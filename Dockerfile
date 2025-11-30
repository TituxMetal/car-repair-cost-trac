# Build stage
FROM oven/bun:1.3 AS builder

WORKDIR /app

# Dummy URL for prisma generate (not used, just satisfies config validation)
ENV DATABASE_URL="file:./dev.db"

# Copy package files
COPY package.json bun.lock* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies
RUN bun install

# Generate Prisma client
RUN bunx --bun prisma generate

# Copy source and build
COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1.3

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
COPY --from=builder /app/package.json /app/bun.lock* ./

EXPOSE 8080

CMD ["bun", "run", "server/index.ts"]
