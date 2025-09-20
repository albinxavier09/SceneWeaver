# Overview

This is a visual storyboarding application designed as a "Figma for storyboarding" that allows users to create, edit, and collaborate on video storyboards in real-time. The application features a canvas-based interface where scenes are represented as draggable cards, similar to Figma artboards. Each scene contains comprehensive details including title, description, dialogue, characters, camera notes, mood, and reference images. The system supports real-time collaboration with WebSocket connections, AI-powered content assistance, and various export formats.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. The application follows a component-based architecture with a clear separation between UI components and business logic:

- **State Management**: Uses TanStack Query for server state management and React hooks for local state
- **Routing**: Implements wouter for lightweight client-side routing
- **UI Framework**: Built on shadcn/ui components with Radix UI primitives and Tailwind CSS for styling
- **Canvas System**: Custom canvas implementation with zoom, pan, and drag-and-drop functionality for scene management
- **Real-time Features**: WebSocket integration for collaborative editing and cursor tracking

## Backend Architecture
The backend is an Express.js server with TypeScript support:

- **API Design**: RESTful API structure with dedicated routes for projects, scenes, comments, and collaboration
- **File Handling**: Multer middleware for image uploads with validation and storage management
- **Real-time Communication**: WebSocket server for collaborative features like cursor tracking and live updates
- **Storage Layer**: Abstracted storage interface with in-memory implementation (designed for easy database migration)

## Data Storage Solutions
Currently uses an in-memory storage system with a well-defined interface:

- **Projects**: Store storyboard projects with metadata
- **Scenes**: Individual storyboard scenes with positioning, content, and media references
- **Comments**: Collaborative feedback system with positioning and resolution tracking
- **Collaboration Events**: Real-time event tracking for user interactions

The system is designed with Drizzle ORM configuration for PostgreSQL migration, with schema definitions ready for database implementation.

## Authentication and Authorization
The current implementation uses a simple user identification system. The architecture supports future integration of proper authentication middleware and role-based access control.

## External Dependencies

### Database Infrastructure
- **Neon Database**: Configured as the primary PostgreSQL provider via `@neondatabase/serverless`
- **Drizzle ORM**: Database toolkit with PostgreSQL dialect configuration for type-safe database operations

### AI Services Integration
- **OpenAI API**: Primary AI provider for dialogue improvement, scene expansion, and content generation
- **Google Gemini AI**: Alternative AI provider via `@google/genai` for diverse AI capabilities
- **OpenRouter**: Additional AI service provider for extended model access

### UI Component Libraries
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives for complex components
- **shadcn/ui**: Pre-styled component library built on Radix UI with consistent design system
- **Tailwind CSS**: Utility-first CSS framework for responsive design and theming

### Real-time Communication
- **WebSocket (ws)**: Native WebSocket implementation for real-time collaboration features
- **TanStack Query**: Advanced data fetching and caching for optimistic updates and synchronization

### File Processing
- **Multer**: Middleware for handling multipart/form-data for image uploads
- **React Signature Canvas**: Canvas-based drawing component for scene illustrations

### Development Tools
- **Vite**: Fast build tool with HMR and optimized bundling
- **TypeScript**: Static typing throughout the application
- **ESBuild**: Fast JavaScript bundler for production builds