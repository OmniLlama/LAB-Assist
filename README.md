# NOTE: for the most updated version, please use the new-editor-implementation branch

# LAB-Assist (Largely Audio-Based Assistant)

This is an Angular-based web-implementation of a fusion between a controller input viewer and MIDI sequencer / Recorder. It's ultimate intent is to allow the viewing / recording / modifying of inputs with dynamically-generated musical playback to assist in learning timing-intensive games and strategies, e.g. Fighting games, Character-Action games, and Speedrunning.

![LAB-Assist1](https://user-images.githubusercontent.com/32592141/129633488-5f3e5bd9-b2d3-4445-a373-1e3725a880a5.png)

## NOTE: For MIDI Playback
install the Jazz MIDI Plugin
https://jazz-soft.net/download/Jazz-Plugin/

## NOTE: Running and Troubleshooting

run npm update

## Development server
Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`.

## Hopefully Near-Future Improvements

[//]: # (diff: -red +green !yellow #gray @@purpleBold@@)
- Implementing input 'Rehearsal' AKA matching the playback and subsequent feedback
  - Actively creating a new version of the editor component to fast-track this functionality.
- Overhauling visual/interface components.
  - Including more customizablility in button arrangement and color schemes, adding different platform schemes and game-dependent labelling
  - Less debug interface garishly on the page (obviously)
  - Directional input path tracing 
    - performative SVG-based solution implemented, working on placement reliability
  - show/hide different direcitonal inputs in editor
  - Proper input display playback from the editor
- Implementing the 'Melodic Phrase' generator for playback
  - Arbitrarily sequential and procedural at first, then grouped based on input cluster recognition and user-selected grouping
  - Implement basic triad/chording for movement phrases, and melodic accompaniment for buttons, both based on chosen key & scale
  - Eventually creating more diverse and unique melodic interactions for longer/divergent input sequences, including different cadences/key shifts for branching input options (particularly in regard to fighting games and their combo systems)

- Fully implementing the database component and a proper interface for searching, tagging and loading different combos / inputs
