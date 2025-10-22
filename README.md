# 🎃 Pumpkin Painter

An interactive web application for controlling a Halloween pumpkin LED installation using WLED controllers. Features both a user-friendly visual interface and an advanced admin panel!

## Features

### User Interface (Main Page)
- 🎃 **Visual Pumpkin Interface** - Tap on eyes, nose, mouth, shell outline, or inner fill
- 🎯 **Simple Modal Controls** - Easy effect and palette selection
- ✨ **Quick Actions** - "Whole Pumpkin" and "Whole Face" shortcut buttons
- 📱 **iPad Optimized** - Single-screen, touch-friendly design
- 🌈 **Beautiful SVG Design** - Jack-o-lantern with thick dark orange outline and light orange interior

### Admin Panel (`/admin.html`)
- 🎨 **Advanced Feature Selection** - Individual control of all segments
- 🔗 **Multi-Segment Control** - Control multiple segments at once (e.g., "Both Rims", "All Face")
- ✨ **WLED Effects** - Choose from 30+ built-in WLED effects (Fire, Rainbow, Sparkle, etc.)
- 🌈 **Color Palettes** - Apply themed palettes from 31 options (Halloween, Fire, Ocean, Party, etc.)
- ⚡ **Real-time Control** - Changes appear instantly on the physical LEDs
- 💾 **State Persistence** - Remembers your settings across sessions
- 🔌 **Power & Brightness** - Global controls for all controllers
- 🎛️ **Fine-tuning** - Precise speed and intensity controls
- 🖥️ **Controller Status** - View live segment details with effect/palette names, presets, and device info

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed on your Raspberry Pi
- WLED controllers on your local network
- iPad or computer on the same network

### 2. Installation

```bash
# Clone or download this repository
cd pumpkin-painter

# Install dependencies
npm install
```

### 3. Configuration

Edit `config/pumpkin.json` to match your setup:

```json
{
  "controllers": {
    "pumpkin_12v": {
      "ip": "192.168.1.100",  // ← Change to your controller's IP
      "name": "12v Controller (Main Pumpkin)",
      "segments": 8
    },
    "pumpkin_24v": {
      "ip": "192.168.1.101",  // ← Change to your controller's IP
      "name": "24v Controller (Filler)",
      "segments": 4
    }
  }
}
```

### 4. Test Connectivity

```bash
npm test
```

This will test connectivity to your WLED controllers and demonstrate basic functionality.

### 5. Start the Server

```bash
npm start
```

The server will start on port 3000. You'll see output like:

```
🎃 Starting Pumpkin Painter...
✓ Loaded configuration for: Halloween Pumpkin 2025
✓ 10 features configured
✓ 11 effects available
✓ 10 palettes available
[WLED Debug] Enabled for 2 controllers
✓ 12v Controller (192.168.1.100) - Online
  WLED Version: 0.14.3
🚀 Server started successfully!
   Local:   http://localhost:3000
   Network: http://192.168.1.X:3000
```

**Note:** Debug mode is enabled by default and will log all WLED commands. To disable: `npm run start:quiet`

### 6. Open on iPad

Open your iPad's browser and navigate to:
```
http://<raspberry-pi-ip>:3000
```

You'll see the **user-friendly pumpkin interface**. For advanced controls, visit:
```
http://<raspberry-pi-ip>:3000/admin.html
```

## Usage

### Choosing an Interface

**User Interface** (`/`) - Perfect for:
- 👥 General users and guests
- 🎨 Quick, intuitive control
- 📱 Simple touch interface
- 🎃 Visual, fun experience

**Admin Panel** (`/admin.html`) - Best for:
- 🔧 Setup and configuration
- 🎛️ Fine-tuned control
- 📊 Multi-segment features
- ⚙️ System management (power, brightness)

You can switch between them at any time - there's an ⚙️ icon in the user interface to jump to admin.

### User Interface (Recommended for most users)

**Two ways to control:**

