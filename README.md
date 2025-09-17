# Brain Calz

Brain Calz is a mental math training application that helps users improve their arithmetic skills through daily challenges and optional free training sessions.

## Features

- Daily challenges with adaptive difficulty
- Free training mode with customizable settings
- Progress tracking and streaks
- Support for addition, subtraction, multiplication, and division
- Weekly overview of completed challenges

## Tech Stack

- Frontend: React
- Backend: Python Flask
- Database: SQLite
- Containerization: Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed

### Running the Application for Development

1. Clone the repository
2. Navigate to the project directory
3. Run the application using Docker Compose:

```bash
docker compose up --build
```

4. Access the application in your browser at `http://localhost:3001`

### Development

The application will automatically reload when you make changes to the code:

- Frontend runs on port 3001
- Backend API runs on port 5000

### Stopping the Application

To stop the application, press `Ctrl+C` in the terminal where Docker Compose is running, or run:

```bash
docker-compose down
```

## Production Deployment

For production deployment, a separate configuration is provided that includes:

1. A production-ready Docker Compose file (`docker-compose.prod.yml`)
2. Production Dockerfiles for both frontend and backend
3. Nginx configuration for serving the frontend and proxying API requests

### Deploying to Production

1. Clone the repository to your server
2. Navigate to the project directory
3. Start the production services:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This will start the application on port 3001. The frontend container handles both serving the React application and proxying API requests to the backend container internally.

### Production Configuration

The production setup includes:
- Frontend served by Nginx
- Backend running with Gunicorn for better performance
- Data persistence through Docker volumes
- Internal proxying of API requests from frontend to backend

### Reverse Proxy Configuration

If you're using an existing reverse proxy (nginx, Apache, etc.), you only need to forward requests to port 3001:

#### For Nginx:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### For Apache:
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    
    ProxyPreserveHost On
    
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
</VirtualHost>
```

## Application Structure

- `/frontend`: React frontend application
- `/backend`: Python Flask backend API
- `docker-compose.yml`: Docker Compose configuration for development
- `docker-compose.prod.yml`: Docker Compose configuration for production
- `DEPLOYMENT.md`: Detailed deployment instructions

## API Endpoints

- `GET /api/user`: Get user information
- `GET /api/weekly-challenges`: Get this week's challenges
- `POST /api/start-daily-challenge`: Start today's daily challenge
- `POST /api/submit-answer`: Submit an answer for a problem
- `GET /api/free-run-config`: Get configuration options for free run mode
- `POST /api/start-free-run`: Start a free run session

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request