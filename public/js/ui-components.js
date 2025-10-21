/**
 * UI Component Helpers
 */

/**
 * Create a feature button
 */
export function createFeatureButton(featureKey, feature, isActive = false) {
  const button = document.createElement('button');
  button.className = `feature-btn group-${feature.group}${isActive ? ' active' : ''}`;
  button.dataset.feature = featureKey;
  button.dataset.group = feature.group;
  
  // Mark multi-segment features
  if (feature.multiSegment) {
    button.dataset.multiSegment = 'true';
  }
  
  button.innerHTML = `
    <div class="feature-name">${feature.name}</div>
    <div class="feature-status">⬛</div>
  `;
  
  return button;
}

/**
 * Create an effect button
 */
export function createEffectButton(effect, isActive = false) {
  const button = document.createElement('button');
  button.className = `effect-btn${isActive ? ' active' : ''}`;
  button.dataset.effectId = effect.id;
  button.dataset.category = effect.category;
  button.title = effect.name;
  
  button.innerHTML = `
    <div class="effect-icon">${effect.icon}</div>
    <div class="effect-name">${effect.name}</div>
  `;
  
  return button;
}

/**
 * Create a palette button
 */
export function createPaletteButton(palette, isActive = false) {
  const button = document.createElement('button');
  button.className = `palette-btn${isActive ? ' active' : ''}`;
  button.dataset.paletteId = palette.id;
  button.title = palette.name;
  
  // Create gradient preview
  const gradient = createPaletteGradient(palette.colors);
  
  button.innerHTML = `
    <div class="palette-icon">${palette.icon}</div>
    <div class="palette-preview" style="background: ${gradient}"></div>
    <div class="palette-name">${palette.name}</div>
  `;
  
  return button;
}

/**
 * Create CSS gradient from color array
 */
function createPaletteGradient(colors) {
  if (colors.length === 1) {
    return colors[0];
  }
  return `linear-gradient(90deg, ${colors.join(', ')})`;
}

/**
 * Create a slider with label
 */
export function createSlider(id, label, min, max, value, onChange) {
  const container = document.createElement('div');
  container.className = 'slider-container';
  
  container.innerHTML = `
    <label for="${id}">
      <span class="slider-label">${label}</span>
      <span class="slider-value">${value}</span>
    </label>
    <input 
      type="range" 
      id="${id}" 
      class="slider"
      min="${min}" 
      max="${max}" 
      value="${value}"
    />
  `;
  
  const slider = container.querySelector('input');
  const valueDisplay = container.querySelector('.slider-value');
  
  slider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    valueDisplay.textContent = value;
    if (onChange) {
      onChange(value);
    }
  });
  
  return container;
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Show loading indicator
 */
export function showLoading(message = 'Loading...') {
  let loading = document.getElementById('loading');
  
  if (!loading) {
    loading = document.createElement('div');
    loading.id = 'loading';
    loading.className = 'loading';
    document.body.appendChild(loading);
  }
  
  loading.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-message">${message}</div>
  `;
  
  loading.classList.add('show');
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.remove('show');
  }
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
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

/**
 * Save state to localStorage
 */
export function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * Load state from localStorage
 */
export function loadState(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error('Failed to load state:', error);
    return defaultValue;
  }
}

