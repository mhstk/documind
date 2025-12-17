class Api::UsersController < Api::BaseController
  skip_before_action :require_authentication, only: [:create]

  # POST /api/signup
  def create
    user = User.new(user_params)

    if user.save
      session[:user_id] = user.id
      user.regenerate_session_token!
      render json: { user: user.as_json_public(include_token: true) }, status: :created
    else
      render_error(user.errors.full_messages.join(", "))
    end
  end

  private

  def user_params
    params.permit(:email, :password, :name)
  end
end
