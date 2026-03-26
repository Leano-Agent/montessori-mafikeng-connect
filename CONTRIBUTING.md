# Contributing to Montessori Mafikeng Connect

## 🦁 Our Mission

Montessori Mafikeng Connect is Africa's first Setswana-first Montessori platform. We're building technology that respects African sovereignty, Montessori philosophy, and cultural relevance.

## 🤝 How to Contribute

### 1. Report Bugs
- Check if the bug already exists in issues
- Use the bug report template
- Include steps to reproduce, expected vs actual behavior

### 2. Suggest Features
- Check if the feature already exists in issues
- Explain the problem it solves
- Describe how it aligns with our mission

### 3. Submit Code Changes
- Fork the repository
- Create a feature branch
- Make your changes
- Submit a pull request

## 🎯 Development Principles

### African Sovereignty First
- Prioritize African hosting and infrastructure
- Use African APIs and services when available
- Consider data sovereignty and POPIA compliance

### Montessori Philosophy Alignment
- Respect individual progress over standardized testing
- Support observation-based assessment
- Enable mixed-age classroom workflows

### Cultural Relevance
- Setswana language as default
- African design aesthetics
- Consider diverse literacy levels

### Technical Excellence
- Mobile-first PWA approach
- Offline-first architecture
- Performance optimization for low-bandwidth

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Git

### Local Development

1. **Clone and setup:**
   ```bash
   git clone https://github.com/yourusername/montessori-mafikeng-connect.git
   cd montessori-mafikeng-connect
   ```

2. **Backend setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your local configuration
   npm install
   npx prisma generate
   npx prisma migrate dev
   npm run dev
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env (set VITE_API_URL to local backend)
   npm install
   npm run dev
   ```

4. **Using Docker (alternative):**
   ```bash
   docker-compose up -d
   ```

## 📁 Project Structure

```
montessori-mafikeng-connect/
├── frontend/                 # React PWA
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API, i18n, offline
│   │   ├── styles/         # Styles and theme
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   └── types/          # TypeScript types
│   └── prisma/             # Database schema
├── infrastructure/          # Deployment configs
├── docs/                   # Documentation
└── scripts/               # Development scripts
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test                    # Unit tests
npm run test:e2e           # E2E tests (requires backend running)
```

### Backend Tests
```bash
cd backend
npm test                    # Unit tests
```

### Test Coverage
- Aim for >80% test coverage
- Write tests for new features
- Update tests when modifying existing code

## 📝 Code Style

### TypeScript
- Use strict TypeScript configuration
- Define types for all props and state
- Use interfaces for object shapes
- Avoid `any` type

### React Components
- Use functional components with hooks
- Follow React naming conventions (PascalCase for components)
- Use PropTypes or TypeScript interfaces
- Keep components focused and reusable

### Backend Code
- Use async/await for asynchronous operations
- Implement proper error handling
- Use middleware for cross-cutting concerns
- Follow RESTful API design principles

### Commit Messages
Use conventional commit format:
```
feat: add Setswana voice message support
fix: resolve observation save issue
docs: update deployment guide
style: format code with prettier
refactor: improve authentication middleware
test: add tests for observation controller
chore: update dependencies
```

## 🌐 Internationalization (i18n)

### Adding Translations
1. Add Setswana translation in `frontend/src/locales/setswana/`
2. Add English translation in `frontend/src/locales/english/`
3. Use the translation keys in components

### Translation Guidelines
- Setswana is the default language
- Use simple, clear language
- Consider cultural context
- Test with native speakers when possible

## 🔒 Security

### Data Protection
- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Implement proper authentication and authorization
- Follow POPIA compliance for South African data

### Code Security
- Validate all user input
- Use parameterized queries for database operations
- Implement rate limiting
- Use HTTPS in production

## 📦 Pull Request Process

1. **Create a branch:** `git checkout -b feature/amazing-feature`
2. **Make your changes:** Follow code style and add tests
3. **Commit changes:** Use conventional commit format
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request:** Use the PR template

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added/updated for new features
- [ ] Documentation updated
- [ ] All tests pass
- [ ] Code reviewed by at least one other developer
- [ ] No security issues introduced

## 🚀 Deployment

### Staging Deployment
- Automatic deployment on push to `develop` branch
- Used for testing and review

### Production Deployment
- Manual deployment from `main` branch
- Requires approval from maintainers
- Follow deployment checklist

## 🆘 Getting Help

### Documentation
- Check `README.md` for project overview
- Check `DEPLOYMENT.md` for deployment instructions
- Check `TESTING_GUIDE.md` for testing procedures

### Community
- GitHub Issues for bug reports and feature requests
- Project maintainers for technical questions
- Montessori experts for pedagogical guidance

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's license.

## 🙏 Acknowledgments

Thank you for contributing to African educational technology! Your work helps build a more sovereign, culturally-relevant future for African education.

---

**Built with ❤️ in Africa, for Africa**