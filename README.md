# Prism AI Frontend

A modern React-based financial data processing interface built with Vite, designed for intuitive financial data analysis, reconciliation, and transformation workflows.

## 🚀 **Quick Start**

### **Development**
```bash
# Clone the repository
git clone <repository-url>
cd prism-ai-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Production**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Docker deployment
docker build -t prism-ai-frontend .
docker run -p 3000:3000 prism-ai-frontend
```

## 🏗️ **Architecture**

### **Core Features**
- **Financial Data Reconciliation** - Interactive reconciliation workflow with AI assistance
- **Data Transformation** - Visual data transformation with rule-based processing
- **Delta Analysis** - File comparison with detailed change tracking
- **Data Viewer** - Advanced data viewing with filtering and editing capabilities
- **AI Integration** - Natural language processing for configuration generation

### **Technology Stack**
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS + Modern CSS
- **State Management**: Custom hooks + Context API
- **Routing**: React Router v6
- **HTTP Client**: Axios + Fetch API
- **Build Tool**: Vite with Hot Module Replacement
- **Testing**: Vitest + Playwright E2E

### **UI Components**
- **Core Components**: Responsive layout with sidebars and navigation
- **Data Components**: Advanced data grids, filters, and viewers
- **Workflow Components**: Step-by-step processing flows
- **AI Components**: Interactive AI assistance interfaces

## 📚 **API Integration**

### **Backend Communication**
The frontend communicates with the Prism AI Backend through a RESTful API.

#### **Default Configuration**
- **Development**: `http://localhost:8000`
- **Production**: Configurable via environment variables

#### **Key API Endpoints**
- **File Management**: Upload, view, and manage data files
- **Reconciliation**: Process financial reconciliation workflows
- **Transformation**: Execute data transformation rules
- **Delta Generation**: Compare files and generate change reports
- **AI Assistance**: Get AI-powered configuration suggestions

### **Environment Configuration**
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# Feature Flags
REACT_APP_DEBUG=false
REACT_APP_API_TIMEOUT=30000

# UI Settings
REACT_APP_MAX_FILE_SIZE=100
REACT_APP_DEFAULT_PAGE_SIZE=1000
REACT_APP_ANIMATION_DURATION=400
```

## ⚙️ **Configuration**

### **Environment Files**
- **`.env.development`** - Development configuration
- **`.env.production`** - Production configuration
- **`.env.local`** - Local overrides (not committed)
- **`.env.example`** - Template for configuration

### **Backend API Configuration**
```javascript
// src/config/environment.js
export const ENV_CONFIG = {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    DEBUG_MODE: process.env.REACT_APP_DEBUG === 'true',
    API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000'),
    // ... other settings
};
```

## 🧪 **Testing**

### **Unit Testing**
```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### **E2E Testing**
```bash
# Run Playwright tests
npm run test:e2e

# Run in headed mode
npm run test:e2e:headed

# Generate test report
npm run test:e2e:report
```

### **Test Structure**
```
testing/
├── e2e/                 # Playwright E2E tests
├── fixtures/            # Test data files
├── screenshots/         # Visual test results
└── reports/            # Test reports
```

## 🐳 **Docker Deployment**

### **Production Build**
```bash
# Build image with custom API URL
docker build \
  --build-arg REACT_APP_API_URL=https://api.your-domain.com \
  --build-arg REACT_APP_DEBUG=false \
  -t prism-ai-frontend:prod .

# Run container
docker run -d \
  --name prism-ai-frontend \
  -p 3000:3000 \
  prism-ai-frontend:prod
```

### **Development Build**
```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up

# Production deployment
docker-compose up -d
```

### **Environment Variables in Docker**
```bash
# Set during build
docker build \
  --build-arg REACT_APP_API_URL=$REACT_APP_API_URL \
  --build-arg REACT_APP_DEBUG=$REACT_APP_DEBUG \
  -t prism-ai-frontend .
```

## 📦 **Build Commands**

```bash
# Development
npm run dev              # Start development server
npm run dev:host         # Start with network access

# Building
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests
npm run test:coverage    # Run with coverage
npm run test:e2e         # Run E2E tests
npm run test:e2e:headed  # Run E2E with browser

# Linting & Formatting
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues
npm run format           # Format with Prettier

# Type Checking
npm run type-check       # TypeScript type checking

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
npm run docker:stop      # Stop Docker container

# Utilities
npm run clean            # Clean build artifacts
npm run analyze          # Analyze bundle size
```

