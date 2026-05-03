# ── Base stage: shared setup ──────────────────────────────────────
FROM node:18-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (tsx is runtime, prisma is dev-only for generate)
RUN npm ci

# Copy source and prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# ── Development ───────────────────────────────────────────────────
FROM base AS development

EXPOSE 3001
CMD ["npm", "run", "dev"]

# ── Production ────────────────────────────────────────────────────
FROM base AS production

# Install production-only dependencies (strips dev deps like jest, eslint, prisma CLI)
# tsx is in dependencies so it's included; prisma client is already generated
RUN npm ci --omit=dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Production command — tsx runs TypeScript directly, no build step
CMD ["npx", "tsx", "src/index.ts"]