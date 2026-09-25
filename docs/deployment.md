# JobConnect Deployment & Containerization

## 1. Overview

JobConnect is packaged with Docker and Docker Compose for reproducible production deployment and local development orchestration.

---

## 2. Docker Architecture

### Multi-Container Topology (`docker-compose.yml`)

- `jobconnect-frontend`: React + Vite built with Nginx reverse proxy alpine image (Port 3000 -> 80).
- `jobconnect-backend`: Node.js Express TypeScript production container with non-root security user (Port 5000).
- `jobconnect-mongodb`: MongoDB 8.0 official image with persistent volume data mount (Port 27017).
- `jobconnect-redis`: Redis Alpine with persistent RDB snapshots (Port 6379).

---

## 3. Environment Configuration

Ensure `.env` is populated based on `.env.example`:

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGO_URI=mongodb://jobconnect-mongodb:27017/jobconnect
REDIS_URL=redis://jobconnect-redis:6379
JWT_ACCESS_SECRET=super_secure_access_secret_change_in_production
JWT_REFRESH_SECRET=super_secure_refresh_secret_change_in_production
COOKIE_DOMAIN=localhost
AI_PROVIDER=deterministic # or gemini / openai
AI_API_KEY=
```

---

## 4. Run Commands

### Docker Compose

```bash
# Start all services in the background
docker-compose up -d --build

# View real-time logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Local Bare-Metal Development (Windows / Linux)

```bash
# Install root monorepo dependencies
npm install

# Start development servers concurrently
npm run dev
```
