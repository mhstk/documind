class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest
      t.string :name
      t.string :provider  # 'google' or nil for email signup
      t.string :uid       # Google UID

      t.timestamps
    end

    add_index :users, :email, unique: true
    add_index :users, [:provider, :uid], unique: true, where: "provider IS NOT NULL"
  end
end
