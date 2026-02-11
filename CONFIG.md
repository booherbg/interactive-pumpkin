# Configuration Guide

This document explains how the configuration system works and how features in the interface map to hardware segments on WLED controllers.

Quick note: Any time I wanted to change config, rework segments, etc. I just updated the config by hand and used an LLM to update the HTML. It's faster that way.

## Overview

The configuration system maps user-friendly "features" (like "Left Eye" or "Whole Pumpkin") to physical hardware segments on WLED controllers. This abstraction allows the interface to work with logical pumpkin parts while the system handles the underlying controller and segment details.

## Configuration File Structure

The main configuration file is `config/pumpkin.json`. It has three main sections:

```json
{
  "name": "Halloween Pumpkin 2025",
  "controllers": { ... },
  "features": { ... }
}
```

## Controllers

The `controllers` section defines your WLED hardware controllers:

```json
{
  "controllers": {
    "pumpkin_12v": {
      "ip": "10.0.1.140",
      "name": "12v Controller (Main Pumpkin)",
      "segments": 8
    },
    "pumpkin_24v": {
      "ip": "10.0.1.141",
      "name": "24v Controller (Filler)",
      "segments": 5
    }
  }
}
```

**Properties:**
- **Key** (e.g., `"pumpkin_12v"`): Unique identifier used to reference this controller
- **ip**: IP address of the WLED controller on your network
- **name**: Human-readable name (displayed in the admin panel)
- **segments**: Number of segments configured on this controller in WLED

## Features

The `features` section maps interface elements to hardware segments. There are two types of features:

### Single Segment Features

A feature that controls one segment on one controller:

```json
{
  "leftEye": {
    "name": "Left Eye",
    "controller": "pumpkin_12v",
    "segment": 2,
    "group": "face",
    "color": "#FF6600"
  }
}
```

**Properties:**
- **Key** (e.g., `"leftEye"`): Unique identifier used in API calls
- **name**: Display name shown in the interface
- **controller**: Key of the controller from the `controllers` section
- **segment**: Segment ID on that controller (0-indexed)
- **group**: Optional grouping for UI organization (e.g., "face", "rim", "shell")
- **color**: Default color (hex format)

### Multi-Segment Features

A feature that controls multiple segments, potentially across different controllers:

```json
{
  "bothEyes": {
    "name": "Both Eyes 👀",
    "group": "face",
    "multiSegment": true,
    "targets": [
      { "controller": "pumpkin_12v", "segment": 2 },
      { "controller": "pumpkin_12v", "segment": 3 }
    ],
    "color": "#FF6600"
  }
}
```

**Properties:**
- **multiSegment**: Must be `true` for multi-segment features
- **targets**: Array of controller/segment pairs to control
- All other properties work the same as single-segment features

**Example: Cross-Controller Feature**

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
      { "controller": "pumpkin_24v", "segment": 0 },
      { "controller": "pumpkin_24v", "segment": 1 }
    ],
    "color": "#FF6600"
  }
}
```

## How Mapping Works

### Flow Diagram

```
User clicks "Left Eye" in UI
    ↓
Frontend: POST /api/feature/leftEye
    ↓
Backend: Look up "leftEye" in config.pumpkin.features
    ↓
Backend: Find controller="pumpkin_12v", segment=2
    ↓
Backend: Get WLED client for "pumpkin_12v" (IP: 10.0.1.140)
    ↓
Backend: Send WLED API command to segment 2
    ↓
