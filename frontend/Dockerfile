# Frontend Dockerfile
# Place this in: laba-zis-frontend/Dockerfile

# Stage 1: Build the SvelteKit app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
# Note: If you're using bun locally, you can still use npm in Docker
RUN npm install

# Copy all source code
COPY . .

# Build the SvelteKit app
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine

WORKDIR /app

# Copy built app from builder stage
COPY --from=builder /app/build build/
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules/

# Expose port 3000
EXPOSE 3000

# Start the SvelteKit app
CMD ["node", "build"]
