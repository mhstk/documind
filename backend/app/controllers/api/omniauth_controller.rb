class Api::OmniauthController < Api::BaseController
  skip_before_action :require_authentication

  # GET /api/auth/google/callback
  def google
    auth = request.env["omniauth.auth"]

    if auth.blank?
      redirect_to_frontend(error: "oauth_failed")
      return
    end

    user = User.find_or_create_from_google(auth)
    session[:user_id] = user.id

    redirect_to_frontend(success: true)
  rescue StandardError => e
    Rails.logger.error "OAuth error: #{e.message}"
    redirect_to_frontend(error: "oauth_failed")
  end

  private

  def redirect_to_frontend(params = {})
    frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:5173")

    if params[:error]
      redirect_to "#{frontend_url}/login?error=#{params[:error]}", allow_other_host: true
    else
      redirect_to "#{frontend_url}/documents", allow_other_host: true
    end
  end
end
