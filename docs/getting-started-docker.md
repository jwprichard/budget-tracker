# Getting Started: First-Time Docker Setup

This guide walks you through setting up and running the Budget Tracker application using Docker for the first time.

## Prerequisites

### Required Software

1. **Docker Engine** (20.10+ recommended)
   - Installation: https://docs.docker.com/engine/install/

2. **Docker Compose** (v2+ recommended)
   - Usually included with Docker Desktop
   - Standalone: https://docs.docker.com/compose/install/

3. **Git** (for cloning the repository)

### System Requirements

- **OS:** Linux, macOS, or Windows with WSL2
- **RAM:** 4GB minimum (8GB recommended)
- **Disk Space:** 2GB for Docker images and volumes
- **Ports:** 3000 (API), 5173 (Frontend), 5432 (Database) must be available

## Step-by-Step Setup

### 1. Verify Docker Installation

```bash
# Check Docker version
docker --version
# Should show: Docker version 20.10.x or higher

# Check Docker Compose version
docker compose version
# Should show: Docker Compose version v2.x.x or higher

# Test Docker is running
docker ps
# Should return an empty list or show running containers (not an error)
```

### 2. Start Docker Service (Linux only)

If Docker daemon isn't running:

```bash
# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Check status
sudo systemctl status docker
```

### 3. Configure Docker Permissions (Linux only)

To run Docker without `sudo`:

```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply the change (choose ONE method):

# Method 1: Apply to current shell (quick)
newgrp docker

# Method 2: Log out and back in (recommended)
# Close your terminal and open a new session

# Method 3: Restart your computer (most reliable)
```

**Verify it worked:**
```bash
docker ps
# Should NOT ask for password
```

### 4. Clone the Repository

```bash
# Clone the project
git clone <repository-url> budget-tracker
cd budget-tracker

# Verify you're in the right directory
ls -la
# Should see: backend/, frontend/, docker-compose.yml, docs/, etc.
```

### 5. Create Environment Configuration

The project needs environment variables for secrets and configuration.

```bash
# Generate secure random keys
ENCRYPTION_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

# Create .env file from template
cp .env.example .env

# Update .env with generated keys (manual edit)
nano .env  # or use your preferred editor
```

**Update these lines in `.env`:**
```env
ENCRYPTION_KEY=<paste-generated-key>
JWT_SECRET=<paste-generated-key>
JWT_REFRESH_SECRET=<paste-generated-key>
```

**Optional:** If using Akahu bank integration:
```env
AKAHU_APP_TOKEN=your_actual_token_here
```

### 6. Build Docker Images

```bash
# Build all images (first time will take 3-5 minutes)
docker compose build

# Expected output:
# ✓ Image budget-tracker-api Built
# ✓ Image budget-tracker-app Built
```

**Note:** If you see cache errors, clear and rebuild:
```bash
docker builder prune -af
docker compose build --no-cache
```

### 7. Start the Application

```bash
# Start all containers in detached mode
docker compose up -d

# Expected output:
# ✓ Network budget-tracker_budget-tracker-network Created
# ✓ Container budget-tracker-db Created
# ✓ Container budget-tracker-api Created
# ✓ Container budget-tracker-app Created
```

### 8. Verify Everything is Running

```bash
# Check container status
docker compose ps

# Expected output:
# NAME                 STATUS
# budget-tracker-api   Up X seconds (healthy)
# budget-tracker-app   Up X seconds (healthy)
# budget-tracker-db    Up X seconds (healthy)
```

**If containers show "Restarting" or "Unhealthy":**
```bash
# Check logs for errors
docker compose logs api --tail 50
docker compose logs app --tail 50
docker compose logs database --tail 50
```

### 9. Initialize the Database

```bash
# Run database migrations
docker compose exec api npx prisma migrate deploy

# Seed default categories (optional)
docker compose exec api npx prisma db seed
```

### 10. Access the Application

Open your browser and navigate to:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api/health
- **API Documentation:** http://localhost:3000/api/docs (if configured)

**Expected:**
- Frontend should show the login/register page
- API health endpoint should return: `{"status":"ok"}`

## Daily Usage Commands

### Starting the Application

```bash
# Start all containers
docker compose up -d

# Start and view logs
docker compose up

# Start specific service
docker compose up -d api
```

