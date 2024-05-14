# Getting Started with the Project

## Prerequisites

Ensure you have Docker Desktop installed.

## Configuration

Key variables which are used in the startup of the app. They are pre-configured for initial use, can be adjusted to tailor the app's startup settings.
- `APP_DB`: MongoDB URI
- `PORT`: Preset to 3000 for backend
- `SECRET`: JWT SECRET TOKEN

Refer to [docker-compose.yaml](./docker-compose.yaml)

## Starting the Application

### Running All Services with latest build
To start the application containers with the latest build:
```bash
docker-compose -f docker-compose.yaml up -d --build
```

### Running All Services

To start both the backend and MongoDB database services as defined in the `docker-compose.yaml` file:

```bash
docker-compose -f docker-compose.yaml up -d
```

### Running only a Database (MongoDB)
To start only the MongoDB database as defined in the docker-compose.yaml file:
```bash
docker-compose -f docker-compose.yaml up -d mongodb
```

## Additional Docker Commands

### Rebuild containers after changes
```bash
docker-compose -f docker-compose.yaml build
```
### Stopping Services
To stop all running containers:
```bash
docker-compose -f docker-compose.yaml down
```

### Remove all volumes (including database data):
```bash
docker-compose -f docker-compose.yaml down -v
```