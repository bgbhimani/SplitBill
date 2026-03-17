# Stage 1: Build the frontend
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the build output to NGINX public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port (default for NGINX)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
