#!/bin/bash

# DevTrack - Developer Utilization Platform
# Installation and Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   DevTrack - Developer Utilization Platform          ║"
echo "║   Installation and Management Script                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        echo "Please install Docker Compose"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
}

# Function to install the application
install() {
    echo -e "${YELLOW}Installing DevTrack...${NC}"
    
    check_docker
    
    echo "Building and starting containers..."
    docker-compose up -d --build
    
    echo ""
    echo -e "${GREEN}✓ Installation complete!${NC}"
    echo ""
    echo "Application URLs:"
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost:8000"
    echo "  API Docs:  http://localhost:8000/docs"
    echo ""
    echo "Default login credentials:"
    echo "  Email:     admin@example.com"
    echo "  Password:  password123"
    echo ""
    echo "Run './manage.sh logs' to view application logs"
}

# Function to start the application
start() {
    echo -e "${YELLOW}Starting DevTrack...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✓ DevTrack is running${NC}"
}

# Function to stop the application
stop() {
    echo -e "${YELLOW}Stopping DevTrack...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ DevTrack stopped${NC}"
}

# Function to restart the application
restart() {
    echo -e "${YELLOW}Restarting DevTrack...${NC}"
    docker-compose restart
    echo -e "${GREEN}✓ DevTrack restarted${NC}"
}

# Function to view logs
logs() {
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

# Function to check status
status() {
    echo -e "${YELLOW}DevTrack Status:${NC}"
    docker-compose ps
}

# Function to backup database
backup() {
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${YELLOW}Creating database backup: ${BACKUP_FILE}${NC}"
    docker-compose exec -T db pg_dump -U devuser devutilization > "$BACKUP_FILE"
    echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
}

# Function to restore database
restore() {
    if [ -z "$1" ]; then
        echo -e "${RED}Error: Please specify backup file${NC}"
        echo "Usage: ./manage.sh restore <backup_file.sql>"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        echo -e "${RED}Error: Backup file not found: $1${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Restoring database from: $1${NC}"
    cat "$1" | docker-compose exec -T db psql -U devuser devutilization
    echo -e "${GREEN}✓ Database restored${NC}"
}

# Function to clean up
clean() {
    echo -e "${YELLOW}Cleaning up DevTrack (this will remove all data)...${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" == "yes" ]; then
        docker-compose down -v
        echo -e "${GREEN}✓ Cleanup complete${NC}"
    else
        echo "Cleanup cancelled"
    fi
}

# Function to update application
update() {
    echo -e "${YELLOW}Updating DevTrack...${NC}"
    docker-compose down
    docker-compose pull
    docker-compose up -d --build
    echo -e "${GREEN}✓ Update complete${NC}"
}

# Function to show help
show_help() {
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install   - Install and start DevTrack"
    echo "  start     - Start the application"
    echo "  stop      - Stop the application"
    echo "  restart   - Restart the application"
    echo "  status    - Show application status"
    echo "  logs      - View application logs (optional: specify service)"
    echo "  backup    - Create database backup"
    echo "  restore   - Restore database from backup file"
    echo "  update    - Update to latest version"
    echo "  clean     - Remove all containers and data"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./manage.sh install"
    echo "  ./manage.sh logs backend"
    echo "  ./manage.sh restore backup_20240101_120000.sql"
}

# Main script logic
case "$1" in
    install)
        install
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    update)
        update
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$1'${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
