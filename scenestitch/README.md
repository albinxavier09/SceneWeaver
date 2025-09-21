# Scenestitch

A minimalistic black-and-white storyboarding app that allows users to create, connect, and manage scenes with AI assistance.

## Features

### Phase 1 - Core Prototype ✅
- **Landing Page**: Minimalistic black-and-white design with hero section
- **Authentication**: Email/password sign-up and login with bcrypt
- **Project Dashboard**: Create, manage, and view multiple projects
- **Storyboard Canvas**: Infinite scrollable canvas with drag-and-drop scene cards using react-flow
- **Scene Cards**: Complete scene management with title, image, description, dialogue, technical details, status, and notes
- **AI Integration**: Google Gemini API for content generation and suggestions
- **File Storage**: Local file storage for user uploads and scene assets

### Planned Features
- **Phase 2**: Multi-user collaboration with real-time updates
- **Phase 3**: Advanced AI features and scene flow optimization
- **Phase 4**: Export options and UI polish

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with custom database layer
- **Authentication**: Session-based with bcrypt
- **AI**: Google Gemini API
- **Canvas**: React Flow for drag-and-drop functionality
- **File Storage**: Local filesystem

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scenestitch
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Add your Google Gemini API key to `.env.local`:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

5. Initialize the database:
```bash
curl http://localhost:3000/api/init-db
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign Up**: Create a new account on the landing page
2. **Create Project**: Add a new storyboard project from the dashboard
3. **Add Scenes**: Create scene cards on the storyboard canvas
4. **Edit Scenes**: Click the edit button on any scene card to open the detailed editor
5. **AI Assistance**: Use the AI features to generate descriptions, dialogue, and technical details
6. **Connect Scenes**: Drag from scene handles to create connections between scenes
7. **Upload Images**: Add visual references to your scenes

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Scenes
- `GET /api/projects/[id]/scenes` - Get project scenes
- `POST /api/projects/[id]/scenes` - Create new scene
- `GET /api/projects/[id]/scenes/[sceneId]` - Get scene details
- `PUT /api/projects/[id]/scenes/[sceneId]` - Update scene
- `DELETE /api/projects/[id]/scenes/[sceneId]` - Delete scene

### AI Features
- `POST /api/ai/generate-description` - Generate scene description
- `POST /api/ai/generate-dialogue` - Generate dialogue
- `POST /api/ai/generate-technical` - Generate technical details
- `POST /api/ai/generate-image-prompt` - Generate image prompt

### File Upload
- `POST /api/upload` - Upload scene images

## Database Schema

### Users
- id, email, password_hash, name, created_at, updated_at

### Projects
- id, user_id, name, description, created_at, updated_at

### Scenes
- id, project_id, title, description, image_url, dialogue, technical_details, status, tags, notes, position_x, position_y, created_at, updated_at

### Scene Connections
- id, from_scene_id, to_scene_id, connection_type, created_at

## Development

### Project Structure
```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Project dashboard
│   └── project/        # Project and scene pages
├── components/         # React components
│   ├── SceneNode.tsx   # Scene card component
│   └── SceneEditor.tsx # Scene editor modal
└── lib/               # Utility libraries
    ├── auth.ts        # Authentication helpers
    ├── database.ts    # Database operations
    └── gemini.ts      # AI integration
```

### Adding New Features

1. **Database**: Add new tables/fields in `src/lib/database.ts`
2. **API Routes**: Create new endpoints in `src/app/api/`
3. **Components**: Add new React components in `src/components/`
4. **Pages**: Create new pages in `src/app/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.