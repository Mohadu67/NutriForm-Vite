# Multi-stage build for React frontend with Nginx
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
ARG VITE_API_URL
ARG VITE_RECAPTCHA_SITE_KEY
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_VAPID_PUBLIC_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application with environment variables
RUN VITE_API_URL=${VITE_API_URL} \
    VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY} \
    VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID} \
    VITE_VAPID_PUBLIC_KEY=${VITE_VAPID_PUBLIC_KEY} \
    npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS production

WORKDIR /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built application from builder stage
COPY --from=builder /app/dist .

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
