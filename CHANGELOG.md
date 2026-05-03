# Changelog

All notable changes to Montessori Mafikeng Connect will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (2026-05-03)
- **Backend test suite**: 89 tests across 4 suites (auth, errorMiddleware, sms, redis)
- **Redis service test** (37 tests): lifecycle, graceful fallbacks, error recovery
- **Error middleware test** (16 tests): AppError class, errorHandler, notFound, asyncHandler
- **SMS service test** (11 tests): sendSMS, validation, phone formatting, message construction
- **Frontend auth API layer**: axios instance with JWT refresh interceptor
- **Auth store** (Zustand): secure in-memory token storage, localStorage for role
- **Login page**: wired to real backend API (replaces simulated API)
- Vite dev proxy configured for /api → backend:3001

### Changed
- **Auth controller test**: fixed mock export name (AuthService vs authService) — 25 tests pass
- **Jest config**: suppressed ts-jest TS151002 warning
- **DashboardLayout**: logout now calls real auth API (was localStorage-only stub)
- **App.tsx**: initializes auth store on mount for session restore

### Fixed
- Redis optional availability: all services degrade gracefully without Redis
- TypeScript compilation: zero errors across both frontend and backend

## [0.1.0] — Phase 2

### Added
- Initial project structure and architecture
- Phase 2 frontend implementation (88% complete)
- Authentication UI with Setswana/English bilingual support
- Montessori observation interface
- School-parent communication system
- Dashboard and navigation system
- Offline-first PWA implementation
- Setswana language integration
- African design aesthetics
- Deployment configurations for Vercel, Railway, Render
- Docker setup for local development
- CI/CD pipeline with GitHub Actions
- Comprehensive documentation

### Technical Foundation
- Frontend: React 18 + TypeScript + Vite + Chakra UI
- Backend: Node.js + Express + Prisma + PostgreSQL
- Database: Montessori-specific schema
- Cache: Redis integration
- File Storage: AWS S3 (African region)
- SMS: Africa's Talking API integration
- Hosting: AWS Africa (Cape Town) focus

### African Context Features
- Setswana-first language implementation
- Voice interfaces for diverse literacy levels
- Offline functionality for connectivity challenges
- SMS integration for low-tech users
- Mobile-first PWA design
- Cultural relevance in all design elements

## [0.1.0] - 2026-03-26

### Initial Release
- Project foundation complete
- Phase 2 frontend implementation ready for testing
- Deployment configurations for free hosting platforms
- Testing documentation for Montessori Mafikeng staff
- Complete GitHub repository structure

### Key Features
- **Authentication**: Bilingual login/registration (Setswana/English)
- **Observations**: Montessori-aligned observation documentation
- **Communication**: Teacher-parent messaging with voice support
- **Dashboard**: Role-based dashboards for teachers, parents, admins
- **Offline Support**: PWA with service workers and sync queue
- **Mobile Experience**: Fully responsive mobile-first design

### Deployment Ready
- Vercel configuration for frontend
- Railway/Render configuration for backend
- Docker Compose for local development
- Environment variable templates
- Database migration setup

## Versioning Scheme

- **Major version (X.0.0)**: Breaking changes, major feature releases
- **Minor version (0.X.0)**: New features, backward compatible
- **Patch version (0.0.X)**: Bug fixes, minor improvements

## Release Schedule

- **Weekly releases** for bug fixes and minor improvements
- **Monthly releases** for new features
- **Quarterly releases** for major updates

## Support Timeline

- **Active development**: March 2026 - March 2027
- **Security updates**: Until March 2028
- **Extended support**: Available for African educational institutions

---

**Built with ❤️ in Africa, for Africa**