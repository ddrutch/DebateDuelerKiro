# Debate Dueler

try out link:
[(https://www.reddit.com/r/debateDuelerKiro/comments/1nhm3ke/neighborly_boundaries_aita_advice_by_drutcher/)](https://www.reddit.com/r/debateDuelerKiro/comments/1nhm3ke/neighborly_boundaries_aita_advice_by_drutcher/)

An interactive, real-time quiz game built for Reddit using Devvit, featuring dynamic scoring mechanics, live backgrounds, and community-driven content creation. Players compete in themed debates with unique strategies while experiencing immersive visual feedback.

## 🎮 Game Features

### Core Gameplay
- **Three Scoring Modes**: Choose between Contrarian (score higher for unpopular choices), Conformist (score higher for popular choices), or Trivia (traditional correct-answer scoring)
- **Multiple Question Types**: Multiple-choice questions and sequence-based ordering challenges
- **Real-time Leaderboards**: Live competition tracking with instant score updates
- **Community Content**: Players can create and submit their own questions and debate topics

### Advanced Components (Kiro Integration)

#### 🎨 Live Background System
- **Emotional Tier Visualization**: Dynamic background colors and animations that reflect player performance and emotional state
- **Animated Emoticon Effects**: Floating emoticons that react to game progress with morphing animations and particle bursts
- **Performance-Optimized Animations**: 60fps hardware-accelerated animations with responsive design
- **Accessibility Features**: Reduced motion support and visual comfort considerations

#### 🧙 Deck Wizard
- **Multi-Step Creation Process**: Guided wizard interface for building comprehensive question decks
- **Drag-and-Drop Sequencing**: Intuitive sequence question creation with visual ordering
- **Theme Integration**: Visual theme selection with automatic styling application
- **Real-time Validation**: Immediate feedback and validation throughout the creation process

#### 🎯 Debate Dueler Core
- **Advanced State Management**: Robust game state handling with session persistence and recovery
- **Backend Communication**: Reliable message passing between React client and Devvit backend
- **Scoring Algorithm Integration**: Complex scoring calculations with time bonuses and mode-specific multipliers
- **Admin Functionality**: Moderator tools for content management and game administration

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐
│   Reddit Post   │
│   (Devvit App)  │
└─────────┬───────┘
          │
    ┌─────▼─────┐
    │  Devvit   │
    │  Backend  │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │   React   │
    │  Webview  │
    │  Client   │
    └───────────┘
```

### Component Structure
- **Client** (`src/client/`): React application with TypeScript, running in Reddit webviews
- **Devvit Backend** (`src/devvit/`): Reddit app logic with Redis operations and custom post types
- **Server** (`src/server/`): Node.js serverless functions for additional backend processing
- **Shared** (`src/shared/`): Common TypeScript types, utilities, and data structures

### Data Flow
- Real-time message passing between React client and Devvit backend
- Redis-based data persistence with optimized key structures
- Local storage for client-side session management and performance optimization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Reddit Developer Account
- Devvit CLI installed globally

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd debate-dueler

# Install dependencies
npm install

# Login to Devvit
npx devvit login

# Start development server
npm run dev
```

### Testing
1. Go to your test subreddit
2. Click "Create Post"
3. Look for "[Debate Dueler] Create New Game" option
4. Create and test your post

**Important Setup Note**: When creating a new post, make sure to update the `flairTemplateId` in the post creation settings to ensure proper categorization and display.

## 🛠️ Development

### Local Development
```bash
# Start development servers
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Project Structure
```
debate-dueler/
├── src/
│   ├── client/          # React webview application
│   │   ├── components/  # UI components (DebateDueler, LiveBackground, etc.)
│   │   └── hooks/       # Custom React hooks
│   ├── devvit/          # Reddit app backend
│   │   ├── components/  # Devvit UI components
│   │   └── main.tsx     # App entry point
│   ├── server/          # Additional server logic
│   └── shared/          # Common types and utilities
├── docs/               # Comprehensive documentation
├── .kiro/             # Kiro hackathon specifications
│   ├── specs/         # Component requirements and designs
│   └── hooks/         # Automation hooks
└── tools/             # Development utilities
```

### Key Technologies
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Devvit (Reddit's app framework) + Redis
- **Build Tools**: Vite, ESLint, Prettier
- **Testing**: Jest + React Testing Library
- **Deployment**: Reddit App Directory + Devvit CLI



## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-scoring-mode`)
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Ensure all tests pass and linting is clean
6. Submit a pull request with detailed description

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with React rules
- **Prettier**: Consistent code formatting
- **Testing**: Unit and integration tests required
- **Documentation**: Update docs for any API changes

### Kiro Integration
The project includes Kiro automation hooks for:
- Documentation updates
- Testing automation
- Refactoring suggestions
- Performance monitoring

## 📊 Scoring System

### Base Mechanics
- **Base Score**: 50 points per question
- **Time Bonus**: +5 points per second remaining
- **Strategy Multiplier**: Based on chosen scoring mode

### Mode-Specific Scoring
- **Contrarian**: `(1 - popularity) × base_score × time_bonus`
- **Conformist**: `popularity × base_score × time_bonus`
- **Trivia**: `correctness × base_score × time_bonus`

## 🔧 Configuration

### Devvit Configuration (`devvit.yaml`)
```yaml
name: debate-dueler
version: 1.0.0
description: Interactive quiz game for Reddit posts
author: Debate Dueler Team
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Configure your settings
# REDDIT_SUBREDDIT=your_test_subreddit
# REDIS_URL=redis://localhost:6379
```

## 📈 Performance Features

- **Local Scoring**: Immediate feedback without server round-trips
- **Lazy Loading**: Questions loaded on-demand
- **Efficient Redis Queries**: Optimized leaderboard operations
- **WebView Communication**: Batched message passing
- **Hardware Acceleration**: CSS transforms for smooth animations

## 🐛 Troubleshooting

### Common Issues
- **Build Errors**: Clear node_modules and reinstall
- **Redis Connection**: Check Redis service status
- **Devvit Auth**: Re-login if authentication fails
- **WebView Issues**: Verify browser console for client errors

### Debug Mode
```bash
# Enable debug logging
DEBUG=devvit:* npm run dev

# Check app logs
npx devvit apps logs <app-id>
```


**Built with** ⚡ [Devvit](https://developers.reddit.com/docs/) - Reddit's app development platform

**Kiro Hackathon Submission** - Advanced React patterns, real-time gaming, and community-driven content creation
