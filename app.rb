require 'sinatra'
require 'slim'

set :public_folder, File.dirname(__FILE__)

JS = File.read('examples/liquid_fill_gauge.txt')

get '/' do
  JS = File.read('examples/liquid_fill_gauge.txt')
  File.read('index.html')
end

get '/visualization' do
  slim(:vis)
end

post '/visualization/update' do
  data = JSON.parse(request.body.read)
  JS = data["js"]
end

get '/visualization/get_js' do
  content_type 'text/javascript'
  JS
end
