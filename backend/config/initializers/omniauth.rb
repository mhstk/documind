Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
           ENV["GOOGLE_CLIENT_ID"],
           ENV["GOOGLE_CLIENT_SECRET"],
           {
             scope: "email,profile",
             prompt: "select_account",
             callback_path: "/api/auth/google/callback"
           }
end

# Configure OmniAuth
OmniAuth.config.allowed_request_methods = [:get, :post]
OmniAuth.config.silence_get_warning = true

# Handle OAuth failures
OmniAuth.config.on_failure = proc do |env|
  # Redirect to frontend with error
  frontend_url = ENV.fetch("FRONTEND_URL", "http://localhost:5173")
  Rack::Response.new(["Authentication failed"], 302, {
    "Location" => "#{frontend_url}/login?error=oauth_failed"
  }).finish
end
