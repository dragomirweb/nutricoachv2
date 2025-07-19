# NutriCoach v2 Documentation

Welcome to the comprehensive documentation for NutriCoach v2, a modern nutrition tracking application built with cutting-edge web technologies.

## 📚 Documentation Structure

### 📋 [01. Project Overview](./01-project/)

- [Product Requirements](./01-project/product-requirements.md) - Features, user stories, and business requirements
- [Technical Stack](./01-project/technical-stack.md) - Complete technology overview with versions

### 🏗️ [02. Architecture](./02-architecture/)

- [Project Structure](./02-architecture/project-structure.md) - Directory organization and conventions
- [Database Schema](./02-architecture/database-schema.md) - Drizzle ORM schema definitions
- [API Architecture](./02-architecture/api-architecture.md) - tRPC v11 patterns and best practices

### 💻 [03. Implementation Patterns](./03-implementation/)

- [Authentication](./03-implementation/authentication.md) - Better Auth v1.2.9 implementation
- [Forms & Validation](./03-implementation/forms-validation.md) - React Hook Form + Zod patterns
- [UI Components](./03-implementation/ui-components.md) - Tailwind CSS v4 component architecture
- [Data Fetching](./03-implementation/data-fetching.md) - tRPC + React Query patterns
- [Background Jobs](./03-implementation/background-jobs.md) - BullMQ job processing system

### 🛠️ [04. Development Guide](./04-development/)

- [Local Setup](./04-development/local-setup.md) - Complete development environment setup
- [Testing Strategy](./04-development/testing-strategy.md) - Unit, integration, and E2E testing
- [Deployment](./04-development/deployment.md) - Production deployment strategies
- [Best Practices](./04-development/best-practices.md) - Coding standards and patterns

### 🎨 [05. System Design](./05-design/)

- [Database Design](./05-design/database-design.md) - Comprehensive database schema with Mermaid diagrams
- [System Architecture](./05-design/system-architecture.md) - High-level system design and components
- [Data Flow Design](./05-design/data-flow-design.md) - Detailed data flow patterns and processes

## 🚀 Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/nutricoach-v2.git
   cd nutricoach-v2
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up database**

   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

## 🔧 Technology Overview

### Frontend

- **Next.js 15.4.1** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **React Hook Form** - Performant forms
- **Zod** - Schema validation

### Backend

- **tRPC v11** - End-to-end type-safe APIs
- **Better Auth v1.2.9** - Authentication framework
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL** - Primary database
- **Redis** - Caching and queues

### Infrastructure

- **Vercel** - Deployment platform
- **GitHub Actions** - CI/CD pipeline
- **Sentry** - Error tracking
- **PostHog** - Analytics

## 📖 Key Features

- 🍽️ **AI-Powered Meal Tracking** - Natural language meal logging with OpenAI
- 📊 **Nutrition Analytics** - Comprehensive macro and micronutrient tracking
- 🎯 **Goal Setting** - Personalized nutrition goals and progress tracking
- 🔐 **Secure Authentication** - OAuth and email/password with 2FA support
- 📱 **Responsive Design** - Mobile-first PWA experience
- 🔄 **Real-time Sync** - Optimistic updates and background synchronization

## 🤝 Contributing

Please refer to our [Best Practices Guide](./04-development/best-practices.md) for coding standards and contribution guidelines.

## 📝 License

This project is proprietary software. All rights reserved.

---

For more detailed information, explore the documentation sections above or contact the development team.
