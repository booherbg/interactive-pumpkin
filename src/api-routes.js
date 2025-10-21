import { Router } from 'express';

/**
 * Setup API routes for the pumpkin painter
 */
export function setupRoutes(app, config, controllerManager) {
  const router = Router();

  /**
   * GET /api/config
   * Returns complete configuration including features, effects, and palettes
   */
  router.get('/config', (req, res) => {
    res.json({
      name: config.pumpkin.name,
      features: config.pumpkin.features,
      effects: config.effects,
      palettes: config.palettes,
      controllers: config.pumpkin.controllers
    });
  });

  /**
   * POST /api/feature/:featureName
   * Set effect and palette for a specific pumpkin feature
   * Body: { fx, pal, sx, ix, col }
   */
  router.post('/feature/:featureName', async (req, res) => {
    try {
      const { featureName } = req.params;
      const props = req.body;

      // Validate feature exists
      const feature = config.pumpkin.features[featureName];
      if (!feature) {
        return res.status(404).json({ 
          success: false, 
          error: `Feature '${featureName}' not found` 
        });
      }

      // Apply the effect/palette to the feature
      const result = await controllerManager.setFeature(featureName, props);

      if (result.success) {
        res.json({
          success: true,
          feature: featureName,
          controller: feature.controller,
          segment: feature.segment,
          applied: props
        });
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error in POST /api/feature/:featureName:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * POST /api/feature/:featureName/color
   * Set solid color for a feature (shortcut for solid effect)
   * Body: { color: "#FF6600" }
   */
  router.post('/feature/:featureName/color', async (req, res) => {
    try {
      const { featureName } = req.params;
      const { color } = req.body;

      if (!color) {
        return res.status(400).json({ 
          success: false, 
          error: 'Color is required' 
        });
      }

      // Convert hex color to RGB array
      const rgb = hexToRgb(color);
      if (!rgb) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid color format' 
        });
      }

      // Set solid effect with the color
      const props = {
        fx: 0, // Solid effect
        col: [rgb]
      };

      const feature = config.pumpkin.features[featureName];
      if (!feature) {
        return res.status(404).json({ 
          success: false, 
          error: `Feature '${featureName}' not found` 
        });
      }

      const result = await controllerManager.setFeature(featureName, props);

      if (result.success) {
        res.json({
          success: true,
          feature: featureName,
          color: color,
          rgb: rgb
        });
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error in POST /api/feature/:featureName/color:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * GET /api/state
   * Get current state of all controllers
   */
  router.get('/state', async (req, res) => {
    try {
      const states = await controllerManager.getAllStates();
      res.json(states);
    } catch (error) {
      console.error('Error in GET /api/state:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * POST /api/power
   * Turn all controllers on/off
   * Body: { on: true }
   */
  router.post('/power', async (req, res) => {
    try {
      const { on } = req.body;

      if (typeof on !== 'boolean') {
        return res.status(400).json({ 
          success: false, 
          error: 'on must be a boolean' 
        });
      }

      const results = await controllerManager.setAllPower(on);
      res.json({ success: true, results });
    } catch (error) {
      console.error('Error in POST /api/power:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * POST /api/brightness
   * Set global brightness for all controllers
   * Body: { brightness: 128 }
   */
  router.post('/brightness', async (req, res) => {
    try {
      const { brightness } = req.body;

      if (typeof brightness !== 'number' || brightness < 0 || brightness > 255) {
        return res.status(400).json({ 
          success: false, 
          error: 'brightness must be a number between 0 and 255' 
        });
      }

      const results = await controllerManager.setAllBrightness(brightness);
      res.json({ success: true, brightness, results });
    } catch (error) {
      console.error('Error in POST /api/brightness:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * GET /api/ping
   * Test connectivity to all controllers
   */
  router.get('/ping', async (req, res) => {
    try {
      const results = await controllerManager.pingAll();
      res.json(results);
    } catch (error) {
      console.error('Error in GET /api/ping:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Mount the router under /api
  app.use('/api', router);
}

/**
 * Convert hex color to RGB array
 * @param {string} hex - Hex color string (e.g., "#FF6600")
 * @returns {array|null} RGB array [r, g, b] or null if invalid
 */
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  if (hex.length === 3) {
    // Short form (e.g., "F60")
    hex = hex.split('').map(c => c + c).join('');
  }

  if (hex.length !== 6) {
    return null;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return [r, g, b];
}

