# LAB-Assist (Largely Audio-Based Assistant)

This is an Angular-based web-implementation of a fusion between a controller input viewer and MIDI sequencer / Recorder. It's ultimate intent is to allow the viewing / recording / modifying of inputs with dynamically-generated musical playback to assist in learning timing-intensive games and strategies, e.g. Fighting games, Character-Action games, and Speedrunning.

![LAB-Assist1](https://user-images.githubusercontent.com/32592141/129633488-5f3e5bd9-b2d3-4445-a373-1e3725a880a5.png)

## NOTE: For MIDI Playback
install the Jazz MIDI Plugin
https://jazz-soft.net/download/Jazz-Plugin/

## NOTE: If files missing / unable to build

run npm update



***Note To Those who want to run the main branch***
You need to run the above, and once all dependencies are installed, you will find a file called `index.d.ts_BACKUP` in the root directory, open and copy all of its contents.

-then, you must navigate to `/node_modules/heartbeat-sequencer/build/` and find the `index.d.ts` file within. open that and replace all of its contents with the ones copied from the root directory file. save the file, and all compiler errors should be resolved and the project will run as intended, barring any fundamental errors that obviously break intended behavior, which I can be contacted regarding further solutions to get it running.

-Also works best with an Xbox 360 / Xbox One / XInput Controller, partial and inaccurate functionality also possible with alternatives, but not guaranteed due to lack of ability to test currently. 

## Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

## Current Status

Moving MIDI and Sequencer functionality from heartbeat-sequencer(https://github.com/abudaan/heartbeat) to webDAW(https://github.com/abudaan/webdaw-modules), along with several integration overhauls between components, in hopes of using the latest updates and achieve the fastest/lowest level interoperability between the MIDI, Controller events, and dynamic playback, as well as remedying a few long standing bugs before overhauling most visual/interface components.
