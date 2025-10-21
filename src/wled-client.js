import axios from 'axios';

/**
 * WLED API Client
 * Handles communication with WLED controllers
 */
export class WLEDClient {
  /**
   * @param {string} ip - IP address of WLED controller
   * @param {string} name - Friendly name for logging
   * @param {boolean} debug - Enable debug logging (default: true)
   */
  constructor(ip, name = 'WLED Controller', debug = true) {
    this.baseUrl = `http://${ip}`;
    this.name = name;
    this.timeout = 5000; // 5 second timeout
    this.debug = debug;
  }

  /**
   * Log debug information if debug mode is enabled
   */
  log(...args) {
    if (this.debug) {
      console.log(`[WLED ${this.name}]`, ...args);
    }
  }

  /**
   * Set segment properties directly using WLED JSON API format
   * @param {number} segmentId - Segment ID (0-based)
   * @param {object} props - Segment properties (fx, pal, col, sx, ix, etc.)
   * 
   * Examples:
   *   - Set effect & palette: { fx: 9, pal: 2, sx: 128, ix: 128 }
   *   - Set solid color: { fx: 0, col: [[255, 0, 0]] }
   * 
   * Note: Palette IDs reference built-in WLED palettes. You cannot set custom 
   * colors via the API for built-in palettes. To use custom colors, upload
   * palette0-9.json files directly to the WLED controller via /edit page.
   */
  async setSegment(segmentId, props) {
    const payload = {
      seg: [{
        id: segmentId,
        ...props
      }]
    };
    
    // Log before sending (so it logs even if controller is offline)
    this.log('→ POST /json/state', JSON.stringify(payload));
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/json/state`,
        payload,
        { timeout: this.timeout }
      );
      
      this.log('✓ Response:', response.status, 'OK');
      
      return { success: true, data: response.data };
    } catch (error) {
      // Log error details
      this.log('✗ Error:', error.message);
      console.error(`Error setting segment ${segmentId} on ${this.name}:`, error.message);
      
      return { 
        success: false, 
        error: error.message,
        controller: this.name
      };
    }
  }

  /**
   * Set multiple segments at once
   * @param {array} segments - Array of segment configs
   * Example: [{ id: 0, fx: 9 }, { id: 1, col: [[255, 0, 0]] }]
   */
  async setSegments(segments) {
    const payload = { seg: segments };
    
    // Log before sending (so it logs even if controller is offline)
    this.log('→ POST /json/state (multi-segment)', JSON.stringify(payload));
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/json/state`,
        payload,
        { timeout: this.timeout }
      );
      
      this.log('✓ Response:', response.status, 'OK');
      
