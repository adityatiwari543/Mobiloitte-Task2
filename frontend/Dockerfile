FROM node:22-alpine AS build

WORKDIR /app

# Copy root and workspaces package definitions
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install

# Copy source files
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build shared package then frontend
RUN npm run build --workspace=shared
RUN npm run build --workspace=frontend

# Production Nginx stage
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
