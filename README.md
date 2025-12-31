# ImpactQuest

**Gamifying Community Service for the Next Generation**

---

## The Problem

### Declining Youth Volunteer Participation

Despite being the most socially conscious generation in recorded history, Gen Z (ages 13-25) shows consistently declining rates of formal volunteer participation. This paradox presents a significant challenge for community development and social cohesion.

### Root Causes

**1. Friction-Heavy Onboarding**

Traditional volunteering requires extensive paperwork, background checks, orientation sessions, and scheduling commitments. This bureaucratic overhead creates significant barriers for spontaneous participation, particularly among younger demographics accustomed to instant digital experiences.

**2. Disconnected Impact Visibility**

Volunteers rarely witness the tangible outcomes of their contributions. A student spending Saturday morning at a food bank has no mechanism to see how many families were fed or how their specific contribution mattered within the larger ecosystem.

**3. Delayed Gratification Model**

Modern digital natives experience constant feedback loops — likes, comments, progress bars, achievements. Traditional volunteering offers none of these psychological rewards, creating a stark contrast with every other activity competing for attention.

**4. Scale Blindness**

The classic question "What difference does my one hour make?" remains systematically unanswered. Without quantification, individual contributions feel insignificant against massive societal challenges.

**5. Geographic Disconnection**

Most volunteer opportunities require travel to specific locations (food banks, shelters, hospitals), creating additional friction and limiting participation to those with transportation access.

---

## The Solution

### ImpactQuest: Location-Based Gamified Micro-Volunteering

ImpactQuest reimagines community service as a game-like experience, breaking down traditional barriers while leveraging behavioral psychology principles that drive engagement in successful applications like Duolingo, Strava, and Pokémon GO.

### Core Concept

Transform local community needs into "quests" — discrete, completable tasks that can be discovered, accepted, completed, and verified entirely through a mobile device. Each completion earns experience points (XP), unlocks achievements, and contributes to visible community-wide impact metrics.

### Key Differentiators

**Micro-Task Architecture**

Rather than requiring multi-hour commitments, quests are designed as 15-45 minute activities: picking up litter in a specific park, planting a tree at a designated location, helping an elderly neighbor with groceries, or participating in a local cleanup drive.

**Location-Based Discovery**

An interactive map displays available quests within the user's vicinity, making community needs visible and accessible. Users can filter by category, difficulty, time requirement, and reward value.

**AI-Powered Verification**

Proof photos are analyzed using computer vision models (BLIP and ViT via Hugging Face) to verify authentic quest completion without requiring human moderators or institutional oversight.

**Gamification Layer**

A comprehensive progression system including:
- Experience points (XP) for each completion
- Levels and titles reflecting cumulative contribution
- Achievement badges for milestones and special accomplishments
- Daily streaks with multiplier bonuses
- Community leaderboards fostering friendly competition
- Impact dashboards visualizing collective contribution

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (PWA)                        │
│  Next.js 16 + TypeScript + Tailwind CSS + Leaflet Maps  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Serverless)                   │
│         Next.js API Routes + Edge Functions              │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────┐    ┌─────────────────────┐
│    SUPABASE     │    │   HUGGING FACE AI   │
│  PostgreSQL DB  │    │  Image Verification │
│  Auth + Storage │    │   BLIP/ViT Models   │
└─────────────────┘    └─────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16 (App Router) | Server-side rendering, routing, API routes |
| Language | TypeScript | Type safety and developer experience |
| Styling | Tailwind CSS | Utility-first responsive design |
| Maps | Leaflet.js + OpenStreetMap | Interactive quest discovery |
| Database | Supabase PostgreSQL | Structured data storage with RLS |
| Authentication | Supabase Auth | OAuth and magic link authentication |
| File Storage | Supabase Storage | Proof photo uploads |
| AI Verification | Hugging Face Inference API | Image analysis and validation |
| Deployment | Vercel Edge Network | Global CDN and serverless functions |

---

## Features

### Quest Discovery

Interactive map interface displaying nearby quests with filtering by:
- Category (Environment, Community, Education, Health, Animal Welfare)
- Difficulty level (Easy, Medium, Hard)
- Time requirement
- XP reward value
- Distance from current location

### Quest Completion Flow

1. User discovers and accepts a quest
2. Navigates to the specified location
3. Completes the required task
4. Captures proof photo within the app
5. Submits for AI verification
6. Receives instant feedback and XP reward

### AI Verification Pipeline

```
Photo Upload → BLIP Caption Generation → ViT Object Detection →
Semantic Matching Against Quest Criteria → Confidence Scoring →
Verification Decision (>70% threshold)
```

### Gamification System

**Experience Points**
- Easy quests: 15-30 XP
- Medium quests: 30-60 XP
- Hard quests: 60-100 XP
- Featured quests: 2x multiplier

**Streak Bonuses**
- 3 consecutive days: +10% XP
- 7 consecutive days: +25% XP
- 14 consecutive days: +50% XP
- 30 consecutive days: +100% XP

**Achievement Badges**
- Completion milestones (First Quest, 10 Quests, 100 Quests)
- Category specialization (Environment Champion, Community Builder)
- Streak achievements (Weekly Warrior, Monthly Master)
- XP thresholds (Rising Star, Legend)

### Community Features

- Real-time leaderboards (daily, weekly, all-time)
- City-wide impact dashboard
- Quest creation for community organizers

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Supabase account (free tier sufficient)
- Hugging Face account (free tier sufficient)

### Installation

```bash
git clone https://github.com/yashodipmore/ImpactQuest.git
cd ImpactQuest
npm install
```

### Environment Configuration

Create `.env.local` with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
HUGGINGFACE_API_KEY=your_huggingface_api_token
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ImpactQuest
```

### Database Setup

1. Navigate to Supabase Dashboard → SQL Editor
2. Execute the schema from `supabase/schema.sql`
3. Row Level Security policies are included in the schema

### Storage Configuration

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `quest-proofs`
3. Configure public access for image URLs

### Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:3000`

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   └── verify-quest/  # AI verification endpoint
│   ├── auth/              # Authentication pages
│   ├── create-quest/      # Quest creation interface
│   ├── impact/            # Community impact dashboard
│   ├── leaderboard/       # Rankings and competition
│   ├── profile/           # User profile and stats
│   └── quest/[id]/        # Quest detail and submission
├── components/            # React components
│   ├── layout/           # Navigation, layout wrappers
│   ├── map/              # Leaflet map integration
│   ├── quest/            # Quest cards, filters, lists
│   └── ui/               # Reusable UI primitives
├── lib/                   # Utility modules
│   ├── supabase/         # Database client configuration
│   ├── gamification.ts   # XP, levels, badges logic
│   └── ai-verification.ts# Hugging Face integration
└── types/                 # TypeScript definitions
    └── database.ts       # Supabase schema types
```

---

## Deployment

### Vercel Deployment

```bash
npm install -g vercel
vercel --prod
```

Configure environment variables in the Vercel dashboard before deployment.

### Environment Variables Required

All variables from `.env.local` must be configured in the deployment platform.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open a Pull Request

---

## License

MIT License — Open for use in hackathons, educational projects, and community initiatives.

---

## Links

- **Live Demo:** [impactquest.vercel.app](https://impactquest.vercel.app)
- **GitHub:** [github.com/yashodipmore/ImpactQuest](https://github.com/yashodipmore/ImpactQuest)

---

*Transforming community service, one quest at a time.*
