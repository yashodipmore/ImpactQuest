# ImpactQuest 🎯

> Turn Your Neighborhood Into Your Quest Zone

A gamified Progressive Web App that transforms local social problems into bite-sized "quests" for teens (13-18). Think Pokémon GO meets social good!

## 🚀 Features

- **🗺️ Interactive Quest Map** - Discover nearby challenges using Leaflet.js
- **🎮 RPG-Style Gamification** - XP, levels, badges, streaks, and leaderboards
- **📸 AI Photo Verification** - FREE Hugging Face CLIP model verifies quest completion
- **📍 Geo-location Based** - Solve problems in YOUR neighborhood
- **📱 PWA** - Works offline, installable on any device
- **💯 100% FREE Stack** - Runs on Vercel + Supabase free tier

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Maps**: Leaflet.js with OpenStreetMap
- **AI**: Hugging Face CLIP model
- **Deployment**: Vercel (free tier)

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free)
- Hugging Face account (free)

### 1. Clone and Install

```bash
cd impactquest
npm install
```

### 2. Setup Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HUGGINGFACE_API_KEY=your_hf_token
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Setup Database

1. Go to Supabase Dashboard → SQL Editor
2. Run the schema from `supabase/schema.sql`
3. Enable Row Level Security (RLS) policies are included

### 4. Create Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create bucket: `quest-proofs`
3. Make it public (for image URLs)

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   └── verify-quest/  # AI verification endpoint
│   ├── auth/              # Authentication pages
│   ├── leaderboard/       # Leaderboard page
│   ├── profile/           # User profile page
│   └── quest/[id]/        # Quest detail & submit
├── components/            # React components
│   ├── layout/           # Navbar, Footer
│   ├── map/              # Leaflet map components
│   ├── quest/            # Quest cards, filters
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client config
│   ├── gamification.ts   # XP, levels, badges logic
│   └── ai-verification.ts# CLIP model integration
└── types/                 # TypeScript types
    └── database.ts       # Supabase schema types
```

## 🎮 Gamification System

### XP & Levels
- Easy quests: 15-30 XP
- Medium quests: 30-60 XP
- Hard quests: 60-100 XP
- Featured quests: 2x XP

### Streak Bonuses
- 3 days: +10% XP
- 7 days: +25% XP
- 14 days: +50% XP
- 30 days: +100% XP

### Badges
- First Steps, Quest Master, Legend
- XP Hunter, XP Champion
- On Fire, Unstoppable, Dedicated
- Category-specific badges

## 🤖 AI Verification

The app uses Hugging Face's CLIP model to verify quest completions:

1. User takes photo at quest location
2. Photo uploaded to Supabase Storage
3. CLIP analyzes image for relevant objects
4. GPS location verified (within 200m)
5. Confidence score calculated
6. 60%+ = Verified, XP awarded

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard.

### Manual Build

```bash
npm run build
npm start
```

## 📱 PWA Features

- ✅ Installable on home screen
- ✅ Offline support (coming soon)
- ✅ Push notifications (coming soon)
- ✅ Works on any device

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📄 License

MIT License - feel free to use for hackathons and personal projects!

---

Built with ❤️ for the Launchly Project Sprint Hackathon
