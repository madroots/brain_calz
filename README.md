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

### Running the Application

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

## Application Structure

- `/frontend`: React frontend application
- `/backend`: Python Flask backend API
- `docker-compose.yml`: Docker Compose configuration

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