<div align="center">
  <img src="./public/logo1.png" alt="Memora Logo" width="120" height="120">
  
  # Memora
  
  **Your Personal AI-Powered Knowledge Assistant**
  
  A sophisticated Retrieval-Augmented Generation (RAG) chat interface that remembers, learns, and grows with you.
  
  [Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Architecture](#architecture)
  
  ---
</div>

<<<<<<< HEAD
## 🌟 Overview
=======
Backend for this project : https://github.com/dilip-bing/memorag

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
>>>>>>> 0d9706e8978170f8837f240ef38bb4dbc1a25d66

Memora is a next-generation conversational AI interface that combines the power of large language models with personalized knowledge management. Built for professionals, researchers, and knowledge workers who need an AI assistant that truly understands their context and remembers what matters.

### Why Memora?

- **🧠 Intelligent Memory System**: Your conversations aren't lost. Memora remembers key facts, preferences, and context across all your interactions.
- **📚 Document Intelligence**: Upload and query your documents with sophisticated RAG technology. Your files become part of the AI's knowledge base.
- **🎯 Context-Aware Responses**: Every answer is informed by your personal knowledge graph and conversation history.
- **🌓 Beautiful Design**: Inspired by Claude's elegant interface, featuring a warm coral color scheme and seamless dark mode.
- **⚡ Real-Time Streaming**: Watch responses generate in real-time with intelligent progress indicators.
- **🔐 Privacy-First**: Your data stays yours. Self-hosted RAG backend with Google OAuth authentication.

---

## ✨ Features

### 💬 Advanced Chat Experience
- **Dual Processing Modes**: 
  - **Fast Mode**: Quick responses for everyday queries
  - **Think Mode**: Deep reasoning for complex problems (3-10 minute processing with progress tracking)
- **Streaming Responses**: Real-time token generation with predictive progress bars
- **Multi-Turn Conversations**: Maintains context across unlimited chat sessions
- **Copy Functionality**: One-click copy for any AI response

### 📖 Knowledge Management
- **Personal Memory Cards**: Create structured memory cards for facts, preferences, context, skills, and goals
- **Global Memory**: Shared knowledge across all conversations
- **Chat-Specific Memory**: Context that stays within individual conversations
- **Smart Suggestions**: AI prompts you to save important insights to memory

### 📎 Document Processing
- **Multi-Format Support**: PDF, TXT, DOCX, MD, CSV
- **Scoped Documents**: 
  - **Chat Documents**: Private to individual conversations
  - **User Documents**: Personal knowledge base across all chats
- **File Attachment**: Drag-and-drop or click to attach files to messages
- **Intelligent Extraction**: Automatic text extraction and indexing

### 🎨 User Experience
- **Responsive Design**: Seamless experience across desktop and mobile
- **Dark Mode**: Automatic theme switching based on system preferences
- **Elegant UI**: Coral (#CE5630) accent colors with warm, neutral backgrounds
- **Sidebar Navigation**: Quick access to all chats, memory, documents, and settings
- **Source Attribution**: View document sources for AI responses

### 🔧 Technical Excellence
- **Model Selection**: Switch between different Ollama models on the fly
- **Google OAuth**: Secure authentication with Google sign-in
- **State Management**: Powered by Zustand for efficient state handling
- **Type Safety**: Full TypeScript implementation
- **Modern Stack**: React 19, Vite, Tailwind CSS 4

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A running instance of the Memora RAG backend
- Google OAuth credentials (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/memora.git
   cd memora
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

### First-Time Setup

1. **Sign in with Google** - Authenticate using your Google account
2. **Configure API Settings** - Open Settings and enter your RAG API URL and key
3. **Select a Model** - Choose your preferred Ollama model from the model selector
4. **Start Chatting** - Create a new chat and begin your conversation!

---

## 📚 Documentation

### Building for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

---

## 🏗️ Architecture

### Technology Stack

**Frontend Framework**
- React 19.2 - Latest React with concurrent features
- TypeScript 5.9 - Type-safe development
- Vite 8 - Lightning-fast build tool

**Styling**
- Tailwind CSS 4.2 - Utility-first CSS framework
- Custom Theme - Claude-inspired coral color palette

**State Management**
- Zustand 5.0 - Lightweight state management
- React Hooks - Local component state

**Authentication**
- @react-oauth/google - Google OAuth integration

**Utilities**
- uuid - Unique ID generation
- Custom hooks for RAG, memory, and auth

### Project Structure

```
memora/
├── public/               # Static assets
│   ├── logo1.png        # Main logo
│   └── logo11.ico       # Favicon
├── src/
│   ├── components/      # React components
│   │   ├── ChatWindow.tsx
│   │   ├── MessageInput.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MemoryPanel.tsx
│   │   ├── DocumentsPanel.tsx
│   │   ├── SettingsModal.tsx
│   │   └── LoginPage.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useStore.ts
│   │   ├── useAuth.ts
│   │   ├── useRAG.ts
│   │   └── useMemory.ts
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── vite.config.ts       # Vite configuration
```

### Key Components

**ChatWindow** - Main conversation interface with message bubbles, streaming support, and source attribution

**MessageInput** - Advanced input with file attachment, model selection, and dual processing modes

**Sidebar** - Navigation hub for chats, memory, documents, and settings

**MemoryPanel** - Memory card management interface with different card types

**DocumentsPanel** - Document upload and management with chat/user scopes

---

## 🎨 Design System

### Color Palette

**Light Mode**
- Page Background: `#EDE9DF` - Warm cream
- Sidebar: `#F0EDE4` - Light beige
- Surface: `#FFFFFF` - Pure white
- Brand: `#CE5630` - Coral orange
- Text Primary: `#1A1A18`
- Text Secondary: `#5F5E5A`

**Dark Mode**
- Page Background: `#1A1A18` - Deep charcoal
- Sidebar: `#181817` - Darker charcoal
- Surface: `#2A2A27` - Dark surface
- Brand: `#CE5630` - Coral orange
- Text Primary: `#F1EFE8`
- Text Secondary: `#888780`

### Typography

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Font Smoothing**: Antialiased for crisp text rendering

---

## 🔐 Security & Privacy

- **Google OAuth**: Industry-standard authentication
- **API Key Management**: Secure key storage in settings
- **Local State**: User preferences stored in browser localStorage
- **No Data Tracking**: Your conversations stay private

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Inspired by Claude's elegant interface design
- Built with modern React and TypeScript best practices
- Powered by the open-source community

---

## 📞 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

<div align="center">
  
  **Built with ❤️ for the future of personal AI**
  
  [⭐ Star us on GitHub](https://github.com/yourusername/memora) • [🐛 Report Bug](https://github.com/yourusername/memora/issues) • [💡 Request Feature](https://github.com/yourusername/memora/issues)
  
</div>