**Option 1: Shortcut Buttons** (top of page)
- 🎃 **Whole Pumpkin** (applies to ALL segments) | ✨ Whole Face | 👀 Eyes | 👃 Nose | 👄 Mouth | 💡 Inner | 🔶 Shell | 🌟 Outer
- Tap any button to quickly control that feature
- The **Whole Pumpkin** button is highlighted and controls every LED segment across all controllers

**Option 2: Visual Pumpkin** (tap directly)
1. **Tap a pumpkin area** - Eyes, nose, mouth, thick dark orange outline (shell), or light orange interior
2. **Select effect and palette** - Choose from the modal that appears
3. **Adjust speed/intensity** - Use the sliders (optional)
4. **Apply** - Tap the Apply button

**Reset Button** (bottom right):
- 🔄 **Reset** - Loads preset 1 on both controllers to restore default state

**Visual Design:**
- Black cutouts = Eyes, nose, mouth (solid, no LEDs inside)
- Dark orange thick outline = Outer shell (main pumpkin outline)
- Light orange fill = Inner shell (LED area inside the pumpkin)
- Gray curved lines (left/right) = Outer rims (parallel to pumpkin shell)

### Admin Panel (Advanced users)

1. **Select a Feature** - Tap on a feature button (e.g., Left Eye)
2. **Choose an Effect** - Tap an effect icon (e.g., 🔥 Fire)
3. **Choose a Palette** - Tap a palette (e.g., 🎃 Halloween)
4. **Adjust Settings** - Use sliders to adjust speed and intensity
5. **Repeat** - Select different features and apply different effects

### Controller Status

At the bottom of the admin panel, you'll find the **Controllers** section:

**What you'll see:**
- 🟢 **Online/Offline Status** - Real-time connection status for each controller
- 📡 **IP Address** - Network address of the controller
- 🎛️ **Segment Count** - Number of configured segments

**View Details:**
1. Click **"View Details"** on any controller card
2. See current state (power, brightness, transition time)
3. **View all segments** with:
   - Current effect name and ID
   - Current palette name and ID
   - Speed and intensity settings
   - LED range and count
   - On/off status indicator
4. View all configured **presets** with their names
5. Check device info (version, LED count, WiFi strength)

This is useful for:
- 🔍 Verifying which effects/palettes are running on each segment
- 🛠️ Troubleshooting connection issues
- 📊 Monitoring controller health
- 🎨 Seeing exactly what's active before making changes

### Available Effects

| Icon | Effect | Description |
|------|--------|-------------|
| ⬛ | Solid | Static color |
| 💫 | Blink | Blinking on/off |
| 🫁 | Breathe | Smooth fade in/out |
| 🌈 | Rainbow | Moving rainbow |
| 🔄 | Rainbow Cycle | Cycling rainbow |
| 🔥 | Fire Flicker | Flickering fire |
| ➡️ | Chase | Running lights |
| ✨ | Sparkle | Random sparkles |
| ⭐ | Twinkle | Twinkling stars |
| ☄️ | Meteor | Meteor shower |
| 🔥 | Fire 2012 | Realistic fire |

### Available Palettes

- 🌈 Rainbow - Classic rainbow colors
- 🎃 Halloween - Orange and purple
- 🔥 Fire - Red, orange, yellow fire
- 🌋 Lava - Dark red lava colors
- 🌊 Ocean - Blue ocean waves
- 🌲 Forest - Green forest colors
- 🎉 Party - Bright party colors
- 🌅 Sunset - Sunset colors
- And more!

## Project Structure

