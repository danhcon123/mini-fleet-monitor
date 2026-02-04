# Mini-Fleet Monitor

This is a web application to manage a fleet of virtual robots, displaying their live positions on a map.

## Architecture

The application is a full-stack solution composed of a React frontend and a Node.js (Express) backend. The backend serves a REST API for robot data and user authentication, while a WebSocket connection provides real-time position updates to the frontend. PostgreSQL is used for persistent data storage (users, robots), and Redis serves as a cache for frequently accessed data. The entire application is containerized using Docker for easy setup and deployment.

## Setup

To run the application, you need Docker and Docker Compose installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/danhcon123/mini-fleet-monitor.git
    cd mini-fleet-monitor
    ```

2. **Setup**
  
## Run the application with docker (🐋 Docker & Docker Compose prerequisites required)
```bash
docker-compose up --build -d
```
This starts all four services:  
| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:5173       |
| Backend    | http://localhost:3000       |
| PostgreSQL | localhost:5432              |
| Redis      | localhost:6379              |

The application will be available at `http://localhost:5173`.  

Demo Credentials       
| Email               | Password |
|---------------------|----------|
| admin@example.com   | admin    |

Terminate the application:

```bash
docker-compose down -d
```
## Run the application locally


## Features

-   User login with JWT-based authentication.
-   Dashboard with an OpenLayers map displaying robot markers.
-   Real-time updates of robot positions via WebSockets.
-   A list of all robots with their current status and position.

## Technologies Used

**Backend:**
-   Node.js with Express
-   PostgreSQL
-   Redis
-   JSON Web Token (JWT) for authentication
-   WebSockets (`ws` library)

**Frontend:**
-   React
-   OpenLayers for the map display
-   Axios for API requests
-   Socket.IO Client for WebSocket communication
