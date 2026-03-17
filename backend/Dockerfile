# Use Node.js as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend files
COPY . .

# Expose the API port (usually 5000 or 8080 - checking server.js might be helpful)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
