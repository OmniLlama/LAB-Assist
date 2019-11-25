import { Component, OnInit, Inject } from '@angular/core';
import { Note, Part, MIDINote, Track, getMidiFiles, createSong, Instrument, Song } from "heartbeat-sequencer";
// import * as sequencer from 'heartbeat-sequencer';
declare let sequencer: any;


@Component({
  selector: 'app-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.sass'],
  template: `

    <div #edit id='editor'>

  <div id='score'>
    <div id='pitch-lines'></div>
    <div id='bar-lines'></div>
    <div id='tick-lines'></div>
    <div id='sub-tick-lines'></div>
    <div id='notes'></div>
    <div id='parts'></div>
    <div id='playhead'>
      <div id='playhead-line'></div>
    </div>
  </div>
</div>
<div id='editor-controls'>
  <span class="editor-control">
  <h4 id='midi-output-info'></h4>
  </span>
  <span class="editor-control">
    <input type='button'class="editor-control-param" id='play' value='play' />
    <input type='button'class="editor-control-param" id='record' value='record' />
    <input type='button'class="editor-control-param" id='loop' value='loop' />
    <input type='button'class="editor-control-param" id='stop' value='stop' />
  </span>
  <span class="editor-control">
    <div id='time-bars-beats'></div>
    <!-- <div class='pipe'>|</div> -->
    <div id='time-seconds'></div>
  </span>
  <span class="editor-control" id="pitch-range">Pitch Range:
    <input type="text" id='key-range-start' (ngModel)="pitchStart" value="{{pitchStart}}" />start
    <input type="text" id='key-range-end' (ngModel)="pitchEnd" value="{{pitchEnd}}" />end
    <button id="update-range" (click)="UpdatePitchRange()">Update</button>
  </span>
  <span class="editor-control">
    <!-- <div class='pipe'>|</div> -->
    <div id='mouse-x'>0</div>

    <!-- <div class='pipe'>|</div> -->
    <div id='mouse-y'>0</div>
  </span>
  <div class='pipe'>|</div>

  <span class="editor-control">
    <input type='button' id='first' value='<<' />
    <input type='button' id='prev' value='<' />
    <div id='page-numbers'>page 0 of 0</div>
    <input type='button' id='next' value='>' />
    <input type='button' id='last' value='>>' />
  </span>

  <div class='pipe'>|</div>
  <span class="editor-control">
    <input type='range' id='scale-slider' />
    <label for='scale-slider' id='scale-label'>#bars 16</label>
  </span>
  <span class="editor-control">
    <span>snap:
      <select id="snap">

        <!-- <option value='bar'>bar</option> <option value='beat' >beat</option> -->

        <option value='1'>whole</option>
        <option value='2'>half</option>
        <option value='4'>quarter</option>
        <option value='8'>8th</option>
        <option value='16'>16th</option>
        <option value='32'>32th</option>
        <option value='64'>64th</option>
        <option value='tick'>tick</option>
        <option value='off'>off</option>
      </select>
    </span>
  </span>
  <input type='button' id='add-part' value='add part' />
  <span class="editor-control">
  <div id='dbg-curr-note'>Sel Note: </div>
  <div id='dbg-curr-part'>Sel Part: </div>
    </span>
    </div>
  `
})
export class InputEditorComponent implements OnInit {
  static NOTE_OFF = 0x80;
  static NOTE_ON = 0x90;
  static inpEdComp;
  // inpEdComp = this;
  testMethod = 1;
  midiOutput;
  edtrHtml: EditorHTMLShell;
  edtrInfo: EditorInfo;
  midiFile;
  keyEditor;
  instruments;
  div_midiFileList;
  midiFileList;
  audCntxt;
  padShell;

  pitchStart = 0;
  pitchEnd = 80;
  track: Track;
  tracks: Track[];
  song: Song;
  constructor() {
  }
  ngOnInit() {
    // console.log(this.editShell);
    InputEditorComponent.inpEdComp = this;
    this.edtrInfo = new EditorInfo();
    this.edtrHtml = new EditorHTMLShell();
    this.init(this);
    // e_OnLoad();
  }
  ngAfterViewInit(): void {
    console.log("Finished creating editor shell");
  }
  init(iec: InputEditorComponent) {
    enableGUI(false);

    // tmp_c = div_Controls.getBoundingClientRect().height,
    let tmp_icons_w = 128;
    let tmp_div_icons = document.getElementById('editor-input-icons');
    let tmp_w = window.innerWidth - tmp_icons_w;
    let tmp_h = editorHeight;
    let tmp_event;

    tmp_div_icons.style.width = tmp_icons_w + 'px';
    tmp_div_icons.style.height = tmp_h + 'px';

    iec.edtrHtml.div_Editor.style.width = tmp_w + 'px';
    iec.edtrHtml.div_Editor.style.height = tmp_h + 'px';

    this.song = this.initSong();
    instruments = sequencer.getInstruments();
    // song.tracks.forEach(function(track) {track.setMidiInput()})
    //|------------------------------------------------------------------------------------------|


    /**
     * Compacts all song tracks onto single track, set to monitor, and set instrument to piano
     */
    if (flattenTracksToSingleTrack) {
      flattenTracks(this.song);
    }
    /**
     *
     * This is where KeyEditor is Made!!!
     */
    keyEditor = sequencer.createKeyEditor(this.song, {
      keyListener: true,
      viewportHeight: tmp_h,
      viewportWidth: tmp_w,
      lowestNote: pitchStart,
      highestNote: pitchEnd,
      barsPerPage: bppStart
    });
    //set editor element values to editor defaults
    setElementValue(iec.edtrHtml.txt_KeyRangeStart, keyEditor.lowestNote);
    setElementValue(iec.edtrHtml.txt_KeyRangeEnd, keyEditor.highestNote);
    setSliderValues(iec.edtrHtml.sldr_barsPerPage, keyEditor.barsPerPage, 1, 32, 1);

    initContextEvents(iec);
    initInputEvents(iec);
    initWindowEvents(iec);

    enableGUI(true);

    iec.edtrHtml.slct_Snap.selectedIndex = 4;
    tmp_event = document.createEvent('HTMLEvents');
    tmp_event.initEvent('change', false, false);
    iec.edtrHtml.slct_Snap.dispatchEvent(tmp_event);

    draw(iec);
    render(iec);

  }
  initSong(): Song {
    /**
  * Uncomment one to test different tracks, will add listing function soon
  */

    const tmp_midiFileName =
      'Blank Test';
    // 'Fantasie Impromptu';
    // 'Queen - Bohemian Rhapsody';
    // 'minute_waltz';
    // 'Thing';
    // 'Fail';
    let song: Song;
    let tmp_midiFiles = sequencer.getMidiFiles();
    let tmp_midiFile = tmp_midiFiles[0];
    if (tmp_midiFile === null || tmp_midiFile === undefined) {
      console.error("MIDI file name string invalid, defaulting to blank score...");
      tmp_midiFile = sequencer.getMidiFiles()[0];
    }
    switch (this.testMethod) {
      case 1:
        // method 1: create a song directly from the midi file, this way the midi file is treated as a config object
        if (tmp_midiFile !== undefined)
          song = sequencer.createSong(tmp_midiFile);
        else {
          song = sequencer.createSong();
        }
        song.useMetronome = true;
        this.track = song.tracks[0];
        break;

      case 2:
        // method 2: copy over some parts of the midi to a config object
        song = sequencer.createSong({
          bpm: 80, // original tempo is 125 bpm
          nominator: tmp_midiFile.nominator,
          denominator: tmp_midiFile.denominator,
          timeEvents: tmp_midiFile.timeEvents,
          tracks: tmp_midiFile.tracks,
          useMetronome: true
        });
        this.track = song.tracks[0];
        break;
      case 3:
        //method 3: just add base midiFile to a song, and continue
        song = sequencer.createSong(tmp_midiFile);
    }
    return song;
  }

