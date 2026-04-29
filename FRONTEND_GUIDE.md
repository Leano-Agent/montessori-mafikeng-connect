# Montessori Mafikeng Connect - Frontend Development Guide

## 🎯 Overview

This guide covers frontend development for the Montessori Mafikeng Connect Progressive Web Application (PWA). The frontend is built with React 18, TypeScript, Vite, and Chakra UI, with a focus on African design, mobile-first approach, and offline capabilities.

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Chakra UI (custom African theme)
- **State Management**: React Query + Zustand
- **Routing**: React Router DOM v6
- **Internationalization**: i18next (Setswana/English)
- **Offline Support**: Dexie.js + Service Workers
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + React Testing Library + Cypress
- **Code Quality**: ESLint + Prettier + Husky

### Project Structure
```
frontend/
├── public/                    # Static assets and PWA files
│   ├── icons/                # App icons for different devices
│   ├── manifest.json         # PWA manifest
│   └── service-worker.js     # Service worker for offline
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Button, Input, Modal, etc.
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   ├── auth/            # Login, Register, Forgot Password
│   │   ├── dashboard/       # Dashboard components
│   │   ├── montessori/      # Montessori-specific components
│   │   └── african/         # African-themed components
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useOffline.ts    # Offline status hook
│   │   ├── useLanguage.ts   # Language switching hook
│   │   └── useTheme.ts      # Theme management hook
│   ├── services/            # API and external services
│   │   ├── api/             # API client and endpoints
│   │   ├── i18n/            # Internationalization setup
│   │   ├── offline/         # Offline database and sync
│   │   └── notifications/   # Push and SMS notifications
│   ├── stores/              # Zustand state stores
│   │   ├── auth.store.ts    # Authentication state
│   │   ├── ui.store.ts      # UI state (theme, language)
│   │   └── offline.store.ts # Offline sync state
│   ├── types/               # TypeScript type definitions
│   │   ├── api.types.ts     # API request/response types
│   │   ├── user.types.ts    # User and role types
│   │   └── montessori.types.ts # Montessori-specific types
│   ├── utils/               # Utility functions
│   │   ├── validation.ts    # Form validation schemas
│   │   ├── format.ts        # Date, number, string formatting
│   │   └── african.ts       # African-specific utilities
│   ├── styles/              # Global styles and theme
│   │   ├── theme.ts         # Chakra UI theme configuration
│   │   ├── fonts.ts         # Font face definitions
│   │   └── global.css       # Global CSS styles
│   ├── pages/               # Page components (routes)
│   │   ├── Auth/           # Authentication pages
│   │   ├── Dashboard/      # Dashboard pages
│   │   ├── Montessori/     # Montessori feature pages
│   │   └── Settings/       # Settings pages
│   ├── App.tsx             # Main App component
│   ├── main.tsx            # Application entry point
│   └── vite-env.d.ts       # Vite type definitions
├── .env.example            # Environment variables template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/Leano-Agent/montessori-mafikeng-connect.git
cd montessori-mafikeng-connect/frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables
Create a `.env` file with:
```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME="Montessori Mafikeng Connect"
VITE_APP_VERSION=0.1.0
VITE_PWA_ENABLED=true
VITE_SENTRY_DSN=your_sentry_dsn
```

## 🎨 Design System

### African Theme
The application uses a custom Chakra UI theme with African-inspired colors:

```typescript
// theme.ts
export const theme = extendTheme({
  colors: {
    african: {
      sun: "#FFD700",     // African sun yellow
      earth: "#8B4513",   // Rich earth brown
      sky: "#1E90FF",     // African sky blue
      forest: "#228B22",  // Forest green
      savanna: "#DAA520", // Savanna gold
    },
    // Role-based colors
    role: {
      teacher: "#4A90E2",
      parent: "#7ED321",
      admin: "#F5A623",
      student: "#BD10E0",
    }
  },
  fonts: {
    heading: "'Ubuntu', sans-serif",
    body: "'Open Sans', sans-serif",
    // African language support
    setswana: "'Noto Sans Tswana', sans-serif",
  }
});
```

### Component Guidelines

#### 1. Use Chakra UI Components
```tsx
import { Button, Box, Text, VStack } from '@chakra-ui/react';

const ExampleComponent = () => (
  <Box p={4}>
    <VStack spacing={4}>
      <Text fontSize="lg">Hello in Setswana</Text>
      <Button colorScheme="african.sun">
        Dumela (Hello)
      </Button>
    </VStack>
  </Box>
);
```

#### 2. Responsive Design
```tsx
// Use Chakra's responsive array syntax
<Box
  width={["100%", "80%", "60%", "40%"]}
  padding={[2, 4, 6, 8]}
>
  {/* Content */}
</Box>
```

#### 3. Accessibility
- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Support screen readers

## 🌐 Internationalization (i18n)

### Setup
The app supports Setswana (tn) and English (en) with Setswana as default:

```typescript
// i18n configuration
i18n
  .use(initReactI18next)
  .init({
    resources: {
      tn: { translation: tnTranslations },
      en: { translation: enTranslations }
    },
    lng: "tn", // Default language
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });
```

### Usage in Components
```tsx
import { useTranslation } from 'react-i18next';

