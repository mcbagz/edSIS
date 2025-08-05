# Student Information System Frontend

A modern React-based Student Information System that connects to the Ed-Fi ODS API.

## Features

- 🔐 **Role-based Authentication** - Support for Admin, Teacher, Parent, and Student roles
- 👥 **Student Management** - View and manage student profiles
- 📊 **Dashboard** - Role-specific dashboards with key metrics
- 🎨 **Modern UI** - Material-UI based responsive design
- 🔄 **Real-time Data** - Connected to Ed-Fi ODS API

## Prerequisites

- Node.js 18+ 
- Ed-Fi ODS running in Docker (already configured)
- Valid Ed-Fi API credentials

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update with your Ed-Fi API credentials

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

## Default Login Credentials

For development/demo purposes:
- Admin: `admin@school.edu`
- Teacher: `teacher@school.edu`
- Parent: `parent@school.edu`
- Student: `student@school.edu`

(Any password will work in demo mode)

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/        # React contexts (Auth)
├── pages/           # Page components
├── services/        # API services
├── App.tsx          # Main app component
└── theme.ts         # Material-UI theme
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Material-UI for components
- React Router for navigation
- React Query for data fetching
- Axios for API calls
