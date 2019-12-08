import { Component, OnInit, Inject } from '@angular/core';
import { Note, Part, MIDINote, Track, getMidiFiles, createSong, Instrument, Song, KeyEditor, createTrack, MIDIEvent } from "heartbeat-sequencer";
import { InputConverterComponent } from '../input-converter/input-converter.component';
import { InputDisplayComponent } from '../input-display/input-display.component';
// import * as sequencer from 'heartbeat-sequencer';
declare let sequencer: any;


@Component({
  selector: 'app-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.sass']
})
export class InputEditorComponent implements OnInit {
  static NOTE_OFF = 0x80;
  static NOTE_ON = 0x90;
  static MIDI_HEARTBEAT = 0xFE;
  static inpEdComp: InputEditorComponent;
  testMethod = 1;
  midiOutput;
  edtrHtml: EditorHTMLShell;
  edtrInfo: EditorInfo;
  midiFile;
  keyEditor: KeyEditor;
  div_MidiFileList: HTMLDivElement;
  midiFileList;
  audCntxt: AudioContext;

  pitchStart = 12;
  pitchEnd = 48;
  pitchHeight = 16;
  timeSigNom = 3;
  timeSigDenom = 4;
  editorHeight = ((this.pitchEnd - this.pitchStart + 2) * this.pitchHeight);
  track: Track;
  tracks: Track[];
  instruments: Instrument[];
  song: Song;

  allNotes = {}; // stores references to all midi notes;
  allParts = {}; // stores references to all midi parts;
  currNote: Note = null;
  currPart: Part = null;
  flattenTracksToSingleTrack = true;

  bppStart = 8;  //default: 16

  console = window.console;
  alert = window.alert;
  idc = InputDisplayComponent.inpDispCmp;
  icc = InputConverterComponent.inpConvComp;
  requestAnimationFrame = window.requestAnimationFrame;
  output = document.getElementById('console');
  constructor() {
  }
  ngOnInit() {
    InputEditorComponent.inpEdComp = this;
    this.edtrInfo = new EditorInfo();
    this.edtrHtml = new EditorHTMLShell();
    this.init(this);
  }
  ngAfterViewInit(): void {
    if (this.song.tracks.length == 0) {
      let tr = sequencer.createTrack('AutoTrack');
      this.song.addTrack(tr);
      this.song.update();
    }
    if (this.track == undefined) {
      this.track = this.song.tracks[0];
    }
    this.track.recordEnabled = 'midi';
    this.track.setMidiInput('all');
    this.track.update();
    this.song.update();
    // sequencer.getMidiInputs();
  }
  init(iec: InputEditorComponent) {
    this.enableGUI(false);
    let tmp_icons_w = 128;
    let tmp_w = window.innerWidth - tmp_icons_w;
    let tmp_h = iec.editorHeight;
    let tmp_event;

    this.song = this.initSong();

    iec.instruments = sequencer.getInstruments();
    // song.tracks.forEach(function(track) {track.setMidiInput()})

    /**
     * Compacts all song tracks onto single track, set to monitor, and set instrument to piano
     */
    if (iec.flattenTracksToSingleTrack) { flattenTracks(iec.song); }
    /**
     *
     * This is where KeyEditor is Made!!!
     */
    let keyEditor = sequencer.createKeyEditor(this.song, {
      keyListener: true,
      viewportHeight: tmp_h,
      viewportWidth: tmp_w,
      pitchHeight: this.pitchHeight,
      lowestNote: iec.pitchStart,
      highestNote: iec.pitchEnd,
      barsPerPage: iec.bppStart
    });
    InputEditorComponent.inpEdComp.keyEditor = keyEditor;
    resize();
    //set editor element values to editor defaults
    setElementValue(iec.edtrHtml.txt_KeyRangeStart, keyEditor.lowestNote);
    setElementValue(iec.edtrHtml.txt_KeyRangeEnd, keyEditor.highestNote);
    let tmp_bpm = this.song.bpm.toString();
    iec.edtrHtml.txt_BPM.value = tmp_bpm;
    setSliderValues(iec.edtrHtml.sldr_barsPerPage, keyEditor.barsPerPage, 1, 32, 1);

    initContextEvents();
    initInputEvents();
    initWindowEvents(iec);

    this.enableGUI(true);

    iec.edtrHtml.slct_Snap.selectedIndex = 4;
    tmp_event = document.createEvent('HTMLEvents');
    tmp_event.initEvent('change', false, false);
    iec.edtrHtml.slct_Snap.dispatchEvent(tmp_event);

    draw(iec);
    render();

  }

