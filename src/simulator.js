/**
 * WLED Pumpkin Simulator
 * Simulates WLED controllers for development/testing without physical hardware
 */

import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_PORT = 8080;

class WLEDSimulator {
  constructor(controllerName, config) {
    this.controllerName = controllerName;
    this.config = config;
    
    // Initialize state based on number of segments
    const numSegments = config.segments || 8;
    this.state = {
      on: true,
      bri: 128,
      seg: []
    };
    
    // Initialize all segments
    for (let i = 0; i < numSegments; i++) {
      this.state.seg.push({
        id: i,
        on: true,
        bri: 255,
        fx: 0,
        sx: 128,
        ix: 128,
        pal: 0,
        col: [[255, 160, 0]] // Default orange
      });
    }
    
    console.log(`✓ Initialized ${controllerName} with ${numSegments} segments`);
  }
  
  /**
   * Get current state (mimics WLED /json/state endpoint)
   */
  getState() {
    return this.state;
  }
  
  /**
   * Update state (mimics WLED POST /json/state endpoint)
   */
  setState(newState) {
    // Update global state
    if (newState.on !== undefined) this.state.on = newState.on;
    if (newState.bri !== undefined) this.state.bri = newState.bri;
    
    // Update segments
    if (newState.seg) {
      if (Array.isArray(newState.seg)) {
        // Multiple segments
        newState.seg.forEach(segUpdate => {
          const segId = segUpdate.id;
          if (segId !== undefined && this.state.seg[segId]) {
            Object.assign(this.state.seg[segId], segUpdate);
          }
        });
      } else if (typeof newState.seg === 'object') {
        // Single segment (legacy format)
        const segId = newState.seg.id || 0;
        if (this.state.seg[segId]) {
          Object.assign(this.state.seg[segId], newState.seg);
        }
      }
    }
    
    console.log(`[${this.controllerName}] State updated:`, JSON.stringify(newState, null, 2));
    
    return { success: true };
  }
  
  /**
   * Get info (mimics WLED /json/info endpoint)
   */
  getInfo() {
    return {
      ver: "0.14.0-simulator",
      vid: 99999,
      name: this.controllerName,
      udpport: 21324,
      live: false,
      leds: {
        count: 300,
        rgbw: false,
        wv: false,
        cct: false,
        seglock: false,
        maxseg: this.state.seg.length,
        maxpwr: 0,
        seglc: [this.state.seg.length]
      },
      freeheap: 150000,
      uptime: Math.floor(Date.now() / 1000),
      opt: 127,
      brand: "Simulator",
      product: "WLED-Sim",
      mac: "aa:bb:cc:dd:ee:ff",
      ip: "127.0.0.1"
    };
  }
}

/**
 * Create Express app for simulator
 */
export function createSimulatorApp(pumpkinConfig) {
  const app = express();
  app.use(express.json());
  
  // Create simulator instances for each controller
  const simulators = {};
  Object.entries(pumpkinConfig.controllers).forEach(([key, config]) => {
    simulators[key] = new WLEDSimulator(config.name, config);
  });
  
  // Middleware to get controller from path
  function getSimulator(req, res, next) {
    const controllerKey = req.path.split('/')[2]; // /simulator/pumpkin_12v/...
    const simulator = simulators[controllerKey];
    
    if (!simulator) {
      return res.status(404).json({ error: 'Controller not found' });
    }
    
    req.simulator = simulator;
    req.controllerKey = controllerKey;
    next();
  }
  
  // WLED API endpoints for each controller
  app.get('/simulator/:controller/json/state', getSimulator, (req, res) => {
    res.json(req.simulator.getState());
  });
  
  app.post('/simulator/:controller/json/state', getSimulator, (req, res) => {
    const result = req.simulator.setState(req.body);
    res.json(result);
  });
  
  app.get('/simulator/:controller/json/info', getSimulator, (req, res) => {
    res.json(req.simulator.getInfo());
  });
  
  app.get('/simulator/:controller/json', getSimulator, (req, res) => {
    res.json({
      state: req.simulator.getState(),
      info: req.simulator.getInfo()
    });
  });
  
  // Visualization page
  app.get('/simulator', (req, res) => {
    const html = generateVisualizationHTML(simulators, pumpkinConfig);
    res.send(html);
  });
  
  // API to get all controller states (for visualization)
  app.get('/simulator/api/states', (req, res) => {
    const states = {};
    Object.entries(simulators).forEach(([key, sim]) => {
      states[key] = sim.getState();
    });
    res.json(states);
  });
  
  return { app, simulators };
}

