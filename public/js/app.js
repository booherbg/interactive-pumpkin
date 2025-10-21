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
      showToast('🎃 Pumpkin Painter ready!', 'success');
      
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
    
    for (const effect of this.config.effects.effects) {
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
    
    for (const palette of this.config.palettes.palettes) {
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
          showToast(isPowerOn ? '🔌 Power On' : '🔌 Power Off', 'success');
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
      
      // Update feature button icon
      const effect = this.config.effects.effects.find(e => e.id === this.currentEffect);
      if (effect) {
        const button = document.querySelector(`[data-feature="${this.selectedFeature}"]`);
        if (button) {
          button.querySelector('.feature-status').textContent = effect.icon;
        }
      }
      
      showToast('✓ Applied', 'success');
      
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

