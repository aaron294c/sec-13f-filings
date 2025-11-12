# Disable webpack dev server proxy in development
# We're using pre-compiled assets from public/packs instead
if Rails.env.development?
  Webpacker::Instance.class_eval do
    def dev_server
      @dev_server ||= Webpacker::DevServer.new(config: config).tap do |server|
        def server.running?
          false
        end
      end
    end
  end
end
