# LAB-Assist (Largely Audio-Based Assistant)

This is an Angular-based web-implementation of a fusion between a controller input viewer and MIDI sequencer / Recorder. It's ultimate intent is to allow the viewing / recording / modifying of inputs with dynamically-generated musical playback to assist in learning timing-intensive games and strategies, e.g. Fighting games, Character-Action games, and Speedrunning.

![LAB-Assist1](https://user-images.githubusercontent.com/32592141/129633488-5f3e5bd9-b2d3-4445-a373-1e3725a880a5.png)

## NOTE: For MIDI Playback
install the Jazz MIDI Plugin
https://jazz-soft.net/download/Jazz-Plugin/

## NOTE: Running and Troubleshooting

run npm update

***Note To Those who want to run the main branch***
You need to run the above, and once all dependencies are installed, you will find a file called `index.d.ts_BACKUP` in the root directory, open and copy all of its contents.

-then, you must navigate to `/node_modules/heartbeat-sequencer/build/` and find the `index.d.ts` file within. open that and replace all of its contents with the ones copied from the root directory file. save the file, and all compiler errors should be resolved and the project will run as intended, barring any fundamental errors that obviously break intended behavior, which I can be contacted regarding further solutions to get it running.

-Also works best with an Xbox 360 / Xbox One / XInput Controller, partial and inaccurate functionality also possible with alternatives, but not guaranteed due to lack of ability to test currently. 

## Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

## Hopefully Near-Future Improvements

- Moving Sequencer functionality from heartbeat-sequencer(https://github.com/abudaan/heartbeat) to webDAW(https://github.com/abudaan/webdaw-modules) & making several integration refinements between components
  - In hopes of using the latest updates and achieve the fastest & lowest-level interoperability between the MIDI Input, Controller events, and audio feedback / playback.
- Overhauling visual/interface components.
  - Including more customizablility in button arrangement and color schemes, adding different platform schemes and game-dependent labelling
  - Less debug interface garishly on the page (obviously)
  - Directional input path tracing and show/hide different direcitonal inputs in display / editor
  - Proper input display playback from the editor
- Implementing the 'Melodic Phrase' generator for playback
  - Arbitrarily sequential and procedural at first, then grouped based on input cluster recognition and user-selected grouping
  - Implement basic triad/chording for movement phrases, and melodic accompaniment for buttons, both based on chosen key & scale
  - Eventually creating more diverse and unique melodic interactions for longer/divergent input sequences, including different cadences for 
- Implementing input 'Rehearsal' AKA matching the playback and subsequent feedback
  - Currently difficult to make meaningful due to sync and feedback conflicts that are actively being resolved
- Fully implementing the database component and a proper interface
