# Pumpkin Painter Architecture

## Overview

A simple Node.js web application that allows users to control a Halloween pumpkin LED installation via WLED controllers. The application provides an intuitive interface for selecting effects and palettes for different parts of the pumpkin.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          iPad Browser                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Frontend (HTML/CSS/JS)                  │   │
│  │  - Visual pumpkin feature selector                   │   │
│  │  - Effect/Palette picker with previews              │   │
│  │  - Real-time state display                          │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │ HTTP/REST API
                          │
┌─────────────────────────▼────────────────────────────────────┐
│              Node.js Backend (Raspberry Pi)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Express Server                      │  │
│  │  - REST API endpoints                                 │  │
│  │  - Request validation                                 │  │
│  │  - Controller routing                                 │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │              Configuration Layer                       │  │
│  │  - pumpkin.json (feature → segment mapping)           │  │
│  │  - effects.json (FX definitions)                      │  │
│  │  - palettes.json (palette definitions)                │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │              WLED API Client                          │  │
│  │  - HTTP client (axios)                                │  │
│  │  - Request formatting                                 │  │
│  │  - Error handling & retry logic                       │  │
│  └───────────┬────────────────────────┬──────────────────┘  │
└──────────────┼────────────────────────┼─────────────────────┘
               │                        │
               │ HTTP/JSON              │ HTTP/JSON
               │                        │
    ┌──────────▼──────────┐  ┌─────────▼─────────┐
    │ WLED Controller     │  │ WLED Controller   │
    │ (12v - 2000 LEDs)   │  │ (24v - 750 LEDs)  │
    │  8 Segments         │  │  3-4 Segments     │
    └─────────────────────┘  └───────────────────┘
