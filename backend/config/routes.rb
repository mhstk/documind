Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    # Auth routes
    post "signup", to: "users#create"
    post "login", to: "sessions#create"
    delete "logout", to: "sessions#destroy"
    get "me", to: "sessions#show"

    # OAuth callback
    get "auth/google/callback", to: "omniauth#google"

    resources :documents, only: [:index, :show, :create, :destroy] do
      post 'chat', on: :member
    end
    post 'qa', to: 'documents#qa'
  end

  # OmniAuth routes - redirect to callback
  get "/auth/google_oauth2", as: :google_oauth
end