WLED Controller: Updates physical LEDs
```

### Code Flow

1. **User Action**: User selects an effect/palette for a feature
2. **API Request**: Frontend sends `POST /api/feature/:featureName` with effect/palette data
3. **Feature Lookup**: Backend looks up the feature in `config.pumpkin.features[featureName]`
4. **Mapping Decision**:
   - If `multiSegment: true` → Use `targets` array
   - Otherwise → Use `controller` + `segment` properties
5. **WLED Command**: Backend sends appropriate WLED JSON API commands to the controller(s)

### Example: Single Segment

**Config:**
```json
{
  "nose": {
    "name": "Nose",
    "controller": "pumpkin_12v",
    "segment": 4,
    "group": "face"
  }
}
```

**API Call:**
```bash
POST /api/feature/nose
Body: { "fx": 9, "pal": 2, "sx": 128, "ix": 128 }
```

**WLED Command Sent:**
```json
POST http://10.0.1.140/json/state
{
  "seg": [
    { "id": 4, "fx": 9, "pal": 2, "sx": 128, "ix": 128 }
  ]
}
```

### Example: Multi-Segment

**Config:**
```json
{
  "bothEyes": {
    "name": "Both Eyes",
    "multiSegment": true,
    "targets": [
      { "controller": "pumpkin_12v", "segment": 2 },
      { "controller": "pumpkin_12v", "segment": 3 }
    ]
  }
}
```

**API Call:**
```bash
POST /api/feature/bothEyes
Body: { "fx": 9, "pal": 2 }
```

**WLED Command Sent:**
```json
POST http://10.0.1.140/json/state
{
  "seg": [
    { "id": 2, "fx": 9, "pal": 2 },
    { "id": 3, "fx": 9, "pal": 2 }
  ]
}
```

### Example: Cross-Controller Multi-Segment

**Config:**
```json
{
  "wholePumpkin": {
    "name": "Whole Pumpkin",
    "multiSegment": true,
    "targets": [
      { "controller": "pumpkin_12v", "segment": 0 },
      { "controller": "pumpkin_24v", "segment": 0 }
    ]
  }
}
```

**API Call:**
```bash
POST /api/feature/wholePumpkin
Body: { "fx": 9, "pal": 2 }
```

**WLED Commands Sent:**
```json
POST http://10.0.1.140/json/state
{
  "seg": [{ "id": 0, "fx": 9, "pal": 2 }]
}

POST http://10.0.1.141/json/state
{
  "seg": [{ "id": 0, "fx": 9, "pal": 2 }]
}
```

## Segment IDs

Segment IDs in the configuration correspond to WLED segment IDs, which are **0-indexed**:

- Segment 0 = First segment on the controller
- Segment 1 = Second segment on the controller
- Segment 2 = Third segment on the controller
- etc.

**Important:** Make sure your segment IDs in the config match the segments you've configured in WLED. You can verify segment IDs by:
1. Opening the WLED web interface
2. Going to LED Settings
3. Checking the segment configuration

## Common Patterns

### Grouping Related Features

Use the `group` property to organize features:

```json
{
  "features": {
    "leftEye": { "group": "face", ... },
    "rightEye": { "group": "face", ... },
    "nose": { "group": "face", ... },
    "mouth": { "group": "face", ... },
    "leftRim": { "group": "rim", ... },
    "rightRim": { "group": "rim", ... }
  }
}
```

### Creating Shortcuts

Create multi-segment features as shortcuts for common combinations:

```json
{
  "allFace": {
    "name": "All Face",
    "multiSegment": true,
    "targets": [
      { "controller": "pumpkin_12v", "segment": 2 },  // leftEye
      { "controller": "pumpkin_12v", "segment": 3 },  // rightEye
      { "controller": "pumpkin_12v", "segment": 4 },  // nose
      { "controller": "pumpkin_12v", "segment": 5 }   // mouth
    ]
  }
}
```

### Cross-Controller Features

Control segments across multiple controllers simultaneously:

```json
{
  "wholePumpkin": {
    "name": "Whole Pumpkin",
    "multiSegment": true,
    "targets": [
      // All segments from controller 1
      { "controller": "pumpkin_12v", "segment": 0 },
      { "controller": "pumpkin_12v", "segment": 1 },
      // All segments from controller 2
      { "controller": "pumpkin_24v", "segment": 0 },
      { "controller": "pumpkin_24v", "segment": 1 }
    ]
  }
}
```

## Troubleshooting

### Feature Not Found

**Error:** `Feature 'featureName' not found`

**Solution:** Check that the feature key exists in `config/pumpkin.json` under the `features` section.

### Controller Not Found

**Error:** `Controller 'controllerKey' not found`

**Solution:** Verify the `controller` property in your feature matches a key in the `controllers` section.

### Segment Not Responding

**Possible Causes:**
1. Segment ID doesn't exist on the controller (check WLED segment configuration)
2. Segment is disabled in WLED
3. Wrong controller IP address
4. Network connectivity issues

**Solution:** 
- Verify segment IDs in WLED web interface
- Check controller IP addresses are correct
- Test connectivity: `ping <controller-ip>`

### Multi-Segment Feature Not Working

**Check:**
1. `multiSegment: true` is set
2. `targets` array exists and is not empty
3. All controller keys in `targets` exist in `controllers` section
4. All segment IDs in `targets` are valid

## HTML Interface Mapping

The HTML interface connects visual elements to features in your configuration using `data-feature` attributes. This section explains how the frontend maps to your config.

### Main Interface (`index.html`)

The main interface uses SVG elements and buttons that reference features by their key:

#### SVG Elements

Each clickable area in the pumpkin SVG has a `data-feature` attribute that matches a feature key in your config:

```html
<!-- Left Eye SVG element -->
<polygon points="216,232 264,232 254,288 226,288" 
         class="clickable-area feature-cutout" 
         data-feature="leftEye" 
         data-label="Left Eye"/>
