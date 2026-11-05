# Battery Passport Portal - Docker Deployment Guide

This Vue 3 application is containerized and ready for Docker deployment.

## Quick Start with Docker Compose

The easiest way to run the application locally:

```bash
docker-compose up
```

The app will be available at `http://localhost` (port 80)

## Manual Docker Build and Run

### Build the image:
```bash
docker build -t battery-passport-portal:latest .
```

### Run the container:
```bash
docker run -d -p 80:80 --name battery-portal battery-passport-portal:latest
```

Access the app at `http://localhost` (port 80)

## Docker Image Details

- **Base Image**: `node:20-alpine` (lightweight, production-ready)
- **Build Strategy**: Multi-stage build for minimal final image size
- **Container Port**: 80 (mapped to localhost port 80 in the examples)
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

- The container runs on port 80 by default; local Docker examples map host port 80 to it
- All demo data is embedded in the application
- No external database required
- Suitable for development and production environments
