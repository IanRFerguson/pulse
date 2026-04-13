# Web App

Full-stack application for viewing and interacting with pipeline data.

## Backend

Flask API that interfaces with Postgres database and serves data to the frontend.

- **server.py** - Defines the Flask application
- **models.py** - SQLAlchemy database models (`Team`, `TeamMember`)
- **routes/api.py** - API endpoints that are exposed to the frontend
- **config.py** - Configuration management

## Frontend

React + TypeScript UI for data visualization and interaction.

- **src/components/** - Reusable React components
- **src/pages/** - Page-level components
- **src/hooks/** - Custom React hooks to manage the themes in the frontend
- **src/api.ts** - Backend API client
