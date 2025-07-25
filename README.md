# 360° Panorama Viewer - Hotspot Training Experience

A modern, interactive 360-degree panorama viewer built with React, Three.js, and TypeScript. This project is designed for immersive training experiences with interactive hotspots, scene transitions, and multimedia content.

## 🚀 Features

- **360° Panorama Viewing**: Immersive spherical panorama viewing with smooth camera controls
- **Interactive Hotspots**: Clickable hotspots with various types (info, questions, scene transitions)
- **Scene Management**: Seamless transitions between multiple scenes
- **Audio Integration**: Background audio support with auto-play and loop functionality
- **Texture Preloading**: Optimized texture loading for smooth scene transitions
- **Responsive Design**: Full-screen immersive experience
- **TypeScript Support**: Full type safety and better development experience
- **VR Ready**: Built with React Three Fiber for potential VR integration

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **3D Graphics**: Three.js, React Three Fiber, React Three Drei
- **UI Components**: React Three UI Kit
- **Build Tool**: Vite
- **Audio**: HTML5 Audio API
- **Speech Recognition**: React Speech Recognition
- **Styling**: CSS-in-JS with inline styles

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vieweroptimized
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
   Navigate to `http://localhost:5173` to view the application

## 🎮 Usage

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Scene Configuration

The application loads scene data from `public/complete-scene.json`. Each scene contains:

- **Basic Info**: ID, title, panorama image URL
- **Hotspots**: Interactive elements with positions and behaviors
- **Audio**: Optional background audio with playback controls
- **Transitions**: Scene-to-scene navigation

### Hotspot Types

1. **Info Hotspots**: Display information when clicked
2. **Question Hotspots**: Interactive QCM (multiple choice questions)
3. **Scene Transition Hotspots**: Navigate to different scenes
4. **Intro Hotspots**: Welcome messages with character images
5. **ActivAI Hotspots**: AI-powered interactive feedback
6. **Drag & Drop Hotspots**: Interactive drag-and-drop matching activities

## 📁 Project Structure

```
vieweroptimized/
├── public/
│   ├── complete-scene.json    # Scene configuration
│   ├── assets/                # Audio files
│   ├── personas/              # Character images
│   ├── scene/                 # Panorama images
│   └── textures/              # Hotspot textures
├── src/
│   ├── core/
│   │   ├── SceneViewer.tsx    # Main scene management
│   │   ├── Viewer.tsx         # 3D panorama renderer
│   │   ├── DataManager.tsx    # Scene data management
│   │   └── processors/        # Data processing utilities
│   ├── App.tsx               # Root component
│   └── main.tsx              # Application entry point
└── package.json
```

## 🎯 Key Components

### SceneViewer
- Manages scene transitions and navigation
- Handles texture preloading for smooth performance
- Provides scene selection UI

### Viewer
- Renders 360° panoramas using Three.js
- Implements texture caching for memory optimization
- Provides camera controls and lighting

### DataManager
- Loads and manages scene data
- Handles state management for scene switching
- Provides data subscription system

## 🔧 Configuration

### Scene JSON Structure
```json
{
  "scenes": [
    {
      "id": "scene-id",
      "title": "Scene Title",
      "panoramaUrl": "./scene/image.jpg",
      "sphereRadius": 3,
      "audio": {
        "path_to_audio": "./assets/audio.mp3",
        "initial_state": "auto_play",
        "loop": true,
        "volume": 0.3
      },
      "hotspots": [
        {
          "id": "hotspot-id",
          "title": "Hotspot Title",
          "type": "info|question|link|intro",
          "position": [x, y, z],
          "size": 1.0,
          "text": "Hotspot content"
        },
        {
          "id": "dragdrop1",
          "type": "draganddrop",
          "items": [
            { "id": "item1", "position": [x1, y1, z1], "texture": "item1.png", "label": "Item 1" }
          ],
          "targets": [
            { "id": "target1", "position": [x2, y2, z2], "rotation": [0, 0, 0], "texture": "target1.png", "label": "Target 1", "snapOffset": [0, 0, 0] }
          ],
          "matchingPairs": { "item1": "target1" },
          "instructionTexture": "instructions.png",
          "successTexture": "success.png",
          "instructionPosition": [0, 7, 0],
          "successPosition": [0, 6, 0],
          "lightConfig": { "ambientIntensity": 0.8, "pointPosition": [0, 8, 8], "pointIntensity": 1 }
        }
      ]
    }
  ]
}
```

## 🎨 Customization

### Adding New Scenes
1. Add panorama image to `public/scene/`
2. Add scene configuration to `complete-scene.json`
3. Configure hotspots with appropriate positions and content

### Custom Hotspots
- **Info Hotspots**: Use `type: "info"` for informational content
- **Questions**: Use `type: "question"` with `choices` array for QCM
- **Scene Links**: Use `type: "link"` with `targetScene` for navigation
- **Character Intros**: Use `type: "intro"` with character images

### Styling
The application uses inline styles for immediate visual feedback. Customize colors, positioning, and animations by modifying the style objects in components.

## 🚀 Performance Optimizations

- **Texture Caching**: Automatic texture preloading and memory management
- **Lazy Loading**: Scenes load on demand
- **Memory Cleanup**: Automatic disposal of unused textures
- **Optimized Rendering**: Efficient Three.js scene management

## 🔮 Future Enhancements

- VR/AR support with React Three XR
- Advanced audio spatialization
- Multi-user collaborative features
- Analytics and progress tracking
- Mobile optimization
- Accessibility improvements

