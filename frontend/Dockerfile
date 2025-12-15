# Stage 1: Build with Bun
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies with Bun
RUN bun install --frozen-lockfile

# Copy all source code
COPY . .

# Build the SvelteKit app
RUN bun run build

# Stage 2: Production runtime with Bun
FROM oven/bun:1-alpine

WORKDIR /app

# Copy built app and dependencies from builder
COPY --from=builder /app/build build/
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules/

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the SvelteKit app with Bun
CMD ["bun", "run", "build/index.js"]