  addAssetsToSequencer() {
    sequencer.addMidiFile({ url: '../../assets/midi/test.mid' }, null);
    sequencer.addMidiFile({ url: '../../assets/midi/minute_waltz.mid' }, null);
    sequencer.addMidiFile({ url: '../../assets/midi/chpn_op66.mid' }, null);
    sequencer.addMidiFile({ url: '../../assets/midi/Queen - Bohemian Rhapsody.mid' }, null);
  }
  enableGUI(flag) {
    let tmp_elements = document.querySelectorAll('input, select');
    let tmp_element;
    let i;
    let tmp_maxi = tmp_elements.length;

    for (i = 0; i < tmp_maxi; i++) {
      tmp_element = tmp_elements[i];
      tmp_element.disabled = !flag;
    }
  }
  flattenTracks(ref_song: Song) {
    ref_song.tracks.forEach(
      (track) => {
        track.setInstrument('piano');
        track.monitor = true;
        track.setMidiInput('all', true);
      }
    );
  }
  setElementValue(ref_elmt, val: string) { ref_elmt.value = val; }

  setSliderValues(ref_elmt, val: string, min: number, max: number, step: number) {
    ref_elmt.min = min;
    ref_elmt.max = max;
    ref_elmt.step = step;
    ref_elmt.value = val;
  }
}




let allNotes = {}; // stores references to all midi notes;
let allParts = {}; // stores references to all midi parts;
let currNote = null;
let currPart = null;
let flattenTracksToSingleTrack = true;
let editorHeight = 480;
let pitchHeight = 32;
let pitchStart = 0; //default: 21
let pitchEnd = 40;  //default: 108
let bppStart = 16;  //default: 16

let testMethod = 1;
let midiFile;
let keyEditor;
// let song;
let track: Track;
let instruments: Instrument[];
let div_MidiFileList;
let midiFileList;
let audCntxt;
let padShell;
// let sequencer = window.sequencer;
let
  console = window.console;
// alert = window.alert,
// requestAnimationFrame = window.requestAnimationFrame;



// function initSong() {
//   /**
// * Uncomment one to test different tracks, will add listing function soon
// */
//   let tmp_midiFileName =
//     'Blank Test';
//   // 'Fantasie Impromptu';
//   // 'Queen - Bohemian Rhapsody';
//   // 'minute_waltz';
//   // 'Thing';
//   // 'Fail';
//   // let tmp_midiFile = sequencer.getMidiFile(tmp_midiFileName, false);
//   let tmp_midiFile = sequencer.getMidiFile(tmp_midiFileName, null);
//   if (tmp_midiFile === null) {
//     console.error("MIDI file name string invalid, defaulting to blank score...");
//     tmp_midiFile = sequencer.getMidiFiles()[0];
//   }
//   switch (testMethod) {
//     case 1:
//       // method 1: create a song directly from the midi file, this way the midi file is treated as a config object
//       // tmp_midiFile.useMetronome = true;
//       song = sequencer.createSong(tmp_midiFile);
//       track = song.tracks[0];
//       break;

//     case 2:
//       // method 2: copy over some parts of the midi to a config object
//       song = sequencer.createSong({
//         bpm: 80, // original tempo is 125 bpm
//         nominator: tmp_midiFile.nominator,
//         denominator: tmp_midiFile.denominator,
//         timeEvents: tmp_midiFile.timeEvents,
//         tracks: tmp_midiFile.tracks,
//         useMetronome: true,
//         pitchHeight: pitchHeight
//       });
//       track = song.tracks[0];
//       break;
//     case 3:
//       //method 3: just add base midiFile to a song, and continue
//       song = sequencer.createSong(tmp_midiFile);
//   }
// }
function initWindowEvents(iec: InputEditorComponent) {
  /**
   * Check for working Audio Context, and if not, create one and resume it when user mouses over window
   */
  window.addEventListener('mouseover', (e) => {
    // if (!window.AudioContext) {
    //   console.log('hitting the context startup');
    // }
    // if (!audCntxt) {
    //   audCntxt = new AudioContext();
    //   audCntxt.resume();
    // }
  });
  window.addEventListener('resize', (e) => { resize(); }, false);
}

function initContextEvents(iec: InputEditorComponent) {
  iec.song.addEventListener('play', () => { setElementValue(iec.edtrHtml.btn_Play, 'pause'); });
  iec.song.addEventListener('pause', () => { setElementValue(iec.edtrHtml.btn_Play, 'play'); });
  iec.song.addEventListener('stop', () => { setElementValue(iec.edtrHtml.btn_Play, 'play'); });

  iec.edtrHtml.div_Editor.addEventListener('mousedown', () => {
    iec.edtrHtml.div_currPart.innerHTML = 'Sel Part: ' + (currPart !== null ? currPart.id : 'none');
    iec.edtrHtml.div_currNote.innerHTML = 'Sel Note: ' + (currNote !== null ? currNote.id : 'none');
  });
}