  initSong(): Song {
    /**
     *  Uncomment one to test different tracks, will add listing function soon
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
    let tmp_midiFile = tmp_midiFiles[3];
    if (tmp_midiFile === null || tmp_midiFile === undefined) {
      console.error("MIDI file name string invalid, defaulting to blank score...");
      tmp_midiFile = sequencer.getMidiFiles()[0];
    }
    switch (this.testMethod) {
      case 1:
        // method 1: create a song directly from the midi file, this way the midi file is treated as a config object
        if (tmp_midiFile !== undefined) { song = sequencer.createSong(tmp_midiFile); }
        else {
          song = sequencer.createSong({
            bpm: 153
          });
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
    // song.tracks[0].recordEnabled = 'midi';
    song.setTimeSignature(3, 4, true);
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
    let tmp_maxi = tmp_elements.length;
    for (let i = 0; i < tmp_maxi; i++) {
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
  //#region [rgba(200, 0, 0, 0.05)] Selection Visuals Methods
  setNoteActiveState(ref_note: Note, ref_div_Note) {
    ref_div_Note = document.getElementById(ref_note.id);
    if (ref_div_Note !== null && ref_note.part.mute === false && ref_note.mute !== true) {
      if (ref_note.active) { ref_div_Note.className = 'note note-active'; } else
        if (ref_note.active === false) { ref_div_Note.className = 'note'; }
    }
  }

  selectNote(ref_note: Note) {
    let tmp_div_Note = document.getElementById(ref_note.id);
    if (tmp_div_Note !== null && ref_note.part.mute === false && ref_note.mute !== true) {
      tmp_div_Note.className = 'note note-selected';
    }
  }
  unselectNote(ref_note: Note) {
    let tmp_div_Note = document.getElementById(ref_note.id);
    if (ref_note.part.mute === false && ref_note.mute !== true && tmp_div_Note !== null) {
      tmp_div_Note.className = 'note';
    }
  }
  setPartActiveState(ref_part: Part, ref_div_Part: HTMLDivElement) {
    ref_div_Part = document.getElementById(ref_part.id) as HTMLDivElement;
    if (ref_div_Part !== null && ref_part.mute !== true) {
      if (ref_part.active) {
        ref_div_Part.className = 'part part-active';
      } else if (ref_part.active === false) {
        ref_div_Part.className = 'part';
      }
    }
  }
  selectPart(ref_part: Part) {
    let tmp_div_Part = document.getElementById(ref_part.id);
    if (ref_part.mute === false) {
      tmp_div_Part.className = 'part part-selected';
    }
  }
  unselectPart(ref_part: Part) {
    let tmp_div_Part = document.getElementById(ref_part.id);
    if (ref_part.mute === false) {
      if (tmp_div_Part !== null) {
        tmp_div_Part.className = 'part';
      }
    }
  }
  //#endregion


  //#region [rgba(0,100,0,0.2)] Grid Element Event Functions
  /*
    Part
    */
  evt_Part_lMouDown(e) {
    let iec = InputEditorComponent.inpEdComp as InputEditorComponent;
    let tmp_part = iec.allParts[e.target.id];
    if (e.ctrlKey) {
      iec.keyEditor.removePart(tmp_part);
      iec.unselectPart(tmp_part);
      iec.currPart = null;
      if (iec.currNote !== null) { iec.unselectNote(iec.currNote); }
      iec.currNote = null;
    } else {
      // iec.keyEditor.startMovePart(tmp_part, iec.edtrInfo.screenX, iec.edtrInfo.screenY);
      iec.keyEditor.startMovePart(tmp_part, iec.edtrInfo.clientX + InputEditorComponent.inpEdComp.edtrHtml.div_Editor.scrollLeft, iec.edtrInfo.pageY);
      document.addEventListener('mouseup', iec.evt_Part_lMouUp, false);
    }
  }

  evt_Part_lMouUp(e) {
    InputEditorComponent.inpEdComp.keyEditor.stopMovePart();
    document.removeEventListener('mouseup', InputEditorComponent.inpEdComp.evt_Part_lMouUp);
  }
  /*
    Note Stuff
    */
  evt_Note_lMouDown(e) {
    if (!holdingEdge) {
      let tmp_note = InputEditorComponent.inpEdComp.allNotes[e.target.id];
      if (e.ctrlKey) {
        InputEditorComponent.inpEdComp.keyEditor.removeNote(tmp_note);
        InputEditorComponent.inpEdComp.currNote = null;
      } else {
        InputEditorComponent.inpEdComp.keyEditor.startMoveNote(tmp_note, e.clientX + InputEditorComponent.inpEdComp.edtrHtml.div_Editor.scrollLeft, e.clientY);
        document.addEventListener('mouseup', InputEditorComponent.inpEdComp.evt_Note_lMouUp, false);
      }
    }
  }

  evt_Note_lMouUp(e) {
    InputEditorComponent.inpEdComp.keyEditor.stopMoveNote();
    document.removeEventListener('mouseup', InputEditorComponent.inpEdComp.evt_Note_lMouUp);
  }
  /*
    Note Edge Stuff
   */
  evt_NoteEdge_Left_MouOver(e: MouseEvent) { (e.target as HTMLDivElement).style.cursor = 'w-resize'; }
  evt_NoteEdge_Right_MouOver(e: MouseEvent) { (e.target as HTMLDivElement).style.cursor = 'e-resize'; }

  evt_NoteEdge_Left_lMouDown(e: MouseEvent) {
    holdingEdge = true;
    (e.target as HTMLDivElement).style.cursor = 'w-resize';
    let tmp_note = InputEditorComponent.inpEdComp.allNotes[(e.target as HTMLDivElement).id];
    InputEditorComponent.inpEdComp.keyEditor.gripX = e.clientX;
    if (tmp_note == undefined) { tmp_note = changingNote; }
    if (changingNote == null) { changingNote = tmp_note; }
    if (heldEdge == null) { heldEdge = e.target; }
    document.addEventListener('mousemove', InputEditorComponent.inpEdComp.evt_NoteEdge_Left_MouMove, false);
    document.addEventListener('mouseup', InputEditorComponent.inpEdComp.evt_NoteEdge_Left_lMouUp);
  }
  evt_NoteEdge_Right_lMouDown(e: MouseEvent) {
    holdingEdge = true;
    (e.target as HTMLDivElement).style.cursor = 'e-resize';
    let tmp_note = InputEditorComponent.inpEdComp.allNotes[(e.target as HTMLDivElement).id];
    InputEditorComponent.inpEdComp.keyEditor.gripX = e.clientX;
    if (tmp_note == undefined) { tmp_note = changingNote; }
    if (changingNote == null) { changingNote = tmp_note; }
    if (heldEdge == null) { heldEdge = e.target; }
    document.addEventListener('mousemove', InputEditorComponent.inpEdComp.evt_NoteEdge_Right_MouMove, false);
    document.addEventListener('mouseup', InputEditorComponent.inpEdComp.evt_NoteEdge_Right_lMouUp);
  }
  evt_NoteEdge_Left_MouMove(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp;
    let tmp_ticks = iec.edtrInfo.ticksAtX;
    let tmp_rightEdge = heldEdge.parentElement.childNodes[1];

    if (changingNote !== null) {
      changingNote.part.moveEvent(changingNote.noteOn, tmp_ticks - changingNote.noteOn.ticks);
      // changingNote.part.moveEvent(changingNote.noteOn, );
      changingNote.part.moveEvent(changingNote.noteOff, -(tmp_ticks - changingNote.noteOn.ticks));

      InputEditorComponent.inpEdComp.song.update();
      updateElementBBox(heldEdge, subdivBBox(changingNote.bbox, 0.1, 0, 1, 0));
      updateElementBBox(tmp_rightEdge, subdivBBox(changingNote.bbox, 0.2, 0.8, 1, 0));
    }
    else {
    }
  }
  evt_NoteEdge_Right_MouMove(e) {
    let iec = InputEditorComponent.inpEdComp;
    let tmp_ticks = iec.edtrInfo.ticksAtX;
    let tmp_leftEdge = heldEdge.parentElement.childNodes[0];
    if (changingNote !== null) {
      changingNote.part.moveEvent(changingNote.noteOff, tmp_ticks - changingNote.noteOff.ticks);

      InputEditorComponent.inpEdComp.song.update();
      updateElementBBox(heldEdge, subdivBBox(changingNote.bbox, 0.2, 0.8, 1, 0));
      updateElementBBox(tmp_leftEdge, subdivBBox(changingNote.bbox, 0.1, 0, 1, 0));
    }
    else {

    }
  }
  evt_NoteEdge_Left_lMouUp(e) {
    holdingEdge = false;
    changingNote = null;
    heldEdge = null;
    document.removeEventListener('mousemove', InputEditorComponent.inpEdComp.evt_NoteEdge_Left_MouMove, false);
    document.removeEventListener('mouseup', InputEditorComponent.inpEdComp.evt_NoteEdge_Left_lMouUp);
    InputEditorComponent.inpEdComp.song.update();
  }
  evt_NoteEdge_Right_lMouUp(e) {
    holdingEdge = false;
    changingNote = null;
    heldEdge = null;
    document.removeEventListener('mousemove', InputEditorComponent.inpEdComp.evt_NoteEdge_Right_MouMove, false);
    document.removeEventListener('mouseup', InputEditorComponent.inpEdComp.evt_NoteEdge_Right_lMouUp);
    InputEditorComponent.inpEdComp.song.update();
  }
  /*
    Grid Stuff
  */
  evt_Grid_lMouDown(e) { }

  evt_Grid_lMouUp(e) { }

  evt_Grid_lMouDbl(e) {
    let iec = InputEditorComponent.inpEdComp;
    let tmp_className = e.target.className;
    /**
     * if double clicking a note
     * */
    if (tmp_className.indexOf('note') !== -1) {
      iec.currNote = iec.allNotes[e.target.id];
      iec.currPart = iec.currNote.part;
      return;
    }
    /**
     * if double clicking a blank section of a part
     * */
    else if (tmp_className.indexOf('part') !== -1) {
      iec.currPart = iec.allParts[e.target.id];
      iec.currPart.addEvents(createNewNoteAtMouse(iec.currPart, iec));
      iec.song.update();
      return;
    }
    /**
     * if double clicking grid but current part is selected
     * */
    else if (iec.currPart) {
      // currPart.addEvents(addNewNoteAtMouse());
      iec.song.update();
      return;
    }
    /**
     *if double clicking empty grid space
     * */
    else {
      iec.currNote = null;
      iec.currPart = null;
      addPartAtMouse(iec);
      return;
    }

  }
  evt_Generic_lMouDown(e) {
    let iec = InputEditorComponent.inpEdComp;
    let tmp_className = e.target.className;
    if (tmp_className.indexOf('note') !== -1) {
      if (iec.currNote !== null) { this.unselectNote(iec.currNote); }
      iec.currNote = iec.allNotes[e.target.id];
      if (iec.currNote !== null) { this.selectNote(iec.currNote); }
      iec.currPart = iec.currNote.part;
      if (iec.currPart !== null) { this.selectPart(iec.currPart); }
      return;
    } else if (tmp_className.indexOf('part') !== -1) {
      // keyEditor.setPlayheadToX(e.pageX);
      if (iec.currPart !== null) { this.unselectPart(iec.currPart); }
      iec.currPart = iec.allParts[e.target.id];
      if (iec.currPart !== null) { this.selectPart(iec.currPart); }
      if (iec.currNote !== null) { this.unselectNote(iec.currNote); }
      iec.currNote = null;
      return;
    } else {
      if (iec.currNote !== null) { this.unselectNote(iec.currNote); }
      iec.currNote = null;
      if (iec.currPart !== null) { this.unselectPart(iec.currPart); }
      iec.currPart = null;
      iec.keyEditor.setPlayheadToX(e.clientX);
      return;
    }
    // you could also use:
    //song.setPlayhead('ticks', keyEditor.xToTicks(e.pageX));
  }
  //#endregion

  createNote(iec: InputEditorComponent, start: number, end: number, pitch: number, vel?: number): [MIDIEvent, MIDIEvent] {
    if (iec.currPart != null && iec.currPart != undefined) {
    }
    else {
      iec.currPart = sequencer.createPart('GeneratedPart');
      // this.currPart.addEvents(createNewNote(this.currPart, iec, start, end, pitch));
      iec.track.addPartAt(iec.currPart, ['ticks', start]);
      iec.track.update();
    }
    let noteEvts = createNewNoteEvents(start, end, pitch, vel);
    iec.currPart.addEvents(noteEvts);
    // this.currPart.addEvents(createNewNoteEvents(start, end, pitch));
    iec.track.update();
    iec.song.update();
    return noteEvts;
  }

  /**
 * END InputEditorComponent Class -------|||||-----------------
 *
 *
 *
 */
}
export function getEdgeDivs(note: MIDINote): [HTMLDivElement, HTMLDivElement, HTMLDivElement] {
  let tmp_noteDiv = document.getElementById(note.id) as HTMLDivElement;
  if (tmp_noteDiv != null)
    return [tmp_noteDiv, tmp_noteDiv.children[0] as HTMLDivElement, tmp_noteDiv.children[1] as HTMLDivElement]
  else {
    return null;
  }
}
let heldEdge;
let changingNote;
let holdingEdge = false;


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

function initContextEvents() {
  InputEditorComponent.inpEdComp.song.addEventListener('play', () => { setElementValue(InputEditorComponent.inpEdComp.edtrHtml.btn_Play, 'pause'); });
  InputEditorComponent.inpEdComp.song.addEventListener('pause', () => { setElementValue(InputEditorComponent.inpEdComp.edtrHtml.btn_Play, 'play'); });
  InputEditorComponent.inpEdComp.song.addEventListener('stop', () => { setElementValue(InputEditorComponent.inpEdComp.edtrHtml.btn_Play, 'play'); });

  InputEditorComponent.inpEdComp.edtrHtml.div_Editor.addEventListener('mousedown', () => {
    InputEditorComponent.inpEdComp.edtrHtml.div_currPart.innerHTML = 'Sel Part: ' + (InputEditorComponent.inpEdComp.currPart !== null ? InputEditorComponent.inpEdComp.currPart.id : 'none');
    InputEditorComponent.inpEdComp.edtrHtml.div_currNote.innerHTML = 'Sel Note: ' + (InputEditorComponent.inpEdComp.currNote !== null ? InputEditorComponent.inpEdComp.currNote.id : 'none');
  });
}

function initInputEvents() {
  let iec = InputEditorComponent.inpEdComp;
  /**
   * Text
   */
  iec.edtrHtml.txt_KeyRangeStart.addEventListener('change', (e) => {
    iec.song.setPitchRange(iec.edtrHtml.txt_KeyRangeStart.value, iec.keyEditor.highestNote);
    iec.song.update();
  });
  iec.edtrHtml.txt_KeyRangeEnd.addEventListener('change', (e) => {
    iec.song.setPitchRange(iec.keyEditor.lowestNote, iec.edtrHtml.txt_KeyRangeEnd.value);
    iec.song.update();
  });
  // listen for scale and draw events, a scale event is fired when you change the number of bars per page
  // a draw event is fired when you change the size of the viewport by resizing the browser window
  iec.keyEditor.addEventListener('scale draw', () => { draw(iec); });

  // listen for scroll events, the score automatically follows the song positon during playback: as soon as
  // the playhead moves off the right side of the screen, a scroll event is fired
  iec.keyEditor.addEventListener('scroll', (data) => { iec.edtrHtml.div_Editor.scrollLeft = data.x; });
  /**
   * EXPERIMENTAL - Add notes and parts when double clicked in certain contexts
   */
  iec.edtrHtml.div_Score.addEventListener('dblclick', (e) => { InputEditorComponent.inpEdComp.evt_Grid_lMouDbl(e); });
  // you can set the playhead at any position by clicking on the score
  /**
   * OR - if element clicked on is a part or note, it sets the current note / part to that element
   */
  iec.edtrHtml.div_Score.addEventListener('mousedown', (e) => { InputEditorComponent.inpEdComp.evt_Generic_lMouDown(e); });
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
    iec.keyEditor.updateScroll(iec.edtrHtml.div_Editor.scrollLeft, iec.edtrHtml.div_Editor.scrollTop);
  }, false);
  /**
   * Score Mouse Movement Tracker
   */
  // iec.edtrHtml.div_Score.addEventListener('mousemove', (e) => {
  window.addEventListener('mousemove', (e) => {
    e.preventDefault();
    let tmp_part = iec.keyEditor.selectedPart;
    let tmp_note = iec.keyEditor.selectedNote;

    // show the song position and pitch of the current mouse position; handy for debugging
    iec.edtrInfo.screenX = e.screenX;
    iec.edtrInfo.screenY = e.screenY;
    iec.edtrInfo.pageX = e.pageX;
    iec.edtrInfo.pageY = e.pageY;
    iec.edtrInfo.clientX = e.clientX;
    iec.edtrInfo.clientY = e.clientY;
    iec.edtrInfo.mouseBarPos = iec.keyEditor.getPositionAt(iec.edtrInfo.pageX).barsAsString;
    iec.edtrInfo.editorScrollX = iec.edtrHtml.div_Editor.scrollLeft;
    iec.edtrInfo.editorScrollY = iec.edtrHtml.div_Editor.scrollTop;
    iec.edtrInfo.editorFrameOffsetY = iec.edtrHtml.div_Editor.offsetTop;
    iec.edtrInfo.editorFrameOffsetX = iec.edtrHtml.div_Editor.offsetLeft;
    iec.edtrInfo.headX = iec.keyEditor.getPlayheadX();
    iec.edtrInfo.scrolledHeadX = iec.keyEditor.getPlayheadX(true);
    iec.edtrInfo.snapTicksAtHead = iec.keyEditor.getTicksAt(iec.edtrInfo.headX);
    iec.edtrInfo.ticksAtHead = iec.keyEditor.getTicksAt(iec.edtrInfo.headX, false);
    iec.edtrInfo.scrollTicksAtHead = iec.keyEditor.getTicksAt(iec.edtrInfo.scrolledHeadX, false);
    iec.edtrInfo.ticksAtX = iec.keyEditor.getTicksAt(
      iec.edtrInfo.clientX - iec.edtrInfo.editorFrameOffsetX, false);
    iec.edtrHtml.div_MouseX.innerHTML =
      '\nclient: (' + iec.edtrInfo.clientX + ', ' + iec.edtrInfo.clientY + ')' +
      '\n|screen: (' + iec.edtrInfo.screenX + ', ' + iec.edtrInfo.screenY + ')' +
      '\n|editor-scrl: (' + iec.edtrInfo.editorScrollX + ', ' + iec.edtrInfo.editorScrollY + ')' +
      '\n|page: (' + iec.edtrInfo.pageX + ', ' + iec.edtrInfo.pageY + ')' +
      '\n|ticks-at-mouse: ' + iec.edtrInfo.ticksAtX.toFixed(1) +
      '\n|x Bar: ' + iec.edtrInfo.mouseBarPos +
      '\n|x-head: ' + iec.edtrInfo.headX.toFixed(2) +
      '\n|scrolled-x-head: ' + iec.edtrInfo.scrolledHeadX.toFixed(2) +
      '\n|snap-ticks-head: ' + iec.edtrInfo.snapTicksAtHead +
      '\n|ticks-head: ' + iec.edtrInfo.ticksAtHead;
    ;
    iec.edtrInfo.mousePitchPos = iec.keyEditor.getPitchAt(iec.edtrInfo.pageY - iec.edtrHtml.div_Editor.offsetTop).number;
    iec.edtrHtml.div_MouseY.innerHTML = 'y Pitch: ' + iec.edtrInfo.mousePitchPos +
      '\nframe-offset-y: ' + iec.edtrInfo.editorFrameOffsetY;
    // move part or note if selected
    if (tmp_part !== undefined) {
      // iec.keyEditor.movePart(tmp_x, tmp_y - iec.edtrHtml.div_Score.offsetTop);
      iec.keyEditor.movePart(iec.edtrInfo.pageX, iec.edtrInfo.pageY - iec.edtrHtml.div_Editor.offsetTop);
    }
    if (tmp_note !== undefined) {
      // iec.keyEditor.moveNote(tmp_x, tmp_y - iec.edtrHtml.div_Score.offsetTop);
      iec.keyEditor.moveNote(iec.edtrInfo.pageX, iec.edtrInfo.pageY - iec.edtrHtml.div_Editor.offsetTop);
    }
  },
    false
  );
  /**
   * Grid
   */
  iec.edtrHtml.slct_Snap.addEventListener('change', () => {
    iec.keyEditor.setSnapX(Number.parseInt(
      iec.edtrHtml.slct_Snap.options[iec.edtrHtml.slct_Snap.selectedIndex].value));
  }, false);
  /**
   * Buttons
   */
  iec.edtrHtml.btn_Play.addEventListener('click', () => { iec.song.pause(); });
  iec.edtrHtml.btn_Record.addEventListener('click', () => { iec.song.startRecording(); });
  iec.edtrHtml.btn_Loop.addEventListener('click', () => { iec.song.loop = !iec.song.loop; });

  iec.edtrHtml.btn_Stop.addEventListener('click', () => { iec.song.stop(); });
  iec.edtrHtml.btn_Next.addEventListener('click', () => { iec.keyEditor.scroll('>'); });
  iec.edtrHtml.btn_Prev.addEventListener('click', () => { iec.keyEditor.scroll('<'); });
  iec.edtrHtml.btn_First.addEventListener('click', () => { iec.keyEditor.scroll('<<'); });
  iec.edtrHtml.btn_Last.addEventListener('click', () => { iec.keyEditor.scroll('>>'); });
  iec.edtrHtml.btn_AddPart.addEventListener('click', () => { addRandomPartAtPlayhead(iec); });
  /**
   * Sliders
   */
  iec.edtrHtml.sldr_barsPerPage.addEventListener(
    'change',
    function (e) {
      var tmp_bpp = parseFloat((e.target as HTMLInputElement).value);
      iec.edtrHtml.lbl_sldr_barsPerPage.innerHTML = '#bars ' + tmp_bpp;
      iec.keyEditor.setBarsPerPage(tmp_bpp);
    },
    false
  );
  /**
   * Keyboard Shortcuts
   */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') { iec.song.stop(); }
    if (e.key === ' ') { iec.song.pause(); }
    if (e.key === 'Delete') { }
    //dumb hack: brings playhead to first displayed location from left if offscreen to the left
    if (e.key === 'ArrowRight') { iec.keyEditor.setPlayheadToX(Math.max(iec.keyEditor.getPlayheadX(true) + 16, 0)); }
    if (e.key === 'ArrowLeft') { iec.keyEditor.setPlayheadToX(Math.max(iec.keyEditor.getPlayheadX(true) - 16, 0)); }
  });
}

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
  iec.allNotes = {};
  iec.allParts = {};
  iec.edtrHtml.divs_AllNotes = {};
  iec.edtrHtml.divs_AllParts = {};
  iec.edtrHtml.div_Parts.innerHTML = '';
  iec.edtrHtml.div_Notes.innerHTML = '';
  iec.edtrHtml.div_PitchLines.innerHTML = '';
  iec.edtrHtml.div_BarLines.innerHTML = '';
  iec.edtrHtml.div_BeatLines.innerHTML = '';
  iec.edtrHtml.div_SixteenthLines.innerHTML = '';

  iec.keyEditor.horizontalLine.reset();
  iec.keyEditor.verticalLine.reset();
  iec.keyEditor.noteIterator.reset();
  iec.keyEditor.partIterator.reset();

  iec.edtrHtml.div_Score.style.width = iec.keyEditor.width + 'px';
  let i = 0;
  while (iec.keyEditor.horizontalLine.hasNext('chromatic')) { drawHorizontalLine(iec.keyEditor.horizontalLine.next('chromatic')); }
  while (iec.keyEditor.verticalLine.hasNext('sixteenth')) { drawVerticalLine(iec.keyEditor.verticalLine.next('sixteenth')); }
  while (iec.keyEditor.noteIterator.hasNext()) { drawNote(iec.keyEditor.noteIterator.next(), iec); }
  while (iec.keyEditor.partIterator.hasNext()) { drawPart(iec.keyEditor.partIterator.next(), iec); }
}

