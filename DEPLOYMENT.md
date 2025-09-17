# Production Deployment Guide

This guide explains how to deploy Brain Calz on your own server with an existing reverse proxy.

## Prerequisites

- Docker and Docker Compose installed
- An existing reverse proxy (nginx, Apache, etc.)

## Production Configuration

1. Production Dockerfiles have been created for both frontend and backend:
   - `frontend/Dockerfile.prod` - Builds a production-ready React app served by Nginx with internal API proxying
   - `backend/Dockerfile.prod` - Runs the Flask app with Gunicorn for production

2. A production docker-compose file has been created:
   - `docker-compose.prod.yml` - Defines services for production deployment

3. Environment variables for production:
   - `.env.prod` - Contains production environment variables

## Deployment Steps

1. Clone or copy the repository to your server:
   ```bash
   git clone <repository-url> brain-calz
   cd brain-calz
   ```

2. Customize the environment variables in `.env.prod`:
   ```bash
   # Edit .env.prod to match your domain
   nano .env.prod
   ```

3. Start the services using the production docker-compose file:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   ```

## Reverse Proxy Configuration

With the updated configuration, the frontend container handles proxying API requests to the backend internally. This means your reverse proxy only needs to forward requests to the frontend container on port 3000.

### For Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### For Apache:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    
    ProxyPreserveHost On
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

## How It Works

The frontend container now serves two purposes:
1. Serving the static React application files
2. Proxying all `/api` requests to the backend container internally

This is accomplished through the Nginx configuration in the frontend container, which proxies requests to `http://backend:5000/api` where `backend` is the service name in the Docker network.

## Updating the Application

To update the application after making changes:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Rebuild and restart the services:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   ```

## Data Persistence

User data is persisted in a Docker volume named `brain_calz_data`. This ensures that user progress is maintained across container restarts and updates.

To backup the database:
```bash
docker run --rm -v brain_calz_data:/data -v $(pwd):/backup alpine tar czf /backup/brain_calz_backup.tar.gz -C /data .
```

To restore the database:
```bash
docker run --rm -v brain_calz_data:/data -v $(pwd):/backup alpine tar xzf /backup/brain_calz_backup.tar.gz -C /data
```