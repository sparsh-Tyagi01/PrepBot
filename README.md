# 🎯 PrepBot

A modern, **full-stack** AI-powered interview preparation platform built with Next.js 16, React 19, PostgreSQL, Prisma, NextAuth.js, and Tailwind CSS v4. InterviewMatrix provides a comprehensive suite of tools for mastering technical interviews through AI-driven mock interviews, detailed analytics, and personalized learning paths.

## 🚀 **NEW: Complete Backend Implementation**

✅ **Full-Stack Application Ready**
- PostgreSQL database with Prisma ORM
- NextAuth.js authentication (Email/Password + OAuth)
- Complete REST API with protected routes
- User registration and login system
- Interview tracking and management
- Analytics and skill gap tracking
- Session management and security

👉 **[See SETUP.md for complete backend setup instructions](./SETUP.md)**

## ✨ Features

### 🔐 Authentication & Security
- **Email/Password Authentication**: Secure user registration and login with bcrypt hashing
- **OAuth Integration**: Google and GitHub sign-in options
- **Session Management**: Secure JWT-based sessions with NextAuth
- **Protected Routes**: API route protection with authentication middleware
- **Role-Based Access**: Student and Professional user roles

### 🗄️ Database & Backend
- **PostgreSQL Database**: Production-ready relational database
- **Prisma ORM**: Type-safe database access with auto-generated client
- **Complete Schema**: Users, Interviews, Reports, Analytics, Skill Gaps
- **RESTful API**: Well-structured API endpoints for all features
- **Data Validation**: Server-side validation and error handling

### 🎨 Premium Design System
- **Dark Theme**: Sophisticated slate/black base with off-white typography
- **Purple-Blue Gradients**: Eye-catching accent system (purple-600 → blue-600 → cyan-600)
- **Glassmorphism UI**: Frosted glass cards with backdrop blur effects
- **Smooth Animations**: Micro-interactions with hover states and transitions
- **Responsive Layout**: Mobile-first design with collapsible sidebar
- **Clean Typography**: Inter font family throughout

### 📄 Complete Page Suite

**Authentication**
- **Fully Functional** login/signup pages with backend integration
- Email/password authentication with real user creation
- Google OAuth integration (configured)
- GitHub OAuth integration (configured)
- Role selection (Student/Professional)
- Form validation and error handling
- Auto-login after registration

**Dashboard**
- Collapsible sidebar navigation
- Top navbar with profile dropdown
- Stats overview (interviews, scores, hours, readiness)
- Learning progress tracker
- Recent interviews list
- Quick actions panel

**Interview Screen**
- AI interviewer with animated avatar
- Live question display with difficulty badges
- Real-time feedback metrics (clarity, pace, confidence)
- Answer input area
- Code editor interface
- Voice recording toggle
- Timer and progress tracking

**Analytics**
- Circular readiness score with trend indicators
- Topic-wise performance breakdown (6 metrics)
- Communication score analysis
- Coding accuracy metrics
- Interview history table with search/sort

**Skill Gap Analysis**
- Strengths vs. weaknesses comparison
- Radar chart visualization (6 axes)
- 3-phase learning roadmap (7 weeks)
- Curated resource recommendations
- Priority-based improvement tracking

**Reports**
- Searchable interview history
- Filterable report cards
- Performance badges (scores, types)
- Strengths and improvements breakdown
- Pagination for large datasets

**Settings**
- Profile management with avatar upload
- Password change interface
- Subscription details (Pro Plan)
- Notification preferences (4 toggles)
- Security settings (2FA, account deletion)

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **UI Library** | React 19.2.3 |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | NextAuth.js v4 with JWT |
| **Password Hashing** | bcryptjs |
| **Styling** | Tailwind CSS v4 (PostCSS) |
| **Icons** | Lucide React v0.563.0 |
| **Components** | shadcn/ui inspired with CVA |
| **Font** | Inter (Google Fonts) |
| **Utilities** | clsx, tailwind-merge, class-variance-authority |

## 🏗️ Backend Architecture

### Database Models
- **User**: Authentication and profile data
- **Account**: OAuth provider accounts
- **Session**: User session management
- **Interview**: Mock interview records with questions and responses
- **Report**: Detailed performance analysis and feedback
- **SkillGap**: Identified areas for improvement with tracking
- **Analytics**: Aggregated user performance metrics

### API Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User authentication (NextAuth)
- `GET /api/user` - Fetch user profile
- `PATCH /api/user` - Update user profile
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Create interview
- `GET /api/analytics` - Fetch analytics
- `GET /api/skill-gaps` - List skill gaps
- `POST /api/skill-gaps` - Create skill gap

## 📁 Project Structure

