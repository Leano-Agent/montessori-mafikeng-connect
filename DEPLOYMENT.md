# Montessori Mafikeng Connect - Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Vercel + Railway (Recommended for Free Tier)
- **Frontend**: Deploy to Vercel (free)
- **Backend**: Deploy to Railway (free with credit card)
- **Database**: Railway PostgreSQL (free)
- **Redis**: Railway Redis (free)

### Option 2: Vercel + Render (Alternative Free Option)
- **Frontend**: Deploy to Vercel (free)
- **Backend**: Deploy to Render (free with slower cold starts)
- **Database**: Render PostgreSQL (free)
- **Redis**: Render Redis (free)

### Option 3: Docker Compose (Local/Production)
- Full stack with PostgreSQL, Redis, Backend, and Frontend
- Suitable for self-hosting or local development

## 📦 Prerequisites

1. **GitHub Account** (for repository)
2. **Vercel Account** (free tier)
3. **Railway/Render Account** (free tier)
4. **Node.js 18+** (for local development)
5. **Docker & Docker Compose** (optional, for containerized deployment)

## 🎯 Deployment Steps

### Step 1: Create GitHub Repository

1. Create a new repository on GitHub
2. Push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Montessori Mafikeng Connect"
   git branch -M main
   git remote add origin https://github.com/yourusername/montessori-mafikeng-connect.git
   git push -u origin main
   ```

### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add environment variables:
   - `VITE_API_URL`: Your backend API URL (will add after backend deployment)
6. Click "Deploy"

### Step 3: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Add environment variables (from `.env.example`):
   - `DATABASE_URL`: Will be auto-provided when adding database
   - `REDIS_URL`: Will be auto-provided when adding Redis
   - `JWT_SECRET`: Generate a secure random string
   - `JWT_REFRESH_SECRET`: Generate another secure random string
   - `PORT`: `3001`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Your Vercel frontend URL
6. Add PostgreSQL database:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will auto-set `DATABASE_URL`
7. Add Redis:
   - Click "New" → "Database" → "Redis"
   - Railway will auto-set `REDIS_URL`
8. Deploy

### Step 4: Update Frontend Environment Variables

1. Go back to Vercel project settings
2. Update `VITE_API_URL` to your Railway backend URL
3. Redeploy frontend

### Step 5: Run Database Migrations

1. Connect to Railway backend via SSH or use Railway CLI:
   ```bash
   railway run npx prisma migrate deploy
   ```
2. Seed database (optional):
   ```bash
   railway run npm run db:seed
   ```

## 🔧 Environment Variables

### Backend Required Variables
```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app

# AWS (for file uploads - optional)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=af-south-1
AWS_S3_BUCKET=your-bucket

# Africa's Talking (for SMS - optional)
AFRICAS_TALKING_API_KEY=your-key
AFRICAS_TALKING_USERNAME=your-username
```

### Frontend Required Variables
```env
VITE_API_URL=https://your-backend.railway.app/api
VITE_APP_NAME="Montessori Mafikeng Connect"
```

## 🐳 Docker Deployment

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Production Deployment
1. Build and push Docker images to registry
2. Use `docker-compose.prod.yml` (create from example)
3. Set up reverse proxy (nginx, traefik, etc.)
4. Configure SSL certificates

## 📊 Health Checks

### Backend Health Endpoint
- `GET /api/health` - Returns service status
- Expected response: `{"status": "healthy", "timestamp": "..."}`

### Frontend Health
- Service worker registration
- API connectivity
- Offline functionality

## 🔍 Monitoring

### Backend Logs
- Railway: Project → Deployments → Logs
- Render: Dashboard → Service → Logs
- Docker: `docker-compose logs backend`

### Frontend Logs
- Vercel: Project → Deployments → Logs
- Browser console for client-side errors

## 🔄 CI/CD Setup

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd frontend && npm ci && npm test
      - run: cd backend && npm ci && npm test

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` format
   - Verify database is running
   - Check network connectivity

2. **CORS Errors**
   - Ensure `FRONTEND_URL` is set correctly in backend
   - Check CORS configuration

3. **Build Failures**
   - Check Node.js version (requires 18+)
   - Verify all dependencies are installed
   - Check TypeScript compilation errors

4. **Service Worker Not Registering**
   - Check `service-worker.js` is served correctly
   - Verify SSL certificate (HTTPS required for PWA)

### Logs Location
- **Vercel**: Project → Deployments → Select deployment → Logs
- **Railway**: Project → Deployments → Select deployment → Logs
- **Render**: Dashboard → Service → Logs
- **Docker**: `docker-compose logs [service-name]`

## 📞 Support

For deployment issues:
1. Check logs for error messages
2. Verify environment variables
3. Ensure all services are running
4. Check network connectivity between services

## 🎉 Success Indicators

After successful deployment:
- ✅ Frontend loads at Vercel URL
- ✅ Backend API responds at `/api/health`
- ✅ Database migrations applied
- ✅ User registration works
- ✅ PWA installable on mobile devices
- ✅ Offline functionality works

---

**Built with ❤️ in Africa, for Africa**