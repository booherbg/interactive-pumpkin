# TODO

## Final Checklist
    - [x] Remove the admin link from the pumpkin page (LLM)
    - [x] Add random effect button in subtitle of modal; will pick a random effect from the list of effects shown on the page (LLM)
    - [x] Add random palette button in subtitle of modal; will pick a random palette from list of pallettes shown on the page (LLM)
    - [x] Solid and Color Palletes (1+2, gradient) remove white and warm white; Replace Cyan, Magenta, Yellow with slightly less intense versions if they don't already exist (to prevent dual-diode flicker) (LLM)
    - [x] Remove purple from solid colors (too similar to magenta) (LLM)
    - [x] Update 'reset' functionality (LLM):
        - [x] When resetting (via button click and after screen saver is touched after the period of time), instead of of resetting to preset 1, let's just reset the whole pumpkin to solid color effect with a soft orange (LLM)
        - [x] New feature: When the screensaver is active, after 3 minutes of inactivity, reset to preset 1 for both controllers (this is what the previous reset functionality did). This way after a few minutes, the pumpkin will go back to default mode (LLM)
    - [x] When clicking either rim, send to both. No more separate left/right outer rims - clicking either should alway send to both (LLM)
    - Reduce the behavior of doing preset 1 from 5 minutes to 30 seconds on screen saver
    - [x] Organize palettes into good groupings (ME)
    - [x] Add wifi mac addresses to LED DREAMS (ME)
    - [x] Update Raspi with this project and startup (ME)
    - [x] Final test of whole system (ME)
    - [x] "Reset" should mean clean slate, simple (TBD)
    - [x] "Playlist 1" Should run after 5 minutes of inactivity (TBD)
    - [x] Update the background idle behavior... instead of always just doing 'preset 1', let's have some fun (LLM):
        - [x] Note: When selecting random palette, don't select solid or the palettes that require additional color options (colors 1/2, color 1/2 gradient, etc). When selecting palettes and effects, of course use only effects that are available already on the frontend.
        - [x] Start this after 30 seconds of inactivity on the screensaver (like we do now) and repeat every 60 seconds. Cancel this behavior of course when someone touches the screen to interact with the pumpkin
        - [x] 50% of the time, pick a random effect and apply it to the whole pumpkin with the "random color cycle" palette
        - [x] 25% of the time, pick 3 effects. Apply one effect to the eyes, nose, and mouth with a randomly selected palette, apply a second random effect to the filler with a different randomly selected palette, and apply a third random effect to the shell and rim with a third randomly selected palette.
        - [x] 25% of the time, pick a random effect and apply it to the whole pumpkin, but eyes get one random palette, nose gets another random palette, mouth gets another random palette, fill gets another random palette, shell gets another random palette, and left/right outer rim get a different random color palette