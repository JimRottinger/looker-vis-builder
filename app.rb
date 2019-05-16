require 'sinatra'
require 'slim'

set :public_folder, File.dirname(__FILE__)

JS = File.read('examples/text.txt')
DEPS = [
  "https://code.jquery.com/jquery-2.2.4.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/d3/4.13.0/d3.js"
]

get '/' do
  JS = File.read('examples/text.txt')
  File.read('index.html')
end

get '/visualization' do
  slim(:vis, {}, {
    dependencies: DEPS
  })
end

post '/visualization/update' do
  data = JSON.parse(request.body.read)
  JS = data["js"]
  DEPS = data["deps"] || []
end

get '/visualization/get_js' do
  content_type 'text/javascript'
  JS
end
