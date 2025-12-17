class AddAnalysisFieldsToDocuments < ActiveRecord::Migration[8.1]
  def change
    add_column :documents, :sections, :jsonb, default: []
    add_column :documents, :questions_answered, :jsonb, default: []
    add_column :documents, :conclusions, :jsonb, default: []
    add_column :documents, :relationships, :jsonb, default: []
    add_column :documents, :timeline, :jsonb, default: []
  end
end
