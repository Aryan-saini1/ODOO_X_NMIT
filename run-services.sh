#!/bin/bash

# Stop any existing containers
echo "Stopping existing services..."
docker-compose -f docker-compose.services.yml down

# Build and start the services
echo "Starting services..."
docker-compose -f docker-compose.services.yml up --build -d

# Check the status
echo "Services status:"
docker-compose -f docker-compose.services.yml ps