function drawHorizontalLine(ref_data) {
  let tmp_div_HLine = document.createElement('div'),
    pitchHeight = InputEditorComponent.inpEdComp.keyEditor.pitchHeight;

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
  // if (iec !== null)
  InputEditorComponent.inpEdComp.edtrHtml.div_PitchLines.appendChild(tmp_div_HLine);

}

function drawVerticalLine(ref_data) {
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
      // if (iec !== null)
      tmp_div_VLine.style.height = InputEditorComponent.inpEdComp.edtrHtml.div_Score.scrollHeight.toString() + 'px';
      InputEditorComponent.inpEdComp.edtrHtml.div_BarLines.appendChild(tmp_div_VLine);
      break;
    case 'beat':
      // if (iec !== null)
      InputEditorComponent.inpEdComp.edtrHtml.div_BeatLines.appendChild(tmp_div_VLine);
      break;
    case 'sixteenth':
      // if (iec !== null)
      InputEditorComponent.inpEdComp.edtrHtml.div_SixteenthLines.appendChild(tmp_div_VLine);
      break;
  }
}

function drawNote(ref_note: Note, iec: InputEditorComponent) {
  let tmp_bbox = ref_note.bbox;
  const tmp_bbox_left = subdivBBox(ref_note.bbox, 0.1, 0, 1, 0);
  let tmp_bbox_right = subdivBBox(ref_note.bbox, 0.2, 0.8, 1, 0);
  let tmp_div_Note = document.createElement('div');
  let tmp_div_Note_leftEdge = document.createElement('div');
  let tmp_div_Note_rightEdge = document.createElement('div');
  let tmp_div_Note_info = document.createElement('div');

  tmp_div_Note.id = ref_note.id;
  tmp_div_Note.className = 'note';
  let tmpThing = iec.song.notes;
  let tmp_vel = -1;
  tmpThing.forEach((e: MIDINote) => {
    if (e.id == ref_note.id) {
      tmp_vel = e.velocity;
    }
  });
  // tmp_div_Note_info.id = 'note-info';
  // tmp_div_Note_info.innerHTML = "   " + tmp_vel.toString();

  tmp_div_Note_leftEdge.id = tmp_div_Note.id;
  tmp_div_Note_leftEdge.className = 'note-edge';

  tmp_div_Note_rightEdge.id = tmp_div_Note.id;
  tmp_div_Note_rightEdge.className = 'note-edge';

  updateElementBBox(tmp_div_Note, tmp_bbox);
  updateElementBBox(tmp_div_Note_leftEdge, tmp_bbox_left);
  updateElementBBox(tmp_div_Note_rightEdge, tmp_bbox_right);

  // store note and div
  InputEditorComponent.inpEdComp.allNotes[ref_note.id] = ref_note;
  iec.edtrHtml.divs_AllNotes[ref_note.id] = tmp_div_Note;
  tmp_div_Note.addEventListener('mousedown', InputEditorComponent.inpEdComp.evt_Note_lMouDown, false);
  tmp_div_Note_leftEdge.addEventListener('mouseover', (e) => { InputEditorComponent.inpEdComp.evt_NoteEdge_Left_MouOver(e); });
  tmp_div_Note_leftEdge.addEventListener('mousedown', (e) => { InputEditorComponent.inpEdComp.evt_NoteEdge_Left_lMouDown(e); });
  tmp_div_Note_rightEdge.addEventListener('mouseover', (e) => { InputEditorComponent.inpEdComp.evt_NoteEdge_Right_MouOver(e); });
  tmp_div_Note_rightEdge.addEventListener('mousedown', (e) => { InputEditorComponent.inpEdComp.evt_NoteEdge_Right_lMouDown(e); });

  tmp_div_Note.append(tmp_div_Note_leftEdge);
  tmp_div_Note.append(tmp_div_Note_rightEdge);
  tmp_div_Note.append(tmp_div_Note_info);
  iec.edtrHtml.div_Notes.appendChild(tmp_div_Note);
}