/**
 * Create a fallback SVG pumpkin
 */
function createFallbackSVG() {
  return `<svg viewBox="0 0 600 600" class="pumpkin-svg">
    <defs>
      <linearGradient id="featureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff6600"/>
        <stop offset="100%" stop-color="#ffaa00"/>
      </linearGradient>
    </defs>
    
    <!-- Left outer shell (rim) -->
    <path d="M 70,120 A 240,260 0 0,0 70,520" 
          class="clickable-area outer-shell-left" data-feature="leftRim" data-label="Left Rim"
          fill="none" stroke="#ff6600" stroke-width="20"/>
    
    <!-- Right outer shell (rim) -->
    <path d="M 530,120 A 240,260 0 0,1 530,520" 
          class="clickable-area outer-shell-right" data-feature="rightRim" data-label="Right Rim"
          fill="none" stroke="#ff6600" stroke-width="20"/>
    
    <!-- Inner fill -->
    <ellipse cx="300" cy="320" rx="190" ry="210" 
             class="clickable-area inner-fill" data-feature="innerFiller" data-label="Inner Fill"
             fill="#ffb366"/>
    
    <!-- Pumpkin shell -->
    <ellipse cx="300" cy="320" rx="200" ry="220" 
             class="clickable-area pumpkin-shell" data-feature="pumpkinShell" data-label="Shell"
             fill="none" stroke="#cc5500" stroke-width="24"/>
    
    <!-- Left Eye -->
    <polygon points="216,232 264,232 254,288 226,288" 
             class="clickable-area feature-cutout" data-feature="leftEye" data-label="Left Eye"
             fill="#000000" stroke="#ff6600" stroke-width="4"/>
    
    <!-- Right Eye -->
    <polygon points="336,232 384,232 374,288 346,288" 
             class="clickable-area feature-cutout" data-feature="rightEye" data-label="Right Eye"
             fill="#000000" stroke="#ff6600" stroke-width="4"/>
    
    <!-- Nose -->
    <polygon points="300,294 324,336 276,336" 
             class="clickable-area feature-cutout" data-feature="nose" data-label="Nose"
             fill="#000000" stroke="#ff6600" stroke-width="4"/>
    
    <!-- Mouth -->
    <path d="M 200,380 Q 300,420 400,380 L 390,400 Q 300,440 210,400 Z" 
          class="clickable-area feature-cutout" data-feature="allMouth" data-label="Mouth"
          fill="#000000" stroke="#ff6600" stroke-width="4"/>
  </svg>`;
}

/**
 * Generate HTML visualization page
 */