## 🔧 **Development**

### **Project Structure**
```
src/
├── components/          # React components
│   ├── core/           # Core UI components
│   ├── recon/          # Reconciliation components
│   ├── transformation/ # Transformation components
│   ├── delta/          # Delta generation components
│   ├── viewer/         # Data viewer components
│   └── rules/          # Rule management components
├── services/           # API service layers
│   ├── defaultApi.js   # Main API service
│   ├── deltaApiService.js
│   ├── aiAssistanceService.js
│   └── transformationApiService.js
├── hooks/              # Custom React hooks
├── pages/              # Main page components
├── config/             # Configuration files
├── assets/             # Static assets
└── fileManagement/     # File handling components
```

### **Component Architecture**
- **Flow Components**: Multi-step workflow managers
- **Step Components**: Individual workflow steps
- **Core Components**: Reusable UI elements
- **Service Integration**: API communication layers

### **State Management**
- **Custom Hooks**: Domain-specific state management
- **Context API**: Global application state
- **Local State**: Component-level state management

### **Styling Guidelines**
- **Tailwind CSS**: Utility-first CSS framework
- **Component Styles**: Scoped component styling
- **Responsive Design**: Mobile-first responsive layouts
- **Dark Mode**: Support for dark/light themes

## 🎨 **UI/UX Features**

### **Data Visualization**
- **Interactive Tables**: Sortable, filterable data grids
- **Progress Indicators**: Multi-step process tracking
- **Real-time Updates**: Live data refresh capabilities
- **Export Options**: Multiple export formats (CSV, Excel)

### **User Experience**
- **Drag & Drop**: File upload with drag & drop
- **Auto-save**: Automatic saving of user configurations
- **Error Handling**: User-friendly error messages
- **Loading States**: Smooth loading animations

### **Accessibility**
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: WCAG compliant color schemes
- **Focus Management**: Logical focus order

## 🔒 **Security**

### **Security Features**
- **Input Validation**: Client-side validation for all inputs
- **File Type Validation**: Strict file type checking
- **CORS Handling**: Proper cross-origin request handling
- **Environment Isolation**: Secure environment variable handling

### **Production Security**
```bash
# Secure environment variables
export REACT_APP_API_URL=https://api.your-secure-domain.com
export REACT_APP_DEBUG=false

# Content Security Policy
# Configured in nginx.conf for production deployment
```

## 📊 **Performance**

### **Optimization Features**
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: Service worker caching strategies

### **Performance Monitoring**
```bash
# Analyze bundle size
npm run analyze

# Performance profiling
npm run build && npm run preview
```

### **Build Optimization**
- **Tree Shaking**: Automatic dead code elimination
- **Minification**: Production build minification
- **Compression**: Gzip compression via nginx
- **Asset Optimization**: Image and asset optimization

## 🌐 **Deployment**

### **Development Deployment**
```bash
# Local development
npm run dev

# Network accessible
npm run dev:host
```

### **Production Deployment**

#### **Static Hosting**
```bash
# Build static files
npm run build

# Deploy to any static hosting service
# (Netlify, Vercel, AWS S3, etc.)
```

#### **Docker Deployment**
```bash
# Production deployment
docker-compose up -d

# With custom API URL
REACT_APP_API_URL=https://api.example.com docker-compose up -d
```

#### **Nginx Configuration**
The included `nginx.conf` provides:
- Gzip compression
- Security headers
- SPA routing support
- Health check endpoint

## 🤝 **Contributing**

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### **Development Guidelines**
- Follow React best practices
- Use TypeScript for type safety
- Add tests for new components
- Update documentation
- Follow the existing code style

### **Code Style**
- **ESLint**: Configured with React best practices
- **Prettier**: Automated code formatting
- **Husky**: Pre-commit hooks for quality
- **Conventional Commits**: Standardized commit messages

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/your-org/prism-ai-frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/prism-ai-frontend/discussions)
- **Documentation**: [Component Documentation](./docs/)

---

**Prism AI Frontend** - Intelligent financial data processing interface 🎨✨