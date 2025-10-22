/**
 * API Client for Pumpkin Painter
 * Handles all communication with the backend
 */

const API_BASE = window.location.origin;

export const api = {
  /**
   * Get configuration (features, effects, palettes)
   */
  async getConfig() {
    const response = await fetch(`${API_BASE}/api/config`);
    if (!response.ok) {
      throw new Error('Failed to load configuration');
    }
    return await response.json();
  },

  /**
   * Set effect and palette for a feature
   * @param {string} featureName - Feature name (e.g., 'leftEye')
   * @param {object} props - Properties { fx, pal, sx, ix, col }
   */
  async setFeature(featureName, props) {
    const response = await fetch(`${API_BASE}/api/feature/${featureName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(props),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set feature');
    }

    return await response.json();
  },

  /**
   * Set solid color for a feature
   * @param {string} featureName - Feature name
   * @param {string} color - Hex color (e.g., '#FF6600')
   */
  async setFeatureColor(featureName, color) {
    const response = await fetch(`${API_BASE}/api/feature/${featureName}/color`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ color }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set feature color');
    }

    return await response.json();
  },

  /**
   * Get current state of all controllers
   */
  async getState() {
    const response = await fetch(`${API_BASE}/api/state`);
    if (!response.ok) {
      throw new Error('Failed to get state');
    }
    return await response.json();
  },

  /**
   * Set power on/off
   * @param {boolean} on - Power state
   */
  async setPower(on) {
    const response = await fetch(`${API_BASE}/api/power`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ on }),
    });

    if (!response.ok) {
      throw new Error('Failed to set power');
    }

    return await response.json();
  },

  /**
   * Set brightness
   * @param {number} brightness - Brightness value (0-255)
   */
  async setBrightness(brightness) {
    const response = await fetch(`${API_BASE}/api/brightness`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brightness }),
    });

    if (!response.ok) {
      throw new Error('Failed to set brightness');
    }

    return await response.json();
  },

  /**
   * Test connectivity to controllers
   */
  async ping() {
    const response = await fetch(`${API_BASE}/api/ping`);
    if (!response.ok) {
      throw new Error('Failed to ping controllers');
    }
    return await response.json();
  },

  /**
   * Get detailed controller information
   * @param {string} controllerKey - Controller key from config
   */
  async getControllerDetails(controllerKey) {
    const response = await fetch(`${API_BASE}/api/controller/${controllerKey}`);
    if (!response.ok) {
      throw new Error('Failed to get controller details');
    }
    return await response.json();
  },
};

