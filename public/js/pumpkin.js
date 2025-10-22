/**
 * Pumpkin Painter - User-Friendly Interface
 */

// API helper
const api = {
  async getConfig() {
    const response = await fetch('/api/config');
    return response.json();
  },
  
  async setFeature(featureName, props) {
    const response = await fetch(`/api/feature/${featureName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(props)
    });
    return response.json();
  },

  async loadPreset(preset) {
    const response = await fetch('/api/preset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset })
    });
    return response.json();
  }
};

// Debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

class PumpkinPainter {
  constructor() {
    this.config = null;
    this.selectedFeature = null;
    this.selectedEffect = null;
    this.selectedPalette = null;
    this.selectedColor = null;
    this.speed = 128;
    this.intensity = 128;
    
    // Screensaver settings
    this.inactivityTimeout = null;
    this.inactivityDelay = 30000; // 30 seconds
    this.screensaverActive = true; // Start with screensaver active
    this.bouncingPumpkins = [];
    
    // Track active feature visualizations
    this.activeFeatures = {};
    
    // Define solid color presets
    this.solidColors = [
      { name: 'Red', color: '#FF0000', icon: '🔴' },
      { name: 'Orange', color: '#FF6600', icon: '🟠' },
      { name: 'Yellow', color: '#FFFF00', icon: '🟡' },
      { name: 'Lime', color: '#00FF00', icon: '🟢' },
      { name: 'Green', color: '#008000', icon: '💚' },
      { name: 'Cyan', color: '#00FFFF', icon: '🔵' },
      { name: 'Blue', color: '#0000FF', icon: '🔵' },
      { name: 'Purple', color: '#800080', icon: '🟣' },
      { name: 'Magenta', color: '#FF00FF', icon: '💜' },
      { name: 'Pink', color: '#FF1493', icon: '💗' },
      { name: 'White', color: '#FFFFFF', icon: '⚪' },
      { name: 'Warm White', color: '#FFE4B5', icon: '🤍' },
    ];
    
    // Create debounced apply function
    this.debouncedApply = debounce(() => this.applySettings(), 300);
  }

  async init() {
    try {
      // Load configuration
      this.config = await api.getConfig();
      console.log('Config loaded:', this.config);
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Setup screensaver
      this.setupScreensaver();
      
      // Screensaver is already showing on page load
      
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.showToast('❌ Failed to connect to server');
    }
  }

  setupEventListeners() {
    // Shortcut buttons
    document.querySelectorAll('.shortcut-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const feature = e.currentTarget.dataset.feature;
        const label = e.currentTarget.dataset.label;
        this.openModal(feature, label);
      });
    });

    // Clickable areas
    document.querySelectorAll('.clickable-area').forEach(area => {
      area.addEventListener('click', (e) => {
        const feature = e.target.dataset.feature;
        const label = e.target.dataset.label;
        this.openModal(feature, label);
      });
      
      // Show label on hover
      area.addEventListener('mouseenter', (e) => {
        const label = e.target.dataset.label;
        const hoverLabel = document.getElementById('hoverLabel');
        hoverLabel.textContent = label;
        hoverLabel.style.opacity = '1';
      });
      
      area.addEventListener('mouseleave', () => {
        const hoverLabel = document.getElementById('hoverLabel');
        hoverLabel.style.opacity = '0';
      });
    });


    // Modal close
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeModal();
    });

    // Click outside modal to close
    document.getElementById('controlModal').addEventListener('click', (e) => {
      if (e.target.id === 'controlModal') {
        this.closeModal();
      }
    });

    // Sliders
    const speedSlider = document.getElementById('speedSlider');
    const intensitySlider = document.getElementById('intensitySlider');
    
    speedSlider.addEventListener('input', (e) => {
      this.speed = parseInt(e.target.value);
      document.getElementById('speedValue').textContent = this.speed;
      
      // Apply with debounce to avoid too many requests
      if (this.selectedFeature) {
        this.debouncedApply();
      }
    });
    
    intensitySlider.addEventListener('input', (e) => {
      this.intensity = parseInt(e.target.value);
      document.getElementById('intensityValue').textContent = this.intensity;
      
      // Apply with debounce to avoid too many requests
      if (this.selectedFeature) {
        this.debouncedApply();
      }
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetToPreset();
    });
  }

  openModal(feature, label) {
    this.selectedFeature = feature;
    
    // Set modal title
    document.getElementById('modalTitle').textContent = `Control ${label}`;
    
    // Populate effects
    this.populateEffects();
    
    // Populate palettes
    this.populatePalettes();
    
    // Populate colors
    this.populateColors();
    
    // Update section visibility based on current selection
    this.updateSectionVisibility();
    
    // Show modal
    document.getElementById('controlModal').classList.add('show');
  }

  closeModal() {
    document.getElementById('controlModal').classList.remove('show');
  }

  populateEffects() {
    const grid = document.getElementById('effectGrid');
    grid.innerHTML = '';
    
    // Filter effects where show is not false (default to true if not specified)
    const visibleEffects = this.config.effects.effects.filter(effect => effect.show !== false);
    
    visibleEffects.forEach(effect => {
      const btn = document.createElement('button');
      btn.className = 'effect-btn';
      btn.innerHTML = `
        <div class="effect-icon">${effect.icon}</div>
        <div class="effect-name">${effect.name}</div>
      `;
      
      btn.addEventListener('click', () => {
        // Remove active from all
        grid.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
        // Add active to this one
        btn.classList.add('active');
        this.selectedEffect = effect.id;
        
        // Update section visibility
        this.updateSectionVisibility();
        
        // If solid effect, don't apply until color is selected
        if (effect.id !== 0) {
          this.applySettings();
        }
      });
      
      grid.appendChild(btn);
    });
  }

  populatePalettes() {
    const grid = document.getElementById('paletteGrid');
    grid.innerHTML = '';
    
    // Filter palettes where show is not false (default to true if not specified)
    const visiblePalettes = this.config.palettes.palettes.filter(palette => palette.show !== false);
    
    visiblePalettes.forEach(palette => {
      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      
      // Create gradient from colors
      const gradient = this.createGradient(palette.colors);
      
      btn.innerHTML = `
        <div class="palette-icon">${palette.icon}</div>
        <div class="palette-preview" style="background: ${gradient}"></div>
        <div class="palette-name">${palette.name}</div>
      `;
      
      btn.addEventListener('click', () => {
        // Remove active from all
        grid.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
        // Add active to this one
        btn.classList.add('active');
        this.selectedPalette = palette.id;
        
        // Apply immediately
        this.applySettings();
      });
      
      grid.appendChild(btn);
    });
  }

  populateColors() {
    const grid = document.getElementById('colorGrid');
    grid.innerHTML = '';
    
    this.solidColors.forEach(colorPreset => {
      const btn = document.createElement('button');
      btn.className = 'color-btn';
      btn.style.setProperty('--color', colorPreset.color);
      
      btn.innerHTML = `
        <div class="color-swatch" style="background-color: ${colorPreset.color}"></div>
        <div class="color-name">${colorPreset.name}</div>
      `;
      
      btn.addEventListener('click', () => {
        // Remove active from all
        grid.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        // Add active to this one
        btn.classList.add('active');
        this.selectedColor = colorPreset.color;
        
        // Apply color immediately
        this.applyColorSettings();
      });
      
      grid.appendChild(btn);
    });
  }

  updateSectionVisibility() {
    const isSolid = this.selectedEffect === 0;
    
    // Show/hide sections based on whether solid is selected
    document.getElementById('solidColorSection').style.display = isSolid ? 'block' : 'none';
    document.getElementById('paletteSection').style.display = isSolid ? 'none' : 'block';
    document.getElementById('controlsSection').style.display = isSolid ? 'none' : 'block';
  }

  createGradient(colors) {
    if (!colors || colors.length === 0) {
      return '#888888';
    }
    if (colors.length === 1) {
      return colors[0];
    }
    return `linear-gradient(90deg, ${colors.join(', ')})`;
  }

  async applySettings() {
    if (!this.selectedFeature) {
      this.showToast('❌ No feature selected');
      return;
    }

    const props = {
      sx: this.speed,
      ix: this.intensity
    };

    if (this.selectedEffect !== null) {
      props.fx = this.selectedEffect;
    }

    if (this.selectedPalette !== null) {
      props.pal = this.selectedPalette;
    }

    // Update pumpkin visualization immediately before API call
    if (this.selectedPalette !== null) {
      const palette = this.config.palettes.palettes.find(p => p.id === this.selectedPalette);
      if (palette && palette.colors) {
        this.updatePumpkinVisualization(this.selectedFeature, palette.colors);
      }
    }

    try {
      await api.setFeature(this.selectedFeature, props);
      this.showToast('✓ Applied!');
      // Don't close modal - let user continue selecting
    } catch (error) {
      console.error('Failed to apply settings:', error);
      this.showToast('❌ Failed to apply');
    }
  }

  async applyColorSettings() {
    if (!this.selectedFeature) {
      this.showToast('❌ No feature selected');
      return;
    }

    if (!this.selectedColor) {
      this.showToast('❌ No color selected');
      return;
    }

    // Update pumpkin visualization immediately before API call
    this.updatePumpkinVisualization(this.selectedFeature, [this.selectedColor]);

    try {
      // Set solid effect with color
      await api.setFeature(this.selectedFeature, {
        fx: 0, // Solid effect
        col: [this.selectedColor]
      });
      
      this.showToast('✓ Color applied!');
    } catch (error) {
      console.error('Failed to apply color:', error);
      this.showToast('❌ Failed to apply color');
    }
  }

  async resetToPreset(silent = false) {
    try {
      if (!silent) {
        this.showToast('🔄 Resetting to preset 1...');
      }
      await api.loadPreset(1);
      
      // Clear pumpkin visualizations
      this.clearPumpkinVisualization();
      
      if (!silent) {
        this.showToast('✓ Reset complete!');
      }
    } catch (error) {
      console.error('Failed to reset:', error);
      if (!silent) {
        this.showToast('❌ Failed to reset');
      }
    }
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  setupScreensaver() {
    const screensaver = document.getElementById('screensaver');
    
    // Click/tap anywhere on screensaver to dismiss
    screensaver.addEventListener('click', () => {
      this.hideScreensaver();
    });
    
    // Track user activity to reset inactivity timer
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        if (!this.screensaverActive) {
          this.resetInactivityTimer();
        }
      });
    });
    
    // Setup bouncing pumpkins
    this.setupBouncingPumpkins();
  }

  setupBouncingPumpkins() {
    const container = document.getElementById('screensaverBouncingBg');
    const pumpkinCount = 50;
    this.bouncingPumpkins = [];
    
    // Create 50 bouncing pumpkins
    for (let i = 0; i < pumpkinCount; i++) {
      const pumpkin = document.createElement('div');
      pumpkin.className = 'bouncing-pumpkin-bg';
      pumpkin.textContent = '🎃';
      container.appendChild(pumpkin);
      
      // Random starting position and velocity
      const pumpkinData = {
        element: pumpkin,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 2, // velocity between -1 and 1
        vy: (Math.random() - 0.5) * 2,
        size: 1.5 + Math.random() * 2, // size between 1.5rem and 3.5rem
      };
      
      // Set initial size
      pumpkin.style.fontSize = `${pumpkinData.size}rem`;
      
      this.bouncingPumpkins.push(pumpkinData);
    }
    
    // Start animation
    this.animateBouncingPumpkins();
  }

  animateBouncingPumpkins() {
    if (!this.screensaverActive || !this.bouncingPumpkins || this.bouncingPumpkins.length === 0) {
      return;
    }
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.bouncingPumpkins.forEach(pumpkin => {
      // Update position
      pumpkin.x += pumpkin.vx;
      pumpkin.y += pumpkin.vy;
      
      // Bounce off edges
      if (pumpkin.x <= 0 || pumpkin.x >= width - 50) {
        pumpkin.vx *= -1;
        pumpkin.x = Math.max(0, Math.min(width - 50, pumpkin.x));
      }
      
      if (pumpkin.y <= 0 || pumpkin.y >= height - 50) {
        pumpkin.vy *= -1;
        pumpkin.y = Math.max(0, Math.min(height - 50, pumpkin.y));
      }
      
      // Apply position
      pumpkin.element.style.transform = `translate(${pumpkin.x}px, ${pumpkin.y}px)`;
    });
    
    // Continue animation
    requestAnimationFrame(() => this.animateBouncingPumpkins());
  }

  showScreensaver() {
    const screensaver = document.getElementById('screensaver');
    screensaver.classList.remove('hidden');
    this.screensaverActive = true;
    
    // Clear pumpkin visualizations
    this.clearPumpkinVisualization();
    
    // Reset the pumpkin (silently, no toasts)
    this.resetToPreset(true);
    
    // Start bouncing animation
    this.animateBouncingPumpkins();
    
    // Clear any inactivity timer
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
  }

  hideScreensaver() {
    const screensaver = document.getElementById('screensaver');
    screensaver.classList.add('hidden');
    this.screensaverActive = false;
    
    // Start the inactivity timer
    this.resetInactivityTimer();
  }

  resetInactivityTimer() {
    // Clear existing timer
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    
    // Set new timer
    this.inactivityTimeout = setTimeout(() => {
      this.showScreensaver();
    }, this.inactivityDelay);
  }

  updatePumpkinVisualization(featureName, colors) {
    console.log('Updating visualization for:', featureName, 'with colors:', colors);
    
    // Get the feature config to find which segments it affects
    const feature = this.config.features[featureName];
    if (!feature) {
      console.warn('Feature not found in config:', featureName);
      return;
    }
    
    const svg = document.querySelector('.pumpkin-svg');
    
    // Determine which SVG elements to highlight
    let svgFeaturesToHighlight = [];
    
    // First, try to find the feature directly in the SVG
    let directElement = svg.querySelector(`[data-feature="${featureName}"]`);
    if (directElement) {
      // Direct match - this feature has its own SVG element
      svgFeaturesToHighlight.push(featureName);
    } else {
      // No direct match - need to find which multi-segment features contain this feature's segment(s)
      const featureSegments = new Set();
      
      if (feature.multiSegment && feature.targets) {
        // This is a multi-segment feature
        feature.targets.forEach(t => {
          const key = `${t.controller}:${t.segment}`;
          featureSegments.add(key);
        });
      } else if (feature.segment !== undefined && feature.controller) {
        // Single segment feature
        const key = `${feature.controller}:${feature.segment}`;
        featureSegments.add(key);
      }
      
      // Find all features that have SVG elements and check if they match
      Object.entries(this.config.features).forEach(([svgFeatureName, svgFeatureConfig]) => {
        const svgElement = svg.querySelector(`[data-feature="${svgFeatureName}"]`);
        if (!svgElement) return; // Skip if no SVG element exists
        
        // Check if this SVG feature contains any of our segments
        if (svgFeatureConfig.multiSegment && svgFeatureConfig.targets) {
          const containsSegment = svgFeatureConfig.targets.some(t => {
            const key = `${t.controller}:${t.segment}`;
            return featureSegments.has(key);
          });
          if (containsSegment) {
            svgFeaturesToHighlight.push(svgFeatureName);
          }
        } else if (svgFeatureConfig.segment !== undefined && svgFeatureConfig.controller) {
          const key = `${svgFeatureConfig.controller}:${svgFeatureConfig.segment}`;
          if (featureSegments.has(key)) {
            svgFeaturesToHighlight.push(svgFeatureName);
          }
        }
      });
    }
    
    console.log('SVG features to highlight:', svgFeaturesToHighlight);
    
    // Update visualization for each SVG element
    svgFeaturesToHighlight.forEach(elementFeature => {
      const element = svg.querySelector(`[data-feature="${elementFeature}"]`);
      if (!element) {
        console.warn('Element not found for feature:', elementFeature);
        return;
      }
      
      console.log('Found element:', element, 'for feature:', elementFeature);
      
      // Store that this feature is active
      this.activeFeatures[elementFeature] = colors;
      
      // Create or update gradient for this element
      const gradientId = `gradient-${elementFeature}`;
      let gradient = document.getElementById(gradientId);
      const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), svg.firstChild);
      
      if (!gradient) {
        // Create new gradient
        gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.id = gradientId;
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');
        defs.appendChild(gradient);
      } else {
        // Clear existing gradient content to update it
        while (gradient.firstChild) {
          gradient.removeChild(gradient.firstChild);
        }
      }
      
      // Add/update color stops
      for (let i = 0; i < 3; i++) {
        const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop.setAttribute('offset', `${(i * 50)}%`);
        stop.setAttribute('stop-color', colors[i % colors.length]);
        
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'stop-color');
        animate.setAttribute('dur', '3s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        const colorIndex = i % colors.length;
        const nextColorIndex = (i + 1) % colors.length;
        animate.setAttribute('values', `${colors[colorIndex]};${colors[nextColorIndex]};${colors[colorIndex]}`);
        
        stop.appendChild(animate);
        gradient.appendChild(stop);
      }
      
      // Add rotation animation
      const animateTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
      animateTransform.setAttribute('attributeName', 'gradientTransform');
      animateTransform.setAttribute('type', 'rotate');
      animateTransform.setAttribute('from', '0 0.5 0.5');
      animateTransform.setAttribute('to', '360 0.5 0.5');
      animateTransform.setAttribute('dur', '6s');
      animateTransform.setAttribute('repeatCount', 'indefinite');
      gradient.appendChild(animateTransform);
      
      // Apply gradient based on element type
      if (element.classList.contains('inner-fill') || element.classList.contains('feature-cutout')) {
        element.style.fill = `url(#${gradientId})`;
        // For feature cutouts, also apply the gradient to the stroke for a cohesive look
        if (element.classList.contains('feature-cutout')) {
          element.style.stroke = `url(#${gradientId})`;
        }
        console.log('Applied fill gradient to:', elementFeature);
      } else if (element.classList.contains('outer-shell-left') || element.classList.contains('outer-shell-right') || element.classList.contains('pumpkin-shell')) {
        element.style.stroke = `url(#${gradientId})`;
        console.log('Applied stroke gradient to:', elementFeature);
      }
      
      // Add active class for additional styling
      element.classList.add('feature-active');
    });
  }

  clearPumpkinVisualization() {
    // Clear all active features
    const svg = document.querySelector('.pumpkin-svg');
    Object.keys(this.activeFeatures).forEach(featureName => {
      const element = svg.querySelector(`[data-feature="${featureName}"]`);
      if (element) {
        element.classList.remove('feature-active');
        element.style.fill = '';
        element.style.stroke = '';
      }
    });
    
    this.activeFeatures = {};
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PumpkinPainter();
  app.init();
  
  // Make available for debugging
  window.app = app;
});

