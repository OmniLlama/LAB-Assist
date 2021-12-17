##NOTE: if looking for latest working release, please use the master branch, as this branch has active changes that may be incomplete 
# LAB-Assist (Largely Audio-Based Assistant)

This is an Angular-based web-implementation of a fusion between a controller input viewer and MIDI sequencer / Recorder. It's ultimate intent is to allow the viewing / recording / modifying of inputs with dynamically-generated musical playback to assist in learning timing-intensive games and strategies, e.g. Fighting games, Character-Action games, and Speedrunning.

![LAB-Assist2](src/assets/LAB-Assist2.png)

## NOTE: To Those who want to run/test

-Works best with an Xbox 360 / Xbox One / XSX / XInput Controller, partial and inaccurate functionality also possible with alternatives, but not guaranteed due to lack of ability to test currently.

## NOTE: Running and Troubleshooting

before initial run, run `npm install`

further compatibility issues / future updates, run `npm update`

## Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

## Hopefully Near-Future Improvements

- Overhauling visual/interface components.
  - Including more customizablility in button arrangement and color schemes, adding different platform schemes and game-dependent labelling
  - show/hide different direcitonal inputs in editor
  - Proper input display playback from the editor
- Implementing the 'Melodic Phrase' generator for playback
  - Arbitrarily sequential and procedural at first, then grouped based on input cluster recognition and user-selected grouping
  - Implement basic triad/chording for movement phrases, and melodic accompaniment for buttons, both based on chosen key & scale
  - Eventually creating more diverse and unique melodic interactions for longer/divergent input sequences, including different cadences/key shifts for branching input options (particularly in regard to fighting games and their combo systems)
  - Implementing input 'Rehearsal' AKA matching the playback and subsequent feedback
- Fully implementing the database component and a proper interface for searching, tagging and loading different combos / inputs
