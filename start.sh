#!/bin/bash

# Weather App Development Launcher
# =================================
# Usage: ./start.sh [options]
# 
# Options:
#   --api-only    Start only the backend API
#   --web-only    Start only the frontend
#   --production  Start in production mode
#   --help       Show this help message

set -e  # Exit on any error

# Colors for output
BLUE='\033[36m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
RESET='\033[0m'

# Configuration
API_PORT=3000
WEB_PORT=3333
API_DIR="api"
WEB_DIR="web"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${RESET}"
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
    fi
    if [ ! -z "$WEB_PID" ]; then
        kill $WEB_PID 2>/dev/null || true
    fi
    # Kill any remaining processes
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup complete${RESET}"
    exit 0
}

# Set trap for cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Help function
show_help() {
    echo -e "${BLUE}Weather App Development Launcher${RESET}"
    echo "================================="
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --api-only     Start only the backend API (port $API_PORT)"
    echo "  --web-only     Start only the frontend (port $WEB_PORT)"
    echo "  --production   Start in production mode"
    echo "  --help         Show this help message"
    echo ""
    echo "Default: Start both development servers"
    echo ""
    echo "Development URLs:"
    echo "  Backend API:  http://localhost:$API_PORT"
    echo "  Frontend:     http://localhost:$WEB_PORT"
    echo ""
    echo "Press Ctrl+C to stop all servers"
}

# Check if directories exist
check_setup() {
    if [ ! -d "$API_DIR" ]; then
        echo -e "${RED}❌ API directory '$API_DIR' not found${RESET}"
        exit 1
    fi
    if [ ! -d "$WEB_DIR" ]; then
        echo -e "${RED}❌ Web directory '$WEB_DIR' not found${RESET}"
        exit 1
    fi
    if [ ! -f "$API_DIR/package.json" ]; then
        echo -e "${RED}❌ Backend package.json not found${RESET}"
        exit 1
    fi
    if [ ! -f "$WEB_DIR/package.json" ]; then
        echo -e "${RED}❌ Frontend package.json not found${RESET}"
        exit 1
    fi
}

# Check if dependencies are installed
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${RESET}"
    
    if [ ! -d "$API_DIR/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing backend dependencies...${RESET}"
        cd "$API_DIR" && npm install && cd ..
    fi
    
    if [ ! -d "$WEB_DIR/node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${RESET}"
        cd "$WEB_DIR" && npm install && cd ..
    fi
    
    echo -e "${GREEN}✅ Dependencies ready${RESET}"
}

# Start API server
start_api() {
    echo -e "${BLUE}🚀 Starting backend API...${RESET}"
    cd "$API_DIR"
    
    if [ "$PRODUCTION" = true ]; then
        npm run build
        npm start &
    else
        npm run dev &
    fi
    
    API_PID=$!
    cd ..
    
    # Wait for API to be ready
    echo -e "${YELLOW}⏳ Waiting for API to start...${RESET}"
    for i in {1..30}; do
        if curl -s "http://localhost:$API_PORT/" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend API ready at http://localhost:$API_PORT${RESET}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ Backend API failed to start${RESET}"
    exit 1
}

# Start web server
start_web() {
    echo -e "${BLUE}🚀 Starting frontend...${RESET}"
    cd "$WEB_DIR"
    
    if [ "$PRODUCTION" = true ]; then
        npm run build
        npm run preview &
    else
        npm run dev &
    fi
    
    WEB_PID=$!
    cd ..
    
    # Wait for web server to be ready
    echo -e "${YELLOW}⏳ Waiting for frontend to start...${RESET}"
    for i in {1..30}; do
        if curl -s "http://localhost:$WEB_PORT/" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend ready at http://localhost:$WEB_PORT${RESET}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ Frontend failed to start${RESET}"
    exit 1
}

# Parse command line arguments
API_ONLY=false
WEB_ONLY=false
PRODUCTION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --api-only)
            API_ONLY=true
            shift
            ;;
        --web-only)
            WEB_ONLY=true
            shift
            ;;
        --production)
            PRODUCTION=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${RESET}"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
echo -e "${BLUE}🌦️  Weather App Development Launcher${RESET}"
echo "====================================="

# Validate arguments
if [ "$API_ONLY" = true ] && [ "$WEB_ONLY" = true ]; then
    echo -e "${RED}❌ Cannot use --api-only and --web-only together${RESET}"
    exit 1
fi

# Setup checks
check_setup
check_dependencies

# Start servers based on options
if [ "$API_ONLY" = true ]; then
    start_api
    echo -e "${GREEN}🎉 Backend API is running!${RESET}"
elif [ "$WEB_ONLY" = true ]; then
    start_web
    echo -e "${GREEN}🎉 Frontend is running!${RESET}"
else
    # Start both servers
    start_api
    start_web
    
    echo ""
    echo -e "${GREEN}🎉 Both servers are running!${RESET}"
    echo -e "${YELLOW}Backend API:  http://localhost:$API_PORT${RESET}"
    echo -e "${YELLOW}Frontend:     http://localhost:$WEB_PORT${RESET}"
    echo ""
    echo -e "${BLUE}Press Ctrl+C to stop all servers${RESET}"
fi

# Keep script running and wait for user to stop
wait 