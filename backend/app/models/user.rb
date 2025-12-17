class User < ApplicationRecord
  has_secure_password validations: false

  has_many :documents, dependent: :destroy

  # Generate a new session token
  def regenerate_session_token!
    update!(session_token: SecureRandom.urlsafe_base64(32))
    session_token
  end

  # Clear the session token (logout)
  def clear_session_token!
    update!(session_token: nil)
  end

  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, length: { minimum: 6 }, if: :password_required?
  validates :name, presence: true

  before_save :downcase_email

  # Find or create user from Google OAuth
  def self.find_or_create_from_google(auth)
    user = find_by(provider: "google", uid: auth["uid"])
    return user if user

    # Check if user exists with same email
    user = find_by(email: auth["info"]["email"]&.downcase)
    if user
      # Link Google account to existing user
      user.update!(provider: "google", uid: auth["uid"])
      return user
    end

    # Create new user from Google
    create!(
      email: auth["info"]["email"],
      name: auth["info"]["name"] || auth["info"]["email"].split("@").first,
      provider: "google",
      uid: auth["uid"],
      password: SecureRandom.hex(16) # Random password for OAuth users
    )
  end

  def as_json_public(include_token: false)
    data = {
      id: id,
      email: email,
      name: name
    }
    data[:token] = session_token if include_token && session_token.present?
    data
  end

  private

  def downcase_email
    self.email = email.downcase if email.present?
  end

  def password_required?
    # Password required for new records without OAuth, or if password is being set
    (new_record? && provider.blank?) || password.present?
  end
end
