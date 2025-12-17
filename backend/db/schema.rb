# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_12_16_000002) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "documents", force: :cascade do |t|
    t.jsonb "conclusions", default: []
    t.datetime "created_at", null: false
    t.string "doc_type"
    t.jsonb "entities", default: {}
    t.string "error_message"
    t.integer "file_size"
    t.string "file_type", null: false
    t.jsonb "key_points", default: []
    t.string "original_filename", null: false
    t.jsonb "questions_answered", default: []
    t.text "raw_text"
    t.jsonb "relationships", default: []
    t.tsvector "searchable_content"
    t.jsonb "sections", default: []
    t.string "status", default: "pending"
    t.text "summary"
    t.jsonb "timeline", default: []
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["created_at"], name: "index_documents_on_created_at"
    t.index ["doc_type"], name: "index_documents_on_doc_type"
    t.index ["searchable_content"], name: "index_documents_on_searchable_content", using: :gin
    t.index ["status"], name: "index_documents_on_status"
    t.index ["user_id"], name: "index_documents_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name"
    t.string "password_digest"
    t.string "provider"
    t.string "uid"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true, where: "(provider IS NOT NULL)"
  end

  add_foreign_key "documents", "users"
end
