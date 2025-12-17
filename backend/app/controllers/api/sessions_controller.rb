class Api::SessionsController < Api::BaseController
  skip_before_action :require_authentication, only: [:create, :show]

  # POST /api/login
  def create
    user = User.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password])
      session[:user_id] = user.id
      user.regenerate_session_token!
      render json: { user: user.as_json_public(include_token: true) }
    else
      render_error("Invalid email or password", :unauthorized)
    end
  end

  # DELETE /api/logout
  def destroy
    current_user&.clear_session_token!
    session.delete(:user_id)
    render json: { success: true }
  end

  # GET /api/me
  def show
    if current_user
      render json: { user: current_user.as_json_public }
    else
      render json: { user: nil }
    end
  end
end
