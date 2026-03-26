# Montessori Mafikeng Connect

**A culturally-relevant, Montessori-aligned school management platform for African Montessori schools**

---

## 🦁 African Sovereignty Focus

Built in Africa, for Africa. This project demonstrates African tech sovereignty in education with:
- Setswana language integration (local language first, English second)
- African hosting (AWS Cape Town)
- Cultural relevance in design
- Cost-effective for African schools

## 🎯 Core Philosophy

### Montessori Philosophy First
- Individual progress tracking (not standardized testing)
- Observation-based assessment (not traditional grading)
- Mixed-age classroom support (3-year age spans)
- Work cycle documentation (2-3 hour uninterrupted periods)
- Practical life skills tracking

### African Context Design
- **Mobile-first PWA** - 95% of users access via smartphone
- **Offline-first architecture** - Works without constant internet
- **Setswana language priority** - Local language first, English second
- **Low data usage** - Optimized for limited data plans
- **SMS integration** - Critical notifications via SMS (Africa's Talking API)

## 🚀 Project Status

**Phase 1: Foundation** ✅ **IN PROGRESS**
- [x] Project structure setup
- [x] Frontend foundation (React + TypeScript + Vite + Chakra UI)
- [x] PWA setup with offline capabilities
- [x] Setswana/English i18n integration
- [x] Backend foundation (Node.js + Express + Prisma)
- [x] Database schema design
- [ ] Authentication system
- [ ] Offline sync infrastructure
- [ ] Basic user management

## 🛠️ Technology Stack

### Frontend (PWA)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** Chakra UI (African-inspired design)
- **State Management:** React Query + Zustand
- **Offline Support:** Dexie.js + Service Workers
- **Internationalization:** i18next (Setswana/English)
- **Testing:** Jest + Cypress

### Backend
- **Runtime:** Node.js + Express
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis
- **File Storage:** AWS S3 (African region)
- **SMS Gateway:** Africa's Talking API
- **Authentication:** JWT + Refresh tokens

### Infrastructure
- **Hosting:** AWS Africa (Cape Town) - sa-east-1 region
- **Containerization:** Docker
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry + Winston logging

## 📁 Project Structure

```
montessori-mafikeng-connect/
├── frontend/                 # React PWA frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services, i18n, offline
│   │   ├── styles/         # Global styles and theme
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets, PWA files
│   └── package.json
├── backend/                 # Node.js API backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   └── types/          # TypeScript types
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── infrastructure/          # AWS infrastructure as code
├── docs/                   # Documentation
└── scripts/               # Development and deployment scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- AWS Account (for deployment)

### Development Setup

1. **Clone and navigate to project:**
   ```bash
   cd montessori-mafikeng-connect
   ```

2. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api-docs
   - Prisma Studio: http://localhost:5555

## 📊 Key Features Implemented

### Phase 1: Foundation (Current)
- ✅ **PWA Setup:** Service workers, manifest, offline page
- ✅ **African Design:** Chakra UI theme with African color palette
- ✅ **Bilingual Support:** Setswana/English i18n with language switcher
- ✅ **Offline Detection:** Real-time connectivity status indicator
- ✅ **Database Schema:** Complete Prisma schema for Montessori needs
- ✅ **Backend Foundation:** Express server with middleware setup

### Phase 2: Core Features (Upcoming)
- Authentication system (JWT + roles)
- Montessori observation documentation
- School-parent communication
- SMS fallback integration
- Student progress tracking

### Phase 3: Advanced Features
- Attendance system with offline sync
- Events calendar with volunteer management
- Montessori materials management
- Reporting and analytics

### Phase 4: Polish & Launch
- Performance optimization
- Security hardening (POPIA compliance)
- AWS Africa deployment
- Monitoring and support setup

## 🌍 African Context Innovations

1. **Hybrid Connectivity Model**
   - Online/offline seamless transition
   - SMS integration for critical communications
   - Voice messages for low-literacy users

2. **Cultural Communication Styles**
   - Respectful teacher-parent communication protocols
   - Community-focused announcement styles
   - African aesthetic design language

3. **Cost-Effective Architecture**
   - Optimized for African hosting costs
   - Efficient data usage (critical for data costs)
   - Scalable pricing for African school budgets

## 👥 User Personas Supported

1. **Teacher Thandi** - Montessori educator, moderate tech skills
2. **Parent Kagiso** - Working parent, basic tech literacy
3. **Admin Busi** - School administrator, good tech skills
4. **Principal David** - School leader, limited but willing tech user

## 📈 Success Metrics

### Technical Success
- 99.9% uptime with offline capability
- <3 second page load time
- <100ms API response time
- 100% offline functionality

### User Success
- 90% teacher adoption rate
- 80% parent weekly engagement
- 50% reduction in administrative phone calls
- Montessori philosophy alignment score > 4/5

## 🔒 Security & Compliance

- **POPIA Compliance:** South African data protection
- **End-to-End Encryption:** For sensitive communications
- **Role-Based Access Control:** Teacher, Parent, Admin, Principal
- **Audit Logging:** All actions logged for accountability
- **Data Export:** School owns their data

## 🚧 Development Roadmap

### Sprint 0: Foundation (Week 1) ✅ IN PROGRESS
- Project setup and architecture
- Basic authentication system
- Core database schema
- Initial UI component library

### Sprint 1: Core Communication (Weeks 2-3)
- User profiles and roles
- Announcements system
- Basic messaging
- Calendar foundation

### Sprint 2: Montessori Features (Weeks 4-5)
- Student profiles with Montessori fields
- Observation documentation
- Progress tracking UI
- Material management basics

### Sprint 3: Offline & Mobile (Weeks 6-7)
- PWA implementation
- Offline data sync
- Mobile-responsive design
- SMS integration

### Sprint 4: Administration (Weeks 8-9)
- Attendance system
- Reporting framework
- Analytics dashboard
- Advanced user management

### Sprint 5: Polish & Launch (Weeks 10-12)
- Performance optimization
- Security hardening
- Pilot deployment
- User training materials

## 🤝 Contributing

This is a Tyriie Solutions project focused on African tech sovereignty. Contributions aligned with our mission are welcome.

## 📄 License

Proprietary - Tyriie Solutions

## 🦁 About Tyriie Solutions

Tyriie Solutions is committed to building African technology solutions that promote sovereignty, unity, and development across the continent.

---

**Built with ❤️ in Africa, for Africa**