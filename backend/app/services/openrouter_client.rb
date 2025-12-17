class OpenRouterClient
  BASE_URL = "https://openrouter.ai/api/v1"

  class ApiError < StandardError; end

  def initialize
    @api_key = ENV.fetch("OPENROUTER_API_KEY")
    @model = ENV.fetch("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")
    @conn = Faraday.new(url: BASE_URL) do |f|
      f.request :json
      f.response :json
      f.adapter Faraday.default_adapter
      f.options.timeout = 120
      f.options.open_timeout = 10
    end
  end

  def chat(messages:)
    response = @conn.post("chat/completions") do |req|
      req.headers["Authorization"] = "Bearer #{@api_key}"
      req.headers["Content-Type"] = "application/json"
      req.headers["HTTP-Referer"] = "http://localhost:3000"
      req.headers["X-Title"] = "DocuMind"
      req.body = {
        model: @model,
        messages: messages
      }
    end

    unless response.success?
      # Log full response for debugging
      Rails.logger.error "OpenRouter API Error - Status: #{response.status}"
      Rails.logger.error "OpenRouter API Error - Body: #{response.body.inspect}"

      error_message = response.body.dig("error", "message") ||
                      response.body.dig("error", "code") ||
                      response.body.to_s[0..500] ||
                      "API request failed (status: #{response.status})"
      raise ApiError, "OpenRouter API error (#{response.status}): #{error_message}"
    end

    content = response.body.dig("choices", 0, "message", "content")

    if content.nil? || content.empty?
      raise ApiError, "OpenRouter returned empty response. Response: #{response.body.to_s[0..500]}"
    end

    content
  rescue Faraday::TimeoutError
    raise ApiError, "OpenRouter API timeout - the request took too long"
  rescue Faraday::ConnectionFailed => e
    raise ApiError, "Could not connect to OpenRouter API: #{e.message}"
  end
end