```
PrepBot/
├── app/
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (homepage)/          # Protected dashboard routes
│   │   ├── dashboard/       # Dashboard home
│   │   ├── interview/       # Live interview screen
│   │   ├── analytics/       # Performance analytics
│   │   ├── skill-gap/       # Skill analysis
│   │   ├── reports/         # Interview history
│   │   ├── settings/        # User settings
│   │   └── layout.tsx       # Sidebar layout wrapper
│   ├── @modal/              # Parallel route for modals
│   │   ├── (.)login/
│   │   └── (.)register/
│   ├── api/                 # API routes (BACKEND)
│   │   ├── auth/
│   │   │   ├── register/    # User registration endpoint
│   │   │   └── [...nextauth]/ # NextAuth handler
│   │   ├── user/            # User management
│   │   ├── interviews/      # Interview CRUD
│   │   ├── analytics/       # Analytics data
│   │   └── skill-gaps/      # Skill gap tracking
│   ├── globals.css          # Global styles + theme
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── providers.tsx        # NextAuth SessionProvider
├── components/
│   ├── ui/                  # Design system components
│   │   ├── button.tsx       # 5 variants, 5 sizes
│   │   ├── card.tsx         # Glassmorphism cards
│   │   ├── badge.tsx        # 6 semantic variants
│   │   ├── input.tsx        # Form inputs
│   │   ├── textarea.tsx     # Multi-line inputs
│   │   ├── progress.tsx     # Gradient progress bars
│   │   └── skeleton.tsx     # Loading placeholders
│   └── Navbar.tsx           # Global navigation
├── lib/
│   ├── prisma.ts            # Prisma client singleton (BACKEND)
│   ├── auth.ts              # NextAuth configuration (BACKEND)
│   └── utils.ts             # Utility functions (cn)
├── prisma/
│   └── schema.prisma        # Database schema (BACKEND)
├── types/
│   └── next-auth.d.ts       # NextAuth TypeScript definitions
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template
└── public/                  # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun runtime
- npm/yarn/pnpm/bun package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd PrepBot
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Run development server**
```bash
npm run dev
# or
bun dev
```

4. **Open browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 🎨 Design System

### Color Palette

**Theme Variables** (defined in `globals.css`):
```css
--background: 15 23 42       /* slate-950 */
--foreground: 248 250 252    /* slate-50 */
--primary: 139 92 246        /* purple-500 */
--secondary: 59 130 246      /* blue-600 */
--accent: 6 182 212          /* cyan-600 */
--muted: 51 65 85            /* slate-700 */
--border: 51 65 85           /* slate-700 */
```

**Gradient System**:
- Primary: `from-purple-600 via-blue-600 to-cyan-600`
- Hover: `hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500`

### Component Variants

**Button**:
- `primary` - Gradient with white text
- `secondary` - Glassmorphism with border
- `outline` - Transparent with slate border
- `ghost` - Hover state only
- `destructive` - Red for dangerous actions

**Badge**:
- `default` - Gradient background
- `secondary` - Slate background
- `success` - Green for positive states
- `warning` - Yellow/amber for caution
- `danger` - Red for errors
- `outline` - Transparent with border

**Sizes**: `xs`, `sm`, `md` (default), `lg`, `xl`

### Custom Utilities

**Glassmorphism**:
```css
.glass {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.5);
}
```

**Custom Scrollbar**:
```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: rgb(15 23 42); }
::-webkit-scrollbar-thumb { background: rgb(51 65 85); border-radius: 4px; }
```

## 🧩 Key Components

### Card Component
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Button Component
```tsx
import { Button } from '@/components/ui/button'

<Button variant="primary" size="lg">
  Get Started
</Button>
```

### Badge Component
```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="success">Passed</Badge>
```

## 📋 Features Checklist

- ✅ Complete design system with 7 reusable components
- ✅ Landing page with 8 sections
- ✅ Authentication pages (login/register)
- ✅ Dashboard layout with sidebar navigation
- ✅ Interview screen with AI interaction
- ✅ Analytics with performance metrics
- ✅ Skill gap analysis with roadmap
- ✅ Interview reports with history
- ✅ Settings page with all preferences
- ✅ Dark theme throughout
- ✅ Responsive mobile/desktop layouts
- ✅ Smooth animations and transitions
- ✅ Glassmorphism effects
- ✅ Gradient accents system
- ⏳ Backend API integration (pending)
- ⏳ Real authentication (NextAuth.js ready)
- ⏳ Database integration (pending)
- ⏳ AI interview engine (pending)

## 🔧 Customization

### Changing Colors

Edit theme variables in `app/globals.css`:
```css
@layer base {
  :root {
    --primary: 139 92 246;  /* Change to your brand color */
    --secondary: 59 130 246;
    /* ... */
  }
}
```

### Adding New Pages

1. Create route in `app/(homepage)/your-page/page.tsx`
2. Add navigation link in `app/(homepage)/layout.tsx` sidebar
3. Follow existing component patterns

### Modifying Components

All UI components are in `components/ui/` and can be customized:
- Edit variants in CVA configuration
- Modify base styles in className props
- Add new variants by extending the CVA object

## 📊 Tailwind CSS v4 Notes

This project uses **Tailwind CSS v4** (PostCSS-based) which has syntax changes:
- ✅ Use `bg-linear-to-r` instead of `bg-gradient-to-r`
- ✅ Use `shrink-0` instead of `flex-shrink-0`
- ✅ Import with `@import "tailwindcss"` in CSS files

Some linting warnings may appear for old v3 syntax, but functionality is unaffected.

## 🚀 Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Other Platforms
- Build with `npm run build`
- Serve `.next` directory with Node.js server
- Set environment variables for production

## 🤝 Contributing

This is a frontend-only implementation. To extend:
1. Connect to backend API endpoints
2. Implement NextAuth.js authentication
3. Add database models (Prisma ready)
4. Integrate AI/ML interview engine
5. Add real-time features with WebSockets

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Typography by [Inter](https://fonts.google.com/specimen/Inter)

---

**InterviewMatrix** - Master Your Interview Skills with AI 🚀
