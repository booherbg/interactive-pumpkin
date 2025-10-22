import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load and parse a JSON configuration file
 */
async function loadJSON(filename) {
  const configPath = join(__dirname, '..', 'config', filename);
  const data = await readFile(configPath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Load all configuration files
 */
export async function loadConfig() {
  try {
    const [pumpkin, effects, palettes, effectsReference, palettesReference] = await Promise.all([
      loadJSON('pumpkin.json'),
      loadJSON('effects.json'),
      loadJSON('palettes.json'),
      loadJSON('effects-reference.json'),
      loadJSON('palettes-reference.json')
    ]);

    return {
      pumpkin,
      effects,
      palettes,
      effectsReference,
      palettesReference
    };
  } catch (error) {
    console.error('Error loading configuration:', error);
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
}

/**
 * Validate that a feature exists in the configuration
 */
export function validateFeature(config, featureName) {
  if (!config.pumpkin.features[featureName]) {
    throw new Error(`Feature '${featureName}' not found in configuration`);
  }
  return config.pumpkin.features[featureName];
}

/**
 * Get controller configuration for a feature
 */
export function getControllerForFeature(config, featureName) {
  const feature = validateFeature(config, featureName);
  const controller = config.pumpkin.controllers[feature.controller];
  
  if (!controller) {
    throw new Error(`Controller '${feature.controller}' not found for feature '${featureName}'`);
  }
  
  return {
    ...controller,
    segment: feature.segment
  };
}

/**
 * Get all features grouped by their group property
 */
export function getFeaturesByGroup(config) {
  const features = config.pumpkin.features;
  const grouped = {};
  
  for (const [key, feature] of Object.entries(features)) {
    const group = feature.group || 'other';
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push({ key, ...feature });
  }
  
  return grouped;
}