### Stopping the Application

```bash
# Stop all containers (preserves data)
docker compose down

# Stop and remove volumes (WARNING: deletes database data)
docker compose down -v
```

### Viewing Logs

```bash
# View all logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# Logs for specific service
docker compose logs -f api
docker compose logs -f app
docker compose logs -f database

# Last N lines only
docker compose logs api --tail 50
```

### Rebuilding After Code Changes

```bash
# Rebuild specific service
docker compose build api
docker compose build app

# Restart to apply changes
docker compose restart api app

# Or rebuild and restart in one command
docker compose up -d --build
```

## Troubleshooting

### Port Already in Use

**Error:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :3000
# OR
sudo netstat -tlnp | grep 3000

# Kill the process or change port in .env
BACKEND_PORT=3001
FRONTEND_PORT=5174
POSTGRES_PORT=5433
```

### SELinux Permission Issues (Fedora/RHEL/CentOS)

**Error:** `EACCES: permission denied, stat '/app/src/index.ts'`

**Solution:** See [troubleshooting-docker-selinux.md](./troubleshooting-docker-selinux.md)

### Container Keeps Restarting

```bash
# Check logs for error details
docker compose logs api --tail 100

# Common fixes:
# 1. Database not ready - wait 30 seconds and check again
# 2. Missing .env variables - verify .env file exists and is complete
# 3. Port conflicts - check ports aren't in use
```

### Reset Everything

If things are broken and you want to start fresh:

```bash
# Stop and remove everything
docker compose down -v

# Remove images
docker compose rm -f
docker rmi budget-tracker-api budget-tracker-app

# Clear build cache
docker builder prune -af

# Start from Step 6 (Build Docker Images)
docker compose build --no-cache
docker compose up -d
```

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- **Frontend:** Vite automatically reloads when you edit files in `frontend/src/`
- **Backend:** ts-node-dev automatically restarts when you edit files in `backend/src/`

### Accessing Container Shell

```bash
# Backend container
docker compose exec api sh

# Frontend container
docker compose exec app sh

# Database container
docker compose exec database sh
```

### Database Management

```bash
# Open Prisma Studio (database GUI)
docker compose exec api npx prisma studio
# Opens at http://localhost:5555

# View database directly
docker compose exec database psql -U budget_user -d budget_tracker

# Backup database
docker compose exec database pg_dump -U budget_user budget_tracker > backup.sql

# Restore database
docker compose exec -i database psql -U budget_user budget_tracker < backup.sql
```

### Running Tests

```bash
# Backend tests (when implemented)
docker compose exec api npm test

# Frontend tests (when implemented)
docker compose exec app npm test
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | `budget_user` |
| `POSTGRES_PASSWORD` | Database password | `budget_password` |
| `POSTGRES_DB` | Database name | `budget_tracker` |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting sensitive data | `3c8dc5d2...` |
| `JWT_SECRET` | 32-byte hex key for JWT tokens | `996118df...` |
| `JWT_REFRESH_SECRET` | 32-byte hex key for refresh tokens | `d689f434...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_PORT` | API port | `3000` |
| `FRONTEND_PORT` | Frontend port | `5173` |
| `POSTGRES_PORT` | Database port | `5432` |
| `AKAHU_APP_TOKEN` | Akahu bank sync token | (none) |
| `AKAHU_BASE_URL` | Akahu API URL | `https://api.akahu.io` |

## Next Steps

After successful setup:

1. ✅ Create your first user account at http://localhost:5173
2. ✅ Add a bank account manually or via Akahu sync
3. ✅ Import transactions via CSV or bank sync
4. ✅ Set up categories and budgets
5. ✅ Start tracking your finances!

## Additional Resources

- **Project Documentation:** `/docs/budget-tracker-solution-design.md`
- **API Documentation:** `/docs/Budget-Tracker-API.postman_collection.json`
- **Troubleshooting:** `/docs/troubleshooting-docker-selinux.md`
- **Roadmap:** `/ROADMAP.md`

## Support

For issues or questions:
1. Check the logs: `docker compose logs`
2. Review troubleshooting guides in `/docs/`
3. Open an issue on the project repository

---

**Last Updated:** February 6, 2026
**Tested On:** Fedora Linux (Kernel 6.18.8), Docker Compose v2
