# Battery Passport Portal - Docker Deployment Guide

This Vue 3 application is containerized and ready for Docker deployment.

## Quick Start with Docker Compose

The easiest way to run the application locally:

```bash
docker-compose up
```

The app will be available at `http://localhost:3000`

## Manual Docker Build and Run

### Build the image:
```bash
docker build -t battery-passport-portal:latest .
```

### Run the container:
```bash
docker run -d -p 3000:3000 --name battery-portal battery-passport-portal:latest
```

Access the app at `http://localhost:3000`

## Docker Image Details

- **Base Image**: `node:20-alpine` (lightweight, production-ready)
- **Build Strategy**: Multi-stage build for minimal final image size
- **Port**: 3000
- **Health Check**: Enabled (checks every 30 seconds)
- **Server**: `serve` (production-grade static file server)

## Container Management

### Stop the container:
```bash
docker stop battery-portal
```

### Start the container:
```bash
docker start battery-portal
```

### Remove the container:
```bash
docker rm battery-portal
```

### View logs:
```bash
docker logs battery-portal
```

## Docker Compose Commands

### Build the image:
```bash
docker-compose build
```

### Start services:
```bash
docker-compose up -d
```

### Stop services:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f battery-portal
```

## Features

✅ Multi-stage build for smaller image size
✅ Alpine Linux for minimal footprint
✅ Health check for container monitoring
✅ Auto-restart policy
✅ Production-ready static file serving
✅ Demo authentication (admin/password)

## Login Credentials

Username: `admin`
Password: `password`

## Notes

- The application runs on port 3000 by default
- All demo data is embedded in the application
- No external database required
- Suitable for development and production environments