function drawPart(ref_part: Part, iec) {
  let tmp_bbox = ref_part.bbox,
    tmp_div_Part = document.createElement('div');

  tmp_div_Part.id = ref_part.id;
  tmp_div_Part.className = 'part';
  tmp_div_Part.style.left = tmp_bbox.x + 'px';
  tmp_div_Part.style.top = tmp_bbox.y + 'px';
  tmp_div_Part.style.width = tmp_bbox.width - 1 + 'px';
  tmp_div_Part.style.height = tmp_bbox.height - 1 + 'px';

  // store part and div
  InputEditorComponent.inpEdComp.allParts[ref_part.id] = ref_part;
  iec.edtrHtml.divs_AllParts[ref_part.id] = tmp_div_Part;
  tmp_div_Part.addEventListener('mousedown', InputEditorComponent.inpEdComp.evt_Part_lMouDown, false);
  iec.edtrHtml.div_Parts.appendChild(tmp_div_Part);
}
//Fits element within its bounding box
export function updateElementBBox(element, bbox: BBox) {
  element.style.left = bbox.x + 'px';
  element.style.top = bbox.y + 'px';
  element.style.width = bbox.width + 'px';
  element.style.height = bbox.height + 'px';
}

function resize() {
  let iec = InputEditorComponent.inpEdComp;
  // let tmp_div_icons = document.getElementById('editor-input-icons');
  // let tmp_icons_w = tmp_div_icons.clientWidth;
  let tmp_icons_w = 64;
  let tmp_c = iec.edtrHtml.div_Controls.getBoundingClientRect().height;
  let tmp_w = window.innerWidth - tmp_icons_w;
  let tmp_h = iec.editorHeight;

  // tell the key editor that the viewport has canged, necessary for auto scroll during playback
  iec.keyEditor.setViewport(tmp_w, tmp_h);
  // tmp_div_icons.style.width = tmp_icons_w + 'px';
  // tmp_div_icons.style.height = tmp_h + 'px';
  iec.edtrHtml.div_Editor.style.width = tmp_w + 'px';
  iec.edtrHtml.div_Editor.style.left = tmp_icons_w + 'px';
  iec.edtrHtml.div_Editor.style.height = tmp_h + 'px';
}