```

## Data Model

### Configuration Files (JSON)

#### `pumpkin.json` - Feature to Segment Mapping
```json
{
  "name": "Halloween Pumpkin 2025",
  "controllers": {
    "pumpkin_12v": {
      "ip": "192.168.1.100",
      "name": "12v Controller (Main Pumpkin)",
      "segments": 8
    },
    "pumpkin_24v": {
      "ip": "192.168.1.101",
      "name": "24v Controller (Filler)",
      "segments": 4
    }
  },
  "features": {
    "leftEye": {
      "name": "Left Eye",
      "controller": "pumpkin_12v",
      "segment": 0,
      "group": "face",
      "color": "#FF6600"
    },
    "rightEye": {
      "name": "Right Eye",
      "controller": "pumpkin_12v",
      "segment": 1,
      "group": "face",
      "color": "#FF6600"
    },
    "nose": {
      "name": "Nose",
      "controller": "pumpkin_12v",
      "segment": 2,
      "group": "face",
      "color": "#FF8800"
    },
    "mouth": {
      "name": "Mouth",
      "controller": "pumpkin_12v",
      "segment": 3,
      "group": "face",
      "color": "#FF6600"
    },
    "innerShell": {
      "name": "Inner Shell",
      "controller": "pumpkin_12v",
      "segment": 4,
      "group": "shell",
      "color": "#FF4400"
    },
    "leftOuterShell": {
      "name": "Left Outer Shell",
      "controller": "pumpkin_12v",
      "segment": 5,
      "group": "shell",
      "color": "#FF4400"
    },
    "rightOuterShell": {
      "name": "Right Outer Shell",
      "controller": "pumpkin_12v",
      "segment": 6,
      "group": "shell",
      "color": "#FF4400"
    },
    "innerFiller": {
      "name": "Inner Filler",
      "controller": "pumpkin_24v",
      "segment": 0,
      "group": "background",
      "color": "#000088"
    },
    "mouthFiller": {
      "name": "Mouth Filler",
      "controller": "pumpkin_24v",
      "segment": 1,
      "group": "background",
      "color": "#000088"
    },
    "skyFiller": {
      "name": "Sky/Background",
      "controller": "pumpkin_24v",
      "segment": 2,
      "group": "background",
      "color": "#000044"
    }
  }
}
```

#### `effects.json` - WLED Effect Definitions
```json
{
  "effects": [
    { "id": 0, "name": "Solid", "category": "basic", "icon": "⬛" },
    { "id": 1, "name": "Blink", "category": "basic", "icon": "💫" },
    { "id": 2, "name": "Breathe", "category": "basic", "icon": "🫁" },
    { "id": 9, "name": "Rainbow", "category": "color", "icon": "🌈" },
    { "id": 10, "name": "Rainbow Cycle", "category": "color", "icon": "🔄" },
    { "id": 13, "name": "Fire Flicker", "category": "animated", "icon": "🔥" },
    { "id": 28, "name": "Chase", "category": "animated", "icon": "➡️" },
    { "id": 42, "name": "Sparkle", "category": "animated", "icon": "✨" },
    { "id": 43, "name": "Twinkle", "category": "animated", "icon": "⭐" },
    { "id": 74, "name": "Meteor", "category": "animated", "icon": "☄️" },
    { "id": 108, "name": "Fire 2012", "category": "animated", "icon": "🔥" }
  ],
  "categories": {
    "basic": "Basic Effects",
    "color": "Color Cycles",
    "animated": "Animated Effects"
  }
}
```

#### `palettes.json` - WLED Palette Definitions
```json
{
  "palettes": [
    { "id": 0, "name": "Default", "colors": ["#000000"], "icon": "⚫" },
    { "id": 1, "name": "Random Cycle", "colors": ["#FF0000", "#00FF00", "#0000FF"], "icon": "🎲" },
    { "id": 2, "name": "Rainbow", "colors": ["#FF0000", "#FFFF00", "#00FF00", "#0000FF", "#FF00FF"], "icon": "🌈" },
    { "id": 4, "name": "Party", "colors": ["#FF00FF", "#FFFF00", "#00FFFF"], "icon": "🎉" },
    { "id": 6, "name": "Lava", "colors": ["#000000", "#8B0000", "#FF4500", "#FF8C00"], "icon": "🌋" },
    { "id": 7, "name": "Ocean", "colors": ["#000080", "#0000FF", "#00FFFF"], "icon": "🌊" },
    { "id": 8, "name": "Forest", "colors": ["#006400", "#228B22", "#90EE90"], "icon": "🌲" },
    { "id": 9, "name": "Halloween", "colors": ["#FF6600", "#9900FF", "#000000"], "icon": "🎃" },
    { "id": 11, "name": "Sunset", "colors": ["#FF4500", "#FF6347", "#FFD700"], "icon": "🌅" },
    { "id": 35, "name": "Fire", "colors": ["#000000", "#8B0000", "#FF4500", "#FFFF00"], "icon": "🔥" }
  ]
}
```

## Backend API

### Endpoints

#### `GET /api/config`
Returns complete configuration including features, effects, and palettes.

**Response:**
```json
{
  "features": { /* pumpkin.json features */ },
  "effects": { /* effects.json */ },
  "palettes": { /* palettes.json */ }
}
```

#### `POST /api/feature/:featureName`
Set effect and palette for a specific pumpkin feature.

**Request Body:**
```json
{
  "fx": 9,        // Effect ID (optional, from effects.json)
  "pal": 2,       // Palette ID (optional, from palettes.json)
  "sx": 128,      // Speed 0-255 (optional, default: 128)
  "ix": 128,      // Intensity 0-255 (optional, default: 128)
  "col": [[255, 100, 0]]  // RGB color array (optional, for solid colors)
}
```

**Response:**
```json
{
  "success": true,
  "feature": "leftEye",
  "controller": "pumpkin_12v",
  "segment": 0
}
```

#### `POST /api/feature/:featureName/color`
Set solid color for a feature (shortcut for solid effect).

**Request Body:**
```json
{
  "color": "#FF6600"  // Hex color
}
```

#### `GET /api/state`
Get current state of all features.

**Response:**
```json
{
  "leftEye": { "fx": 9, "pal": 2, "sx": 128, "ix": 128 },
  "rightEye": { "fx": 9, "pal": 2, "sx": 128, "ix": 128 },
  // ... etc
}
```

#### `POST /api/power`
Turn all controllers on/off.

**Request Body:**
```json
{ "on": true }
```

#### `POST /api/brightness`
Set global brightness for all controllers.

**Request Body:**
```json
{ "brightness": 128 }  // 0-255
```

## Frontend Interface Design

### Layout Concept

```
┌─────────────────────────────────────────────────────────────┐
│                    🎃 Pumpkin Painter                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Pumpkin Feature Selector                  │   │
│  │                                                       │   │
│  │        👁️ Left Eye        👁️ Right Eye             │   │
│  │         [active: 🔥]       [active: 🔥]             │   │
│  │                                                       │   │
│  │              👃 Nose                                 │   │
│  │           [active: ✨]                               │   │
│  │                                                       │   │
│  │              👄 Mouth                                │   │
│  │           [active: 🌈]                               │   │
│  │                                                       │   │
│  │         ───── Shell ─────                           │   │
│  │    Inner │ Left │ Right                             │   │
│  │    [🔥] │ [🔥] │ [🔥]                              │   │
│  │                                                       │   │
│  │       ─── Background Fill ───                       │   │
│  │    Inner │ Mouth │ Sky                              │   │
│  │    [⭐] │ [⭐] │ [⚫]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Selected: Left Eye 👁️                                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Effect Picker                                       │   │
│  │  ┌───┬───┬───┬───┬───┬───┬───┬───┐                │   │
│  │  │⬛│💫│🫁│🌈│🔥│➡️│✨│⭐│  ← Categories    │   │
│  │  └───┴───┴───┴───┴───┴───┴───┴───┘                │   │
│  │     Solid Blink Breathe Rainbow Fire...             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Palette Picker                                      │   │
│  │  ┌───┬───┬───┬───┬───┬───┬───┬───┐                │   │
│  │  │⚫│🎲│🌈│🎉│🌋│🌊│🎃│🔥│                      │   │
│  │  └───┴───┴───┴───┴───┴───┴───┴───┘                │   │
│  │   Default Random Rainbow Party...                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌────────────────┬────────────────┐                        │
│  │  Speed: ━━●━━━ │ Intensity: ━━━●━━ │                   │
│  └────────────────┴────────────────┘                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💡 Brightness: ━━━━━●━━━━━   🔌 Power: [ON]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Quick Presets: [🎃 Spooky] [🌈 Party] [✨ Sparkle]       │
└─────────────────────────────────────────────────────────────┘
```

### UI/UX Features

1. **Visual Feedback:**
   - Each feature button shows currently active effect icon
   - Selected feature is highlighted with border/glow
   - Color indicators show the dominant color/palette
   - Real-time updates when effects change

2. **Touch-Friendly Design:**
   - Large tap targets (minimum 60px)
   - Swipeable effect/palette carousels
   - Responsive grid layout
   - Works well in portrait and landscape

3. **Intuitive Grouping:**
   - Features grouped by logical parts (Face, Shell, Background)
   - Color coding for different groups
   - "Apply to All" buttons for groups

4. **State Persistence:**
   - Current configuration saved to localStorage
   - Can reload last used settings
   - Quick undo for accidental changes

5. **Preview System:**
   - Palette picker shows color gradients
   - Effect picker shows animated icon previews
   - Optional: Small animation preview in the picker

### Technology Stack - Frontend

- **Vanilla JavaScript** (ES6+) - No framework needed for MVP
- **CSS Grid/Flexbox** - Responsive layout
- **CSS Custom Properties** - Theming
- **Fetch API** - Backend communication
- **LocalStorage** - State persistence

Optional enhancements:
- Add Vue.js or React for more complex state management
- Add WebSockets for real-time multi-user sync
- Add PWA capabilities for offline config

## File Structure

```
pumpkin-painter/
├── README.md
├── DESIGN.md
├── ARCHITECTURE.md
├── package.json
├── config/
│   ├── pumpkin.json          # Feature mapping (editable)
│   ├── effects.json          # Effect definitions
│   └── palettes.json         # Palette definitions
├── src/
│   ├── server.js             # Express server
│   ├── wled-client.js        # WLED API client
│   ├── config-loader.js      # Load/validate JSON configs
│   └── api-routes.js         # API endpoint handlers
├── public/
│   ├── index.html            # Main UI
│   ├── css/
│   │   ├── style.css         # Main styles
│   │   └── mobile.css        # Mobile-specific styles
│   ├── js/
│   │   ├── app.js            # Main application logic
│   │   ├── api.js            # API client
│   │   └── ui-components.js  # UI helper functions
│   └── assets/
│       └── icons/            # Any additional icons
└── test/
    └── test-wled.js          # Connectivity tests
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- ✅ Set up Node.js project with Express
- ✅ Create JSON configuration files
- ✅ Implement WLED client with axios
- ✅ Build API endpoints
- ✅ Test connectivity with controllers

