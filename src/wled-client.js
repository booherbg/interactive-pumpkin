import axios from 'axios';

/**
 * WLED API Client
 * Handles communication with WLED controllers
 */
export class WLEDClient {
  constructor(ip, name = 'WLED Controller') {
    this.baseUrl = `http://${ip}`;
    this.name = name;
    this.timeout = 5000; // 5 second timeout
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
    try {
      const payload = {
        seg: [{
          id: segmentId,
          ...props
        }]
      };
      
      const response = await axios.post(
        `${this.baseUrl}/json/state`,
        payload,
        { timeout: this.timeout }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
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
    try {
      const payload = { seg: segments };
      const response = await axios.post(
        `${this.baseUrl}/json/state`,
        payload,
        { timeout: this.timeout }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
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
    try {
      const response = await axios.post(
        `${this.baseUrl}/json/state`,
        { on },
        { timeout: this.timeout }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
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
    try {
      const response = await axios.post(
        `${this.baseUrl}/json/state`,
        { bri: Math.max(0, Math.min(255, bri)) },
        { timeout: this.timeout }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error setting brightness on ${this.name}:`, error.message);
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
  constructor(config) {
    this.config = config;
    this.clients = {};
    
    // Initialize clients for each controller
    for (const [key, controller] of Object.entries(config.pumpkin.controllers)) {
      this.clients[key] = new WLEDClient(controller.ip, controller.name);
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
   * Set effect/palette for a feature
   */
  async setFeature(featureName, props) {
    const feature = this.config.pumpkin.features[featureName];
    if (!feature) {
      throw new Error(`Feature '${featureName}' not found`);
    }

    const client = this.getClient(feature.controller);
    return await client.setSegment(feature.segment, props);
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
}

