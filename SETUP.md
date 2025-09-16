# Setup Instructions

## Quick Start

Follow these steps to get the Buyer Lead Intake App running locally:

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Set up Environment Variables

```bash
# Copy example files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Edit the `.env.local` and `.env` files with your actual values:

#### Frontend (.env.local)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/buyer_leads"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
```

#### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/buyer_leads"
NODE_ENV="development"
```

### 3. Set up Database

```bash
# Create PostgreSQL database
createdb buyer_leads

# Run migrations
cd backend
npm run db:migrate

# Optional: Seed with sample data
npm run db:seed
```

### 4. Start Development Server

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` and sign in with magic link!

## Troubleshooting

### Common Issues

1. **TypeScript errors**: These are expected until dependencies are installed
2. **Database connection**: Ensure PostgreSQL is running and credentials are correct
3. **Email not working**: Check email provider settings and app passwords
4. **Port conflicts**: Change port in package.json if 3000 is occupied

### Dependencies Installation

The project uses these main dependencies:
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Drizzle ORM
- NextAuth.js
- Zod validation
- Radix UI components

All dependencies will be installed when you run `npm install` in both directories.

## Development Commands

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run type-check   # TypeScript checking
```

### Backend
```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database
```

## Next Steps

1. Configure your email provider for magic link authentication
2. Set up a PostgreSQL database (local or cloud)
3. Customize the validation rules if needed
4. Deploy to Vercel or your preferred platform

The application includes all required features:
- ✅ Lead management with CRUD operations
- ✅ Search and filtering with pagination
- ✅ CSV import/export (max 200 rows)
- ✅ Magic link authentication
- ✅ History tracking with audit trail
- ✅ Responsive design with accessibility
- ✅ Rate limiting and error handling
- ✅ Unit tests for validation logic
