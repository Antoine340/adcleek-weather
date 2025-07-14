# Weather App 🌦️

A full-stack weather application with a TypeScript backend API and Vue.js frontend.

## 📁 Project Structure

```
weather-app/
├── api/              # Backend TypeScript API
│   ├── src/          # Source code
│   ├── tests/        # API tests
│   ├── data/         # Database files
│   └── package.json  # Backend dependencies
├── web/              # Frontend Vue.js application
│   ├── src/          # Vue components & pages
│   ├── public/       # Static assets
│   └── package.json  # Frontend dependencies
├── Makefile          # Development commands
├── start.sh          # Bash launch script
└── .env              # Environment configuration
```

## 🚀 Quick Start

### Option 1: Using Makefile (Recommended)
```bash
# Start both backend and frontend
make dev

# Or start individual services
make dev-api    # Backend only
make dev-web    # Frontend only

# View all available commands
make help
```

### Option 2: Using Bash Script
```bash
# Start both servers
./start.sh

# Start individual services
./start.sh --api-only    # Backend only
./start.sh --web-only    # Frontend only

# Production mode
./start.sh --production

# View help
./start.sh --help
```

## 🛠️ Development URLs

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:3333

## 📝 Available Commands

### Makefile Commands
| Command | Description |
|---------|-------------|
| `make dev` | Start both development servers |
| `make build` | Build for production |
| `make test` | Run all tests |
| `make install` | Install all dependencies |
| `make clean` | Clean build artifacts |
| `make status` | Check server status |
| `make help` | Show all commands |

### Package Scripts
Each service has its own package.json with scripts:

**Backend (api/)**
```bash
cd api
npm run dev      # Development server
npm run build    # Build TypeScript
npm start        # Production server
npm test         # Run tests
```

**Frontend (web/)**
```bash
cd web
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests
```

## 🏗️ Architecture

### Backend API (TypeScript/Node.js)
- **Framework**: Express.js with TypeScript
- **Database**: SQLite with custom Database helper
- **API Integration**: Météo-Concept weather API
- **Testing**: Jest with real API integration tests
- **Routes**:
  - `GET /cities` - List all cities
  - `GET /weather/:insee` - Weather forecast for city
  - `POST /cities` - Add new city by INSEE code

### Frontend (Vue.js)
- **Framework**: Vue 3 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Router**: Vue Router with auto-imports
- **Features**: i18n, dev tools, layouts

## 🔧 Configuration

Environment variables are managed through `.env` files:

**Root `.env`** (shared configuration)
```env
API_KEY=your_meteo_concept_api_key
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/weather.db
```

**Backend specific** (`api/.env`)
- Same configuration as root, copied automatically

## 🧪 Testing

### Run All Tests
```bash
make test
```

### Backend Tests Only
```bash
make test-api
# or
cd api && npm test
```

### Frontend Tests Only
```bash
make test-web
# or
cd web && npm test
```

## 📦 Dependencies Management

### Install All Dependencies
```bash
make install
```

### Reset Project (Clean + Install)
```bash
make reset
```

## 🚢 Production Deployment

### Build for Production
```bash
make build
```

### Start Production Servers
```bash
make start
```

### Production Mode with Script
```bash
./start.sh --production
```

## 🐛 Troubleshooting

### Check Server Status
```bash
make status
```

### Clean Build Issues
```bash
make clean
make install
```

### Port Already in Use
If ports 3000 or 3333 are busy:
1. Kill existing processes: `pkill -f "npm run dev"`
2. Or change ports in the configuration files

### Database Issues
- Database is automatically initialized on first run
- To reset: `rm -rf api/data/weather.db`

## 🔍 API Endpoints

### GET /cities
Lists all cities with INSEE codes.

```bash
curl http://localhost:3000/cities
```

### GET /weather/:insee
Get weather forecast for a city by INSEE code.

```bash
curl http://localhost:3000/weather/75101
```

### POST /cities
Add a new city by INSEE code.

```bash
curl -X POST http://localhost:3000/cities \
  -H "Content-Type: application/json" \
  -d '{"insee": "33063"}'
```

## 📋 Best Practices

1. **Use Makefile** for consistent development workflow
2. **Environment Variables** are automatically loaded
3. **Database** is initialized automatically
4. **Tests** use real API integration for reliability
5. **Cleanup** is handled automatically by scripts
6. **Dependencies** are checked before starting servers

## 🤝 Contributing

1. Make changes in respective folders (`api/` or `web/`)
2. Test your changes: `make test`
3. Use the launch scripts for development
4. Follow the existing TypeScript/Vue patterns

---

**Happy coding! 🚀** 
>>>>>>> b8022f0 (v1)
