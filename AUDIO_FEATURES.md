# Audio Features Documentation

## Overview

The scene viewer now supports background audio with configurable triggers. Audio can be automatically played when a scene loads and can be controlled based on hotspot interactions.

## Audio Configuration

Audio is configured in the scene JSON file under the `audio` property:

```json
{
  "id": "kitchen-training",
  "title": "Formation Cuisine - Sauce Brûlée",
  "panoramaUrl": "/scene/cuisine.jpg",
  "audio": {
    "path_to_audio": "/assets/brulure.mp3",
    "initial_state": "auto_play",
    "trigger_type": "stop",
    "trigger": "hotspot_004",
    "loop": true,
    "volume": 0.3,
    "fade_duration": 2
  }
}
```

## Configuration Options

### Basic Properties
- `path_to_audio`: Path to the audio file (MP3, WAV, etc.)
- `initial_state`: How audio should start
  - `"auto_play"`: Audio starts playing automatically when scene loads
  - `"manual_play"`: Audio is loaded but not playing (user must start)
  - `"stopped"`: Audio is stopped initially
- `loop`: Whether audio should loop (true/false)
- `volume`: Initial volume level (0.0 to 1.0)

### Trigger Properties
- `trigger_type`: What happens when the trigger is activated
  - `"stop"`: Audio stops and resets to beginning
  - `"pause"`: Audio pauses (can be resumed)
  - `"volume_change"`: Audio volume is reduced to 0.1
  - `"fade_out"`: Audio fades out over specified duration
  - `"fade_in"`: Audio fades in to target volume
- `trigger`: Hotspot ID that activates the trigger
- `fade_duration`: Duration of fade effects in seconds (default: 2)

## Usage Examples

### Simple Background Music
```json
{
  "audio": {
    "path_to_audio": "/assets/ambient.mp3",
    "initial_state": "auto_play",
    "loop": true,
    "volume": 0.4
  }
}
```

### Audio That Stops When Hotspot is Completed
```json
{
  "audio": {
    "path_to_audio": "/assets/tension.mp3",
    "initial_state": "auto_play",
    "trigger_type": "stop",
    "trigger": "hotspot_004",
    "loop": true,
    "volume": 0.5
  }
}
```

### Audio That Fades Out
```json
{
  "audio": {
    "path_to_audio": "/assets/music.mp3",
    "initial_state": "auto_play",
    "trigger_type": "fade_out",
    "trigger": "hotspot_001",
    "fade_duration": 3,
    "volume": 0.6
  }
}
```

## Audio Controls

A visual audio control panel appears in the top-right corner when audio is configured for a scene. It provides:

- Play/Pause button
- Volume slider
- Trigger information display

## Programmatic Control

Audio can also be controlled programmatically via the global `audioManager` object:

```javascript
// Play audio
window.audioManager.play();

// Pause audio
window.audioManager.pause();

// Stop audio
window.audioManager.stop();

// Set volume (0.0 to 1.0)
window.audioManager.setVolume(0.5);

// Fade out over 3 seconds
window.audioManager.fadeOut(3);

// Fade in to 0.7 volume over 2 seconds
window.audioManager.fadeIn(0.7, 2);

// Check if audio is playing
const isPlaying = window.audioManager.isPlaying();
```

## Browser Compatibility

- Audio auto-play may be blocked in some browsers due to user interaction policies
- The system gracefully handles auto-play failures and logs warnings
- Manual play via controls will always work

## File Formats

Supported audio formats depend on the browser, but typically include:
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- AAC (.aac)

## Best Practices

1. **File Size**: Keep audio files reasonably sized for fast loading
2. **Volume Levels**: Use appropriate volume levels (0.3-0.6 recommended)
3. **Looping**: Use looping for ambient background music
4. **Triggers**: Choose appropriate trigger types for your use case
5. **Fade Effects**: Use fade effects for smoother audio transitions

## Troubleshooting

- Check browser console for audio loading errors
- Ensure audio file paths are correct
- Verify hotspot IDs match between audio triggers and scene hotspots
- Test audio functionality in different browsers 