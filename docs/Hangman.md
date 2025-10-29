# Hangman Mode

Let's create a hangman game. Instead of making a hangman, we'll make a pumpkin.

- Generate a json file of 50 halloween themed words. These should be simple and easy, 5-8 letters.
- The game will show an empty blank space for each letter of the guess word
- To take a guess the user can select one of the alphabet letters on the screen (no external keyboard needed)
- When a guess is made correctly, show the letter in the appropriate place. Disable the letter button and make it green.
- When a guess is made incorrectly, disable the ltter button and make it red. Advance the state of the pumpkin. 
- The LED pumpkin states: left eye, right eye, nose, mouth, left rim, right rim, shell, fill (8 guesses). Each color is random and solid.
    - When all guesses have been exhausted, player loses. Pumpkin turns entirely red and fully filled in.
    - When the player guesses the word correctly, activate a fun disco mode (glitter for the background, color waves for eyes, twinkle for the nose, meteor for the mouth and rims with random colors)
- The game rests after 30 seconds of inactivity (goes back to screensaver)
- There's a button to play a new game (picks a new word)
- There is a preview of the pumpkin on the screen with the proper sections lit up, and how many guesses they have left
- Use `pumpkin.json` to issue the appropriate API requests to the correct segments