function initInputEvents(iec) {
  /**
   * Text
   */
  iec.edtrHtml.txt_KeyRangeStart.addEventListener('change', (e) => {
    iec.song.setPitchRange(iec.edtrHtml.txt_KeyRangeStart.value, keyEditor.highestNote);
    iec.song.update();
  });
  iec.edtrHtml.txt_KeyRangeEnd.addEventListener('change', (e) => {
    iec.song.setPitchRange(keyEditor.lowestNote, iec.edtrHtml.txt_KeyRangeEnd.value);
    iec.song.update();
  });
  // listen for scale and draw events, a scale event is fired when you change the number of bars per page
  // a draw event is fired when you change the size of the viewport by resizing the browser window
  keyEditor.addEventListener('scale draw', () => { draw(iec); });

  // listen for scroll events, the score automatically follows the song positon during playback: as soon as
  // the playhead moves off the right side of the screen, a scroll event is fired
  keyEditor.addEventListener('scroll', (data) => { iec.edtrHtml.div_Editor.scrollLeft = data.x; });
  /**
   * EXPERIMENTAL - Add notes and parts when double clicked in certain contexts
   */
  iec.edtrHtml.div_Score.addEventListener('dblclick', (e) => { evt_Grid_lMouDbl(e, iec); });
  // you can set the playhead at any position by clicking on the score
  /**
   * OR - if element clicked on is a part or note, it sets the current note / part to that element
   */
  iec.edtrHtml.div_Score.addEventListener('mousedown', (e) => { evt_Generic_lMouDown(e); });
  /**
   * AUDIO CONTEXT CHECKER EVENT
   */
  iec.edtrHtml.div_Editor.addEventListener('click', (e) => {
    // if (!audCntxt) {
    //   audCntxt = new AudioContext();
    //   audCntxt.resume();
    //   if (window.AudioContext && window.AudioContext != audCntxt) {
    //     window.AudioContext = audCntxt;
    //     console.log('hitting the context startup');
    //   }
    // }
  });
  // if you scroll the score by hand you must inform the key editor. necessary for calculating
  // the song position by x coordinate and the pitch by y coordinate
  iec.edtrHtml.div_Editor.addEventListener('scroll', () => {
    keyEditor.updateScroll(iec.edtrHtml.div_Editor.scrollLeft, iec.edtrHtml.div_Editor.scrollTop);
  }, false);
  /**
   * Score Mouse Movement Tracker
   */
  iec.edtrHtml.div_Score.addEventListener('mousemove', (e) => {
    e.preventDefault();
    let tmp_x = e.pageX,
      tmp_y = e.pageY,
      tmp_pos = keyEditor.getPositionAt(tmp_x),
      tmp_part = keyEditor.selectedPart,
      tmp_note = keyEditor.selectedNote;

    // show the song position and pitch of the current mouse position; handy for debugging
    iec.edtrInfo.mouseX = tmp_x;
    iec.edtrInfo.mouseY = tmp_y;
    iec.edtrInfo.mouseBarPos = tmp_pos.barsAsString;
    iec.edtrHtml.div_MouseX.innerHTML = 'x Bar: ' + iec.edtrInfo.mouseBarPos +
      '\nx client: ' + e.clientX +
      '\nx Score scrl: ' + iec.edtrHtml.div_Score.scrollLeft +
      '\nx edit scrl: ' + iec.edtrHtml.div_Editor.scrollLeft +
      '\nx head : ' + keyEditor.getPlayheadX();
    ;
    iec.edtrInfo.mousePitchPos = keyEditor.getPitchAt(tmp_y - iec.edtrHtml.div_Score.offsetTop).number;
    iec.edtrHtml.div_MouseY.innerHTML = 'y Pitch: ' + iec.edtrInfo.mousePitchPos;

    // move part or note if selected
    if (tmp_part !== undefined) {
      keyEditor.movePart(tmp_x, tmp_y);
    }
    if (tmp_note !== undefined) {
      keyEditor.moveNote(tmp_x, tmp_y - iec.edtrHtml.div_Score.offsetTop);
    }
  },
    false
  );
  /**
   * Grid
   */
  iec.edtrHtml.slct_Snap.addEventListener('change', () => {
    keyEditor.setSnapX(iec.edtrHtml.slct_Snap.options[iec.edtrHtml.slct_Snap.selectedIndex].value);
  }, false);
  /**
   * Buttons
   */
  iec.edtrHtml.btn_Play.addEventListener('click', () => { iec.song.pause(); });
  iec.edtrHtml.btn_Record.addEventListener('click', () => { iec.song.startRecording(); });
  iec.edtrHtml.btn_Loop.addEventListener('click', () => { iec.song.loop = !iec.song.loop; });

  iec.edtrHtml.btn_Stop.addEventListener('click', () => { iec.song.stop(); });
  iec.edtrHtml.btn_Next.addEventListener('click', () => { keyEditor.scroll('>'); });
  iec.edtrHtml.btn_Prev.addEventListener('click', () => { keyEditor.scroll('<'); });
  iec.edtrHtml.btn_First.addEventListener('click', () => { keyEditor.scroll('<<'); });
  iec.edtrHtml.btn_Last.addEventListener('click', () => { keyEditor.scroll('>>'); });
  iec.edtrHtml.btn_AddPart.addEventListener('click', () => { addRandomPartAtPlayhead(this); });
  /**
   * Sliders
   */
  iec.edtrHtml.sldr_barsPerPage.addEventListener(
    'change',
    function (e) {
      var tmp_bpp = parseFloat(e.target.value);
      iec.edtrHtml.lbl_sldr_barsPerPage.innerHTML = '#bars ' + tmp_bpp;
      keyEditor.setBarsPerPage(tmp_bpp);
    },
    false
  );
  /**
   * Keyboard Shortcuts
   */
  window.addEventListener("keydown", (e) => {
    if (e.key == "Backspace") { iec.song.stop(); }
    if (e.key == " ") { iec.song.pause(); }
    if (e.key == "Delete") { }
    //dumb hack: brings playhead to first displayed location from left if offscreen to the left
    if (e.key == "ArrowRight") { keyEditor.setPlayheadToX(Math.max(keyEditor.getPlayheadX(true) + 16, 0)); }
    if (e.key == "ArrowLeft") { keyEditor.setPlayheadToX((keyEditor.getPlayheadX(true)) - 16, 0); }
  });
}
//#region [rgba(200, 0, 0, 0.05)] Selection Visuals Methods
function setNoteActiveState(ref_note, ref_div_Note) {
  ref_div_Note = document.getElementById(ref_note.id);
  if (ref_div_Note !== null) {
    if (ref_note.part.mute === false) {
      if (ref_note.mute !== true) {
        if (ref_note.active) {
          ref_div_Note.className = 'note note-active';
        } else if (ref_note.active === false) {
          ref_div_Note.className = 'note';
        }
      }
    }
  }
}

