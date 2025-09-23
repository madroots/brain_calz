# Brain Calz - Docker Deployment

This document explains how to deploy the Brain Calz application using Docker and Docker Compose.

## Prerequisites

1. Docker installed on your server
2. Docker Compose installed on your server

## Deployment Steps

1. **Copy Required Files**
   Copy the following files to your server:
   - `Dockerfile`
   - `docker-compose.yml`
   - `package.json`
   - All source code files (the entire project)

2. **Install Docker and Docker Compose** (if not already installed)
   ```bash
   # For Ubuntu/Debian
   sudo apt update
   sudo apt install docker.io docker-compose -y
   sudo systemctl start docker
   sudo systemctl enable docker

   # For CentOS/RHEL
   sudo yum install docker docker-compose -y
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Build and Run the Application**
   ```bash
   # Navigate to the directory containing the Docker files
   cd /path/to/brain-calz

   # Build and start the application
   docker-compose up -d
   ```

4. **Access the Application**
   The application will be available at `http://your-server-ip:8080`

## Configuration Options

### Changing the Port
To change the port, modify the `docker-compose.yml` file:
```yaml
ports:
  - "8080:8080"  # Change the first number to your desired port
```

## Useful Docker Commands

- Check if the container is running: `docker-compose ps`
- View application logs: `docker-compose logs -f`
- Stop the application: `docker-compose down`
- Rebuild and restart: `docker-compose up -d --build`

## Troubleshooting

### If you encounter issues with dependencies:
1. Make sure all required files are copied to the server
2. Ensure `package.json` is present in the root directory
3. If you have a `package-lock.json` file, make sure it's also copied

### If the build fails:
1. Try running `docker-compose build --no-cache` to force a clean rebuild
2. Check the logs with `docker-compose logs` for more detailed error information

## Notes

- The application data is stored locally in the browser (localStorage), so it will persist between container restarts
- The container will automatically restart if it crashes or after server reboot due to the `restart: unless-stopped` policy