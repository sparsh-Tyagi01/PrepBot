# InterviewMatrix - Full Stack Setup Guide

## 🚀 Complete Backend Implementation

This project now has a fully functional backend with:
- ✅ PostgreSQL database with Prisma ORM
- ✅ NextAuth.js authentication (Credentials + OAuth)
- ✅ User registration and login
- ✅ Protected API routes
- ✅ Interview, Reports, Analytics, and Skill Gap tracking
- ✅ Complete database schema

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install

# Install Prisma CLI globally (optional)
npm install -g prisma
```

### 2. Database Setup

#### Option A: Local PostgreSQL

1. Install PostgreSQL on your machine
2. Create a new database:
```bash
createdb prepbot
```

3. Your DATABASE_URL will be:
```
postgresql://username:password@localhost:5432/prepbot
```

#### Option B: Cloud Database (Recommended for Production)

Use any of these providers:
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available
- **Vercel Postgres** (https://vercel.com/storage/postgres)

### 3. Environment Variables

1. Copy the example env file:
```bash
cp .env.example .env
```

2. Edit `.env` and fill in your values:

```bash
# Database - Replace with your actual database URL
DATABASE_URL="postgresql://user:password@localhost:5432/prepbot?schema=public"

# NextAuth - Generate a secure secret
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32

# OAuth Providers (Optional - for Google/GitHub login)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

#### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Database Migration

```bash
# Generate Prisma Client
npx prisma generate

# Create the database schema
npx prisma db push

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### 5. OAuth Setup (Optional)

#### GitHub OAuth:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Homepage URL: `http://localhost:3000`
4. Callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy Client ID and Client Secret to `.env`

#### Google OAuth:
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
PrepBot/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts        # User registration
│   │   │   └── [...nextauth]/route.ts   # NextAuth handler
│   │   ├── user/route.ts                 # User profile
│   │   ├── interviews/route.ts           # Interview management
│   │   ├── analytics/route.ts            # User analytics
│   │   └── skill-gaps/route.ts           # Skill gap tracking
│   ├── (auth)/
│   │   ├── login/page.tsx                # Login page
│   │   └── register/page.tsx             # Registration page
│   ├── @modal/                           # Modal routes
│   ├── (homepage)/
│   │   ├── dashboard/page.tsx
│   │   ├── interview/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── analytics/page.tsx
│   │   ├── skill-gap/page.tsx
│   │   └── settings/page.tsx
│   └── layout.tsx
├── lib/
│   ├── prisma.ts                         # Prisma client
│   ├── auth.ts                           # NextAuth config
│   └── utils.ts
├── prisma/
│   └── schema.prisma                     # Database schema
└── .env                                  # Environment variables
```

## 🗄️ Database Schema

The application includes these models:

- **User** - User accounts with authentication
- **Account** - OAuth provider accounts
- **Session** - User sessions
- **Interview** - Mock interview records
- **Report** - Interview performance reports
- **SkillGap** - Identified skill gaps
- **Analytics** - User progress analytics

## 🔐 Authentication Features

- ✅ Email/Password registration and login
- ✅ Google OAuth login
- ✅ GitHub OAuth login
- ✅ Session management
- ✅ Protected routes
- ✅ Role-based access (Student/Professional)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/signin` - Sign in (handled by NextAuth)
- `GET /api/auth/session` - Get current session

### User
- `GET /api/user` - Get user profile
- `PATCH /api/user` - Update user profile

### Interviews
- `GET /api/interviews` - List user's interviews
- `POST /api/interviews` - Create new interview

### Analytics
- `GET /api/analytics` - Get user analytics

### Skill Gaps
- `GET /api/skill-gaps` - List skill gaps
- `POST /api/skill-gaps` - Create skill gap

## 🧪 Testing the Backend

1. **Register a new user:**
   - Go to `/register`
   - Fill in name, email, password
   - Select role (Student/Professional)
   - Click "Create Account"

2. **Sign in:**
   - Go to `/login`
   - Enter email and password
   - Click "Sign In"

3. **Access protected pages:**
   - Navigate to `/dashboard`
   - Try other pages: `/interview`, `/reports`, `/analytics`, `/skill-gap`

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub

2. Import project in Vercel

3. Add environment variables in Vercel dashboard

4. Set up database:
   - Use Vercel Postgres, Neon, or Supabase
   - Update DATABASE_URL in environment variables

5. Deploy!

### Database Migration on Production

```bash
# After deployment, run migrations
npx prisma db push
```

## 🔧 Common Issues & Solutions

### Issue: "Prisma Client not found"
**Solution:** Run `npx prisma generate`

### Issue: "Database connection error"
**Solution:** Check your DATABASE_URL in `.env` file

### Issue: "NEXTAUTH_SECRET missing"
**Solution:** Generate one with `openssl rand -base64 32` and add to `.env`

### Issue: "Cannot find module '@prisma/client'"
**Solution:** Run `npm install` and `npx prisma generate`

## 📚 Next Steps

Now that the backend is set up, you can:

1. **Implement AI Interview Features**
   - Add OpenAI integration for interview questions
   - Implement speech-to-text for practice
   - Add real-time feedback generation

2. **Build Dashboard Components**
   - Create charts for analytics
   - Display user progress
   - Show interview history

3. **Add More Features**
   - Email verification
   - Password reset
   - Profile customization
   - Interview scheduling

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

MIT License - feel free to use this project for learning or production.

---

**Need Help?** Check the troubleshooting section or create an issue on GitHub.