```
pumpkin-painter/
├── config/
│   ├── pumpkin.json          # Feature mapping (edit this!)
│   ├── effects.json          # WLED effect definitions (UI subset)
│   ├── effects-reference.json # Complete WLED effects reference (170+ effects)
│   ├── palettes.json         # WLED palette definitions (UI subset)
│   └── palettes-reference.json # Complete WLED palettes reference (70+ palettes)
├── src/
│   ├── server.js             # Express server
│   ├── wled-client.js        # WLED API client
│   ├── config-loader.js      # Configuration loader
│   └── api-routes.js         # API endpoints
├── public/
│   ├── index.html            # User-friendly pumpkin interface
│   ├── admin.html            # Advanced admin panel
│   ├── css/
│   │   ├── pumpkin.css       # User interface styles
│   │   ├── style.css         # Admin panel styles
│   │   └── mobile.css        # Mobile optimizations
│   └── js/
│       ├── pumpkin.js        # User interface logic
│       ├── app.js            # Admin panel logic
│       ├── api.js            # API client
│       └── ui-components.js  # UI components
├── test/
│   └── test-wled.js          # Connectivity tests
├── ARCHITECTURE.md           # Technical architecture
├── DESIGN.md                 # Hardware design notes
└── README.md                 # This file
```

## API Documentation

### GET `/api/config`
Get configuration (features, effects, palettes)

### POST `/api/feature/:featureName`
Set effect/palette for a feature
```json
{
  "fx": 9,        // Effect ID
  "pal": 2,       // Palette ID
  "sx": 128,      // Speed (0-255)
  "ix": 128       // Intensity (0-255)
}
```

### POST `/api/feature/:featureName/color`
Set solid color for a feature
```json
{
  "color": "#FF6600"  // Hex color
}
```

### POST `/api/power`
Turn controllers on/off
```json
{ "on": true }
```

### POST `/api/brightness`
Set brightness (0-255)
```json
{ "brightness": 128 }
```

### GET `/api/state`
Get current state of all controllers

### GET `/api/ping`
Test connectivity to all controllers

### GET `/api/controller/:controllerKey`
Get detailed information about a specific controller
- Returns: controller state, info, presets, device details

**Example response:**
```json
{
  "controllerKey": "pumpkin_12v",
  "name": "12v Controller (Main Pumpkin)",
  "ip": "10.0.1.100",
  "state": {
    "success": true,
    "data": {
      "on": true,
      "bri": 255,
      "transition": 7,
      "seg": [...]
    }
  },
  "info": {
    "success": true,
    "data": {
      "ver": "0.14.1",
      "leds": { "count": 300, "seglc": 16 },
      "wifi": { "rssi": -45 },
      "presets": [
        { "n": "Default", "ql": "1" },
        { "n": "Rainbow Party" }
      ]
    }
  }
}
```

### POST `/api/preset`
Load a preset on all controllers
```json
{
  "preset": 1  // Preset number (1-16)
}
```

## Troubleshooting

### Controllers showing as offline

1. Verify WLED is running on your controllers
2. Check that controllers are on the same network as your Raspberry Pi
3. Try pinging the controller: `ping 192.168.1.100`
4. Verify the IP addresses in `config/pumpkin.json`

### Changes not appearing on LEDs

1. Check that the correct segment IDs are configured
2. Verify segments are enabled in WLED
3. Check brightness isn't set to 0
4. Try power cycling the controller

### iPad can't connect to server

1. Verify Raspberry Pi and iPad are on the same network
2. Check firewall settings on Raspberry Pi
3. Use the correct IP address (find with `hostname -I`)
4. Try accessing from the Raspberry Pi first: `http://localhost:3000`

## Customization

### Adding More Effects

Edit `config/effects.json` to add more effects to the UI. 

**Reference:** See `config/effects-reference.json` for the complete list of 170+ WLED effects with IDs. This file contains all available effects from WLED firmware including:
- Basic effects (Solid, Blink, Breathe, etc.)
- Animation effects (Rainbow, Fire, Meteor, etc.)
- Advanced effects (Pacifica, DNA Spiral, Black Hole, etc.)
- Audio-reactive effects (GEQ, Freqwave, Waterfall, etc.)

### Adding More Palettes

Edit `config/palettes.json` to add more palettes to the UI.

**Reference:** See `config/palettes-reference.json` for the complete list of 70+ WLED palettes with IDs. This file contains all available palettes from WLED firmware including themed palettes like Fire, Ocean, Forest, Party, Sunset, and many more.

### Changing Feature Mapping

