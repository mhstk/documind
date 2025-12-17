class Api::BaseController < ApplicationController
  before_action :require_authentication

  private

  def current_user
    @current_user ||= user_from_token || user_from_session
  end

  def user_from_token
    token = request.headers["Authorization"]&.split(" ")&.last
    return nil unless token.present?
    User.find_by(session_token: token)
  end

  def user_from_session
    User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def require_authentication
    unless current_user
      render json: { error: "Authentication required" }, status: :unauthorized
    end
  end

  def render_error(message, status = :unprocessable_entity)
    render json: { error: message }, status: status
  end
end
