# Build stage
FROM node:20-alpine AS builder
     WORKDIR /app
     COPY package*.json ./
     RUN npm install
     COPY . .
     RUN npm run build
     
     # Production stage
    FROM node:20-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --omit=dev
    
    COPY --from=builder /app/dist ./dist
    
    # Create non-root user for security
    RUN addgroup -g 1001 -S nodejs && \
        adduser -S nodejs -u 1001
    
    # Change ownership of app directory
    RUN chown -R nodejs:nodejs /app
    USER nodejs
    
    # Expose port 5000 (your app's port)
    EXPOSE 5000
    
    # Start the application
    CMD ["npm", "start"]
# Trigger new build