      return { success: true, data: response.data };
    } catch (error) {
      // Log error details
      this.log('✗ Error:', error.message);
      console.error(`Error setting segments on ${this.name}:`, error.message);
      
      return { 
        success: false, 
        error: error.message,
        controller: this.name
      };
    }
  }

  /**
   * Get current state including all segments
   */
  async getState() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/json/state`,
        { timeout: this.timeout }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error getting state from ${this.name}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        controller: this.name
      };
    }
  }

  /**
   * Get controller info (effects list, palettes list, etc.)
   */
  async getInfo() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/json/info`,
        { timeout: this.timeout }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error getting info from ${this.name}:`, error.message);
      return { 
        success: false, 
        error: error.message,
        controller: this.name
      };
    }
  }

  /**
   * Turn controller on/off
   */
  async setPower(on) {
    const payload = { on };
    
    // Log before sending (so it logs even if controller is offline)
    this.log('→ POST /json/state (power)', JSON.stringify(payload));
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/json/state`,
        payload,
        { timeout: this.timeout }
      );
      
      this.log('✓ Response:', response.status, 'OK');
      
      return { success: true, data: response.data };
    } catch (error) {
      // Log error details
      this.log('✗ Error:', error.message);
      console.error(`Error setting power on ${this.name}:`, error.message);
      
      return { 
        success: false, 
        error: error.message,
        controller: this.name
      };
    }
  }

  /**
   * Set global brightness (0-255)
   */
  async setBrightness(bri) {
    const payload = { bri: Math.max(0, Math.min(255, bri)) };
    
    // Log before sending (so it logs even if controller is offline)
    this.log('→ POST /json/state (brightness)', JSON.stringify(payload));
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/json/state`,
        payload,
        { timeout: this.timeout }
      );
      
      this.log('✓ Response:', response.status, 'OK');
      
      return { success: true, data: response.data };
    } catch (error) {
      // Log error details
      this.log('✗ Error:', error.message);
      console.error(`Error setting brightness on ${this.name}:`, error.message);
      
      return { 
        success: false, 
        error: error.message,
        controller: this.name
      };
    }
  }

  /**
   * Load a preset (1-16)
   */
  async loadPreset(presetId) {
    const payload = { ps: presetId };
    
    // Log before sending (so it logs even if controller is offline)
    this.log('→ POST /json/state (preset)', JSON.stringify(payload));
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/json/state`,
        payload,
        { timeout: this.timeout }
      );
      
      this.log('✓ Response:', response.status, 'OK');
      
      return { success: true, data: response.data };
    } catch (error) {
      // Log error details
      this.log('✗ Error:', error.message);
      console.error(`Error loading preset ${presetId} on ${this.name}:`, error.message);
      
      return { 
        success: false, 
        error: error.message,
        controller: this.name
      };
    }
  }

  /**
   * Test connectivity to the controller
   */
  async ping() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/json/info`,
        { timeout: this.timeout }
      );
      
      return { 
        success: true, 
        online: true,
        version: response.data.ver,
        name: response.data.name
      };
    } catch (error) {
      return { 
        success: false, 
        online: false,
        error: error.message,
        controller: this.name
      };
    }
  }
}

/**
 * Controller Manager
 * Manages multiple WLED controllers
 */
export class ControllerManager {
  constructor(config, debug = null) {
    this.config = config;
    this.clients = {};
    
    // Use environment variable if available, otherwise default to true
    const debugMode = debug !== null ? debug : (process.env.WLED_DEBUG !== 'false');
    
    // Initialize clients for each controller
    for (const [key, controller] of Object.entries(config.pumpkin.controllers)) {
      this.clients[key] = new WLEDClient(controller.ip, controller.name, debugMode);
    }
    
    if (debugMode) {
      console.log(`[WLED Debug] Enabled for ${Object.keys(this.clients).length} controllers`);
    }
  }

  /**
   * Get a client for a specific controller
   */
  getClient(controllerKey) {
    const client = this.clients[controllerKey];
    if (!client) {
      throw new Error(`Controller '${controllerKey}' not found`);
    }
    return client;
  }

  /**
   * Set effect/palette for a feature (supports multi-segment features)
   */
  async setFeature(featureName, props) {
    const feature = this.config.pumpkin.features[featureName];
    if (!feature) {
      throw new Error(`Feature '${featureName}' not found`);
    }

    // Handle multi-segment features
    if (feature.multiSegment && feature.targets) {
      return await this.setMultipleTargets(feature.targets, props);
    }

    // Handle single segment features
    const client = this.getClient(feature.controller);
    return await client.setSegment(feature.segment, props);
  }

  /**
   * Set properties for multiple segments, potentially across different controllers
   */
  async setMultipleTargets(targets, props) {
    // Group targets by controller
    const byController = {};
    for (const target of targets) {
      if (!byController[target.controller]) {
        byController[target.controller] = [];
      }
      byController[target.controller].push({
        id: target.segment,
        ...props
      });
    }

    // Send requests to each controller
    const results = {};
    const errors = [];
    
    for (const [controllerKey, segments] of Object.entries(byController)) {
      const client = this.getClient(controllerKey);
      const result = await client.setSegments(segments);
      results[controllerKey] = result;
      
      if (!result.success) {
        errors.push(`${controllerKey}: ${result.error}`);
      }
    }

    // Return combined result
    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join('; '),
        results
      };
    }

    return {
      success: true,
      data: results
    };
  }

  /**
   * Get state for all controllers
   */
  async getAllStates() {
    const states = {};
    
    for (const [key, client] of Object.entries(this.clients)) {
      const result = await client.getState();
      states[key] = result;
    }
    
    return states;
  }

  /**
   * Set power for all controllers
   */
  async setAllPower(on) {
    const results = {};
    
    for (const [key, client] of Object.entries(this.clients)) {
      results[key] = await client.setPower(on);
    }
    
    return results;
  }

  /**
   * Set brightness for all controllers
   */
  async setAllBrightness(brightness) {
    const results = {};
    
    for (const [key, client] of Object.entries(this.clients)) {
      results[key] = await client.setBrightness(brightness);
    }
    
    return results;
  }

  /**
   * Test connectivity to all controllers
   */
  async pingAll() {
    const results = {};
    
    for (const [key, client] of Object.entries(this.clients)) {
      results[key] = await client.ping();
    }
    
    return results;
  }

  /**
   * Load preset on all controllers
   */
  async loadPresetAll(presetId) {
    const results = {};
    
    for (const [key, client] of Object.entries(this.clients)) {
      results[key] = await client.loadPreset(presetId);
    }
    
    return results;
  }
}