function selectNote(ref_note) {
  let tmp_div_Note = document.getElementById(ref_note.id);
  if (tmp_div_Note !== null) {
    if (ref_note.part.mute === false) {
      if (ref_note.mute !== true) {
        tmp_div_Note.className = 'note note-selected';
      }
    }
  }
}
function unselectNote(ref_note) {
  let tmp_div_Note = document.getElementById(ref_note.id);
  if (ref_note.part.mute === false) {
    if (ref_note.mute !== true) {
      if (tmp_div_Note !== null) {
        tmp_div_Note.className = 'note';
      }
    }
  }
}
function setPartActiveState(ref_part, ref_div_Part) {
  ref_div_Part = document.getElementById(ref_part.id);
  if (ref_div_Part !== null) {
    if (ref_part.mute !== true) {
      if (ref_part.active) {
        ref_div_Part.className = 'part part-active';
      } else if (ref_part.active === false) {
        ref_div_Part.className = 'part';
      }
    }
  }
}
function selectPart(ref_part) {
  let tmp_div_Part = document.getElementById(ref_part.id);
  if (ref_part.mute === false) {
    if (ref_part.mute !== true) {
      tmp_div_Part.className = 'part part-selected';
    }
  }
}
function unselectPart(ref_part) {
  let tmp_div_Part = document.getElementById(ref_part.id);
  if (ref_part.mute === false) {
    if (ref_part.mute !== true) {
      if (tmp_div_Part !== null) {
        tmp_div_Part.className = 'part';
      }
    }
  }
}
//#endregion
function setElementValue(ref_elmt, val) { ref_elmt.value = val; }

function setSliderValues(ref_elmt, val, min, max, step) {
  ref_elmt.min = min;
  ref_elmt.max = max;
  ref_elmt.step = step;
  ref_elmt.value = val;
}
//#region [rgba(120, 120, 0 ,0.15)] Draw Functions
function draw(iec) {
  //Initialize all Grid HTML elements to blank
  allNotes = {};
  allParts = {};
  iec.edtrHtml.divs_AllNotes = {};
  iec.edtrHtml.divs_AllParts = {};
  iec.edtrHtml.div_Parts.innerHTML = '';
  iec.edtrHtml.div_Notes.innerHTML = '';
  iec.edtrHtml.div_PitchLines.innerHTML = '';
  iec.edtrHtml.div_BarLines.innerHTML = '';
  iec.edtrHtml.div_BeatLines.innerHTML = '';
  iec.edtrHtml.div_SixteenthLines.innerHTML = '';

  keyEditor.horizontalLine.reset();
  keyEditor.verticalLine.reset();
  keyEditor.noteIterator.reset();
  keyEditor.partIterator.reset();

  iec.edtrHtml.div_Score.style.width = keyEditor.width + 'px';
  let i = 0;
  while (keyEditor.horizontalLine.hasNext('chromatic')) { drawHorizontalLine(keyEditor.horizontalLine.next('chromatic')); }
  while (keyEditor.verticalLine.hasNext('sixteenth')) { drawVerticalLine(keyEditor.verticalLine.next('sixteenth')); }
  while (keyEditor.noteIterator.hasNext()) { drawNote(keyEditor.noteIterator.next(), iec); }
  while (keyEditor.partIterator.hasNext()) { drawPart(keyEditor.partIterator.next(), iec); }
}

function drawHorizontalLine(ref_data, iec = null) {
  let tmp_div_HLine = document.createElement('div'),
    pitchHeight = keyEditor.pitchHeight;

  if (ref_data.note.blackKey === true) {
    tmp_div_HLine.className = 'pitch-line black-key';
  } else {
    tmp_div_HLine.className = 'pitch-line';
  }
  tmp_div_HLine.id = ref_data.note.fullName;
  tmp_div_HLine.innerHTML = ref_data.note.fullName;
  tmp_div_HLine.style.height = pitchHeight + 'px';
  tmp_div_HLine.style.top = ref_data.y + 'px';
  // tmp_div_HLine.y = ref_data.y;
  if (iec !== null)
    iec.edtrHtml.div_PitchLines.appendChild(tmp_div_HLine);

}

function drawVerticalLine(ref_data, iec = null) {
  let tmp_type = ref_data.type,
    tmp_div_VLine = document.createElement('div');

  tmp_div_VLine.id = ref_data.position.barsAsString;
  tmp_div_VLine.className = ref_data.type + '-line';
  tmp_div_VLine.style.left = ref_data.x + 'px';
  tmp_div_VLine.style.width = '5px'; // if you make the width too small, the background image of sometimes disappears
  // tmp_div_VLine.x = ref_data.x;

  switch (tmp_type) {
    case 'bar':
      tmp_div_VLine.innerHTML = ref_data.position.barsAsString;
      if (iec !== null)
        iec.edtrHtml.div_BarLines.appendChild(tmp_div_VLine);
      break;
    case 'beat':
      if (iec !== null)
        iec.edtrHtml.div_BeatLines.appendChild(tmp_div_VLine);
      break;
    case 'sixteenth':
      if (iec !== null)
        iec.edtrHtml.div_SixteenthLines.appendChild(tmp_div_VLine);
      break;
  }
}

