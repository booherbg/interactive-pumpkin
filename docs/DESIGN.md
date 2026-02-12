# Architecture

This is a simple project to test an idea to allow a user to set colors of a 2D pumpkin using DDP (or artnet).
```
Current Hardware:
    - WLED (14.3) controllers on local lan
        - 1x 2000 pixels across 8 channels (12v controller)
        - 1x 750 pixels across 4 channels (24v controller)
    - Local LAN (controllers are mix of ethernet and wifi)
        - IP-based DDP direct control (confirmed working)
        - Apple Airport Extreme local secure network
    - Raspberry Pi on network for this script to run
    - iPad for user interactions via local browser on network
    - 2D Pumpkin hung on a grid wall (6m wide, 3m tall)
        - 12v Controller: 8 channels, 2000 LEDs total
            - 2750 LEDs total. 2000 LEDs that are 2.5mm apart across 10 5 meter strands and 750 bullet pixel style LEDs with 8" spacing (150m across 15 10m strands)
            - 2 eyes, 1 nose, 1 mouth - each using 1 200LED strand
            - Pumpkin inner shell: 4 strands (800 LEDs) in a ring
            - Pumpkin outer shell: 1 strand on the left, 1 on the right - same height as the pumpkin, parallel to the left/right shell to add a 3D effect
        - 24v Controller: 4 channels, 750 LEDs total
            - Filler inside the pumpkin negative space around eyes, mouth, nose (500 pixels)
            - Filler inside the mouth (tbd, 250 pixels?)

12v Controller:
    Segment 1: Left Eye
    Segment 2: Right Eye
    Segment 3: Nose
    Segment 4: Mouth
    Segment 5: Inner Shell
    Segment 6: Left Outer Shell
    Segment 7: Right Outer Shell
24v Controller:
    Segment 1: Inner Filler
    Segment 2: Mouth Filler
    Segment 3: Sky / Background Filler (optional)

Basic Features:
    - Simple Mode: DDP Color Chooser
        - User can choose color for eyes, nose, mouth, shell, filler, shell
        - In this mode we can take advantage of the physical segments - each feature of the pumpkin is made up of identical 200-LED strands so there isn't a need for 2D mapping. The filler can be treated as a regular matrix or as a simple singular strip for the purpose of creating fun patterns
        - Stretch goal: Add shaders or animations as selectable options so that instead of just 'colors' there are patterns and movement
        - Stretch goal: Allow for simple matrix mapping. For example, knowing that the filler is, say, 500 pixels but is organically spread throughout the pumpkin, could treat it as 10 50-LED segments to modulate 2D effects. This wouldn't be perfect, but it would create waves of color that would be very interesting
    - Simple Mode II: FX Chooser
        - Alternate idea: Instead of DDP directly, use WLED native FX so each segment will run locally on the controller. User could select from a handful of effects and pallettes that get sent to the pumpkin via HTTP API
    - Paint Mode:
        - User can use the entire pumpkin as a canvas
        - Drawing on the screen will animate drawing on the pumpkin
        - Interactive and fun but would require 2D mapping
    - Activate Scene Mode:
        - Use xLights to map the pumpkin
        - Create various scenes in xLights
        - Activate xLights via HTTP when user selects from a list of effects (1-5)
        - Questions: Is xLights easy to set up in this way? Can users select colors or just FX? How does this work?
```
