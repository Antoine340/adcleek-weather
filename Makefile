# Weather App Makefile
# ==================

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# Development Commands
# ====================

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Weather App - Development Commands$(RESET)"
	@echo "=================================="
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*##/ { printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

.PHONY: install
install: ## Install dependencies for both backend and frontend
	@echo "$(BLUE)Installing backend dependencies...$(RESET)"
	@cd api && npm install
	@echo "$(BLUE)Installing frontend dependencies...$(RESET)"
	@cd web && npm install
	@echo "$(GREEN)✅ All dependencies installed$(RESET)"

.PHONY: dev
dev: ## Start both backend and frontend in development mode
	@echo "$(BLUE)🚀 Starting development servers...$(RESET)"
	@echo "$(YELLOW)Backend: http://localhost:3000$(RESET)"
	@echo "$(YELLOW)Frontend: http://localhost:3333$(RESET)"
	@echo "$(YELLOW)Press Ctrl+C to stop both servers$(RESET)"
	@$(MAKE) -j2 dev-api dev-web

.PHONY: dev-api
dev-api: ## Start only the backend API server
	@echo "$(BLUE)Starting backend API...$(RESET)"
	@cd api && npm run dev

.PHONY: dev-web
dev-web: ## Start only the frontend development server
	@echo "$(BLUE)Starting frontend...$(RESET)"
	@cd web && npm run dev

# Production Commands
# ===================

.PHONY: build
build: ## Build both backend and frontend for production
	@echo "$(BLUE)Building for production...$(RESET)"
	@cd api && npm run build
	@cd web && npm run build
	@echo "$(GREEN)✅ Production build complete$(RESET)"

.PHONY: start
start: build ## Start production servers (after building)
	@echo "$(BLUE)Starting production servers...$(RESET)"
	@$(MAKE) -j2 start-api start-web

.PHONY: start-api
start-api: ## Start production backend server
	@cd api && npm start

.PHONY: start-web
start-web: ## Start production frontend server (preview)
	@cd web && npm run preview

# Testing Commands
# ================

.PHONY: test
test: ## Run all tests
	@echo "$(BLUE)Running backend tests...$(RESET)"
	@cd api && npm test
	@echo "$(BLUE)Running frontend tests...$(RESET)"
	@cd web && npm test

.PHONY: test-api
test-api: ## Run only backend tests
	@cd api && npm test

.PHONY: test-web
test-web: ## Run only frontend tests
	@cd web && npm test

# Maintenance Commands
# ====================

.PHONY: clean
clean: ## Clean build artifacts and dependencies
	@echo "$(BLUE)Cleaning build artifacts...$(RESET)"
	@rm -rf api/dist api/node_modules api/.env
	@rm -rf web/dist web/node_modules
	@echo "$(GREEN)✅ Clean complete$(RESET)"

.PHONY: reset
reset: clean install ## Reset project (clean + install)
	@echo "$(GREEN)✅ Project reset complete$(RESET)"

.PHONY: lint
lint: ## Run linting for both projects
	@echo "$(BLUE)Linting backend...$(RESET)"
	@cd api && npm run lint
	@echo "$(BLUE)Linting frontend...$(RESET)"
	@cd web && npm run lint

.PHONY: format
format: ## Format code for both projects
	@echo "$(BLUE)Formatting backend...$(RESET)"
	@cd api && npm run format || echo "No format script in backend"
	@echo "$(BLUE)Formatting frontend...$(RESET)"
	@cd web && npm run format || echo "No format script in frontend"

# Quick Status Check
# ==================

.PHONY: status
status: ## Check status of development servers
	@echo "$(BLUE)Checking server status...$(RESET)"
	@printf "Backend API: "
	@curl -s http://localhost:3000/ >/dev/null && echo "$(GREEN)✅ Running$(RESET)" || echo "$(RED)❌ Not running$(RESET)"
	@printf "Frontend: "
	@curl -s http://localhost:3333/ >/dev/null && echo "$(GREEN)✅ Running$(RESET)" || echo "$(RED)❌ Not running$(RESET)" 