class CreateDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :documents do |t|
      t.string :original_filename, null: false
      t.string :file_type, null: false
      t.integer :file_size
      t.string :status, default: "pending"
      t.string :error_message

      # LLM-generated fields
      t.string :doc_type
      t.text :summary
      t.jsonb :key_points, default: []
      t.jsonb :entities, default: {}

      # Content
      t.text :raw_text
      t.tsvector :searchable_content

      t.timestamps
    end

    add_index :documents, :searchable_content, using: :gin
    add_index :documents, :status
    add_index :documents, :doc_type
    add_index :documents, :created_at
  end
end