function render() {
  let iec = InputEditorComponent.inpEdComp;
  let tmp_snapshot = iec.keyEditor.getSnapshot('key-editor');
  let tmp_div_Note: HTMLDivElement;
  let tmp_div_Part: HTMLDivElement;

  iec.edtrHtml.div_Playhead.style.left = iec.keyEditor.getPlayheadX() - 10 + 'px';
  iec.edtrHtml.div_PageNumbers.innerHTML =
    'page ' + iec.keyEditor.currentPage + ' of ' + iec.keyEditor.numPages;

  iec.edtrHtml.div_BarsBeats.innerHTML = iec.song.barsAsString;
  const position = iec.keyEditor.getPositionAt(iec.keyEditor.getPlayheadX());
  if (position) {
    const tmp_hrMinSecMillisec = new Date(position.ticks * iec.song.millisPerTick);
    iec.edtrHtml.div_Seconds.innerHTML =
      tmp_hrMinSecMillisec.getUTCHours() + ':'
      + tmp_hrMinSecMillisec.getUTCMinutes() + ':'
      + tmp_hrMinSecMillisec.getUTCSeconds() + '.'
      + tmp_hrMinSecMillisec.getUTCMilliseconds();
  }

  tmp_snapshot.notes.removed.forEach((note) => {
    iec.edtrHtml.divs_AllNotes[note.id].removeEventListener('mousedown', InputEditorComponent.inpEdComp.evt_Note_lMouDown);
    iec.edtrHtml.div_Notes.removeChild(document.getElementById(note.id));
  });

  tmp_snapshot.notes.new.forEach((note) => { drawNote(note, iec); });
  tmp_snapshot.notes.recorded.forEach((note) => { drawNote(note, iec); });
  tmp_snapshot.notes.recording.forEach((note) => { updateElementBBox(iec.edtrHtml.divs_AllNotes[note.id], note.bbox); });
  // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
  tmp_snapshot.notes.changed.forEach((note) => { updateElementBBox(iec.edtrHtml.divs_AllNotes[note.id], note.bbox); });

  // stateChanged arrays contain elements that have become active or inactive
  tmp_snapshot.notes.stateChanged.forEach((note) => { InputEditorComponent.inpEdComp.setNoteActiveState(note, tmp_div_Note); });

  tmp_snapshot.parts.removed.forEach((part) => {
    iec.edtrHtml.divs_AllParts[part.id].removeEventListener('mousedown', InputEditorComponent.inpEdComp.evt_Part_lMouDown);
    iec.edtrHtml.div_Parts.removeChild(document.getElementById(part.id));
  });

  tmp_snapshot.parts.new.forEach((part) => { drawPart(part, iec); });

  // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
  tmp_snapshot.parts.changed.forEach((part) => { updateElementBBox(iec.edtrHtml.divs_AllParts[part.id], part.bbox); });

  // stateChanged arrays contain elements that have become active or inactive
  tmp_snapshot.parts.stateChanged.forEach((part) => { InputEditorComponent.inpEdComp.setPartActiveState(part, tmp_div_Part); });

  if (tmp_snapshot.hasNewBars) {
    // set the new width of the score
    iec.edtrHtml.div_Score.style.width = tmp_snapshot.newWidth + 'px';

    // clear the horizontal lines because the lines have to be drawn longer
    iec.edtrHtml.div_PitchLines.innerHTML = '';

    // reset the index of the iterator because we're starting from 0 again
    iec.keyEditor.horizontalLine.reset();
    while (iec.keyEditor.horizontalLine.hasNext('chromatic')) { drawHorizontalLine(iec.keyEditor.horizontalLine.next('chromatic')); }

    // the index of the vertical line iterator has already been set to the right index by the key editor
    // so only the extra barlines will be drawn
    while (iec.keyEditor.verticalLine.hasNext('sixteenth')) { drawVerticalLine(iec.keyEditor.verticalLine.next('sixteenth')); }
  }
  //update head values if playing
  if (iec.song.playing) {
    iec.edtrInfo.headX = iec.keyEditor.getPlayheadX();
    iec.edtrInfo.scrolledHeadX = iec.keyEditor.getPlayheadX(true);
    iec.edtrInfo.snapTicksAtHead = iec.keyEditor.getTicksAt(iec.edtrInfo.headX);
    iec.edtrInfo.ticksAtHead = iec.keyEditor.getTicksAt(iec.edtrInfo.headX, false);
    iec.edtrInfo.scrollTicksAtHead = iec.keyEditor.getTicksAt(iec.edtrInfo.scrolledHeadX, false);
    iec.edtrHtml.div_MouseX.innerHTML =
      '\nclient: (' + iec.edtrInfo.clientX + ', ' + iec.edtrInfo.clientY + ')' +
      '\n|screen: (' + iec.edtrInfo.screenX + ', ' + iec.edtrInfo.screenY + ')' +
      '\n|editor-scrl: (' + iec.edtrInfo.editorScrollX + ', ' + iec.edtrInfo.editorScrollY + ')' +
      '\n|page: (' + iec.edtrInfo.pageX + ', ' + iec.edtrInfo.pageY + ')' +
      '\n|ticks-at-mouse: ' + iec.edtrInfo.ticksAtX.toFixed(1) +
      '\n|x Bar: ' + iec.edtrInfo.mouseBarPos +
      '\n|x-head: ' + iec.edtrInfo.headX.toFixed(2) +
      '\n|scrolled-x-head: ' + iec.edtrInfo.scrolledHeadX.toFixed(2) +
      '\n|snap-ticks-head: ' + iec.edtrInfo.snapTicksAtHead +
      '\n|ticks-head: ' + iec.edtrInfo.ticksAtHead;
  }
  requestAnimationFrame(render);
}

