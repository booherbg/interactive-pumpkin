import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config-loader.js';
import { ControllerManager } from './wled-client.js';
import { setupRoutes } from './api-routes.js';
import { startSimulator } from './simulator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const SIMULATOR_PORT = process.env.SIMULATOR_PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Parse command line arguments
const USE_SIMULATOR = process.argv.includes('--use-simulator');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

// CORS for local network
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🎃 Starting Pumpkin Painter...\n');

    // Load configuration
    console.log('📋 Loading configuration...');
    const config = await loadConfig();
    console.log(`✓ Loaded configuration for: ${config.pumpkin.name}`);
    console.log(`✓ ${Object.keys(config.pumpkin.features).length} features configured`);
    console.log(`✓ ${config.effects.effects.length} effects available`);
    console.log(`✓ ${config.palettes.palettes.length} palettes available\n`);

    // Start simulator if requested
    if (USE_SIMULATOR) {
      console.log('🎮 SIMULATOR MODE ENABLED\n');
      await startSimulator(config.pumpkin, SIMULATOR_PORT);
      
      // Update controller IPs to point to simulator
      Object.keys(config.pumpkin.controllers).forEach(key => {
        config.pumpkin.controllers[key].ip = `localhost:${SIMULATOR_PORT}/simulator/${key}`;
      });
      console.log('');
    }

    // Initialize controller manager
    console.log('🔌 Initializing WLED controllers...');
    const controllerManager = new ControllerManager(config, !USE_SIMULATOR);
    
    if (!USE_SIMULATOR) {
      // Test connectivity to controllers (skip in simulator mode)
      const pingResults = await controllerManager.pingAll();
      for (const [key, result] of Object.entries(pingResults)) {
        const controller = config.pumpkin.controllers[key];
        if (result.online) {
          console.log(`✓ ${controller.name} (${controller.ip}) - Online`);
          console.log(`  WLED Version: ${result.version}`);
        } else {
          console.log(`✗ ${controller.name} (${controller.ip}) - Offline`);
          console.log(`  Error: ${result.error}`);
        }
      }
    } else {
      console.log('✓ Using simulator endpoints (hardware not required)');
    }
    console.log('');

    // Setup API routes
    setupRoutes(app, config, controllerManager);

    // Start listening
    app.listen(PORT, HOST, () => {
      console.log('🚀 Server started successfully!\n');
      console.log(`   Local:   http://localhost:${PORT}`);
      console.log(`   Network: http://${HOST}:${PORT}`);
      
      if (USE_SIMULATOR) {
        console.log(`\n🎮 Simulator: http://localhost:${SIMULATOR_PORT}/simulator`);
      }
      
      console.log('\n📱 Open this URL on your iPad to control the pumpkin!\n');
      console.log('Available endpoints:');
      console.log('   GET  /api/config        - Get configuration');
      console.log('   GET  /api/state         - Get current state');
      console.log('   GET  /api/ping          - Test connectivity');
      console.log('   POST /api/feature/:name - Set feature effect/palette');
      console.log('   POST /api/power         - Power on/off');
      console.log('   POST /api/brightness    - Set brightness');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

