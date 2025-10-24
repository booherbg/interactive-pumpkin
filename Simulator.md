# WLED Pumpkin Simulator

Make a simulator that we can use to accept API requests when the controllers are not available.

When the app is ran in dev mode, use the simulator instead of the controller IP addresses. This can be set with a flag `--use-simulator`

The goal of the simulator is to accept WLED segment requests and show the appropriate segment lit up with the color palette and approximation of the effect (just solid vs twinkle is fine for now). This can be shown using a web page and a similar SVG pumpkin pattern that we're already using.

This simulator can be a separate nodejs app that can accept URLs with the controller name like /simulator/controller12v vs /simulator/controller24v so that the URL just has to change to include those paths but the backend otherwise doesn't know or care that it is talking to a simulated backend. 

The simulator can use `pumpkin.json` to understand what each segment is, and provide a simple HTML page to show the current state of the segments.