function drawNote(ref_note, iec) {
  let tmp_bbox = ref_note.bbox;
  let tmp_bbox_left = subdivBBox(ref_note.bbox, 0.1, 0, 1, 0);
  let tmp_bbox_right = subdivBBox(ref_note.bbox, 0.1, 0.9, 1, 0);
  let tmp_div_Note = document.createElement('div');
  let tmp_div_Note_leftEdge = document.createElement('div');
  let tmp_div_Note_rightEdge = document.createElement('div');

  tmp_div_Note.id = ref_note.id;
  tmp_div_Note.className = 'note';

  tmp_div_Note_leftEdge.id = tmp_div_Note.id;
  tmp_div_Note_leftEdge.className = 'note-edge';

  tmp_div_Note_rightEdge.id = tmp_div_Note.id;
  tmp_div_Note_rightEdge.className = 'note-edge';

  updateElementBBox(tmp_div_Note, tmp_bbox);
  updateElementBBox(tmp_div_Note_leftEdge, tmp_bbox_left);
  updateElementBBox(tmp_div_Note_rightEdge, tmp_bbox_right);

  // store note and div
  allNotes[ref_note.id] = ref_note;
  iec.edtrHtml.divs_AllNotes[ref_note.id] = tmp_div_Note;
  tmp_div_Note.addEventListener('mousedown', evt_Note_lMouDown, false);
  tmp_div_Note_leftEdge.addEventListener('mouseover', (e) => { evt_NoteEdge_Left_MouOver(e); });
  tmp_div_Note_leftEdge.addEventListener('mousedown', (e) => { evt_NoteEdge_Left_lMouDown(e); });
  tmp_div_Note_rightEdge.addEventListener('mouseover', (e) => { evt_NoteEdge_Right_MouOver(e); });
  tmp_div_Note_rightEdge.addEventListener('mousedown', (e) => { evt_NoteEdge_Right_lMouDown(e); });

  tmp_div_Note.append(tmp_div_Note_leftEdge);
  tmp_div_Note.append(tmp_div_Note_rightEdge);
  iec.edtrHtml.div_Notes.appendChild(tmp_div_Note);
}

function drawPart(ref_part, iec) {
  let tmp_bbox = ref_part.bbox,
    tmp_div_Part = document.createElement('div');

  tmp_div_Part.id = ref_part.id;
  tmp_div_Part.className = 'part';
  tmp_div_Part.style.left = tmp_bbox.left + 'px';
  tmp_div_Part.style.top = tmp_bbox.top + 'px';
  tmp_div_Part.style.width = tmp_bbox.width - 1 + 'px';
  tmp_div_Part.style.height = tmp_bbox.height - 1 + 'px';

  // store part and div
  allParts[ref_part.id] = ref_part;
  iec.edtrHtml.divs_AllParts[ref_part.id] = tmp_div_Part;
  tmp_div_Part.addEventListener('mousedown', evt_Part_lMouDown, false);
  iec.edtrHtml.div_Parts.appendChild(tmp_div_Part);
}
//Fits element within its bounding box
function updateElementBBox(element, bbox) {
  element.style.left = bbox.x + 'px';
  element.style.top = bbox.y + 'px';
  element.style.width = bbox.width + 'px';
  element.style.height = bbox.height + 'px';
}

function resize() {
  let
    tmp_icons_w = 128,
    tmp_div_icons = document.getElementById('editor-input-icons'),
    tmp_c = this.edtrHtml.div_Controls.getBoundingClientRect().height,
    tmp_w = window.innerWidth - tmp_icons_w,
    tmp_h = editorHeight;

  // tell the key editor that the viewport has canged, necessary for auto scroll during playback
  keyEditor.setViewport(tmp_w, tmp_h);
  tmp_div_icons.style.width = tmp_icons_w + 'px';
  tmp_div_icons.style.height = tmp_h + 'px';
  this.edtrHtml.div_Editor.style.width = tmp_w + 'px';
  this.edtrHtml.div_Editor.style.height = tmp_h + 'px';
}

function render(iec) {
  let tmp_snapshot = keyEditor.getSnapshot('key-editor'),
    tmp_div_Note,
    tmp_div_Part;

  iec.edtrHtml.div_Playhead.style.left = keyEditor.getPlayheadX() - 10 + 'px';
  iec.edtrHtml.div_PageNumbers.innerHTML =
    'page ' + keyEditor.currentPage + ' of ' + keyEditor.numPages;

  iec.edtrHtml.div_BarsBeats.innerHTML = iec.song.barsAsString;
  iec.edtrHtml.div_Seconds.innerHTML = iec.song.timeAsString;

  tmp_snapshot.notes.removed.forEach((note) => {
    iec.edtrHtml.divs_AllNotes[note.id].removeEventListener('mousedown', evt_Note_lMouDown);
    iec.edtrHtml.div_Notes.removeChild(document.getElementById(note.id));
  });

  tmp_snapshot.notes.new.forEach((note) => { drawNote(note, iec); });
  tmp_snapshot.notes.recorded.forEach((note) => { drawNote(note, iec); });
  tmp_snapshot.notes.recording.forEach((note) => { updateElementBBox(iec.edtrHtml.divs_AllNotes[note.id], note.bbox); });
  // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
  tmp_snapshot.notes.changed.forEach((note) => { updateElementBBox(iec.edtrHtml.divs_AllNotes[note.id], note.bbox); });

  // stateChanged arrays contain elements that have become active or inactive
  tmp_snapshot.notes.stateChanged.forEach((note) => { setNoteActiveState(note, tmp_div_Note); });

  tmp_snapshot.parts.removed.forEach((part) => {
    this.edtrHtml.divs_AllParts[part.id].removeEventListener('mousedown', evt_Part_lMouDown);
    this.edtrHtml.div_Parts.removeChild(document.getElementById(part.id));
  });

  tmp_snapshot.parts.new.forEach((part) => { drawPart(part, iec); });

  // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
  tmp_snapshot.parts.changed.forEach((part) => { updateElementBBox(iec.edtrHtml.divs_AllParts[part.id], part.bbox); });

  // stateChanged arrays contain elements that have become active or inactive
  tmp_snapshot.parts.stateChanged.forEach((part) => { setPartActiveState(part, tmp_div_Part); });

  if (tmp_snapshot.hasNewBars) {
    // set the new width of the score
    this.edtrHtml.div_Score.style.width = tmp_snapshot.newWidth + 'px';

    // clear the horizontal lines because the lines have to be drawn longer
    this.edtrHtml.div_PitchLines.innerHTML = '';

    // reset the index of the iterator because we're starting from 0 again
    keyEditor.horizontalLine.reset();
    while (keyEditor.horizontalLine.hasNext('chromatic')) { drawHorizontalLine(keyEditor.horizontalLine.next('chromatic')); }

    // the index of the vertical line iterator has already been set to the right index by the key editor
    // so only the extra barlines will be drawn
    while (keyEditor.verticalLine.hasNext('sixteenth')) { drawVerticalLine(keyEditor.verticalLine.next('sixteenth')); }
  }
  requestAnimationFrame(() => render(iec));
}

