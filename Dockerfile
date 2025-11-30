# Build stage
FROM node:24-slim AS builder

WORKDIR /app

# Dummy URL for prisma generate (not used, just satisfies config validation)
ENV DATABASE_URL="file:./dev.db"

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:24-slim

WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_URL="file:///data/prod.db"
ENV PORT=8080

# Copy runtime files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server/
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/package*.json ./

EXPOSE 8080

CMD ["npx", "tsx", "server/index.ts"]
