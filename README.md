# NutriCoach v2

AI-powered nutrition tracking and meal planning assistant built with Next.js 15, tRPC, and Drizzle ORM.

## Tech Stack

- **Framework**: Next.js 15.4.1 with App Router
- **API**: tRPC v11 for end-to-end typesafe APIs
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth v1.2.9
- **Styling**: Tailwind CSS v4
- **Forms**: React Hook Form with Zod validation
- **Language**: TypeScript with strict mode

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database credentials and auth secret.

4. Generate auth secret:

   ```bash
   openssl rand -base64 32
   ```

5. Set up the database:
   ```bash
   npm run db:push
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema to database (development)
- `npm run db:studio` - Open Drizzle Studio

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── modules/               # Feature modules
├── components/           # Shared components
├── server/              # Server-side code
├── lib/                 # Utilities and configs
├── hooks/               # Global React hooks
├── types/               # Global TypeScript types
└── config/              # Configuration files
```

See `docs/02-architecture/project-structure.md` for detailed structure information.