const Greeting = () => {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('greeting.hello')}</h1>
      <button onClick={() => i18n.changeLanguage('tn')}>
        {t('language.setswana')}
      </button>
      <button onClick={() => i18n.changeLanguage('en')}>
        {t('language.english')}
      </button>
    </div>
  );
};
```

### Translation Files
```json
// locales/tn.json
{
  "greeting": {
    "hello": "Dumela",
    "welcome": "O amogelesegile"
  },
  "auth": {
    "login": "Kena",
    "register": "Ngwadisisa"
  }
}

// locales/en.json
{
  "greeting": {
    "hello": "Hello",
    "welcome": "Welcome"
  },
  "auth": {
    "login": "Login",
    "register": "Register"
  }
}
```

## 📱 Progressive Web App (PWA)

### Service Worker
The app includes a service worker for offline functionality:

```javascript
// public/service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('montessori-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        // Critical assets
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### Offline Detection
```tsx
// hooks/useOffline.ts
import { useEffect, useState } from 'react';

export const useOffline = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOffline;
};
```

### Install Prompt
```tsx
// components/common/InstallPrompt.tsx
import { useEffect, useState } from 'react';

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);
  
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };
  
  if (!deferredPrompt) return null;
  
  return (
    <Button onClick={handleInstall}>
      Install App
    </Button>
  );
};
```

## 🔌 API Integration

### React Query Setup
```typescript
// services/api/client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### API Service Layer
```typescript
// services/api/auth.ts
import api from './client';

export const authAPI = {
  login: (credentials: LoginRequest) => 
    api.post<LoginResponse>('/auth/login', credentials),
  
  register: (userData: RegisterRequest) =>
    api.post<RegisterResponse>('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    api.post<TokenResponse>('/auth/refresh', { refreshToken }),
};
```

### Usage in Components
```tsx
// pages/Auth/Login.tsx
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../services/api/auth';

const LoginPage = () => {
  const mutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      // Handle successful login
      localStorage.setItem('token', data.accessToken);
    },
    onError: (error) => {
      // Handle error
    },
  });
  
  const handleSubmit = (data: LoginFormData) => {
    mutation.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button isLoading={mutation.isPending}>
        Login
      </Button>
    </form>
  );
};
```

## 💾 Offline Data Management

### Dexie.js Database
```typescript
// services/offline/database.ts
import Dexie from 'dexie';

class MontessoriDB extends Dexie {
  observations: Dexie.Table<Observation, string>;
  students: Dexie.Table<Student, string>;
  syncQueue: Dexie.Table<SyncItem, string>;
  
  constructor() {
    super('MontessoriDB');
    
    this.version(1).stores({
      observations: '++id, studentId, date',
      students: '++id, firstName, lastName',
      syncQueue: '++id, type, status, createdAt',
    });
  }
}

export const db = new MontessoriDB();
```

### Offline Sync Service
```typescript
// services/offline/sync.ts
export class OfflineSyncService {
  async syncChanges() {
    const pendingChanges = await db.syncQueue
      .where('status')
      .equals('pending')
      .toArray();
    
    for (const change of pendingChanges) {
      try {
        await this.sendToServer(change);
        await db.syncQueue.update(change.id!, { status: 'synced' });
      } catch (error) {
        await db.syncQueue.update(change.id!, { status: 'failed' });
      }
    }
  }
  
  async queueChange(type: string, data: any) {
    await db.syncQueue.add({
      type,
      data,
      status: 'pending',
      createdAt: new Date(),
    });
  }
}
```

## 🧪 Testing

### Unit Tests with Vitest
```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/common/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests with Cypress
```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  it('should login successfully', () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('teacher@school.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

### Running Tests
```bash
# Unit tests
npm test

# E2E tests (headless)
npm run test:e2e

# E2E tests (with UI)
npm run test:e2e:open
```

## 🚀 Building for Production

### Build Commands
```bash
# Development build
npm run build:dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Montessori Mafikeng Connect',
        short_name: 'Montessori',
        theme_color: '#FFD700',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          // More icons...
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@chakra-ui/react', '@emotion/react'],
        },
      },
    },
  },
});
```

## 📱 Mobile Optimization

### Touch-Friendly Components
```tsx
// components/common/TouchButton.tsx
import { Button, ButtonProps } from '@chakra-ui/react';

export const TouchButton = (props: ButtonProps) => (
  <Button
    minHeight="44px" // Minimum touch target size
    minWidth="44px"
    padding="12px 24px"
    fontSize="16px" // Minimum readable font size
    {...props}
  />
);
```

### Performance Optimization

#### 1. Code Splitting
```tsx
// Lazy load heavy components
const ObservationForm = lazy(() => 
  import('../components/montessori/ObservationForm')
);

const ObservationsPage = () => (
  <Suspense fallback={<Spinner />}>
    <ObservationForm />
  </Suspense>
);
```

#### 2. Image Optimization
```tsx
// Use Chakra's Image with lazy loading
import { Image } from '@chakra-ui/react';

<Image
  src="/photo.jpg"
  alt="Student observation"
  loading="lazy"
  fallbackSrc="/placeholder.jpg"
/>
```

#### 3. Bundle Analysis
```bash
# Analyze bundle size
npm run build -- --analyze
```

## 🔒 Security Best Practices

### 1. Input Sanitization
```typescript
// utils/security.ts
export const sanitize