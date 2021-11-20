# LAB-Assist (Largely Audio-Based Assistant)

This is an Angular-based web-implementation of a fusion between a controller input viewer and MIDI sequencer / Recorder. It's ultimate intent is to allow the viewing / recording / modifying of inputs with dynamically-generated musical playback to assist in learning timing-intensive games and strategies, e.g. Fighting games, Character-Action games, and Speedrunning.

<<<<<<< HEAD
![LAB-Assist1](E:\Google Drive Omnillama\Visual\Lab-Assist\LAB-Assist2.png)

=======
## NOTE: For MIDI Playback
install the Jazz MIDI Plugin
https://jazz-soft.net/download/Jazz-Plugin/

## NOTE: Running and Troubleshooting

run npm update

***Note To Those who want to run the main branch***
***Note To Those who want to run/test***

-Works best with an Xbox 360 / Xbox One / XSX / XInput Controller, partial and inaccurate functionality also possible with alternatives, but not guaranteed due to lack of ability to test currently.

## Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

## Hopefully Near-Future Improvements

- Overhauling visual/interface components.
  - Including more customizablility in button arrangement and color schemes, adding different platform schemes and game-dependent labelling
  - Less debug interface garishly on the page (obviously)
  - Directional input path tracing and show/hide different direcitonal inputs in display / editor
  - Proper input display playback from the editor
- Implementing the 'Melodic Phrase' generator for playback
  - Arbitrarily sequential and procedural at first, then grouped based on input cluster recognition and user-selected grouping
  - Implement basic triad/chording for movement phrases, and melodic accompaniment for buttons, both based on chosen key & scale
  - Eventually creating more diverse and unique melodic interactions for longer/divergent input sequences, including different cadences/key shifts for branching input options (particularly in regard to fighting games and their combo systems)
- Implementing input 'Rehearsal' AKA matching the playback and subsequent feedback
  - Currently difficult to make meaningful and reliable due to sync criteria and feedback conflicts that are actively being worked on
- Fully implementing the database component and a proper interface for searching, tagging and loading different combos / inputs