### Phase 2: Basic UI (Week 1-2)
- ✅ Create HTML structure with feature buttons
- ✅ Build effect and palette pickers
- ✅ Implement API client in frontend
- ✅ Add basic styling for iPad
- ✅ Test on actual hardware

### Phase 3: Enhanced UX (Week 2)
- ⬜ Add visual feedback and state indicators
- ⬜ Implement speed/intensity sliders
- ⬜ Add preset system
- ⬜ Polish styling and animations
- ⬜ Add error handling and user feedback

### Phase 4: Polish & Testing (Week 3)
- ⬜ User testing with actual iPad
- ⬜ Performance optimization
- ⬜ Documentation
- ⬜ Party mode! 🎃

## Configuration Notes

The JSON-based configuration system allows for easy customization:

1. **Multiple Pumpkin Support:** Simply create different JSON files (e.g., `pumpkin-front.json`, `pumpkin-back.json`)
2. **Easy Remapping:** Change segment assignments without code changes
3. **Effect Customization:** Add/remove effects by editing `effects.json`
4. **Shareable Configs:** Export/import configurations between installations

## Technical Considerations

### Error Handling
- Graceful degradation if controller is offline
- Retry logic for failed requests
- User-friendly error messages
- Fallback to last known good state

### Performance
- Debounce rapid UI changes (e.g., slider adjustments)
- Batch segment updates when possible
- Cache controller state to minimize requests
- Optimize for low-latency on local network

### Security
- Basic auth for API (optional)
- Validate all inputs
- Rate limiting on endpoints
- CORS configuration for local network only

