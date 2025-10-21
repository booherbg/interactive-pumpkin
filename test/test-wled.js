import { WLEDClient, ControllerManager } from '../src/wled-client.js';
import { loadConfig } from '../src/config-loader.js';

/**
 * WLED Connectivity Test Script
 * Tests connectivity and basic functionality with WLED controllers
 */

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWLED() {
  console.log('🎃 Pumpkin Painter - WLED Connectivity Test\n');
  console.log('=' .repeat(60));
  
  try {
    // Load configuration
    console.log('\n📋 Step 1: Loading configuration...');
    const config = await loadConfig();
    console.log(`✓ Configuration loaded: ${config.pumpkin.name}`);
    console.log(`✓ Features: ${Object.keys(config.pumpkin.features).length}`);
    console.log(`✓ Controllers: ${Object.keys(config.pumpkin.controllers).length}`);
    
    // Initialize controller manager
    console.log('\n🔌 Step 2: Testing controller connectivity...');
    const manager = new ControllerManager(config);
    
    const pingResults = await manager.pingAll();
    let allOnline = true;
    
    for (const [key, result] of Object.entries(pingResults)) {
      const controller = config.pumpkin.controllers[key];
      console.log(`\n  Controller: ${controller.name} (${controller.ip})`);
      
      if (result.online) {
        console.log(`  ✓ Status: Online`);
        console.log(`  ✓ WLED Version: ${result.version}`);
        console.log(`  ✓ Device Name: ${result.name}`);
      } else {
        console.log(`  ✗ Status: Offline`);
        console.log(`  ✗ Error: ${result.error}`);
        allOnline = false;
      }
    }
    
    if (!allOnline) {
      console.log('\n⚠️  Warning: Some controllers are offline. Please check network connectivity.');
      console.log('   The test will continue but some commands may fail.\n');
    }
    
    // Test basic commands
    console.log('\n🎨 Step 3: Testing basic commands...');
    
    // Test 1: Set Left Eye to solid red
    console.log('\n  Test 1: Setting Left Eye to solid red...');
    const test1 = await manager.setFeature('leftEye', {
      fx: 0, // Solid
      col: [[255, 0, 0]] // Red
    });
    console.log(`  ${test1.success ? '✓' : '✗'} ${test1.success ? 'Success' : 'Failed: ' + test1.error}`);
    await sleep(2000);
    
    // Test 2: Set Right Eye to solid blue
    console.log('\n  Test 2: Setting Right Eye to solid blue...');
    const test2 = await manager.setFeature('rightEye', {
      fx: 0, // Solid
      col: [[0, 0, 255]] // Blue
    });
    console.log(`  ${test2.success ? '✓' : '✗'} ${test2.success ? 'Success' : 'Failed: ' + test2.error}`);
    await sleep(2000);
    
    // Test 3: Set Nose to sparkle effect
    console.log('\n  Test 3: Setting Nose to sparkle effect...');
    const test3 = await manager.setFeature('nose', {
      fx: 42, // Sparkle
      pal: 9, // Halloween palette
      sx: 128, // Speed
      ix: 128 // Intensity
    });
    console.log(`  ${test3.success ? '✓' : '✗'} ${test3.success ? 'Success' : 'Failed: ' + test3.error}`);
    await sleep(3000);
    
    // Test 4: Set Mouth to fire effect
    console.log('\n  Test 4: Setting Mouth to fire effect...');
    const test4 = await manager.setFeature('mouth', {
      fx: 108, // Fire 2012
      pal: 35, // Fire palette
      sx: 128,
      ix: 200
    });
    console.log(`  ${test4.success ? '✓' : '✗'} ${test4.success ? 'Success' : 'Failed: ' + test4.error}`);
    await sleep(3000);
    
    // Test 5: Set Inner Shell to rainbow
    console.log('\n  Test 5: Setting Inner Shell to rainbow...');
    const test5 = await manager.setFeature('innerShell', {
      fx: 9, // Rainbow
      pal: 2, // Rainbow palette
      sx: 150
    });
    console.log(`  ${test5.success ? '✓' : '✗'} ${test5.success ? 'Success' : 'Failed: ' + test5.error}`);
    await sleep(3000);
    
    // Test 6: Set brightness
    console.log('\n  Test 6: Setting brightness to 50%...');
    const test6 = await manager.setAllBrightness(128);
    let brightnessSuccess = Object.values(test6).every(r => r.success);
    console.log(`  ${brightnessSuccess ? '✓' : '✗'} ${brightnessSuccess ? 'Success' : 'Failed'}`);
    await sleep(2000);
    
    // Test 7: Get current state
    console.log('\n  Test 7: Getting current state...');
    const states = await manager.getAllStates();
    let stateSuccess = Object.values(states).every(s => s.success);
    console.log(`  ${stateSuccess ? '✓' : '✗'} ${stateSuccess ? 'Success' : 'Failed'}`);
    
    if (stateSuccess) {
      for (const [key, state] of Object.entries(states)) {
        if (state.success && state.data) {
          console.log(`    ${key}: ${state.data.on ? 'ON' : 'OFF'}, Brightness: ${state.data.bri}`);
        }
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test Complete!\n');
    console.log('Summary:');
    console.log(`  • Configuration loaded: ✓`);
    console.log(`  • Controllers online: ${allOnline ? '✓' : '⚠️'}`);
    console.log(`  • Basic commands: ${test1.success && test2.success && test3.success ? '✓' : '⚠️'}`);
    console.log(`  • Effects working: ${test3.success && test4.success && test5.success ? '✓' : '⚠️'}`);
    console.log(`  • Brightness control: ${brightnessSuccess ? '✓' : '⚠️'}`);
    console.log(`  • State retrieval: ${stateSuccess ? '✓' : '⚠️'}`);
    
    console.log('\n💡 Next Steps:');
    console.log('  1. Update controller IPs in config/pumpkin.json');
    console.log('  2. Run: npm start');
    console.log('  3. Open http://<raspberry-pi-ip>:3000 on your iPad');
    console.log('  4. Start painting! 🎃\n');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testWLED();