//#endregion
function enableGUI(flag) {
  let tmp_elements = document.querySelectorAll('input, select'),
    tmp_element,
    i,
    tmp_maxi = tmp_elements.length;

  for (i = 0; i < tmp_maxi; i++) {
    tmp_element = tmp_elements[i];
    tmp_element.disabled = !flag;
  }
}
let heldEdge,
  changingNote,
  holdingEdge = false;
//#region [rgba(0,100,0,0.2)] Grid Element Event Functions
/*
  Part
  */
function evt_Part_lMouDown(e) {
  let tmp_part = allParts[e.target.id];
  if (e.ctrlKey) {
    keyEditor.removePart(tmp_part);
    unselectPart(tmp_part);
    currPart = null;
    if (currNote !== null)
      unselectNote(currNote);
    currNote = null;
  } else {
    keyEditor.startMovePart(tmp_part, e.clientX + this.edtrHtml.div_Editor.scrollLeft, e.clientY); //default values
    // keyEditor.startMovePart(tmp_part, e.clientY, e.clientY);
    document.addEventListener('mouseup', evt_Part_lMouUp, false);
  }
}

function evt_Part_lMouUp(e) {
  keyEditor.stopMovePart();
  document.removeEventListener('mouseup', evt_Part_lMouUp);
}
/*
  Note Stuff
  */
function evt_Note_lMouDown(e) {
  if (!holdingEdge) {
    let tmp_note = allNotes[e.target.id];
    if (e.ctrlKey) {
      keyEditor.removeNote(tmp_note);
      currNote = null;
    } else {
      keyEditor.startMoveNote(tmp_note, e.clientX + this.edtrHtml.div_Editor.scrollLeft, e.clientY); //default values
      document.addEventListener('mouseup', evt_Note_lMouUp, false);
    }
  }
}

function evt_Note_lMouUp(e) {
  keyEditor.stopMoveNote();
  document.removeEventListener('mouseup', evt_Note_lMouUp);
}
/*
  Note Edge Stuff
 */
function evt_NoteEdge_Left_MouOver(e) { e.target.style.cursor = 'w-resize'; }
function evt_NoteEdge_Right_MouOver(e) { e.target.style.cursor = 'e-resize'; }

function evt_NoteEdge_Left_lMouDown(e) {
  holdingEdge = true;
  e.target.style.cursor = 'w-resize';
  let tmp_note = allNotes[e.target.id];
  keyEditor.gripX = tmp_note.bbox.x;
  if (tmp_note == undefined) {
    tmp_note = changingNote;
  }
  if (changingNote == null)
    changingNote = tmp_note;
  if (heldEdge == null)
    heldEdge = e.target;
  document.addEventListener('mousemove', evt_NoteEdge_Left_MouMove, false);
  document.addEventListener('mouseup', evt_NoteEdge_Left_lMouUp);
}
function evt_NoteEdge_Right_lMouDown(e) {
  holdingEdge = true;
  e.target.style.cursor = 'e-resize';
  let tmp_note = allNotes[e.target.id];
  keyEditor.gripX = tmp_note.bbox.x;
  if (tmp_note == undefined) {
    tmp_note = changingNote;
  }
  if (changingNote == null)
    changingNote = tmp_note;
  if (heldEdge == null)
    heldEdge = e.target;
  document.addEventListener('mousemove', evt_NoteEdge_Right_MouMove, false);
  document.addEventListener('mouseup', evt_NoteEdge_Right_lMouUp);
}
function evt_NoteEdge_Left_MouMove(e) {
  let tmp_ticks = keyEditor.getTicksAt(this.edtrHtml.mouseX);
  let tmp_rightEdge = heldEdge.parentElement.childNodes[1];

  if (changingNote !== null) {
    changingNote.part.moveEvent(changingNote.noteOn, tmp_ticks - changingNote.noteOn.ticks);
    // changingNote.part.moveEvent(changingNote.noteOn, );
    changingNote.part.moveEvent(changingNote.noteOff, -(tmp_ticks - changingNote.noteOn.ticks));
    updateElementBBox(heldEdge, subdivBBox(changingNote.bbox, 0.1, 0, 1, 0));
    updateElementBBox(tmp_rightEdge, subdivBBox(changingNote.bbox, 0.1, 0.9, 1, 0));
    this.song.update();
  }
  else {

  }
}
function evt_NoteEdge_Right_MouMove(e) {
  let tmp_ticks = keyEditor.getTicksAt(this.edtrHtml.mouseX);
  let tmp_leftEdge = heldEdge.parentElement.childNodes[0];
  if (changingNote !== null) {
    changingNote.part.moveEvent(changingNote.noteOff, tmp_ticks - changingNote.noteOff.ticks);
    updateElementBBox(heldEdge, subdivBBox(changingNote.bbox, 0.1, 0.9, 1, 0));
    updateElementBBox(tmp_leftEdge, subdivBBox(changingNote.bbox, 0.1, 0, 1, 0));
    this.song.update();
  }
  else {

  }
}
function evt_NoteEdge_Left_lMouUp(e) {
  holdingEdge = false;
  changingNote = null;
  heldEdge = null;
  document.removeEventListener('mousemove', evt_NoteEdge_Left_MouMove, false);
  document.removeEventListener('mouseup', evt_NoteEdge_Left_lMouUp);
  this.song.update();
}
function evt_NoteEdge_Right_lMouUp(e) {
  holdingEdge = false;
  changingNote = null;
  heldEdge = null;
  document.removeEventListener('mousemove', evt_NoteEdge_Right_MouMove, false);
  document.removeEventListener('mouseup', evt_NoteEdge_Right_lMouUp);
  this.song.update();
}
/*
  Grid Stuff
*/
function evt_Grid_lMouDown(e) { }

function evt_Grid_lMouUp(e) { }

