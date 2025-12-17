class TextExtractor
  class UnsupportedFileType < StandardError; end

  def self.call(uploaded_file)
    new(uploaded_file).call
  end

  def initialize(uploaded_file)
    @file = uploaded_file
  end

  def call
    case file_type
    when "pdf"
      extract_pdf
    when "txt"
      extract_text
    else
      raise UnsupportedFileType, "Only PDF and TXT files are supported"
    end
  end

  private

  def extract_pdf
    @file.tempfile.rewind
    @file.tempfile.binmode
    content = @file.tempfile.read

    io = StringIO.new(content)
    io.binmode

    reader = PDF::Reader.new(io)
    text = reader.pages.map { |page| page.text rescue "" }.join("\n\n")

    if text.strip.empty?
      raise UnsupportedFileType, "PDF appears to be empty or contains only images (no extractable text)"
    end

    text
  rescue PDF::Reader::MalformedPDFError => e
    raise UnsupportedFileType, "PDF is malformed or corrupted: #{e.message}"
  rescue PDF::Reader::UnsupportedFeatureError => e
    raise UnsupportedFileType, "PDF uses unsupported features: #{e.message}"
  rescue PDF::Reader::EncryptedPDFError => e
    raise UnsupportedFileType, "PDF is password-protected"
  rescue ArgumentError, IOError, Encoding::UndefinedConversionError => e
    raise UnsupportedFileType, "Error reading PDF: #{e.message}"
  end

  def extract_text
    @file.tempfile.rewind
    @file.read.force_encoding('UTF-8').encode('UTF-8', invalid: :replace, undef: :replace)
  end

  def file_type
    content_type = @file.content_type
    filename = @file.original_filename.downcase

    if content_type == "application/pdf" || filename.end_with?(".pdf")
      "pdf"
    elsif content_type == "text/plain" || filename.end_with?(".txt")
      "txt"
    else
      "unknown"
    end
  end
end
