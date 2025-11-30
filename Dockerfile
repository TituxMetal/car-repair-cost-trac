# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Set DATABASE_URL for Prisma generate
ENV DATABASE_URL="file:/data/prod.db"

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy all source files for frontend build
COPY . .

# Build the frontend
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/prod.db"
ENV PORT=8080

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/dist ./dist
COPY server ./server/
COPY tsconfig.json ./
COPY package*.json ./

# Create data directory for SQLite
RUN mkdir -p /data

EXPOSE 8080

# Run migrations and start server
CMD npx prisma db push && npx tsx server/index.ts