function evt_Grid_lMouDbl(e, iec = this) {
  let tmp_className = e.target.className;
  /**
   * if double clicking a note
   * */
  if (tmp_className.indexOf('note') !== -1) {
    currNote = allNotes[e.target.id];
    currPart = currNote.part;
    return;
  }
  /**
   * if double clicking a blank section of a part
   * */
  else if (tmp_className.indexOf('part') !== -1) {
    currPart = allParts[e.target.id];
    currPart.addEvents(createNewNoteInPartAtMouse(currPart, iec));
    this.song.update();
    return;
  }
  /**
   * if double clicking grid but current part is selected
   * */
  else if (currPart) {
    // currPart.addEvents(addNewNoteAtMouse());
    this.song.update();
    return;
  }
  /**
   *if double clicking empty grid space
   * */
  else {
    currNote = null;
    currPart = null;
    addPartAtMouse(iec);
    return;
  }

}
function evt_Generic_lMouDown(e) {
  let tmp_className = e.target.className;
  if (tmp_className.indexOf('note') !== -1) {
    if (currNote !== null)
      unselectNote(currNote);
    currNote = allNotes[e.target.id];
    if (currNote !== null)
      selectNote(currNote);
    currPart = currNote.part;
    if (currPart !== null)
      selectPart(currPart);
    return;
  } else if (tmp_className.indexOf('part') !== -1) {
    // keyEditor.setPlayheadToX(e.pageX);
    if (currPart !== null)
      unselectPart(currPart);
    currPart = allParts[e.target.id];
    if (currPart !== null)
      selectPart(currPart);
    if (currNote !== null)
      unselectNote(currNote);
    currNote = null;
    return;
  } else {
    if (currNote !== null)
      unselectNote(currNote);
    currNote = null;
    if (currPart !== null)
      unselectPart(currPart);
    currPart = null;
    // keyEditor.setPlayheadToX(e.pageX);
    keyEditor.setPlayheadToX(e.clientX);
  }
  // you could also use:
  //song.setPlayhead('ticks', keyEditor.xToTicks(e.pageX));
}
//#endregion

//#region [ rgba(200, 200, 200, 0.1) ] Random Generation Functions
function getRandom(num_min, num_max, bool_round) {
  let tmp_r = Math.random() * (num_max - num_min) + num_min;
  if (bool_round === true) {
    return Math.round(tmp_r);
  } else {
    return tmp_r;
  }
}

function addRandomPartAtPlayhead(iec: InputEditorComponent) {
  let i,
    tmp_ticks = 0, //startPositions[getRandom(0, 4, true)],
    tmp_numNotes = getRandom(4, 8, true),
    tmp_spread = 5,
    tmp_basePitch = getRandom(
      keyEditor.lowestNote + tmp_spread,
      keyEditor.highestNote - tmp_spread,
      true
    ),
    tmp_part = sequencer.createPart(),
    tmp_events = [],
    tmp_noteLength = iec.song.ppq / 2,
    tmp_pitch,
    tmp_velocity;

  for (i = 0; i < tmp_numNotes; i++) {
    tmp_pitch = tmp_basePitch + getRandom(-tmp_spread, tmp_spread, true);
    tmp_velocity = getRandom(50, 127, true);

    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_ON, tmp_pitch, tmp_velocity));
    tmp_ticks += tmp_noteLength;
    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_OFF, tmp_pitch, 0));
    tmp_ticks += tmp_noteLength;
  }
  tmp_ticks = keyEditor.getTicksAt(keyEditor.getPlayheadX());

  tmp_part.addEvents(tmp_events);
  if (!track) track = iec.song.tracks[0];
  if (!track) track = sequencer.createTrack("forcedTrack");
  track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
  iec.song.update();
}

function addPartAtMouse(iec: InputEditorComponent) {
  keyEditor.setPlayheadToX(iec.edtrInfo.mouseX);
  let i;
  let tmp_ticks = 0; //startPositions[getRandom(0, 4, true)],
  let tmp_numNotes = 2;
  let tmp_spread = 1;
  let tmp_basePitch = keyEditor.getPitchAt(iec.edtrInfo.mouseY - iec.edtrHtml.div_Score.offsetTop).number;
  let tmp_part = sequencer.createPart();
  let tmp_events = [];
  let tmp_noteLength = iec.song.ppq * 2;
  let tmp_pitch;
  let tmp_velocity;

  for (i = 0; i < tmp_numNotes; i++) {
    // pitch = basePitch + getRandom(-spread, spread, true);
    tmp_pitch = tmp_basePitch;
    tmp_velocity = getRandom(50, 127, true);

    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_ON, tmp_pitch, tmp_velocity));
    tmp_ticks += tmp_noteLength;
    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_OFF, tmp_pitch, 0));
    tmp_ticks += tmp_noteLength;
  }
  tmp_ticks = keyEditor.getTicksAt(keyEditor.getPlayheadX(true));

  tmp_part.addEvents(tmp_events);
  if (!track) {
    track = iec.song.tracks[0];
  }
  if (!track) {
    track = sequencer.createTrack("forcedTrack");
    iec.song.addTrack(track);
  }
  track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
  track.update();
  iec.song.update();
}
//#endregion



/**
 * EXPERIMENTAL
 */
function createNewNoteInPartAtMouse(tmp_part, iec) {
  let tmp_pitch = keyEditor.getPitchAt(this.edtrHtml.mouseY - this.edtrHtml.div_Score.offsetTop).number;
  let tmp_velocity = 127;
  let tmp_events = [];
  let tmp_noteLength = iec.song.ppq/*  * 2 */;
  let tmp_ticks = keyEditor.getTicksAt(this.edtrHtml.mouseX);
  let tmp_noteOn;
  let tmp_noteOff;
  let tmp_note;
  // tmp_note = sequencer.createNote(pitch.number);
  tmp_noteOn = sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_ON, tmp_pitch, tmp_velocity);
  tmp_ticks += tmp_noteLength;
  tmp_noteOff = sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_OFF, tmp_pitch, 0);
  tmp_events.push(tmp_noteOn, tmp_noteOff);
  tmp_ticks = keyEditor.getTicksAt(this.edtrHtml.mouseX);
  console.log('added new note: \n ' +
    'pitch: ' + tmp_pitch.number + '\n' +
    'at ticks: ' + tmp_ticks + '\n' +
    'velocity: ' + tmp_velocity + '\n' +
    'length: ' + tmp_noteLength + '\n'
  );

  return tmp_events;
}

