# CodeFix

A community platform for programmers to share coding errors and get help fixing them. Built with Vue 3, Vite, Vue Router, Pinia, and Tailwind CSS.

## Features

- **User Authentication**: Register, login, and manage user profiles
- **Post Management**: Create, view, and manage coding error posts
- **Answer System**: Reply to posts with solutions and mark best answers
- **Search & Filter**: Find posts by keywords or tags
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between light and dark modes
- **Real-time Updates**: Instant updates using Pinia state management

## Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Fast build tool and development server
- **Vue Router** - Official router for Vue.js
- **Pinia** - State management for Vue
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── Navbar.vue      # Navigation bar with search and theme toggle
│   ├── PostCard.vue    # Post preview card component
│   ├── AnswerCard.vue  # Answer display component
│   └── Footer.vue       # Site footer
├── views/              # Page components
│   ├── HomeView.vue    # Home page with post listings
│   ├── PostDetailsView.vue # Individual post view
│   ├── AddPostView.vue # Create new post form
│   ├── ProfileView.vue # User profile page
│   └── AuthView.vue    # Login/register form
├── store/              # Pinia stores
│   └── postsStore.js   # Main application state
├── router/              # Vue Router configuration
│   └── index.js        # Route definitions
├── assets/             # Static assets
│   └── styles.css      # Global styles and Tailwind imports
├── App.vue             # Root component
└── main.js             # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd CodeFix-project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code linting
- `npm run format` - Format code with Prettier

## Usage

### For Users

1. **Register/Login**: Create an account or sign in to access all features
2. **Browse Posts**: View recent coding errors and solutions on the home page
3. **Search**: Use the search bar to find posts by keywords or tags
4. **Create Posts**: Share your coding errors with the community
5. **Answer Posts**: Help others by providing solutions to their problems
6. **Mark Best Answers**: Post owners can mark the most helpful answer

### For Developers

The application uses a component-based architecture with:

- **Reactive State Management**: Pinia stores for global state
- **Component Communication**: Props and events for data flow
- **Routing**: Vue Router for navigation
- **Styling**: Tailwind CSS for responsive design
- **Code Quality**: ESLint and Prettier for consistent code style

## Key Features Implementation

### State Management

- Centralized state with Pinia stores
- Reactive data binding
- Local storage persistence for user sessions

### Routing

- Protected routes for authenticated users
- Dynamic route parameters for post details
- Navigation guards for authentication

### UI/UX

- Responsive design with mobile-first approach
- Dark/light theme toggle with system preference detection
- Loading states and error handling
- Accessible form controls and navigation

### Data Flow

- Parent-child component communication
- Event-driven architecture
- Centralized state updates

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Supports

For support, email support@codefix.dev or create an issue in the repository.
