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

class PumpkinPainter {
  constructor() {
    this.config = null;
    this.selectedFeature = null;
    this.selectedEffect = null;
    this.selectedPalette = null;
    this.speed = 128;
    this.intensity = 128;
  }

  async init() {
    try {
      // Load configuration
      this.config = await api.getConfig();
      console.log('Config loaded:', this.config);
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Show welcome toast
      this.showToast('🎃 Tap any part of the pumpkin to control it!');
      
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
    });
    
    intensitySlider.addEventListener('input', (e) => {
      this.intensity = parseInt(e.target.value);
      document.getElementById('intensityValue').textContent = this.intensity;
    });

    // Apply button
    document.getElementById('applyBtn').addEventListener('click', () => {
      this.applySettings();
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
      });
      
      grid.appendChild(btn);
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
    }

    try {
      await api.setFeature(this.selectedFeature, props);
      this.showToast('✓ Applied!');
      this.closeModal();
    } catch (error) {
      console.error('Failed to apply settings:', error);
      this.showToast('❌ Failed to apply');
    }
  }

  async resetToPreset() {
    try {
      this.showToast('🔄 Resetting to preset 1...');
      await api.loadPreset(1);
      this.showToast('✓ Reset complete!');
    } catch (error) {
      console.error('Failed to reset:', error);
      this.showToast('❌ Failed to reset');
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new PumpkinPainter();
  app.init();
  
  // Make available for debugging
  window.app = app;
});

