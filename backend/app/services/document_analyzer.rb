class DocumentAnalyzer
  class AnalysisError < StandardError; end

  def self.call(raw_text)
    new(raw_text).call
  end

  def initialize(raw_text)
    @raw_text = raw_text
    @client = ::OpenRouterClient.new
  end

  def call
    response = @client.chat(messages: [
      { role: "system", content: system_prompt },
      { role: "user", content: user_prompt }
    ])

    parse_response(response)
  rescue JSON::ParserError => e
    raise AnalysisError, "Failed to parse LLM response: #{e.message}"
  rescue ::OpenRouterClient::ApiError => e
    raise AnalysisError, e.message
  end

  private

  def system_prompt
    <<~PROMPT
      You are a document analyzer. Analyze the provided document and return a JSON response with:

      doc_type: One of: receipt, report, article, assignment, email, contract, notes, other

      summary: A comprehensive summary of the document covering the main topic, purpose, and key findings. Be thorough.

      sections: Array of main topics/sections found in the document. Each section should have:
        - title: Section or topic name
        - content: Summary of what this section covers

      key_points: Array of bullet points capturing all important ideas (as many as needed)

      questions_answered: Array of questions that this document can answer. Think about what someone might ask about this document's content.

      conclusions: Array of conclusions, recommendations, or key takeaways from the document

      entities: Object with arrays for:
        - people: Names of people mentioned
        - organizations: Company/org names
        - dates: Important dates mentioned
        - amounts: Money amounts, quantities
        - locations: Places mentioned

      relationships: Array of relationships between entities (if applicable). Each should describe how two entities are connected. Example: "John Smith is the CEO of Acme Corp"

      timeline: Array of events in chronological order (if applicable). Each should have:
        - date: When it happened (or relative timing like "first", "then", "finally")
        - event: What happened

      Respond ONLY with valid JSON, no markdown code blocks or other text.
    PROMPT
  end

  def user_prompt
    truncated_text = @raw_text.to_s[0, 15000]
    "Analyze this document:\n\n#{truncated_text}"
  end

  def parse_response(response)
    # Remove potential markdown code blocks
    cleaned = response.to_s.gsub(/```json\n?/, '').gsub(/```\n?/, '').strip

    parsed = JSON.parse(cleaned)

    {
      doc_type: parsed["doc_type"] || "other",
      summary: parsed["summary"] || "",
      sections: Array(parsed["sections"]),
      key_points: Array(parsed["key_points"]),
      questions_answered: Array(parsed["questions_answered"]),
      conclusions: Array(parsed["conclusions"]),
      entities: {
        people: Array(parsed.dig("entities", "people")),
        organizations: Array(parsed.dig("entities", "organizations")),
        dates: Array(parsed.dig("entities", "dates")),
        amounts: Array(parsed.dig("entities", "amounts")),
        locations: Array(parsed.dig("entities", "locations"))
      },
      relationships: Array(parsed["relationships"]),
      timeline: Array(parsed["timeline"])
    }
  end
end
