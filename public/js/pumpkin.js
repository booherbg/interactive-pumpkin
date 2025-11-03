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

// Convert hex color to RGB array
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

class PumpkinPainter {
  constructor() {
    this.config = null;
    this.selectedFeature = null;
    this.selectedEffect = null;
    this.selectedPalette = null;
    this.selectedColor = null;
    this.customColor1 = '#FF6600'; // Default color 1
    this.customColor2 = '#0000FF'; // Default color 2
    this.customColorsInitialized = false; // Track if user has selected both colors
    this.speed = 128;
    this.intensity = 128;
    
    // Screensaver settings
    this.inactivityTimeout = null;
    this.inactivityDelay = 10000; // screen saver activation delay
    this.resetTimeout = null;
    this.resetDelay = 5000; // how long after screensaver activates before user can tap to reset
    // Idle cycle timers
    this.idleStartTimeout = null; // start idle behavior after 30s
    this.idleInterval = null; // repeat every 60s
    this.idleStartDelay = 10000; // after screensaver activates, how long before idle routine starts
    this.idleRepeatMs = 60000; // how often to repeat the idle routine
    this.screensaverActive = true; // Start with screensaver active
    this.shouldResetOnNextTap = false; // Flag to track if we should reset on next tap
    this.bouncingPumpkins = [];
    
    // Performance/low-power mode detection (older iPads, reduced motion)
    this.lowPowerMode = false;
    try {
      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const fewCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2;
      const lowDpr = typeof window.devicePixelRatio === 'number' && window.devicePixelRatio <= 1;
      this.lowPowerMode = Boolean(prefersReduced || (fewCores && lowDpr));
    } catch (e) {
      this.lowPowerMode = false;
    }
    // Disable animated gradients on iPad/iOS for responsiveness
    const ua = (navigator && navigator.userAgent) ? navigator.userAgent : '';
    const isIOSiPad = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    this.disableGradientAnimation = !!isIOSiPad;
    this.frameSkip = this.lowPowerMode ? 2 : 0; // skip updates to reduce CPU (every N frames)
    this._frameTick = 0;
    
    // Track active feature visualizations
    this.activeFeatures = {};
    
    // Define solid color presets
    this.solidColors = [
      { name: 'Red', color: '#FF0000', icon: '🔴' },
      { name: 'Orange', color: '#FF6600', icon: '🟠' },
      { name: 'Yellow', color: '#FFCC00', icon: '🟡' },
      { name: 'Lime', color: '#00FF00', icon: '🟢' },
      { name: 'Green', color: '#008000', icon: '💚' },
      { name: 'Cyan', color: '#0099FF', icon: '🔵' },
      { name: 'Blue', color: '#0000FF', icon: '🔵' },
      { name: 'Magenta', color: '#CC00CC', icon: '💜' },
      { name: 'Pink', color: '#FF1493', icon: '💗' },
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
      
      // If screensaver starts visible, kick off idle timers now
      const screensaverEl = document.getElementById('screensaver');
      const isVisible = screensaverEl && !screensaverEl.classList.contains('hidden');
      if (this.screensaverActive && isVisible) {
        this.startIdleTimers();
      }
      
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

    // Random effect button
    document.getElementById('randomEffectBtn').addEventListener('click', () => {
      this.selectRandomEffect();
    });

    // Random palette button
    document.getElementById('randomPaletteBtn').addEventListener('click', () => {
      this.selectRandomPalette();
    });
  }

  openModal(feature, label) {
    this.selectedFeature = feature;
    
    // Set solid effect as default
    this.selectedEffect = 0;
    this.selectedPalette = null;
    this.selectedColor = null;
    this.customColorsInitialized = false; // Reset when opening modal
    
    // Reset sliders to center values when opening modal
    this.resetSlidersToCenter();
    
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
    const container = document.getElementById('effectCategories');
    container.innerHTML = '';
    
    // Filter effects where show is not false (default to true if not specified)
    const visibleEffects = this.config.effects.effects.filter(effect => effect.show !== false);
    
    // Group effects by category
    const effectsByCategory = {};
    visibleEffects.forEach(effect => {
      const category = effect.category || 'other';
      if (!effectsByCategory[category]) {
        effectsByCategory[category] = [];
      }
      effectsByCategory[category].push(effect);
    });
    
    // Create category sections
    Object.keys(effectsByCategory).forEach(categoryKey => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'effect-category';
      
      const categoryTitle = document.createElement('div');
      categoryTitle.className = 'effect-category-title';
      categoryTitle.textContent = this.config.effects.categories[categoryKey] || 'Other';
      categoryDiv.appendChild(categoryTitle);
      
      const grid = document.createElement('div');
      grid.className = 'effect-grid';
      
      effectsByCategory[categoryKey].forEach(effect => {
        const btn = document.createElement('button');
        btn.className = 'effect-btn';
        btn.dataset.effectId = effect.id;
        
        // Mark solid effect (id=0) as active by default
        if (effect.id === 0) {
          btn.classList.add('active');
        }
        
        btn.innerHTML = `
          <div class="effect-name">${effect.name}</div>
        `;
        
        btn.addEventListener('click', () => {
          // Remove active from all effect buttons
          container.querySelectorAll('.effect-btn').forEach(b => b.classList.remove('active'));
          // Add active to this one
          btn.classList.add('active');
          this.selectedEffect = effect.id;
          
          // Reset sliders to center values when selecting a new effect
          this.resetSlidersToCenter();
          
          // If no palette is selected yet, default to Random Cycle
          if (this.selectedPalette === null) {
            this.selectedPalette = 1; // Random Cycle
            this.updatePaletteSelection();
          }
          
          // Update section visibility
          this.updateSectionVisibility();
          
          // If solid effect, don't apply until color is selected
          if (effect.id !== 0) {
            this.applySettings();
          }
        });
        
        grid.appendChild(btn);
      });
      
      categoryDiv.appendChild(grid);
      container.appendChild(categoryDiv);
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
        
        // Update section visibility (to show/hide custom colors)
        this.updateSectionVisibility();
        
        // Apply immediately (unless it's Colors 1&2 or Color Gradient, which need custom colors first)
        if (palette.id !== 3 && palette.id !== 4) {
          this.applySettings();
        }
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
        
        // Set to solid effect and clear palette selection
        this.selectedEffect = 0;
        this.selectedPalette = null;
        
        // Clear palette selection
        document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
        
        // Mark Solid effect as active
        document.querySelectorAll('.effect-btn').forEach(effectBtn => {
          const effectId = parseInt(effectBtn.dataset.effectId);
          if (effectId === 0) {
            effectBtn.classList.add('active');
          } else {
            effectBtn.classList.remove('active');
          }
        });
        
        // Apply the solid color
        this.applyColorSettings();
      });
      
      grid.appendChild(btn);
    });
    
    // Populate custom color grids
    this.populateCustomColors();
  }
  
  populateCustomColors() {
    // Populate color 1 grid
    const grid1 = document.getElementById('customColor1Grid');
    grid1.innerHTML = '';
    
    let color1Selected = false;
    let color2Selected = false;
    
    this.solidColors.forEach(colorPreset => {
      const btn = document.createElement('button');
      btn.className = 'color-btn';
      btn.style.setProperty('--color', colorPreset.color);
      
      btn.innerHTML = `
        <div class="color-swatch" style="background-color: ${colorPreset.color}"></div>
        <div class="color-name">${colorPreset.name}</div>
      `;
      
      // Mark as active if it matches current customColor1
      if (colorPreset.color === this.customColor1) {
        btn.classList.add('active');
        color1Selected = true;
      }
      
      btn.addEventListener('click', () => {
        // Remove active from all in this grid
        grid1.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        // Add active to this one
        btn.classList.add('active');
        this.customColor1 = colorPreset.color;
        
        // If both colors have been selected, apply automatically
        if (this.customColorsInitialized) {
          this.applySettings();
        }
      });
      
      grid1.appendChild(btn);
    });
    
    // Populate color 2 grid
    const grid2 = document.getElementById('customColor2Grid');
    grid2.innerHTML = '';
    
    this.solidColors.forEach(colorPreset => {
      const btn = document.createElement('button');
      btn.className = 'color-btn';
      btn.style.setProperty('--color', colorPreset.color);
      
      btn.innerHTML = `
        <div class="color-swatch" style="background-color: ${colorPreset.color}"></div>
        <div class="color-name">${colorPreset.name}</div>
      `;
      
      // Mark as active if it matches current customColor2
      if (colorPreset.color === this.customColor2) {
        btn.classList.add('active');
        color2Selected = true;
      }
      
      btn.addEventListener('click', () => {
        // Remove active from all in this grid
        grid2.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
        // Add active to this one
        btn.classList.add('active');
        this.customColor2 = colorPreset.color;
        
        // Mark as initialized and apply
        this.customColorsInitialized = true;
        this.applySettings();
      });
      
      grid2.appendChild(btn);
    });
    
    // If both colors were already selected (from defaults), mark as initialized
    if (color1Selected && color2Selected) {
      this.customColorsInitialized = true;
    }
  }

  updateSectionVisibility() {
    const isSolid = this.selectedEffect === 0;
    const isCustomColors = this.selectedPalette === 3 || this.selectedPalette === 4; // Colors 1&2 or Color Gradient
    
    // Show/hide sections based on whether solid is selected
    document.getElementById('solidColorSection').style.display = isSolid ? 'block' : 'none';
    document.getElementById('paletteSection').style.display = isSolid ? 'none' : 'block';
    document.getElementById('controlsSection').style.display = isSolid ? 'none' : 'block';
    document.getElementById('customColorsSection').style.display = isCustomColors ? 'block' : 'none';
  }

  resetSlidersToCenter() {
    // Reset speed and intensity to center values (128)
    this.speed = 128;
    this.intensity = 128;
    
    // Update slider elements
    const speedSlider = document.getElementById('speedSlider');
    const intensitySlider = document.getElementById('intensitySlider');
    const speedValue = document.getElementById('speedValue');
    const intensityValue = document.getElementById('intensityValue');
    
    if (speedSlider && speedValue) {
      speedSlider.value = 128;
      speedValue.textContent = '128';
    }
    
    if (intensitySlider && intensityValue) {
      intensitySlider.value = 128;
      intensityValue.textContent = '128';
    }
  }

  updatePaletteSelection() {
    // Update palette button active states
    document.querySelectorAll('.palette-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Mark Random Cycle as active
    const paletteButtons = document.querySelectorAll('.palette-btn');
    paletteButtons.forEach(btn => {
      const paletteName = btn.querySelector('.palette-name').textContent;
      if (paletteName === 'Random Cycle') {
        btn.classList.add('active');
      }
    });
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
      
      // If palette is "Colors 1&2" (id 3) or "Color Gradient" (id 4), send custom colors
      if (this.selectedPalette === 3 || this.selectedPalette === 4) {
        const rgb1 = hexToRgb(this.customColor1);
        const rgb2 = hexToRgb(this.customColor2);
        if (rgb1 && rgb2) {
          props.col = [rgb1, rgb2];
        }
      }
    }

    // Update pumpkin visualization immediately before API call
    if (this.selectedPalette !== null) {
      const palette = this.config.palettes.palettes.find(p => p.id === this.selectedPalette);
      if (palette && palette.colors) {
        // For Colors 1&2 or Color Gradient, use the custom colors for visualization
        if (this.selectedPalette === 3 || this.selectedPalette === 4) {
          this.updatePumpkinVisualization(this.selectedFeature, [this.customColor1, this.customColor2]);
        } else {
          this.updatePumpkinVisualization(this.selectedFeature, palette.colors);
        }
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
      // Convert hex color to RGB array for WLED
      const rgb = hexToRgb(this.selectedColor);
      if (!rgb) {
        this.showToast('❌ Invalid color');
        return;
      }

      // Set solid effect with color
      await api.setFeature(this.selectedFeature, {
        fx: 0, // Solid effect
        col: [rgb] // WLED expects array of RGB arrays
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
        this.showToast('🔄 Resetting to solid orange...');
      }
      
      // Soft orange color (softer than #FF6600)
      const softOrange = '#FF8800'; // Soft orange color
      const rgb = hexToRgb(softOrange);
      
      if (!rgb) {
        throw new Error('Invalid color');
      }
      
      // Update pumpkin visualization immediately before API call
      this.updatePumpkinVisualization('wholePumpkin', [softOrange]);
      
      // Explicitly ensure face cutouts remain dark (they should be filtered out, but double-check)
      const svg = document.querySelector('.pumpkin-svg');
      const faceCutoutFeatures = ['leftEye', 'rightEye', 'nose', 'allMouth'];
      faceCutoutFeatures.forEach(featureName => {
        const element = svg.querySelector(`[data-feature="${featureName}"]`);
        if (element) {
          element.style.fill = '#000000';
          element.style.stroke = '#1a0000';
          element.style.strokeWidth = '5px';
        }
      });
      
      // Apply solid color effect (fx: 0) with soft orange to whole pumpkin
      await api.setFeature('wholePumpkin', {
        fx: 0, // Solid effect
        col: [rgb] // WLED expects array of RGB arrays
      });

      // Re-center sliders to default values to match reset state
      this.speed = 128;
      this.intensity = 128;
      const speedSlider = document.getElementById('speedSlider');
      const intensitySlider = document.getElementById('intensitySlider');
      const speedValue = document.getElementById('speedValue');
      const intensityValue = document.getElementById('intensityValue');
      if (speedSlider) speedSlider.value = 128;
      if (speedValue) speedValue.textContent = '128';
      if (intensitySlider) intensitySlider.value = 128;
      if (intensityValue) intensityValue.textContent = '128';
      
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
      // If we should reset, do it before hiding screensaver
      if (this.shouldResetOnNextTap) {
        this.clearPumpkinVisualization();
        this.resetToPreset(true);
        this.shouldResetOnNextTap = false;
      }
      
      this.hideScreensaver();
      this.resetInactivityTimer();
    });
    
    // Track user activity to reset inactivity timer (but NOT reset timer)
    const activityEvents = ['mousedown', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, (e) => {
        // Only reset inactivity if not clicking on screensaver
        if (!this.screensaverActive && !e.target.closest('#screensaver')) {
          this.resetInactivityTimer();
        }
      });
    });
    
    // Setup bouncing pumpkins
    this.setupBouncingPumpkins();
  }

  setupBouncingPumpkins() {
    const container = document.getElementById('screensaverBouncingBg');
    const pumpkinCount = this.lowPowerMode ? 12 : 50;
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
        vx: (Math.random() - 0.5) * (this.lowPowerMode ? 1 : 2),
        vy: (Math.random() - 0.5) * (this.lowPowerMode ? 1 : 2),
        size: (this.lowPowerMode ? 1.5 : 2) + Math.random() * (this.lowPowerMode ? 1.2 : 2.0)
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
    // Throttle updates in low-power mode
    if (this.frameSkip && (this._frameTick++ % (this.frameSkip + 1) !== 0)) {
      requestAnimationFrame(() => this.animateBouncingPumpkins());
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
    // Ensure control modal is closed when entering screensaver so new session starts clean
    const modal = document.getElementById('controlModal');
    if (modal && modal.classList.contains('show')) {
      modal.classList.remove('show');
      this.selectedFeature = null;
    }
    
    // DON'T clear pumpkin visualizations - keep the current effect
    // DON'T reset to preset yet
    
    // Start bouncing animation
    this.animateBouncingPumpkins();
    
    // Clear any inactivity timer
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
    
    // Start timer - after 10 seconds, mark that we should reset on next tap
    this.resetTimeout = setTimeout(() => {
      this.shouldResetOnNextTap = true;
    }, this.resetDelay);
    
    // Schedule idle behavior start after 30s, then repeat every 60s while screensaver stays active
    this.startIdleTimers();
  }

  hideScreensaver() {
    const screensaver = document.getElementById('screensaver');
    screensaver.classList.add('hidden');
    this.screensaverActive = false;
    
    // Clear the reset timer since user is active (tapped within 10 seconds)
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
    
    // Clear idle timers
    this.clearIdleTimers();
    
    // Reset the flag since they tapped within the window
    this.shouldResetOnNextTap = false;
    
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

  // ----- Idle behavior helpers -----
  getEffectNameById(id) {
    const e = this.config.effects.effects.find(x => x.id === id);
    return e ? `${e.name} (#${e.id})` : `#${id}`;
  }

  getPaletteNameById(id) {
    const p = this.config.palettes.palettes.find(x => x.id === id);
    return p ? `${p.name} (#${p.id})` : `#${id}`;
  }

  startIdleTimers() {
    if (this.idleStartTimeout) clearTimeout(this.idleStartTimeout);
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
    this.idleStartTimeout = setTimeout(() => {
      this.runIdleCycle();
      this.idleInterval = setInterval(() => {
        this.runIdleCycle();
      }, this.idleRepeatMs);
    }, this.idleStartDelay);
  }

  clearIdleTimers() {
    if (this.idleStartTimeout) {
      clearTimeout(this.idleStartTimeout);
      this.idleStartTimeout = null;
    }
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
  }

  getVisibleEffectsForIdle() {
    // Use only effects visible in UI and exclude Solid (id 0) for variety
    return this.config.effects.effects.filter(e => e.show !== false && e.id !== 0);
  }

  getVisiblePalettesForIdle() {
    // Use only palettes visible in UI, exclude those requiring extra custom colors
    // Exclude: Single Color (2), Two Colors (3), 2-Color Gradient (4)
    const excluded = new Set([2, 3, 4]);
    return this.config.palettes.palettes.filter(p => p.show !== false && !excluded.has(p.id));
  }

  pickRandomEffect() {
    const effects = this.getVisibleEffectsForIdle();
    if (effects.length === 0) return null;
    return effects[Math.floor(Math.random() * effects.length)];
  }

  pickRandomPalette(excludeIds = []) {
    const excludeSet = new Set(excludeIds);
    const palettes = this.getVisiblePalettesForIdle().filter(p => !excludeSet.has(p.id));
    if (palettes.length === 0) return null;
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  async applyEffectPalette(featureName, effectId, paletteId) {
    const props = {
      fx: effectId,
      pal: paletteId,
      sx: this.speed,
      ix: this.intensity
    };
    try {
      await api.setFeature(featureName, props);
    } catch (error) {
      console.error(`Failed to set feature ${featureName}:`, error);
    }
  }

  async runIdleCycle() {
    if (!this.screensaverActive) return;
    console.log('[Idle] Running idle cycle');

    // Pick random speed/intensity for this idle tick and reflect in UI
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    this.speed = rand(0, 255);
    this.intensity = rand(0, 255);
    const speedSlider = document.getElementById('speedSlider');
    const intensitySlider = document.getElementById('intensitySlider');
    const speedValue = document.getElementById('speedValue');
    const intensityValue = document.getElementById('intensityValue');
    if (speedSlider) speedSlider.value = this.speed;
    if (speedValue) speedValue.textContent = String(this.speed);
    if (intensitySlider) intensitySlider.value = this.intensity;
    if (intensityValue) intensityValue.textContent = String(this.intensity);
    console.log('[Idle] Params:', { speed: this.speed, intensity: this.intensity });

    // 50% whole pumpkin with random effect + Random Cycle palette
    // 25% split: face has E1+P1, filler E2+P2, shell+rim E3+P3
    // 25% same effect everywhere but each region gets its own random palette
    const roll = Math.random();
    const effectsPool = this.getVisibleEffectsForIdle();
    const palettesPool = this.getVisiblePalettesForIdle();
    if (effectsPool.length === 0 || palettesPool.length === 0) {
      return;
    }

    if (roll < 0.5) {
      // Whole pumpkin
      const fx = this.pickRandomEffect();
      const randomCyclePaletteId = 1; // "Random Cycle"
      if (fx) {
        await this.applyEffectPalette('wholePumpkin', fx.id, randomCyclePaletteId);
        console.log('[Idle] Mode: WHOLE', {
          effect: this.getEffectNameById(fx.id),
          palette: this.getPaletteNameById(randomCyclePaletteId)
        });
      }
      return;
    }

    if (roll < 0.75) {
      // Three groups
      const fx1 = this.pickRandomEffect();
      const p1 = this.pickRandomPalette();
      const usedP1 = p1 ? [p1.id] : [];
      const fx2 = this.pickRandomEffect();
      const p2 = this.pickRandomPalette(usedP1);
      const usedP12 = p2 ? [...usedP1, p2.id] : usedP1;
      const fx3 = this.pickRandomEffect();
      const p3 = this.pickRandomPalette(usedP12);
      if (fx1 && p1) {
        await Promise.all([
          this.applyEffectPalette('bothEyes', fx1.id, p1.id),
          this.applyEffectPalette('nose', fx1.id, p1.id),
          this.applyEffectPalette('mouth', fx1.id, p1.id)
        ]);
      }
      if (fx2 && p2) {
        await this.applyEffectPalette('innerFiller', fx2.id, p2.id);
      }
      if (fx3 && p3) {
        await Promise.all([
          this.applyEffectPalette('pumpkinShell', fx3.id, p3.id),
          this.applyEffectPalette('bothRims', fx3.id, p3.id)
        ]);
      }
      console.log('[Idle] Mode: GROUPED', {
        face: fx1 && p1 ? { effect: this.getEffectNameById(fx1.id), palette: this.getPaletteNameById(p1.id) } : 'skipped',
        filler: fx2 && p2 ? { effect: this.getEffectNameById(fx2.id), palette: this.getPaletteNameById(p2.id) } : 'skipped',
        shellAndRims: fx3 && p3 ? { effect: this.getEffectNameById(fx3.id), palette: this.getPaletteNameById(p3.id) } : 'skipped'
      });
      return;
    }

    // Same effect, different palettes per region
    const fx = this.pickRandomEffect();
    if (!fx) return;
    const pEyes = this.pickRandomPalette();
    const used1 = pEyes ? [pEyes.id] : [];
    const pNose = this.pickRandomPalette(used1);
    const used2 = pNose ? [...used1, pNose.id] : used1;
    const pMouth = this.pickRandomPalette(used2);
    const used3 = pMouth ? [...used2, pMouth.id] : used2;
    const pFill = this.pickRandomPalette(used3);
    const used4 = pFill ? [...used3, pFill.id] : used3;
    const pShell = this.pickRandomPalette(used4);
    const used5 = pShell ? [...used4, pShell.id] : used4;
    const pRims = this.pickRandomPalette(used5);

    await Promise.all([
      pEyes && this.applyEffectPalette('bothEyes', fx.id, pEyes.id),
      pNose && this.applyEffectPalette('nose', fx.id, pNose.id),
      pMouth && this.applyEffectPalette('mouth', fx.id, pMouth.id),
      pFill && this.applyEffectPalette('innerFiller', fx.id, pFill.id),
      pShell && this.applyEffectPalette('pumpkinShell', fx.id, pShell.id),
      pRims && this.applyEffectPalette('bothRims', fx.id, pRims.id)
    ].filter(Boolean));

    console.log('[Idle] Mode: SAME_EFFECT_MULTI_PALETTE', {
      effect: this.getEffectNameById(fx.id),
      palettes: {
        eyes: pEyes ? this.getPaletteNameById(pEyes.id) : 'skipped',
        nose: pNose ? this.getPaletteNameById(pNose.id) : 'skipped',
        mouth: pMouth ? this.getPaletteNameById(pMouth.id) : 'skipped',
        filler: pFill ? this.getPaletteNameById(pFill.id) : 'skipped',
        shell: pShell ? this.getPaletteNameById(pShell.id) : 'skipped',
        rims: pRims ? this.getPaletteNameById(pRims.id) : 'skipped'
      }
    });
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
      // Use querySelectorAll to get all elements with this feature (e.g., both rim paths)
      const elements = svg.querySelectorAll(`[data-feature="${elementFeature}"]`);
      if (!elements || elements.length === 0) {
        console.warn('Elements not found for feature:', elementFeature);
        return;
      }
      
      console.log('Found', elements.length, 'element(s) for feature:', elementFeature);
      
      // Store that this feature is active
      this.activeFeatures[elementFeature] = colors;
      
      // Create or update gradient for this feature (shared across all matching elements)
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
      
      // Add/update color stops (disable animation on iPad or in low-power mode)
      const shouldAnimateGradient = !this.disableGradientAnimation && !this.lowPowerMode;
      const stopAnimDur = this.lowPowerMode ? '10s' : '6s';
      for (let i = 0; i < 3; i++) {
        const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop.setAttribute('offset', `${(i * 50)}%`);
        stop.setAttribute('stop-color', colors[i % colors.length]);
        
        if (shouldAnimateGradient) {
          const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
          animate.setAttribute('attributeName', 'stop-color');
          animate.setAttribute('dur', stopAnimDur);
          animate.setAttribute('repeatCount', 'indefinite');
          const colorIndex = i % colors.length;
          const nextColorIndex = (i + 1) % colors.length;
          animate.setAttribute('values', `${colors[colorIndex]};${colors[nextColorIndex]};${colors[colorIndex]}`);
          stop.appendChild(animate);
        }
        gradient.appendChild(stop);
      }
      
      // Add rotation animation (disable on iPad or in low-power mode)
      if (shouldAnimateGradient) {
        const animateTransform = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animateTransform.setAttribute('attributeName', 'gradientTransform');
        animateTransform.setAttribute('type', 'rotate');
        animateTransform.setAttribute('from', '0 0.5 0.5');
        animateTransform.setAttribute('to', '360 0.5 0.5');
        animateTransform.setAttribute('dur', this.lowPowerMode ? '24s' : '12s');
        animateTransform.setAttribute('repeatCount', 'indefinite');
        gradient.appendChild(animateTransform);
      }
      
      // Apply gradient to all matching elements
      elements.forEach(element => {
        // Apply gradient based on element type
        if (element.classList.contains('feature-cutout')) {
          element.style.fill = `url(#${gradientId})`;
          // For feature cutouts, keep the stroke as dark border (don't apply gradient to stroke)
          element.style.stroke = '#1a0000';
          element.style.strokeWidth = '5px';
          console.log('Applied fill gradient to:', elementFeature);
        } else if (element.classList.contains('inner-fill')) {
          // For inner fill, keep the stroke as dark border (don't apply gradient to stroke)
          element.style.fill = `url(#${gradientId})`;
          element.style.stroke = '#1a0000';
          element.style.strokeWidth = '12px';
          console.log('Applied fill gradient to inner fill with dark border:', elementFeature);
        } else if (element.classList.contains('outer-shell-left') || element.classList.contains('outer-shell-right') || element.classList.contains('pumpkin-shell')) {
          element.style.stroke = `url(#${gradientId})`;
          console.log('Applied stroke gradient to:', elementFeature);
        }
        
        // Add active class for additional styling
        element.classList.add('feature-active');
      });
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
    
    // Explicitly restore face cutouts to dark appearance
    const faceCutoutFeatures = ['leftEye', 'rightEye', 'nose', 'allMouth'];
    faceCutoutFeatures.forEach(featureName => {
      const element = svg.querySelector(`[data-feature="${featureName}"]`);
      if (element) {
        element.style.fill = '#000000';
        element.style.stroke = '#1a0000';
        element.style.strokeWidth = '5px';
      }
    });
    
    this.activeFeatures = {};
  }

  selectRandomEffect() {
    // Get all visible effects (where show is not false)
    const visibleEffects = this.config.effects.effects.filter(effect => effect.show !== false);
    
    if (visibleEffects.length === 0) {
      this.showToast('❌ No effects available');
      return;
    }
    
    // Pick a random effect
    const randomEffect = visibleEffects[Math.floor(Math.random() * visibleEffects.length)];
    
    // Find the corresponding button and click it
    const buttons = document.querySelectorAll('.effect-btn');
    buttons.forEach(btn => {
      const effectId = parseInt(btn.dataset.effectId);
      if (effectId === randomEffect.id) {
        btn.click();
      }
    });
    
    this.showToast(`🎲 Picked: ${randomEffect.name}`);
  }

  selectRandomPalette() {
    // Get all visible palettes (where show is not false)
    const visiblePalettes = this.config.palettes.palettes.filter(palette => palette.show !== false);
    
    if (visiblePalettes.length === 0) {
      this.showToast('❌ No palettes available');
      return;
    }
    
    // Pick a random palette
    const randomPalette = visiblePalettes[Math.floor(Math.random() * visiblePalettes.length)];
    
    // Find the corresponding button and click it
    const buttons = document.querySelectorAll('.palette-btn');
    buttons.forEach(btn => {
      const paletteName = btn.querySelector('.palette-name').textContent;
      if (paletteName === randomPalette.name) {
        btn.click();
      }
    });
    
    this.showToast(`🎨 Picked: ${randomPalette.name}`);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PumpkinPainter();
  app.init();
  
  // Make available for debugging
  window.app = app;
});

