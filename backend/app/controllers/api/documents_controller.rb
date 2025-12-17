class Api::DocumentsController < Api::BaseController
  before_action :set_document, only: [:show, :destroy, :chat]

  def index
    documents = current_user.documents.completed.newest_first

    # Search
    documents = documents.search(params[:q]) if params[:q].present?

    # Filter by doc_type
    documents = documents.by_doc_type(params[:doc_type]) if params[:doc_type].present?

    # Sorting
    case params[:sort]
    when "oldest"
      documents = documents.reorder(created_at: :asc)
    end

    # Pagination
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 20).to_i.clamp(1, 100)
    total = documents.count
    documents = documents.offset((page - 1) * per_page).limit(per_page)

    render json: {
      documents: documents.map(&:as_json_summary),
      meta: {
        total: total,
        page: page,
        per_page: per_page
      }
    }
  end

  def show
    render json: { document: @document.as_json_full }
  end

  def create
    uploaded_file = params[:file]

    unless uploaded_file
      return render_error("No file provided", :bad_request)
    end

    # Determine file type
    file_type = determine_file_type(uploaded_file)
    unless %w[pdf txt].include?(file_type)
      return render_error("Only PDF and TXT files are supported", :bad_request)
    end

    # Create document record
    document = current_user.documents.create!(
      original_filename: uploaded_file.original_filename,
      file_type: file_type,
      file_size: uploaded_file.size,
      status: "processing"
    )

    begin
      # Extract text
      raw_text = TextExtractor.call(uploaded_file)
      document.update!(raw_text: raw_text)

      # Analyze with LLM
      analysis = DocumentAnalyzer.call(raw_text)

      # Update document with results
      document.update!(
        doc_type: analysis[:doc_type],
        summary: analysis[:summary],
        sections: analysis[:sections],
        key_points: analysis[:key_points],
        questions_answered: analysis[:questions_answered],
        conclusions: analysis[:conclusions],
        entities: analysis[:entities],
        relationships: analysis[:relationships],
        timeline: analysis[:timeline],
        status: "completed"
      )

      # Update search index
      document.update_search_index!

      render json: { document: document.as_json_full }, status: :created
    rescue TextExtractor::UnsupportedFileType, DocumentAnalyzer::AnalysisError => e
      document.update!(status: "failed", error_message: e.message)
      render_error(e.message)
    rescue StandardError => e
      Rails.logger.error "Document processing error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.first(10).join("\n")
      document.update!(status: "failed", error_message: "#{e.class}: #{e.message}")
      render_error("#{e.class}: #{e.message}")
    end
  end

  def destroy
    @document.destroy
    render json: { success: true }
  end

  # POST /api/documents/:id/chat - Chat with specific document
  def chat
    question = params[:question]

    if question.blank?
      return render_error("Question is required", :unprocessable_entity)
    end

    # Get conversation history and summary
    messages = params[:messages] || []
    summary = params[:summary]

    result = QaService.call(
      question,
      document_id: @document.id,
      messages: messages,
      summary: summary,
      user: current_user
    )
    render json: result
  rescue QaService::QaError => e
    render_error(e.message)
  end

  # POST /api/qa - RAG Q&A endpoint
  def qa
    question = params[:question]

    if question.blank?
      return render_error("Question is required", :unprocessable_entity)
    end

    # Get conversation history and summary
    messages = params[:messages] || []
    summary = params[:summary]

    result = QaService.call(
      question,
      messages: messages,
      summary: summary,
      user: current_user
    )
    render json: result
  rescue QaService::QaError => e
    render_error(e.message)
  end

  private

  def set_document
    @document = current_user.documents.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render_error("Document not found", :not_found)
  end

  def determine_file_type(uploaded_file)
    content_type = uploaded_file.content_type
    filename = uploaded_file.original_filename.downcase

    if content_type == "application/pdf" || filename.end_with?(".pdf")
      "pdf"
    elsif content_type == "text/plain" || filename.end_with?(".txt")
      "txt"
    else
      "unknown"
    end
  end
end
