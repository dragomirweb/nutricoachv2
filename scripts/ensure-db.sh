#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Navigate to docker directory
cd "$(dirname "$0")/../docker" || exit 1

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q '^nutricoach_postgres$'; then
    echo -e "${GREEN}✓ PostgreSQL container is already running${NC}"
    
    # Check if database is ready
    if docker exec nutricoach_postgres pg_isready -U nutricoach &> /dev/null; then
        echo -e "${GREEN}✓ Database is ready${NC}"
    else
        echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
        for i in {1..30}; do
            if docker exec nutricoach_postgres pg_isready -U nutricoach &> /dev/null; then
                echo -e "${GREEN}✓ Database is ready${NC}"
                exit 0
            fi
            sleep 1
        done
        echo -e "${RED}Error: Database failed to become ready${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Starting PostgreSQL container...${NC}"
    
    # Use docker-compose or docker compose depending on what's available
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        docker compose up -d
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ PostgreSQL container started${NC}"
        
        # Wait for database to be ready
        echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
        for i in {1..30}; do
            if docker exec nutricoach_postgres pg_isready -U nutricoach &> /dev/null; then
                echo -e "${GREEN}✓ Database is ready${NC}"
                exit 0
            fi
            sleep 1
        done
        echo -e "${RED}Error: Database failed to become ready${NC}"
        exit 1
    else
        echo -e "${RED}Error: Failed to start PostgreSQL container${NC}"
        exit 1
    fi
fi