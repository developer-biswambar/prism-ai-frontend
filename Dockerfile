# Frontend Dockerfile for React Application
# Multi-stage build for optimized production image with environment variable support

# Build stage
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Set environment variables for build
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build arguments for environment configuration
ARG REACT_APP_API_URL=https://your-api-domain.com
ARG REACT_APP_DEBUG=false
ARG REACT_APP_API_TIMEOUT=30000
ARG REACT_APP_MAX_FILE_SIZE=500
ARG REACT_APP_DEFAULT_PAGE_SIZE=1000
ARG REACT_APP_ANIMATION_DURATION=400

# Set environment variables from build args
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_DEBUG=$REACT_APP_DEBUG
ENV REACT_APP_API_TIMEOUT=$REACT_APP_API_TIMEOUT
ENV REACT_APP_MAX_FILE_SIZE=$REACT_APP_MAX_FILE_SIZE
ENV REACT_APP_DEFAULT_PAGE_SIZE=$REACT_APP_DEFAULT_PAGE_SIZE
ENV REACT_APP_ANIMATION_DURATION=$REACT_APP_ANIMATION_DURATION

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create nginx user for security
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create health check endpoint
RUN echo '{"status":"healthy","service":"ftt-ml-frontend","timestamp":"'$(date -Iseconds)'"}' > /usr/share/nginx/html/health

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx directories with proper permissions
RUN mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /etc/nginx

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]