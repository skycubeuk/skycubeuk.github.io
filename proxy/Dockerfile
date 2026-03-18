# ── Stage 1: build TypeScript ─────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Create the log directory and hand it to the non-root user before switching.
RUN mkdir -p /app/logs && chown node:node /app/logs

# Run as the least-privileged built-in user (node:22-alpine ships with 'node').
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