function generateVisualizationHTML(simulators, pumpkinConfig) {
  // Read the pumpkin SVG from the public folder
  const svgPath = join(__dirname, '../public/index.html');
  let svgContent = '';
  try {
    const fullHTML = readFileSync(svgPath, 'utf-8');
    console.log('✓ Loaded HTML file, extracting SVG...');
    
    // Extract just the SVG portion - be more specific
    const svgMatch = fullHTML.match(/<svg[^>]*class="pumpkin-svg"[^>]*>[\s\S]*?<\/svg>/);
    if (svgMatch) {
      svgContent = svgMatch[0];
      console.log('✓ SVG extracted successfully');
    } else {
      console.warn('⚠ SVG not found in HTML, using fallback');
      svgContent = createFallbackSVG();
    }
  } catch (err) {
    console.warn('Could not load SVG file:', err.message);
    svgContent = createFallbackSVG();
  }
  
  // Load palette data for visualization
  let paletteData = {};
  try {
    const palettePath = join(__dirname, '../config/palettes.json');
    const paletteJSON = readFileSync(palettePath, 'utf-8');
    const paletteConfig = JSON.parse(paletteJSON);
    paletteConfig.palettes.forEach(p => {
      paletteData[p.id] = p.colors || [];
    });
  } catch (err) {
    console.warn('Could not load palette data:', err.message);
  }
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WLED Pumpkin Simulator</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    h1 {
      text-align: center;
      margin-bottom: 10px;
      font-size: 2rem;
      background: linear-gradient(135deg, #ff6600, #ffaa00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle {
      text-align: center;
      color: #888;
      margin-bottom: 30px;
    }
    .layout {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 20px;
    }
    .pumpkin-view {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pumpkin-svg {
      width: 100%;
      max-width: 600px;
      height: auto;
    }
    
    /* Pumpkin SVG Styles */
    .inner-fill {
      fill: #ffb366;
      stroke: none;
    }
    
    .pumpkin-shell {
      fill: none;
      stroke: #cc5500;
      stroke-width: 24;
    }
    
    .feature-cutout {
      fill: #000000;
      stroke: #ff6600;
      stroke-width: 4;
      filter: drop-shadow(0 0 8px rgba(255, 102, 0, 0.6));
    }
    
    .outer-shell-left,
    .outer-shell-right {
      fill: none;
      stroke: rgba(150, 150, 150, 0.6);
      stroke-width: 20;
      stroke-linecap: round;
    }
    
    .clickable-area {
      transition: fill 0.2s ease, stroke 0.2s ease, filter 0.3s ease;
    }
    
    .feature-active {
      animation: pulsate 1s ease-in-out infinite;
    }
    
    @keyframes pulsate {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .controllers {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 20px;
      overflow-y: auto;
      max-height: 80vh;
    }
    .controller {
      margin-bottom: 20px;
      padding: 15px;
      background: #2a2a2a;
      border-radius: 8px;
    }
    .controller h3 {
      color: #ff6600;
      margin-bottom: 10px;
      font-size: 1.1rem;
    }
    .segment {
      margin: 8px 0;
      padding: 10px;
      background: #1a1a1a;
      border-radius: 6px;
      border-left: 3px solid #444;
      font-size: 0.9rem;
    }
    .segment.on {
      border-left-color: #00ff00;
    }
    .segment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-weight: 600;
    }
    .segment-details {
      font-size: 0.85rem;
      color: #888;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
    }
    .color-preview {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 1px solid #555;
      vertical-align: middle;
      margin-left: 5px;
    }
    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎃 WLED Pumpkin Simulator</h1>
    <p class="subtitle">Development Mode - No Hardware Required</p>
    
    <div class="layout">
      <div class="pumpkin-view">
        ${svgContent}
      </div>
      
      <div class="controllers" id="controllers">
        <p style="text-align: center; color: #888;">Loading...</p>
      </div>
    </div>
  </div>
  
  <script>
    // Palette color data
    const PALETTES = ${JSON.stringify(paletteData)};
    
    // Poll for state updates
    async function updateStates() {
      try {
        const response = await fetch('/simulator/api/states');
        const states = await response.json();
        renderControllers(states);
        updatePumpkinVisualization(states);
      } catch (err) {
        console.error('Failed to fetch states:', err);
      }
    }
    
    function renderControllers(states) {
      const container = document.getElementById('controllers');
      container.innerHTML = '';
      
      Object.entries(states).forEach(([key, state]) => {
        const div = document.createElement('div');
        div.className = 'controller';
        
        let html = \`<h3>\${key}</h3>\`;
        html += \`<div style="margin-bottom: 10px; color: #888;">Power: \${state.on ? '✓ ON' : '✗ OFF'} | Brightness: \${state.bri}</div>\`;
        
        state.seg.forEach(seg => {
          const colorRgb = seg.col[0] || [255, 160, 0];
          const colorHex = \`#\${colorRgb.map(c => c.toString(16).padStart(2, '0')).join('')}\`;
          
          // Generate palette preview if using effect with palette
          let colorDisplay = \`<span class="color-preview" style="background: \${colorHex}"></span>\`;
          if (seg.fx > 0 && seg.pal > 0 && PALETTES[seg.pal]) {
            const paletteColors = PALETTES[seg.pal];
            if (paletteColors.length > 1) {
              const gradient = paletteColors.slice(0, 5).join(', ');
              colorDisplay = \`<span class="color-preview" style="background: linear-gradient(to right, \${gradient}); border: 1px solid #555;"></span>\`;
            } else {
              colorDisplay = \`<span class="color-preview" style="background: \${paletteColors[0]}"></span>\`;
            }
          }
          
          html += \`
            <div class="segment \${seg.on ? 'on' : ''}">
              <div class="segment-header">
                <span>Segment \${seg.id}</span>
                <span>\${seg.on ? '●' : '○'}</span>
              </div>
              <div class="segment-details">
                <div>FX: \${seg.fx}</div>
                <div>Palette: \${seg.pal}</div>
                <div>Speed: \${seg.sx}</div>
                <div>Intensity: \${seg.ix}</div>
                <div>Color: \${colorDisplay}</div>
                <div>Brightness: \${seg.bri}</div>
              </div>
            </div>
          \`;
        });
        
        div.innerHTML = html;
        container.appendChild(div);
      });
    }
    
    function updatePumpkinVisualization(states) {
      // Update SVG based on segment states
      const svg = document.querySelector('.pumpkin-svg');
      if (!svg) return;
      
      // Map segments to SVG features (from pumpkin.json)
      const segmentMap = {
        'pumpkin_12v': {
          0: 'leftRim',
          1: 'rightRim',
          2: 'leftEye',
          3: 'rightEye',
          4: 'nose',
          5: 'allMouth',
          6: 'pumpkinShell'
        },
        'pumpkin_24v': {
          0: 'innerFiller',
          1: 'innerFiller',
          2: 'innerFiller',
          3: 'innerFiller',
          4: 'allMouth'
        }
      };
      
      // Clear all features first
      svg.querySelectorAll('[data-feature]').forEach(el => {
        el.style.fill = '';
        el.style.stroke = '';
        el.classList.remove('feature-active');
      });
      
      // Update each controller's segments
      Object.entries(states).forEach(([controllerKey, state]) => {
        if (!state.on) return;
        
        state.seg.forEach(seg => {
          if (!seg.on) return;
          
          const featureName = segmentMap[controllerKey]?.[seg.id];
          if (!featureName) return;
          
          // Find the SVG element
          let element = svg.querySelector(\`[data-feature="\${featureName}"]\`);
          
          if (!element) return;
          
          // Determine color to use
          let color;
          
          // If using an effect with a palette, show palette colors as gradient
          if (seg.fx > 0 && seg.pal > 0 && PALETTES[seg.pal]) {
            const paletteColors = PALETTES[seg.pal];
            if (paletteColors.length > 1) {
              // Create a gradient from palette colors
              const gradientId = \`palette-\${controllerKey}-\${seg.id}\`;
              let gradient = svg.querySelector(\`#\${gradientId}\`);
              
              if (!gradient) {
                // Create gradient element
                let defs = svg.querySelector('defs');
                if (!defs) {
                  defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                  svg.insertBefore(defs, svg.firstChild);
                }
                
                gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
                gradient.id = gradientId;
                gradient.setAttribute('x1', '0%');
                gradient.setAttribute('y1', '0%');
                gradient.setAttribute('x2', '100%');
                gradient.setAttribute('y2', '100%');
                defs.appendChild(gradient);
              }
              
              // Clear and rebuild gradient stops
              gradient.innerHTML = '';
              paletteColors.slice(0, 5).forEach((hexColor, i) => {
                const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
                stop.setAttribute('offset', \`\${(i / (paletteColors.length - 1)) * 100}%\`);
                stop.setAttribute('stop-color', hexColor);
                gradient.appendChild(stop);
              });
              
              color = \`url(#\${gradientId})\`;
            } else {
              color = paletteColors[0] || '#ff6600';
            }
          } else {
            // Solid color from segment
            const rgb = seg.col[0] || [255, 160, 0];
            color = \`rgb(\${rgb[0]}, \${rgb[1]}, \${rgb[2]})\`;
          }
          
          // Apply color based on element type
          if (element.classList.contains('feature-cutout')) {
            element.style.fill = color;
            element.style.stroke = color;
          } else if (element.classList.contains('inner-fill')) {
            element.style.fill = color;
          } else if (element.classList.contains('pumpkin-shell')) {
            element.style.stroke = color;
          } else if (element.classList.contains('outer-shell-left') || element.classList.contains('outer-shell-right')) {
            element.style.stroke = color;
          }
          
          // Add active class for animation
          element.classList.add('feature-active');
        });
      });
    }
    
    // Update every second
    setInterval(updateStates, 1000);
    updateStates();
  </script>
</body>
</html>`;
}

/**
 * Start simulator server
 */
export async function startSimulator(pumpkinConfig, port = DEFAULT_PORT) {
  const { app, simulators } = createSimulatorApp(pumpkinConfig);
  
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log('🎃 WLED Pumpkin Simulator started');
      console.log(`📺 Visualization: http://localhost:${port}/simulator`);
      console.log('');
      console.log('Controller endpoints:');
      Object.keys(simulators).forEach(key => {
        console.log(`  • http://localhost:${port}/simulator/${key}/json/state`);
      });
      console.log('');
      
      resolve({ server, simulators });
    });
    
    server.on('error', reject);
  });
}

