import { api } from './api.js';
import { 
  createFeatureButton, 
  createEffectButton, 
  createPaletteButton,
  createSlider,
  showToast,
  showLoading,
  hideLoading,
  debounce,
  saveState,
  loadState
} from './ui-components.js';

/**
 * Main Application
 */
class PumpkinPainter {
  constructor() {
    this.config = null;
    this.selectedFeature = null;
    this.currentEffect = null;
    this.currentPalette = null;
    this.currentSpeed = 128;
    this.currentIntensity = 128;
    this.featureStates = loadState('featureStates', {});
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      showLoading('Loading configuration...');
      
      // Load configuration
      this.config = await api.getConfig();
      console.log('Configuration loaded:', this.config);
      
      // Build UI
      this.buildUI();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Select first feature by default
      const firstFeature = Object.keys(this.config.features)[0];
      if (firstFeature) {
        this.selectFeature(firstFeature);
      }
      
      hideLoading();
      
    } catch (error) {
      console.error('Failed to initialize:', error);
      hideLoading();
      showToast('Failed to load configuration', 'error');
    }
  }

  /**
   * Build the UI
   */
  buildUI() {
    // Build feature selector
    this.buildFeatureSelector();
    
    // Build effect picker
    this.buildEffectPicker();
    
    // Build palette picker
    this.buildPalettePicker();
    
    // Build controls
    this.buildControls();
    
    // Build controller list
    this.buildControllerList();
  }

  /**
   * Build feature selector
   */
  buildFeatureSelector() {
    const container = document.getElementById('feature-selector');
    if (!container) return;
    
    // Group features by group
    const groups = {};
    for (const [key, feature] of Object.entries(this.config.features)) {
      const group = feature.group || 'other';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push({ key, ...feature });
    }
    
    // Create sections for each group
    for (const [groupName, features] of Object.entries(groups)) {
      const section = document.createElement('div');
      section.className = `feature-group group-${groupName}`;
      
      const title = document.createElement('h3');
      title.className = 'group-title';
      title.textContent = groupName.charAt(0).toUpperCase() + groupName.slice(1);
      section.appendChild(title);
      
      const grid = document.createElement('div');
      grid.className = 'feature-grid';
      
      for (const feature of features) {
        const button = createFeatureButton(feature.key, feature);
        button.addEventListener('click', () => this.selectFeature(feature.key));
        grid.appendChild(button);
        
        // Restore state if available
        if (this.featureStates[feature.key]) {
          const state = this.featureStates[feature.key];
          const effect = this.config.effects.effects.find(e => e.id === state.fx);
          if (effect) {
            button.querySelector('.feature-status').textContent = effect.icon;
          }
        }
      }
      
      section.appendChild(grid);
      container.appendChild(section);
    }
  }

  /**
   * Build effect picker
   */
  buildEffectPicker() {
    const container = document.getElementById('effect-picker');
    if (!container) return;
    
    const grid = document.createElement('div');
    grid.className = 'effect-grid';
    
    // Filter effects where show is not false (default to true if not specified)
    const visibleEffects = this.config.effects.effects.filter(effect => effect.show !== false);
    
    for (const effect of visibleEffects) {
      const button = createEffectButton(effect);
      button.addEventListener('click', () => this.selectEffect(effect.id));
      grid.appendChild(button);
    }
    
    container.appendChild(grid);
  }

  /**
   * Build palette picker
   */
  buildPalettePicker() {
    const container = document.getElementById('palette-picker');
    if (!container) return;
    
    const grid = document.createElement('div');
    grid.className = 'palette-grid';
    
    // Filter palettes where show is not false (default to true if not specified)
    const visiblePalettes = this.config.palettes.palettes.filter(palette => palette.show !== false);
    
    for (const palette of visiblePalettes) {
      const button = createPaletteButton(palette);
      button.addEventListener('click', () => this.selectPalette(palette.id));
      grid.appendChild(button);
    }
    
    container.appendChild(grid);
  }

  /**
   * Build controls (sliders, power, brightness)
   */
  buildControls() {
    // Speed slider
    const speedContainer = document.getElementById('speed-control');
    if (speedContainer) {
      const speedSlider = createSlider(
        'speed-slider',
        'Speed',
        0,
        255,
        this.currentSpeed,
        debounce((value) => this.setSpeed(value), 300)
      );
      speedContainer.appendChild(speedSlider);
    }
    
    // Intensity slider
    const intensityContainer = document.getElementById('intensity-control');
    if (intensityContainer) {
      const intensitySlider = createSlider(
        'intensity-slider',
        'Intensity',
        0,
        255,
        this.currentIntensity,
        debounce((value) => this.setIntensity(value), 300)
      );
      intensityContainer.appendChild(intensitySlider);
    }
    
    // Brightness slider
    const brightnessContainer = document.getElementById('brightness-control');
    if (brightnessContainer) {
      const brightnessSlider = createSlider(
        'brightness-slider',
        'Brightness',
        0,
        255,
        loadState('brightness', 128),
        debounce((value) => this.setBrightness(value), 300)
      );
      brightnessContainer.appendChild(brightnessSlider);
    }
  }

  /**
   * Build controller list
   */
  buildControllerList() {
    const container = document.getElementById('controller-list');
    if (!container) return;

    container.innerHTML = '';

    // Create controller cards
    for (const [key, controller] of Object.entries(this.config.controllers)) {
      const card = document.createElement('div');
      card.className = 'controller-card';
      card.innerHTML = `
        <div class="controller-header">
          <h3 class="controller-name">${controller.name}</h3>
          <span class="controller-status">⚫ Checking...</span>
        </div>
        <div class="controller-info">
          <div><strong>IP:</strong> ${controller.ip}</div>
          <div><strong>Segments:</strong> ${controller.segments}</div>
        </div>
        <button class="controller-details-btn" data-controller="${key}">
          View Details
        </button>
        <div class="controller-details" id="details-${key}" style="display: none;"></div>
      `;

      // Add event listener for details button
      const detailsBtn = card.querySelector('.controller-details-btn');
      detailsBtn.addEventListener('click', () => this.toggleControllerDetails(key));

      container.appendChild(card);
    }

    // Check controller status
    this.checkControllerStatus();
  }

  /**
   * Check status of all controllers
   */
  async checkControllerStatus() {
    try {
      const results = await api.ping();
      
      for (const [key, result] of Object.entries(results)) {
        const statusEl = document.querySelector(
          `.controller-card:has([data-controller="${key}"]) .controller-status`
        );
        
        if (statusEl) {
          if (result.success) {
            statusEl.textContent = '🟢 Online';
            statusEl.style.color = '#4ade80';
          } else {
            statusEl.textContent = '🔴 Offline';
            statusEl.style.color = '#f87171';
          }
        }
      }
    } catch (error) {
      console.error('Error checking controller status:', error);
    }
  }

  /**
   * Toggle controller details panel
   */
  async toggleControllerDetails(controllerKey) {
    const detailsEl = document.getElementById(`details-${controllerKey}`);
    const btn = document.querySelector(`[data-controller="${controllerKey}"]`);
    
    if (!detailsEl || !btn) return;

    if (detailsEl.style.display === 'none') {
      // Show and load details
      btn.textContent = 'Loading...';
      btn.disabled = true;

      try {
        const data = await api.getControllerDetails(controllerKey);
        
        if (data.state.success && data.info.success) {
          const state = data.state.data;
          const info = data.info.data;
          const segments = data.segments || [];
          
          detailsEl.innerHTML = `
            <div class="controller-detail-section">
              <h4>Current State</h4>
              <div class="detail-grid">
                <div><strong>Power:</strong> ${state.on ? '🟢 ON' : '🔴 OFF'}</div>
                <div><strong>Brightness:</strong> ${state.bri}/255</div>
                <div><strong>Transition:</strong> ${state.transition}ms</div>
              </div>
            </div>
            
            <div class="controller-detail-section">
              <h4>Segments (${segments.length})</h4>
              <div class="segment-list">
                ${segments.length > 0 ? segments.map((seg, idx) => 
                  `<div class="segment-item ${seg.on ? 'segment-on' : 'segment-off'}">
                    <div class="segment-header">
                      <strong>Segment ${seg.id}</strong>
                      <span class="segment-status">${seg.on ? '🟢' : '⚫'}</span>
                    </div>
                    <div class="segment-details">
                      <div><strong>Effect:</strong> ${seg.effectName || 'Unknown'} (${seg.fx})</div>
                      <div><strong>Palette:</strong> ${seg.paletteName || 'Unknown'} (${seg.pal})</div>
                      <div><strong>Speed:</strong> ${seg.sx}/255</div>
                      <div><strong>Intensity:</strong> ${seg.ix}/255</div>
                      <div><strong>LEDs:</strong> ${seg.start}-${seg.stop} (${seg.len} LEDs)</div>
                    </div>
                  </div>`
                ).join('') : '<div>No segments configured</div>'}
              </div>
            </div>
            
            <div class="controller-detail-section">
              <h4>Presets</h4>
              <div class="preset-list">
                ${info.presets ? info.presets.map((preset, idx) => 
                  `<div class="preset-item">
                    <strong>${idx + 1}.</strong> ${preset.n || `Preset ${idx + 1}`}
                    ${preset.ql ? `<span class="preset-quickload">Quick Load: ${preset.ql}</span>` : ''}
                  </div>`
                ).join('') : '<div>No presets configured</div>'}
              </div>
            </div>
            
            <div class="controller-detail-section">
              <h4>Device Info</h4>
              <div class="detail-grid">
                <div><strong>Version:</strong> ${info.ver || 'Unknown'}</div>
                <div><strong>LED Count:</strong> ${info.leds?.count || 0}</div>
                <div><strong>Max Segments:</strong> ${info.leds?.seglc || 0}</div>
                <div><strong>WiFi RSSI:</strong> ${info.wifi?.rssi || 'N/A'} dBm</div>
              </div>
            </div>
          `;
          
          detailsEl.style.display = 'block';
          btn.textContent = 'Hide Details';
        } else {
          detailsEl.innerHTML = `
            <div class="error-message">
              Failed to load controller details. Controller may be offline.
            </div>
          `;
          detailsEl.style.display = 'block';
          btn.textContent = 'Retry';
        }
      } catch (error) {
        console.error('Error loading controller details:', error);
        detailsEl.innerHTML = `
          <div class="error-message">
            Error: ${error.message}
          </div>
        `;
        detailsEl.style.display = 'block';
        btn.textContent = 'Retry';
      }
      
      btn.disabled = false;
    } else {
      // Hide details
      detailsEl.style.display = 'none';
      btn.textContent = 'View Details';
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Power button
    const powerBtn = document.getElementById('power-btn');
    if (powerBtn) {
      let isPowerOn = loadState('power', true);
      this.updatePowerButton(isPowerOn);
      
      powerBtn.addEventListener('click', async () => {
        isPowerOn = !isPowerOn;
        this.updatePowerButton(isPowerOn);
        
        try {
          await api.setPower(isPowerOn);
          saveState('power', isPowerOn);
        } catch (error) {
          console.error('Failed to set power:', error);
          showToast('Failed to set power', 'error');
          // Revert button state
          isPowerOn = !isPowerOn;
          this.updatePowerButton(isPowerOn);
        }
      });
    }
  }

  /**
   * Update power button appearance
   */
  updatePowerButton(isOn) {
    const powerBtn = document.getElementById('power-btn');
    if (powerBtn) {
      powerBtn.textContent = isOn ? '🔌 ON' : '🔌 OFF';
      powerBtn.className = isOn ? 'power-btn on' : 'power-btn off';
    }
  }

  /**
   * Select a feature
   */
  selectFeature(featureKey) {
    this.selectedFeature = featureKey;
    
    // Update UI to show selected feature
    document.querySelectorAll('.feature-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.feature === featureKey) {
        btn.classList.add('active');
      }
    });
    
    // Update selected feature display
    const selectedDisplay = document.getElementById('selected-feature');
    if (selectedDisplay) {
      const feature = this.config.features[featureKey];
      selectedDisplay.textContent = `Selected: ${feature.name}`;
    }
    
    // Restore feature's current state if available
    if (this.featureStates[featureKey]) {
      const state = this.featureStates[featureKey];
      if (state.fx !== undefined) {
        this.currentEffect = state.fx;
        this.highlightEffect(state.fx);
      }
      if (state.pal !== undefined) {
        this.currentPalette = state.pal;
        this.highlightPalette(state.pal);
      }
      if (state.sx !== undefined) {
        this.currentSpeed = state.sx;
        this.updateSlider('speed-slider', state.sx);
      }
      if (state.ix !== undefined) {
        this.currentIntensity = state.ix;
        this.updateSlider('intensity-slider', state.ix);
      }
    }
  }

  /**
   * Select an effect
   */
  async selectEffect(effectId) {
    if (!this.selectedFeature) {
      showToast('Please select a feature first', 'warning');
      return;
    }
    
    this.currentEffect = effectId;
    this.highlightEffect(effectId);
    
    await this.applySettings();
  }

  /**
   * Select a palette
   */
  async selectPalette(paletteId) {
    if (!this.selectedFeature) {
      showToast('Please select a feature first', 'warning');
      return;
    }
    
    this.currentPalette = paletteId;
    this.highlightPalette(paletteId);
    
    await this.applySettings();
  }

  /**
   * Set speed
   */
  async setSpeed(value) {
    this.currentSpeed = value;
    await this.applySettings();
  }

  /**
   * Set intensity
   */
  async setIntensity(value) {
    this.currentIntensity = value;
    await this.applySettings();
  }

  /**
   * Set brightness
   */
  async setBrightness(value) {
    try {
      await api.setBrightness(value);
      saveState('brightness', value);
    } catch (error) {
      console.error('Failed to set brightness:', error);
      showToast('Failed to set brightness', 'error');
    }
  }

  /**
   * Apply current settings to selected feature
   */
  async applySettings() {
    if (!this.selectedFeature) return;
    
    try {
      const props = {};
      
      if (this.currentEffect !== null) {
        props.fx = this.currentEffect;
      }
      if (this.currentPalette !== null) {
        props.pal = this.currentPalette;
      }
      props.sx = this.currentSpeed;
      props.ix = this.currentIntensity;
      
      await api.setFeature(this.selectedFeature, props);
      
      // Save state
      this.featureStates[this.selectedFeature] = props;
      saveState('featureStates', this.featureStates);
      
      // Update feature button icon with visual feedback
      const effect = this.config.effects.effects.find(e => e.id === this.currentEffect);
      if (effect) {
        const button = document.querySelector(`[data-feature="${this.selectedFeature}"]`);
        if (button) {
          button.querySelector('.feature-status').textContent = effect.icon;
          // Add brief visual feedback
          button.classList.add('just-updated');
          setTimeout(() => button.classList.remove('just-updated'), 600);
        }
      }
      
    } catch (error) {
      console.error('Failed to apply settings:', error);
      showToast('Failed to apply settings', 'error');
    }
  }

  /**
   * Highlight selected effect
   */
  highlightEffect(effectId) {
    document.querySelectorAll('.effect-btn').forEach(btn => {
      btn.classList.remove('active');
      if (parseInt(btn.dataset.effectId) === effectId) {
        btn.classList.add('active');
      }
    });
  }

  /**
   * Highlight selected palette
   */
  highlightPalette(paletteId) {
    document.querySelectorAll('.palette-btn').forEach(btn => {
      btn.classList.remove('active');
      if (parseInt(btn.dataset.paletteId) === paletteId) {
        btn.classList.add('active');
      }
    });
  }

  /**
   * Update slider value
   */
  updateSlider(sliderId, value) {
    const slider = document.getElementById(sliderId);
    if (slider) {
      slider.value = value;
      const valueDisplay = slider.parentElement.querySelector('.slider-value');
      if (valueDisplay) {
        valueDisplay.textContent = value;
      }
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PumpkinPainter();
  app.init();
  
  // Make app available globally for debugging
  window.app = app;
});

