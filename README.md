# Mini-Fleet Monitor

This is a web application to manage a fleet of virtual robots, displaying their live positions on a map.

## Architecture

The application is a full-stack solution composed of a React frontend and a Node.js (Express) backend. The backend serves a REST API for robot data and user authentication, while a WebSocket connection provides real-time position updates to the frontend. PostgreSQL is used for persistent data storage (users, robots), and Redis serves as a cache for frequently accessed data. The entire application is containerized using Docker for easy setup and deployment.

## Setup

To run the application, you need Docker and Docker Compose installed.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd mini-fleet-monitor
    ```

2.  **Create environment files:**
    - In the `backend` directory, copy `env_example` to `.env` and set the `JWT_SECRET`.
    - In the `frontend` directory, copy `.env.example` to `.env`.

3.  **Run the application:**
    ```bash
    docker-compose up --build -d
    ```

The application will be available at `http://localhost:5173`.  

Demo Credentials       
| Email               | Password |
|---------------------|----------|
| admin@example.com   | admin    |

4. Terminate the application
    ```bash
   docker-compose down -d
    ```

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
