# Buyer Lead Intake App

A comprehensive lead management system built with Next.js, TypeScript, and modern web technologies for real estate professionals.

## Live Demo
- Frontend: [Vercel App](https://leadbuyer-lx3bnckrc-saptash-chaubeys-projects.vercel.app)
- Backend: [Render Service](https://your-render-backend-url.onrender.com)

## 🚀 Features

### Core Features
- **Lead Management**: Create, view, edit, and manage buyer leads with full CRUD operations
- **Advanced Search & Filtering**: Real-time search by name, phone, email with URL-synced filters
- **CSV Import/Export**: Bulk import leads (max 200 rows) and export filtered data
- **Authentication**: Secure magic link authentication system
- **History Tracking**: Complete audit trail of lead changes with user attribution
- **Responsive Design**: Modern, accessible UI with keyboard navigation

### Data Model
- **Buyers**: Full contact info, property requirements, budget, timeline, status, notes, tags
- **History**: Automatic tracking of all changes with diff logging
- **Users**: Authentication and ownership management

### Nice-to-Have Features Implemented
- **Tag Management**: Typeahead tag input with suggestions
- **Status Quick Actions**: Dropdown status updates directly from list view
- **Search Highlighting**: Visual highlighting of search terms in results
- **Optimistic Updates**: Smooth UI interactions with rollback capability
- **Rate Limiting**: Per-user/IP rate limiting on create/update operations
- **Error Boundaries**: Graceful error handling with recovery options

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes with middleware
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with magic link provider
- **Validation**: Zod schemas with client/server validation
- **Testing**: Jest + React Testing Library
- **UI Components**: Radix UI primitives with custom styling
- **File Processing**: PapaParse for CSV handling

## 📁 Project Structure

```
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                # App Router pages & API routes
│   │   │   ├── api/            # Backend API endpoints
│   │   │   ├── auth/           # Authentication pages
│   │   │   ├── buyers/         # Lead management pages
│   │   │   └── layout.tsx      # Root layout with navigation
│   │   ├── components/         # Reusable UI components
│   │   │   ├── buyers/         # Lead-specific components
│   │   │   ├── layout/         # Navigation & layout
│   │   │   └── ui/             # Base UI components
│   │   ├── lib/                # Utilities & configurations
│   │   │   ├── auth.ts         # NextAuth configuration
│   │   │   ├── db.ts           # Database connection
│   │   │   ├── validations.ts  # Zod schemas
│   │   │   └── utils.ts        # Helper functions
│   │   └── __tests__/          # Unit tests
│   ├── .env.example            # Environment variables template
│   └── package.json
├── backend/                     # Database & migrations
│   ├── src/
│   │   ├── schema.ts           # Drizzle schema definitions
│   │   ├── migrate.ts          # Migration runner
│   │   └── seed.ts             # Database seeding
│   ├── drizzle/                # Generated migrations
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** database
- **pnpm** (recommended) or npm
- **Email provider** for magic link authentication (Gmail, SendGrid, etc.)

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd buyer-lead-intake
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   pnpm install
   
   # Backend
   cd ../backend
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example files
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   
   # Edit the files with your actual values
   ```

4. **Configure database**
   ```bash
   # Create PostgreSQL database
   createdb buyer_leads
   
   # Run migrations
   cd backend
   pnpm db:migrate
   
   # Optional: Seed with sample data
   pnpm db:seed
   ```

5. **Start development server**
   ```bash
   cd frontend
   pnpm dev
   ```

Visit `http://localhost:3000` and sign in with magic link!

### Environment Variables

#### Frontend (.env.local)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/buyer_leads"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (for magic link auth)
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

## 📊 Data Model

### Buyers Table
- `id` (UUID) - Primary key
- `fullName` (string, 2-80 chars) - Required
- `email` (email) - Optional
- `phone` (string, 10-15 digits) - Required
- `city` (enum) - Chandigarh|Mohali|Zirakpur|Panchkula|Other
- `propertyType` (enum) - Apartment|Villa|Plot|Office|Retail
- `bhk` (enum) - 1|2|3|4|Studio (required for Apartment/Villa)
- `purpose` (enum) - Buy|Rent
- `budgetMin/Max` (integer, INR) - Optional, max ≥ min
- `timeline` (enum) - 0-3m|3-6m|>6m|Exploring
- `source` (enum) - Website|Referral|Walk-in|Call|Other
- `status` (enum) - New|Qualified|Contacted|Visited|Negotiation|Converted|Dropped
- `notes` (text, ≤1000 chars) - Optional
- `tags` (string[]) - Optional
- `ownerId` (UUID) - References users.id
- `createdAt/updatedAt` (timestamp)

### Validation Rules
- BHK required only for Apartment/Villa properties
- Budget max must be ≥ budget min when both present
- Phone must be numeric, 10-15 digits
- Email validation when provided
- Concurrency control via updatedAt timestamp

## 🔐 Authentication & Authorization

- **Magic Link Authentication**: Passwordless login via email
- **Ownership Model**: Users can only edit/delete their own leads
- **Read Access**: All authenticated users can view all leads
- **Session Management**: Database-backed sessions with NextAuth.js

## 📈 API Endpoints

### Buyers
- `GET /api/buyers` - List with search/filter/pagination
- `POST /api/buyers` - Create new buyer
- `GET /api/buyers/[id]` - Get buyer with history
- `PUT /api/buyers/[id]` - Update buyer (with concurrency control)
- `DELETE /api/buyers/[id]` - Delete buyer
- `POST /api/buyers/import` - CSV import (max 200 rows)

### Authentication
- `POST /api/auth/signin` - Magic link signin
- `GET /api/auth/callback` - Auth callback handling

## 🧪 Testing

```bash
cd frontend
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test validations  # Run specific test
```

### Test Coverage
- ✅ Zod validation schemas
- ✅ Budget validation logic
- ✅ BHK requirement rules
- ✅ CSV parsing and transformation
- ✅ Error boundary components

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Database Setup
- Use Vercel Postgres, Supabase, or any PostgreSQL provider
- Run migrations: `pnpm db:migrate`
- Seed data: `pnpm db:seed`

### Production Checklist
- [ ] Set secure NEXTAUTH_SECRET
- [ ] Configure production email provider
- [ ] Set up database backups
- [ ] Configure error monitoring (Sentry)
- [ ] Set up analytics (optional)

## 🔧 Development

### Available Scripts

#### Frontend
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run tests
pnpm type-check   # TypeScript checking
```

#### Backend
```bash
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
pnpm db:seed      # Seed database
```

### Code Quality
- **TypeScript**: Strict type checking
- **ESLint**: Code linting with Next.js config
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality gates
- **Accessibility**: ARIA labels, keyboard navigation
- **Error Handling**: Comprehensive error boundaries

## 📝 Usage Examples

### CSV Import Format
```csv
fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status
John Doe,john@example.com,9876543210,Chandigarh,Apartment,3,Buy,5000000,7000000,3-6m,Website,Looking for 3BHK,urgent,New
```

### API Usage
```javascript
// Create a buyer
const response = await fetch('/api/buyers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    phone: '9876543210',
    city: 'Chandigarh',
    propertyType: 'Apartment',
    bhk: '3',
    purpose: 'Buy',
    timeline: '3-6m',
    source: 'Website'
  })
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the GitHub issues
2. Review the documentation
3. Create a new issue with detailed description

---

**Built with ❤️ for real estate professionals**
