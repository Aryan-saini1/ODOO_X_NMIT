# Running Services in Docker

This document explains how to run the microservices in Docker.

## Prerequisites

1. Install Docker Desktop:
   - For macOS: https://docs.docker.com/desktop/install/mac/
   - For Windows: https://docs.docker.com/desktop/install/windows/
   - For Linux: https://docs.docker.com/desktop/install/linux/

2. Make sure Docker is running before proceeding

## Services Overview

The following services are containerized:

- **Postgres** - Database server
- **Product-BOM** - Product and Bill of Materials service (port 4001)
- **MO** - Manufacturing Order service (port 4002)
- **Inventory** - Inventory management service (port 4003)
- **WO** - Work Order service (port 4004)

## Running the Services

### Option 1: Using the script

Run the provided script:

```bash
./run-services.sh
```

### Option 2: Manual execution

```bash
# Stop any existing services
docker-compose -f docker-compose.services.yml down

# Build and start services
docker-compose -f docker-compose.services.yml up --build -d

# Check status
docker-compose -f docker-compose.services.yml ps
```

## Accessing the Services

Once running, the services are available at:

- Product-BOM: http://localhost:4001
- Manufacturing Orders: http://localhost:4002
- Inventory: http://localhost:4003
- Work Orders: http://localhost:4004

## Viewing Logs

```bash
# All services
docker-compose -f docker-compose.services.yml logs -f

# Specific service
docker-compose -f docker-compose.services.yml logs -f mo-service
```

## Stopping the Services

```bash
docker-compose -f docker-compose.services.yml down
```
