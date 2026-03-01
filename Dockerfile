# Build stage
FROM oven/bun:latest AS builder

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

# Create a template database with schema (only used for initial setup, not migrations)
RUN bunx --bun prisma db push --accept-data-loss

# Copy source and build
COPY . .
RUN bun build.ts

# Production stage
FROM oven/bun:latest

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
COPY --from=builder /app/package.json ./
# Copy template database for initialization
COPY --from=builder /app/dev.db ./template.db

# Create entrypoint script that extracts database path from DATABASE_URL
RUN echo '#!/bin/sh\n\
# Extract database path from DATABASE_URL (format: file:/path/to/db)\n\
DB_PATH=$(echo "$DATABASE_URL" | sed "s|^file:||")\n\
if [ -n "$DB_PATH" ] && [ ! -f "$DB_PATH" ]; then\n\
  echo "📁 Initializing database from template..."\n\
  mkdir -p "$(dirname "$DB_PATH")"\n\
  cp /app/template.db "$DB_PATH"\n\
  echo "✅ Database initialized at $DB_PATH"\n\
fi\n\
echo "🔄 Running database migrations..."\n\
bunx --bun prisma migrate deploy\n\
echo "✅ Migrations complete"\n\
exec "$@"' > /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["bun", "server/index.ts"]