```

**Mapping:**
- `data-feature="leftEye"` → Looks up `"leftEye"` in `config.pumpkin.features`
- `data-label="Left Eye"` → Display name shown in the UI

**Example SVG Elements:**
```html
<!-- Eyes -->
<polygon data-feature="leftEye" data-label="Left Eye" .../>
<polygon data-feature="rightEye" data-label="Right Eye" .../>

<!-- Nose -->
<polygon data-feature="nose" data-label="Nose" .../>

<!-- Mouth -->
<path data-feature="allMouth" data-label="Mouth" .../>

<!-- Shell -->
<ellipse data-feature="pumpkinShell" data-label="Shell" .../>

<!-- Inner Fill -->
<ellipse data-feature="innerFiller" data-label="Inner Fill" .../>

<!-- Outer Rims -->
<path data-feature="bothRims" data-label="Both Outer Rims" .../>
```

#### Shortcut Buttons

Shortcut buttons at the top of the page also use `data-feature` attributes:

```html
<button class="shortcut-btn" 
        data-feature="wholePumpkin" 
        data-label="Whole Pumpkin">
  🎃 Whole Pumpkin
</button>
```

**How it works:**
1. User clicks the button
2. JavaScript reads `data-feature="wholePumpkin"`
3. Opens modal with controls for that feature
4. When user selects effect/palette, sends API call: `POST /api/feature/wholePumpkin`

### Admin Panel (`admin.html`)

The admin panel **dynamically builds** feature buttons from your configuration:

#### Dynamic Feature Buttons

The admin panel reads all features from the config and creates buttons automatically:

```javascript
// JavaScript reads config
const features = config.features; // From /api/config

// Groups features by their 'group' property
const groups = {
  "face": ["leftEye", "rightEye", "nose", "mouth", ...],
  "rim": ["leftRim", "rightRim", ...],
  "shell": ["pumpkinShell", ...]
};

// Creates buttons for each feature
features.forEach((featureKey, feature) => {
  const button = document.createElement('button');
  button.dataset.feature = featureKey; // Uses feature key
  button.textContent = feature.name;   // Uses feature name
  // ...
});
```

**Key Points:**
- Features are automatically grouped by their `group` property
- Multi-segment features are marked with a dashed border (🔗 icon)
- All features from your config appear in the admin panel
- No HTML changes needed when you add features to config

### Complete Flow: HTML → Config → Hardware

Here's the complete flow from a user click to hardware control:

```
1. User clicks SVG element or button
   ↓
2. HTML: <polygon data-feature="leftEye" .../>
   ↓
3. JavaScript: Reads data-feature="leftEye"
   ↓
4. JavaScript: Opens modal, user selects effect/palette
   ↓
5. JavaScript: POST /api/feature/leftEye
   Body: { "fx": 9, "pal": 2, "sx": 128, "ix": 128 }
   ↓
6. Backend: Looks up "leftEye" in config.pumpkin.features
   ↓
