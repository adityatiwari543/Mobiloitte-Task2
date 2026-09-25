FROM node:22-alpine AS base

WORKDIR /app

# Copy root and workspaces package definitions
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install

# Copy source files
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build shared package then backend
RUN npm run build --workspace=shared
RUN npm run build --workspace=backend

# Production image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

RUN npm install --omit=dev

COPY --from=base /app/shared/dist ./shared/dist
COPY --from=base /app/backend/dist ./backend/dist

# Security: Non-root user
USER node

EXPOSE 5000

CMD ["node", "backend/dist/server.js"]
