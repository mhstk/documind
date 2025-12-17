class Document < ApplicationRecord
  belongs_to :user, optional: true

  validates :original_filename, presence: true
  validates :file_type, presence: true, inclusion: { in: %w[pdf txt] }
  validates :status, inclusion: { in: %w[pending processing completed failed] }

  scope :search, ->(query) {
    return all if query.blank?
    
    where(
      "searchable_content @@ plainto_tsquery('english', ?)",
      query
    ).order(
      Arel.sql("ts_rank(searchable_content, plainto_tsquery('english', #{connection.quote(query)})) DESC")
    )
  }

  scope :by_doc_type, ->(type) {
    return all if type.blank?
    where(doc_type: type)
  }

  scope :completed, -> { where(status: "completed") }
  scope :newest_first, -> { order(created_at: :desc) }
  scope :oldest_first, -> { order(created_at: :asc) }

  def update_search_index!
    # Include all analyzed content AND raw text for better search/RAG retrieval
    searchable = [
      original_filename,
      summary,
      sections&.map { |s| "#{s['title']} #{s['content']}" }&.join(" "),
      key_points&.join(" "),
      questions_answered&.join(" "),
      conclusions&.join(" "),
      relationships&.join(" "),
      raw_text.to_s[0..10000]  # Include first 10k chars of raw text for better relevance
    ].compact.join(" ")

    # PostgreSQL tsvector max word length is 2046 bytes
    # Be very strict: limit by byte size (UTF-8 chars can be 1-4 bytes)
    safe_text = searchable.to_s
      .gsub(/[^a-zA-Z0-9\s]/, ' ')  # Replace all non-alphanumeric with space
      .split(/\s+/)  # Split on whitespace
      .select { |w| w.length >= 2 && w.bytesize <= 500 }  # Check byte size
      .uniq  # Remove duplicates to reduce size
      .first(5000)  # Limit total words
      .join(" ")

    update_columns(
      searchable_content: self.class.sanitize_sql_array([
        "to_tsvector('english', ?)",
        safe_text
      ]).then { |sql| Arel.sql(sql) }
    )
  rescue ActiveRecord::StatementInvalid => e
    # If search index fails, log it but don't fail the document
    Rails.logger.warn "Search index update failed for document #{id}: #{e.message}"
  end

  def as_json_summary
    {
      id: id,
      original_filename: original_filename,
      file_type: file_type,
      file_size: file_size,
      status: status,
      doc_type: doc_type,
      summary: summary,
      created_at: created_at
    }
  end

  def as_json_full
    as_json_summary.merge(
      sections: sections,
      key_points: key_points,
      questions_answered: questions_answered,
      conclusions: conclusions,
      entities: entities,
      relationships: relationships,
      timeline: timeline,
      raw_text: raw_text,
      error_message: error_message
    )
  end

end