7. Backend: Finds controller="pumpkin_12v", segment=2
   ↓
8. Backend: Sends WLED command to controller IP
   ↓
9. WLED: Updates physical LEDs on segment 2
```

### Adding New Features to the Interface

To add a new feature that appears in the interface:

#### Step 1: Add Feature to Config

```json
{
  "features": {
    "newFeature": {
      "name": "New Feature",
      "controller": "pumpkin_12v",
      "segment": 7,
      "group": "custom"
    }
  }
}
```

#### Step 2: Add to Main Interface (Optional)

If you want it clickable in the SVG, add an element:

```html
<!-- In index.html -->
<circle cx="300" cy="400" r="30" 
        class="clickable-area" 
        data-feature="newFeature" 
        data-label="New Feature"/>
```

**Note:** The feature will automatically appear in the admin panel without any HTML changes.

#### Step 3: Add Shortcut Button (Optional)

```html
<!-- In index.html shortcuts section -->
<button class="shortcut-btn" 
        data-feature="newFeature" 
        data-label="New Feature">
  ✨ New Feature
</button>
```

### Feature Key Naming

The `data-feature` attribute must **exactly match** the feature key in your config:

**Config:**
```json
{
  "features": {
    "leftEye": { ... }  // ← This is the key
  }
}
```

**HTML:**
```html
<!-- ✅ Correct -->
<polygon data-feature="leftEye" .../>

<!-- ❌ Wrong - won't work -->
<polygon data-feature="Left Eye" .../>
<polygon data-feature="left_eye" .../>
```

### Multi-Segment Features in HTML

Multi-segment features work the same way - just use the feature key:

```html
<!-- Both Eyes button -->
<button data-feature="bothEyes" data-label="Both Eyes">
  👀 Both Eyes
</button>
```

When clicked, the backend handles mapping to multiple segments automatically based on the `targets` array in the config.

### Visual Feedback

The interface provides visual feedback by:

1. **Hover Labels**: Shows feature name when hovering over SVG elements
2. **Active States**: Highlights selected features in the admin panel
3. **Color Visualization**: Updates SVG colors based on current effect/palette

These visual updates are driven by the feature keys in your config, so they work automatically for any feature you add.

## Best Practices

1. **Use descriptive feature keys**: `leftEye` is better than `le`
2. **Group related features**: Use the `group` property for organization
3. **Document your hardware**: Add comments in your config about physical layout
4. **Test incrementally**: Add one feature at a time and test before adding more
5. **Keep segment IDs in sync**: When you change WLED segment configuration, update the config file
6. **Match HTML to config**: Ensure `data-feature` attributes exactly match feature keys
7. **Use consistent naming**: Keep feature keys lowercase with camelCase (e.g., `leftEye`, not `LeftEye`)

## Example Configuration

Here's a complete example configuration:

```json
{
  "name": "Halloween Pumpkin 2025",
  "controllers": {
    "pumpkin_12v": {
      "ip": "10.0.1.140",
      "name": "12v Controller (Main Pumpkin)",
      "segments": 8
    },
    "pumpkin_24v": {
      "ip": "10.0.1.141",
      "name": "24v Controller (Filler)",
      "segments": 5
    }
  },
  "features": {
    "leftEye": {
      "name": "Left Eye",
      "controller": "pumpkin_12v",
      "segment": 2,
      "group": "face",
      "color": "#FF6600"
    },
    "rightEye": {
      "name": "Right Eye",
      "controller": "pumpkin_12v",
      "segment": 3,
      "group": "face",
      "color": "#FF6600"
    },
    "bothEyes": {
      "name": "Both Eyes 👀",
      "group": "face",
      "multiSegment": true,
      "targets": [
        { "controller": "pumpkin_12v", "segment": 2 },
        { "controller": "pumpkin_12v", "segment": 3 }
      ],
      "color": "#FF6600"
    },
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
        { "controller": "pumpkin_24v", "segment": 2 },
        { "controller": "pumpkin_24v", "segment": 3 }
      ],
      "color": "#FF6600"
    }
  }
}
```
