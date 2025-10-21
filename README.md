# 🎃 Pumpkin Painter

An interactive web application for controlling a Halloween pumpkin LED installation using WLED controllers. Control effects, palettes, and colors from your iPad!

## Features

- 🎨 **Visual Feature Selection** - Select different parts of your pumpkin (eyes, nose, mouth, shell, fillers, rims)
- 🔗 **Multi-Segment Control** - Control multiple segments at once (e.g., "Both Rims", "All Face")
- ✨ **WLED Effects** - Choose from 11+ built-in WLED effects (Fire, Rainbow, Sparkle, etc.)
- 🌈 **Color Palettes** - Apply themed palettes (Halloween, Fire, Ocean, Party, etc.)
- ⚡ **Real-time Control** - Changes appear instantly on the physical LEDs
- 📱 **iPad Optimized** - Touch-friendly interface designed for iPad
- 💾 **State Persistence** - Remembers your settings across sessions
- 🔌 **Power & Brightness** - Global controls for all controllers

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

## Usage

### Basic Workflow

1. **Select a Feature** - Tap on a pumpkin feature (e.g., Left Eye)
2. **Choose an Effect** - Tap an effect icon (e.g., 🔥 Fire)
3. **Choose a Palette** - Tap a palette (e.g., 🎃 Halloween)
4. **Adjust Settings** - Use sliders to adjust speed and intensity
5. **Repeat** - Select different features and apply different effects

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
│   ├── effects.json          # WLED effect definitions
│   └── palettes.json         # WLED palette definitions
├── src/
│   ├── server.js             # Express server
│   ├── wled-client.js        # WLED API client
│   ├── config-loader.js      # Configuration loader
│   └── api-routes.js         # API endpoints
├── public/
│   ├── index.html            # Main UI
│   ├── css/                  # Stylesheets
│   └── js/                   # Client-side JavaScript
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

Edit `config/effects.json` to add more effects. Find effect IDs in WLED documentation or by inspecting the `/json/effects` endpoint on your WLED controller.

### Adding More Palettes

Edit `config/palettes.json` to add custom palettes. Include color previews for better visual feedback.

### Changing Feature Mapping

Edit `config/pumpkin.json` to remap features to different segments or controllers. This is useful if your physical layout changes.

### Creating Multi-Segment Features

You can create features that control multiple segments at once (even across different controllers):

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

