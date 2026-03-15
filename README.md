# Aaj Kya Banega - Frontend

A family meal planning app built with React 19, TypeScript, and Firebase.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Firebase** - Authentication & Firestore database
- **TanStack React Query v5** - Server state management
- **Capacitor 8** - iOS/Android mobile deployment

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project setup

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Sonali029/aajkyabanega.git
cd aajkyabanega
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your Firebase configuration.

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React contexts (Auth, Theme)
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── services/        # Firebase service layer
├── data/            # Static data (dishes, cuisines)
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Backend Repository

The Firebase Cloud Functions backend is in a separate repository:
- [aajkyabanega-backend](https://github.com/Sonali029/aajkyabanega-backend) *(to be created)*

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed architecture and development guidelines.

## Features

- 🍽️ Browse and add dishes from multiple cuisines
- 📅 Daily meal slot planning (breakfast, lunch, dinner)
- 👨‍👩‍👧‍👦 Family-based meal management
- 🎲 Auto-scheduler for meal planning
- 📱 Mobile-ready with Capacitor