Edit `config/pumpkin.json` to remap features to different segments or controllers. This is useful if your physical layout changes.

### Creating Multi-Segment Features

You can create features that control multiple segments at once (even across different controllers):

**Example 1: Control all segments everywhere (Whole Pumpkin)**
```json
{
  "wholePumpkin": {
    "name": "Whole Pumpkin 🎃",
    "group": "all",
    "multiSegment": true,
    "targets": [
      { "controller": "pumpkin_12v", "segment": 0 },
      { "controller": "pumpkin_12v", "segment": 1 },
      { "controller": "pumpkin_12v", "segment": 2 },
      { "controller": "pumpkin_12v", "segment": 3 },
      { "controller": "pumpkin_12v", "segment": 4 },
      { "controller": "pumpkin_12v", "segment": 5 },
      { "controller": "pumpkin_12v", "segment": 6 },
      { "controller": "pumpkin_24v", "segment": 0 },
      { "controller": "pumpkin_24v", "segment": 1 },
      { "controller": "pumpkin_24v", "segment": 2 }
    ],
    "color": "#FF6600"
  }
}
```

**Example 2: Control specific segments**
```json
{
  "bothRims": {
    "name": "Both Rims 🔗",
    "group": "rim",
    "multiSegment": true,
    "targets": [
      { "controller": "pumpkin_12v", "segment": 7 },
      { "controller": "pumpkin_24v", "segment": 3 }
    ],
    "color": "#FF6600"
  }
}
```

Multi-segment features:
- Use `multiSegment: true` to enable
- Define `targets` array with controller/segment pairs
- Work across different controllers automatically
- Display with a dashed border in the UI (marked with 🔗)
- Use WLED's native multi-segment API for efficiency
- Perfect for synchronized effects across the entire display

### Creating Multiple Configurations

You can create multiple JSON files for different setups (e.g., `pumpkin-front.json`, `pumpkin-back.json`) and switch between them by modifying the `loadJSON()` calls in `config-loader.js`.

## Development

### Running in Development Mode

```bash
# Auto-restart on file changes (Node 18+)
npm run dev
```

### Testing WLED Commands

```bash
# Interactive testing
npm test
```

### Debug Mode

Debug mode logs all WLED API commands to the server console. **It's enabled by default**.

To disable debug logging:

```bash
# Disable debug output
WLED_DEBUG=false npm start
```

Example debug output (controller online):
```
[WLED Debug] Enabled for 2 controllers
[WLED 12v Controller (Main Pumpkin)] → POST /json/state {"seg":[{"id":0,"fx":9,"pal":2,"sx":128,"ix":128}]}
[WLED 12v Controller (Main Pumpkin)] ✓ Response: 200 OK
```

Example debug output (controller offline):
```
[WLED 12v Controller (Main Pumpkin)] → POST /json/state {"seg":[{"id":5,"fx":35,"pal":9}]}
[WLED 12v Controller (Main Pumpkin)] ✗ Error: connect ECONNREFUSED 10.0.1.100:80
Error setting segment 5 on 12v Controller (Main Pumpkin): connect ECONNREFUSED 10.0.1.100:80
```

**Commands are logged BEFORE sending**, so you'll see them even if controllers are offline. This is useful for:
- Testing without hardware (controllers can be offline)
- Debugging API calls to WLED
- Verifying correct payloads
- Troubleshooting multi-segment features
- Learning WLED's JSON API format

## Contributing

Feel free to fork this project and customize it for your own LED installations! Some ideas:

- Add preset scenes
- Add color picker for solid colors
- Add animation timeline/sequencing
- Add multi-user support with WebSockets
- Add voice control integration
- Create mobile app version

## License

MIT License - Feel free to use and modify!

## Credits

- Built with Node.js, Express, and vanilla JavaScript
- Uses [WLED](https://github.com/Aircoookie/WLED) for LED control
- Emoji icons for intuitive visual feedback

## Happy Halloween! 🎃👻🕷️

Enjoy your interactive pumpkin display!

