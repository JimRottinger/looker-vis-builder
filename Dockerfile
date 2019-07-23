# Use the base image provided by Google
FROM gcr.io/google_appengine/ruby

RUN apt-get update && \
    apt-get install -y net-tools

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install Dependencies and build
RUN npm run build

# Start server
ENV PORT 3000
EXPOSE 3000

# Run app.py when the container launches
CMD ["ruby", "app.rb"]