//#endregion
// function enableGUI(flag: boolean) {
//   let tmp_elements = document.querySelectorAll('input, select');
//   let tmp_element;
//   let tmp_maxi = tmp_elements.length;
//   for (let i = 0; i < tmp_maxi; i++) {
//     tmp_element = tmp_elements[i];
//     tmp_element.disabled = !flag;
//   }
// }



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
  let i;
  let tmp_ticks = 0; //startPositions[getRandom(0, 4, true)],
  let tmp_numNotes = getRandom(4, 8, true);
  let tmp_spread = 5;
  let tmp_basePitch = getRandom(
    InputEditorComponent.inpEdComp.keyEditor.lowestNote + tmp_spread,
    InputEditorComponent.inpEdComp.keyEditor.highestNote - tmp_spread,
    true
  );
  let tmp_part = sequencer.createPart();
  let tmp_events = [];
  let tmp_noteLength = iec.song.ppq / 2;
  let tmp_pitch;
  let tmp_velocity;

  for (i = 0; i < tmp_numNotes; i++) {
    tmp_pitch = tmp_basePitch + getRandom(-tmp_spread, tmp_spread, true);
    tmp_velocity = getRandom(50, 127, true);

    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_ON, tmp_pitch, tmp_velocity));
    tmp_ticks += tmp_noteLength;
    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_OFF, tmp_pitch, 0));
    tmp_ticks += tmp_noteLength;
  }
  tmp_ticks = InputEditorComponent.inpEdComp.keyEditor.getTicksAt(InputEditorComponent.inpEdComp.keyEditor.getPlayheadX());

  tmp_part.addEvents(tmp_events);
  if (!iec.track) { iec.track = iec.song.tracks[0]; }
  if (!iec.track) { iec.track = sequencer.createTrack("forcedTrack"); }
  InputEditorComponent.inpEdComp.track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
  iec.song.update();
}

