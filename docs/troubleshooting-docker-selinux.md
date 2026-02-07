# Troubleshooting: Docker Permission Issues on SELinux Systems

## Problem Summary

When running `docker compose up -d --build` on a Linux system with SELinux enabled (such as Fedora), containers may fail to start with permission errors like:

```
Error: EACCES: permission denied, stat '/app/src/index.ts'
Error: EACCES: permission denied, mkdir 'logs'
```

## Root Cause

SELinux (Security-Enhanced Linux) enforces mandatory access controls that prevent Docker containers from accessing host files by default. Files in your home directory have the `user_home_t` SELinux context, which blocks container access even when Unix file permissions (755, 644, etc.) are correct.

## Solution Applied

### 1. Add SELinux Volume Labels

Modified `docker-compose.yml` to add the `:z` flag to all volume mounts. This flag tells Docker to automatically relabel files with the appropriate SELinux context for container access.

**Changes made:**

```yaml
# Backend API volumes
volumes:
  # Mount source code for hot reload (with :z for SELinux)
  - ./backend/src:/app/src:z
  - ./backend/prisma:/app/prisma:z
  - backend_node_modules:/app/node_modules

# Frontend App volumes
volumes:
  # Mount source code for hot reload (with :z for SELinux)
  - ./frontend/src:/app/src:z
  - ./frontend/public:/app/public:z
  - ./frontend/index.html:/app/index.html:z
  - frontend_node_modules:/app/node_modules
```

### 2. Simplified Container User Configuration

Removed explicit `USER node` directives from Dockerfiles to avoid permission conflicts with volume mounts. Running as root inside the container is safe for development and avoids write permission issues.

**Backend Dockerfile changes:**
- Removed `RUN chown -R node:node /app`
- Removed `USER node`

**Frontend Dockerfile changes:**
- Removed `RUN chown -R node:node /app`
- Removed `USER node`

### 3. Created Environment Configuration

Generated `.env` file with secure encryption keys and JWT secrets using OpenSSL:

```bash
openssl rand -hex 32  # For ENCRYPTION_KEY
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
```

## Verification Steps

After applying fixes:

1. **Check SELinux status:**
   ```bash
   getenforce  # Should show "Enforcing"
   ```

2. **Verify file contexts:**
   ```bash
   ls -laZ backend/src/index.ts
   # After mounting with :z, files get container_file_t context
   ```

3. **Check container status:**
   ```bash
   docker compose ps
   # All services should show "healthy" status
   ```

4. **Verify logs:**
   ```bash
   docker compose logs api --tail 20
   docker compose logs app --tail 20
   # Should see successful startup messages, no permission errors
   ```

## SELinux Volume Mount Flags

- **`:z`** - Shared volume mount (used in this project)
  - Allows multiple containers to read/write
  - Files are relabeled with `svirt_sandbox_file_t` context

- **`:Z`** - Private volume mount
  - Only one container can access the volume
  - Use when security isolation between containers is critical

## Additional Issues Encountered

### Issue: Docker daemon not running
**Error:** `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`

**Solution:**
```bash
sudo systemctl start docker
sudo systemctl enable docker  # Enable on boot
```

### Issue: Permission denied on docker commands
**Error:** `permission denied while trying to connect to the Docker daemon socket`

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Apply group changes (choose one):
newgrp docker              # Apply to current shell
# OR log out and back in
# OR restart your system
```

### Issue: Stale Docker build cache
**Error:** `failed to prepare extraction snapshot` or similar cache errors

**Solution:**
```bash
docker builder prune -af   # Remove all build cache
docker compose build --no-cache
```

## System Information

This fix was tested and verified on:
- **OS:** Fedora Linux (Kernel 6.18.8)
- **SELinux:** Enforcing mode
- **Docker:** Docker Compose v2
- **Architecture:** Native Linux (not WSL)

## References

- [Docker and SELinux](https://docs.docker.com/storage/bind-mounts/#configure-the-selinux-label)
- [SELinux Project Wiki](https://github.com/SELinuxProject/selinux/wiki)
- [Podman/Docker SELinux Guide](https://www.redhat.com/sysadmin/user-namespaces-selinux-rootless-containers)

## Prevention for Future Projects

When setting up Docker projects on SELinux systems:

1. ✅ Always add `:z` or `:Z` to bind mounts in `docker-compose.yml`
2. ✅ Test with `getenforce` to check if SELinux is enabled
3. ✅ Use `ls -laZ` to verify file contexts
4. ✅ Avoid hardcoded user directives in development Dockerfiles
5. ✅ Document SELinux requirements in project README

---

**Last Updated:** February 6, 2026
**Status:** Resolved ✅