function flattenTracks(ref_song) {
  ref_song.tracks.forEach(
    function (track) {
      track.setInstrument('piano');
      track.monitor = true;
      track.setMidiInput('all');
    }
  );
}
function subdivBBox(ref_bbox, ref_xRatio: number, ref_xOffsetRatio: number, ref_yRatio: number, ref_yOffsetRatio: number) {
  let tmp_bbox = {
    left: (ref_bbox.width * ref_xOffsetRatio),
    top: (ref_bbox.height * ref_yOffsetRatio),
    width: ref_bbox.width * ref_xRatio,
    height: ref_bbox.height * ref_yRatio
  }
  // tmp_bbox.x = tmp_bbox.left;
  // tmp_bbox.y = tmp_bbox.top;
  if (tmp_bbox.width < 1) tmp_bbox.width = 1;
  return tmp_bbox;
}
function subdivBBoxByPixels(ref_bbox, ref_xRatio, ref_xOffsetRatio: number, ref_yRatio: number, ref_yOffsetRatio: number, ref_minWidth: number, ref_maxWidth: number) {
  let tmp_bbox = {
    left: (ref_bbox.width * ref_xOffsetRatio),
    top: (ref_bbox.height * ref_yOffsetRatio),
    width: ref_bbox.width * ref_xRatio,
    height: ref_bbox.height * ref_yRatio
  }
  // tmp_bbox.x = tmp_bbox.left;
  // tmp_bbox.y = tmp_bbox.top;
  if (tmp_bbox.width < ref_minWidth) { tmp_bbox.width = ref_minWidth; }
  else if (tmp_bbox.width > ref_maxWidth) { tmp_bbox.width = ref_maxWidth; }
  return tmp_bbox;
}
export class EditorInfo {
  mouseX: number;
  mouseBarPos;
  mouseY: number;
  mousePitchPos;
  instruments: Instrument[];
  currNote = null;
  currPart = null;
  pitchStart = 0;
  pitchEnd = 80;
  allNotes: Note[];
  allParts: Part[];
  flattenTracksToSingleTrack = true;
  editorHeight = 480;
  edHTMLShell = new EditorHTMLShell();
}
export class EditorHTMLShell {
  btn_Play: HTMLButtonElement;
  btn_Stop: HTMLButtonElement;
  btn_Record: HTMLButtonElement;
  btn_Loop: HTMLButtonElement;
  btn_Prev: HTMLButtonElement;
  btn_Next: HTMLButtonElement;
  btn_Last: HTMLButtonElement;
  btn_First: HTMLButtonElement;
  btn_AddPart: HTMLButtonElement;
  txt_KeyRangeStart: HTMLTextAreaElement;
  txt_KeyRangeEnd: HTMLTextAreaElement;

  sldr_barsPerPage: HTMLInputElement;
  lbl_sldr_barsPerPage: HTMLLabelElement;

  div_Controls: HTMLDivElement;
  div_BarsBeats: HTMLDivElement;
  div_Seconds: HTMLDivElement;

  div_MouseX: HTMLDivElement;
  div_MouseY: HTMLDivElement;


  div_currNote: HTMLDivElement;
  div_currPart: HTMLDivElement;

  div_PageNumbers: HTMLDivElement;
  div_Editor: HTMLDivElement;
  div_Score: HTMLDivElement;
  div_BarLines: HTMLDivElement;
  div_BeatLines: HTMLDivElement;
  div_SixteenthLines: HTMLDivElement;
  div_PitchLines: HTMLDivElement;
  div_Notes: HTMLDivElement;
  div_Parts: HTMLDivElement;
  div_Playhead: HTMLDivElement;
  divs_AllNotes: HTMLDivElement[];
  divs_AllParts: HTMLDivElement[];
  slct_Snap: HTMLSelectElement;


  gridHoriMargin: number;
  gridVertMargin: number;
  constructor() {
    this.btn_Play = document.getElementById('play') as HTMLButtonElement,
      this.btn_Stop = document.getElementById('stop') as HTMLButtonElement,
      this.btn_Record = document.getElementById('record') as HTMLButtonElement,
      this.btn_Loop = document.getElementById('loop') as HTMLButtonElement,
      this.btn_Prev = document.getElementById('prev') as HTMLButtonElement,
      this.btn_Next = document.getElementById('next') as HTMLButtonElement,
      this.btn_Last = document.getElementById('last') as HTMLButtonElement,
      this.btn_First = document.getElementById('first') as HTMLButtonElement,
      this.btn_AddPart = document.getElementById('add-part') as HTMLButtonElement,
      this.txt_KeyRangeStart = document.getElementById('key-range-start') as HTMLTextAreaElement,
      this.txt_KeyRangeEnd = document.getElementById('key-range-end') as HTMLTextAreaElement,
      this.sldr_barsPerPage = document.getElementById('scale-slider') as HTMLInputElement,
      this.lbl_sldr_barsPerPage = document.getElementById('scale-label') as HTMLLabelElement,
      this.div_Controls = document.getElementById('editor-controls') as HTMLDivElement,
      this.div_BarsBeats = document.getElementById('time-bars-beats') as HTMLDivElement,
      this.div_Seconds = document.getElementById('time-seconds') as HTMLDivElement,
      this.div_MouseX = document.getElementById('mouse-x') as HTMLDivElement,
      this.div_MouseY = document.getElementById('mouse-y') as HTMLDivElement,
      this.div_PageNumbers = document.getElementById('page-numbers') as HTMLDivElement,
      this.div_Editor = document.getElementById('editor') as HTMLDivElement,
      this.div_Score = document.getElementById('score') as HTMLDivElement,
      this.div_BarLines = document.getElementById('bar-lines') as HTMLDivElement,
      this.div_BeatLines = document.getElementById('tick-lines') as HTMLDivElement,
      this.div_SixteenthLines = document.getElementById('sub-tick-lines') as HTMLDivElement,
      this.div_PitchLines = document.getElementById('pitch-lines') as HTMLDivElement,
      this.div_Notes = document.getElementById('notes') as HTMLDivElement,
      this.div_Parts = document.getElementById('parts') as HTMLDivElement,
      this.div_Playhead = document.getElementById('playhead') as HTMLDivElement,
      this.slct_Snap = document.getElementById('snap') as HTMLSelectElement,
      this.div_currNote = document.getElementById('dbg-curr-note') as HTMLDivElement,
      this.div_currPart = document.getElementById('dbg-curr-part') as HTMLDivElement,
      this.gridHoriMargin = 24,
      this.gridVertMargin = 24;
    return this;
  }
}