function addPartAtMouse(iec: InputEditorComponent) {
  iec.keyEditor.setPlayheadToX(iec.edtrInfo.clientX);
  let i;
  let tmp_ticks = 0;
  let tmp_numNotes = 2;
  let tmp_basePitch = iec.edtrInfo.mousePitchPos;
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
  tmp_ticks = iec.edtrInfo.ticksAtHead;

  tmp_part.addEvents(tmp_events);
  if (!InputEditorComponent.inpEdComp.track) {
    InputEditorComponent.inpEdComp.track = iec.song.tracks[0];
  }
  if (!InputEditorComponent.inpEdComp.track) {
    InputEditorComponent.inpEdComp.track = sequencer.createTrack("forcedTrack");
    iec.song.addTrack(InputEditorComponent.inpEdComp.track);
  }
  InputEditorComponent.inpEdComp.track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
  InputEditorComponent.inpEdComp.track.update();
  iec.song.update();
}
//#endregion



/**
 * EXPERIMENTAL
 */
function createNewMIDINote(start: number, end: number, pitch: number): MIDINote {
  let tmp_velocity = 127;
  let tmp_noteOn = sequencer.createMidiEvent(start, InputEditorComponent.NOTE_ON, pitch, tmp_velocity);
  let tmp_noteOff = sequencer.createMidiEvent(end, InputEditorComponent.NOTE_OFF, pitch, 0);
  let tmp_midiNote = sequencer.createMidiNote(tmp_noteOn, tmp_noteOff);
  return tmp_midiNote;
}
function createNewNoteEvents(start: number, end: number, pitch: number, velocity?: number): [MIDIEvent, MIDIEvent] {
  let tmp_velocity = (velocity == undefined ? 127 : velocity);
  let tmp_events = [];
  let tmp_noteOn = sequencer.createMidiEvent(start, InputEditorComponent.NOTE_ON, pitch, tmp_velocity);
  let tmp_noteOff = sequencer.createMidiEvent(end, InputEditorComponent.NOTE_OFF, pitch, 0);
  tmp_events.push(tmp_noteOn, tmp_noteOff);
  return [tmp_noteOn, tmp_noteOff];
}
function createNewNoteAtMouse(tmp_part, iec: InputEditorComponent) {
  let tmp_pitch = iec.edtrInfo.mousePitchPos;
  let tmp_velocity = 127;
  let tmp_events = [];
  let tmp_noteLength = iec.song.ppq/*  * 2 */;
  let tmp_ticks = iec.edtrInfo.ticksAtX;
  let tmp_noteOn;
  let tmp_noteOff;
  let tmp_note;
  // tmp_note = sequencer.createNote(pitch.number);
  tmp_noteOn = sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_ON, tmp_pitch, tmp_velocity);
  tmp_ticks += tmp_noteLength;
  tmp_noteOff = sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_OFF, tmp_pitch, 0);
  tmp_events.push(tmp_noteOn, tmp_noteOff);
  tmp_ticks = InputEditorComponent.inpEdComp.keyEditor.getTicksAt(InputEditorComponent.inpEdComp.edtrInfo.screenX);
  console.log('added new note: \n ' +
    'pitch: ' + tmp_pitch + '\n' +
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
export function subdivBBox(ref_bbox, ref_xRatio: number, ref_xOffsetRatio: number, ref_yRatio: number, ref_yOffsetRatio: number): BBox {
  let tmp_bbox = new BBox(null,
    (ref_bbox.width * ref_xOffsetRatio),
    (ref_bbox.height * ref_yOffsetRatio),
    ref_bbox.width * ref_xRatio,
    ref_bbox.height * ref_yRatio);
  if (tmp_bbox.width < 1) { tmp_bbox.width = 1; }
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
  // screenX: number;
  // screenY: number;
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  headX: number;
  scrolledHeadX: number;
  mouseBarPos;
  mousePitchPos;

  editorFrameOffsetY;
  editorFrameOffsetX;
  editorScrollX;
  editorScrollY;
  ticksAtX: number;
  snapTicksAtHead: number;
  scrollTicksAtHead: number;
  ticksAtHead: number;
  instruments: Instrument[];
  currNote = null;
  currPart = null;
  // pitchStart = 0;
  // pitchEnd = 80;
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

  txt_BPM: HTMLTextAreaElement;
  lbl_txt_BPM: HTMLDivElement;

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
      this.txt_BPM = document.getElementById('bpm') as HTMLTextAreaElement,
      this.lbl_txt_BPM = document.getElementById('bpm-label') as HTMLDivElement,
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

class BBox {
  x: number;
  y: number;
  width: number;
  height: number;
  // constructor(x, y, w, h) {
  //   this.x = x;
  //   this.y = y;
  //   this.width = w;
  //   this.height = h;
  // }
  constructor(box: BBox = null, x, y, w, h) {
    if (box !== null) {
      this.x = box.x;
      this.y = box.y;
      this.width = box.width;
      this.height = box.height;
    }
    else {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
    }
    return this;
  }
}
