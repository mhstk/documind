# RAG (Retrieval Augmented Generation) Q&A Service
#
# How it works:
# 1. RETRIEVAL: Search documents using PostgreSQL full-text search
# 2. AUGMENTATION: Build context from relevant document content
# 3. GENERATION: LLM answers using ONLY the provided context
#
# Conversation history support:
# - Maintains chat history for follow-up questions
# - Automatically summarizes when reaching MESSAGE_LIMIT
#
class QaService
  class QaError < StandardError; end

  # Number of message pairs (Q&A) before triggering summarization
  MESSAGE_LIMIT = 10

  def self.call(question, document_id: nil, messages: [], summary: nil, user: nil)
    new(question, document_id: document_id, messages: messages, summary: summary, user: user).call
  end

  def initialize(question, document_id: nil, messages: [], summary: nil, user: nil)
    @question = question
    @document_id = document_id
    @messages = Array(messages)
    @summary = summary
    @user = user
    @client = OpenRouterClient.new
  end

  def call
    # Step 1: RETRIEVAL - Find relevant documents
    base_scope = @user ? @user.documents : Document

    if @document_id
      # Single document mode - only use the specified document
      relevant_docs = base_scope.where(id: @document_id, status: "completed")
      return document_not_found_response if relevant_docs.empty?
    else
      # Multi-document mode - search across all documents
      relevant_docs = base_scope.completed.search(@question).limit(5)
      if relevant_docs.empty?
        relevant_docs = base_scope.completed.newest_first.limit(5)
      end
      return no_documents_response if relevant_docs.empty?
    end

    # Step 2: AUGMENTATION - Build context from document content
    context = build_context(relevant_docs)

    # Step 3: GENERATION - Ask LLM with context and conversation history
    llm_response = ask_llm(context, relevant_docs)

    # Step 4: Reorder sources based on LLM's ranking
    ranked_sources = rank_sources(relevant_docs, llm_response[:primary_sources])

    # Step 5: Check if we need to summarize the conversation
    response = {
      answer: llm_response[:answer],
      sources: ranked_sources
    }

    # If we're at the message limit, summarize the conversation
    if needs_summarization?
      new_summary = summarize_conversation(context, llm_response[:answer])
      response[:needs_summary] = true
      response[:summary] = new_summary
    end

    response
  rescue OpenRouterClient::ApiError => e
    raise QaError, "Failed to get answer: #{e.message}"
  end

  private

  def needs_summarization?
    # Count message pairs (each Q&A is 2 messages)
    @messages.length >= MESSAGE_LIMIT * 2
  end

  def build_context(docs)
    docs.map do |doc|
      # Include all analyzed content for comprehensive context
      sections_text = doc.sections&.map { |s| "- #{s['title']}: #{s['content']}" }&.join("\n")
      timeline_text = doc.timeline&.map { |t| "- #{t['date']}: #{t['event']}" }&.join("\n")
      # For single document mode, include more content
      content_limit = @document_id ? 8000 : 2000
      content = doc.raw_text.to_s[0..content_limit]

      context_parts = [
        "Document: #{doc.original_filename}",
        "Type: #{doc.doc_type}",
        "Summary: #{doc.summary}",
        ("Sections:\n#{sections_text}" if sections_text.present?),
        "Key Points: #{doc.key_points&.join('; ')}",
        ("Questions this document answers: #{doc.questions_answered&.join('; ')}" if doc.questions_answered.present?),
        ("Conclusions: #{doc.conclusions&.join('; ')}" if doc.conclusions.present?),
        ("Relationships: #{doc.relationships&.join('; ')}" if doc.relationships.present?),
        ("Timeline:\n#{timeline_text}" if timeline_text.present?),
        "Content excerpt:\n#{content}"
      ].compact

      context_parts.join("\n")
    end.join("\n\n---\n\n")
  end

  def build_conversation_history
    return "" if @messages.empty? && @summary.blank?

    history_parts = []

    # Include previous summary if exists
    if @summary.present?
      history_parts << "Previous conversation summary:\n#{@summary}"
    end

    # Include recent messages
    if @messages.any?
      recent_messages = @messages.map do |msg|
        role = msg["role"] || msg[:role]
        content = msg["content"] || msg[:content]
        role == "user" ? "User: #{content}" : "Assistant: #{content}"
      end.join("\n")
      history_parts << "Recent conversation:\n#{recent_messages}"
    end

    history_parts.join("\n\n")
  end

  def ask_llm(context, relevant_docs)
    messages = [
      { role: "system", content: system_prompt(relevant_docs) }
    ]

    # Add conversation history as context if exists
    conversation_history = build_conversation_history
    if conversation_history.present?
      messages << { role: "user", content: "Conversation history for context:\n\n#{conversation_history}" }
      messages << { role: "assistant", content: "I understand the conversation history. I'll use this context to answer your next question." }
    end

    # Add the current question with document context
    messages << { role: "user", content: user_prompt(context) }

    response = @client.chat(messages: messages)
    parse_llm_response(response, relevant_docs)
  end

  def parse_llm_response(response, relevant_docs)
    # Try to extract JSON from the response
    # The LLM should return JSON with "answer" and "primary_sources"
    json_match = response.match(/\{[\s\S]*\}/)

    if json_match
      begin
        parsed = JSON.parse(json_match[0])
        return {
          answer: parsed["answer"] || response,
          primary_sources: parsed["primary_sources"] || []
        }
      rescue JSON::ParserError
        # Fall back to treating entire response as the answer
      end
    end

    # Fallback: use entire response as answer, no source ranking
    {
      answer: response,
      primary_sources: []
    }
  end

  def rank_sources(relevant_docs, primary_sources)
    return relevant_docs.map { |d| { id: d.id, filename: d.original_filename } } if primary_sources.empty?

    # Create a map for quick lookup
    docs_by_filename = relevant_docs.index_by(&:original_filename)

    ranked = []

    # First, add documents in the order LLM specified
    primary_sources.each do |filename|
      if docs_by_filename[filename]
        ranked << { id: docs_by_filename[filename].id, filename: filename }
        docs_by_filename.delete(filename)
      end
    end

    # Then add any remaining documents that weren't mentioned
    docs_by_filename.each do |filename, doc|
      ranked << { id: doc.id, filename: filename }
    end

    ranked
  end

  def summarize_conversation(context, latest_answer)
    # Build the full conversation to summarize
    conversation = @messages.map do |msg|
      role = msg["role"] || msg[:role]
      content = msg["content"] || msg[:content]
      role == "user" ? "User: #{content}" : "Assistant: #{content}"
    end.join("\n")

    # Add the latest exchange
    conversation += "\nUser: #{@question}\nAssistant: #{latest_answer}"

    # Include previous summary if exists
    prev_summary = @summary.present? ? "Previous summary: #{@summary}\n\n" : ""

    summary_prompt = <<~PROMPT
      Please summarize the following conversation about a document.
      Capture the key topics discussed, important information revealed, and any conclusions reached.
      Keep the summary concise but comprehensive enough to continue the conversation.

      #{prev_summary}Conversation:
      #{conversation}

      Provide a summary in 2-3 paragraphs.
    PROMPT

    @client.chat(messages: [
      { role: "system", content: "You are a helpful assistant that summarizes conversations concisely while preserving important context." },
      { role: "user", content: summary_prompt }
    ])
  end

  def system_prompt(relevant_docs)
    doc_list = relevant_docs.map(&:original_filename).join(", ")

    <<~PROMPT
      You are a helpful assistant that answers questions based ONLY on the provided document context.

      Available documents: #{doc_list}

      Rules:
      - Only use information from the provided context
      - If the answer isn't in the context, say "I couldn't find this information in your documents"
      - Be concise and direct
      - Take into account any conversation history provided to give contextual answers

      IMPORTANT: You MUST respond with valid JSON in this exact format:
      {
        "answer": "Your detailed answer here, formatted with markdown if needed",
        "primary_sources": ["most_relevant_doc.pdf", "second_most_relevant.pdf"]
      }

      The "primary_sources" array should list the document filenames in order of how much you used them to answer the question.
      Only include documents you actually referenced. If you only used one document, only list that one.
    PROMPT
  end

  def user_prompt(context)
    <<~PROMPT
      Based on the following documents, please answer the question.

      #{context}

      Question: #{@question}
    PROMPT
  end

  def no_documents_response
    {
      answer: "I don't have any documents to search. Please upload some documents first, then I can answer questions about them.",
      sources: []
    }
  end

  def document_not_found_response
    {
      answer: "This document was not found or is still being processed.",
      sources: []
    }
  end
end
