import { Component, OnInit, Inject } from '@angular/core';
import { Note, Part, MIDINote, Track, getMidiFiles, createSong, Instrument, Song, KeyEditor, createTrack, MIDIEvent } from "heartbeat-sequencer";
import { InputConverterComponent } from '../input-converter/input-converter.component';
import { InputDisplayComponent } from '../input-display/input-display.component';
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
  html: EditorHTMLShell;
  info: EditorInfo;
  midiFile;
  keyEditor: KeyEditor;
  div_MidiFileList: HTMLDivElement;
  midiFileList;
  audCntxt: AudioContext;

  pitchStart = 21;
  pitchEnd = 32;
  pitchHeight = 28;
  timeSigNom = 3;
  timeSigDenom = 4;
  editorHeight = ((this.pitchEnd - this.pitchStart + 2) * this.pitchHeight);
  track: Track;
  tracks: Track[];
  instruments: Instrument[];
  song: Song;

  allNotes: Array<Note> = new Array<Note>(); // stores references to all midi notes;
  allParts: Array<Part> = new Array<Part>(); // stores references to all midi parts;
  currNote: Note = null;
  currPart: Part = null;
  flattenTracksToSingleTrack = true;

  bppStart = 8;  //default: 16

  console: Console = window.console;
  alert = window.alert;
  idc = InputDisplayComponent.inpDispCmp;
  icc = InputConverterComponent.inpConvComp;
  rAF = window.requestAnimationFrame;
  output = document.getElementById('console');
  constructor() {
  }
  ngOnInit() {
    InputEditorComponent.inpEdComp = this;
    this.info = new EditorInfo();
    this.html = new EditorHTMLShell();
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
  }
  /**
   * Initialize Critical Components
   * @param iec
   */
  init(iec: InputEditorComponent): void {
    this.enableGUI(false);
    let tmp_icons_w = 128;
    let tmp_w = window.innerWidth - tmp_icons_w;
    let tmp_h = iec.editorHeight;
    let tmp_event;

    this.song = this.initSong();

    iec.instruments = sequencer.getInstruments();

    if (iec.flattenTracksToSingleTrack) { flattenTracks(iec.song); }
    let keyEditor = sequencer.createKeyEditor(this.song, {
      // keyListener: true,
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
    setElementValue(iec.html.txt_KeyRangeStart, keyEditor.lowestNote);
    setElementValue(iec.html.txt_KeyRangeEnd, keyEditor.highestNote);
    let tmp_bpm = this.song.bpm.toString();
    iec.html.txt_BPM.value = tmp_bpm;
    setSliderValues(iec.html.sldr_barsPerPage, keyEditor.barsPerPage, 1, 32, 1);

    initContextEvents();
    initInputEvents();
    initWindowEvents(iec);

    this.enableGUI(true);

    iec.html.slct_Snap.selectedIndex = 4;
    tmp_event = document.createEvent('HTMLEvents');
    tmp_event.initEvent('change', false, false);
    iec.html.slct_Snap.dispatchEvent(tmp_event);

    draw(iec);
    render();
  }
  /**
   * Initializes Song and its properties in the editor
   */
  initSong(): Song {
    const tmp_midiFileName = 'Blank Test';
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
  /**
   * OLD - Add midi files for testing
   */
  addAssetsToSequencer() {
    sequencer.addMidiFile({ url: '../../assets/midi/test.mid' }, null);
    sequencer.addMidiFile({ url: '../../assets/midi/minute_waltz.mid' }, null);
    sequencer.addMidiFile({ url: '../../assets/midi/chpn_op66.mid' }, null);
    sequencer.addMidiFile({ url: '../../assets/midi/Queen - Bohemian Rhapsody.mid' }, null);
  }
  /**
   * turns on GUI elements once all are properly initalized
   * @param flag - whether to turn on the GUI
   */
  enableGUI(flag) {
    let tmp_elements = document.querySelectorAll('input, select');
    let tmp_element;
    let tmp_maxi = tmp_elements.length;
    for (let i = 0; i < tmp_maxi; i++) {
      tmp_element = tmp_elements[i];
      tmp_element.disabled = !flag;
    }
  }
  /**
   * UTILITY - needed for sequencer compatability
   * @param song
   */
  flattenTracks(song: Song) {
    song.tracks.forEach(
      (track) => {
        track.setInstrument('piano');
        track.monitor = true;
        track.setMidiInput('all', true);
      }
    );
  }
  /**
   * Set Element value to val
   * @param elmt HTML Element
   * @param val value
   */
  setElementValue(elmt, val: string) { elmt.value = val; }
  setSliderValues(elmt, val: string, min: number, max: number, step: number) {
    elmt.min = min;
    elmt.max = max;
    elmt.step = step;
    elmt.value = val;
  }
  //#region [rgba(200, 0, 0, 0.05)] Selection Visuals Methods
  /**
   * Set properties in note required for active state
   * @param note
   * @param div_Note
   */
  setNoteActiveState(note: Note, div_Note) {
    div_Note = document.getElementById(note.id);
    if (div_Note !== null && note.part.mute === false && note.mute !== true) {
      if (note.active) { div_Note.className = 'note note-active'; } else
        if (note.active === false) { div_Note.className = 'note'; }
    }
  }
  /**
   * set properties in note required for selected state
   * @param note
   */
  selectNote(note: Note) {
    let div_Note = document.getElementById(note.id);
    if (div_Note !== null && note.part.mute === false && note.mute !== true) {
      div_Note.className = 'note note-selected';
    }
  }
  /**
 * set properties in note required for unselected state
 * @param note
 */
  unselectNote(note: Note) {
    let div_Note = document.getElementById(note.id);
    if (note.part.mute === false && note.mute !== true && div_Note !== null) {
      div_Note.className = 'note';
    }
  }
  /**
   * set properties in part required for active state
   * @param part
   * @param div_Part
   */
  setPartActiveState(part: Part, div_Part: HTMLDivElement) {
    div_Part = document.getElementById(part.id) as HTMLDivElement;
    if (div_Part !== null && part.mute !== true) {
      if (part.active) {
        div_Part.className = 'part part-active';
      } else if (part.active === false) {
        div_Part.className = 'part';
      }
    }
  }
  /**
   *  set properties in part required for selected state
   * @param part
   */
  selectPart(part: Part) {
    let div_Part = document.getElementById(part.id);
    if (part.mute === false) {
      div_Part.className = 'part part-selected';
    }
  }
  /**
   *  set properties in part required for unselected state
   * @param part
   */
  unselectPart(part: Part) {
    let div_Part = document.getElementById(part.id);
    if (part.mute === false) {
      if (div_Part !== null) {
        div_Part.className = 'part';
      }
    }
  }
  //#endregion


  //#region [rgba(0,100,0,0.2)] Grid Element Event Functions
  /*
    Part
    */
  /**
   *Event: left mouse click down on part
   * @param e
   */
  evt_Part_lMouDown(e): void {
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
      iec.keyEditor.startMovePart(tmp_part,
        iec.info.clientX + InputEditorComponent.inpEdComp.html.div_Editor.scrollLeft,
        iec.info.pageY);
      document.addEventListener('mouseup', iec.evt_Part_lMouUp, false);
    }
  }
  /**
   * Event: left mouse click up on part
   * @param e
   */
  evt_Part_lMouUp(e): void {
    let iec = InputEditorComponent.inpEdComp;
    iec.keyEditor.stopMovePart();
    let thing = iec.allParts[iec.currPart.id] as Part;
    thing.notes.forEach((n) => {
      let noteDiv = iec.html.divs_AllNotes[n.id];
      noteDiv.setAttribute('pitch', numToPitch(n.number));
    })
    document.removeEventListener('mouseup', InputEditorComponent.inpEdComp.evt_Part_lMouUp);
  }
  /*
    Note Stuff
    */
  /**
   * Event: mouse hover over note
   * @param e
   */
  evt_Note_MouOver(e): void { (e.target as HTMLDivElement).style.cursor = 'move'; }
  /**
 * Event: left mouse click down on note
 * @param e
 */
  evt_Note_lMouDown(e): void {
    let iec = InputEditorComponent.inpEdComp;
    if (!holdingEdge) {
      let tmp_note = InputEditorComponent.inpEdComp.allNotes[e.target.id];
      if (e.ctrlKey) {
        InputEditorComponent.inpEdComp.keyEditor.removeNote(tmp_note);
        InputEditorComponent.inpEdComp.currNote = null;
      } else {
        InputEditorComponent.inpEdComp.keyEditor.startMoveNote(tmp_note,
          e.clientX + iec.html.div_Editor.scrollLeft,
          e.clientY + (iec.pitchHeight));

        document.addEventListener('mouseup', InputEditorComponent.inpEdComp.evt_Note_lMouUp, false);
      }
    }
  }
  /**
   * Event: left mouse click up on note
   * @param e
   */
  evt_Note_lMouUp(e: MouseEvent): void {
    let iec = InputEditorComponent.inpEdComp;
    iec.keyEditor.stopMoveNote();
    let elmt = iec.html.divs_AllNotes[iec.currNote.id];
    let tmp_note = iec.allNotes[elmt.id];
    let pitch = createNewMIDINote(0, 0, iec.info.mousePitchPos);
    elmt.setAttribute('pitch', pitch.name);
    document.removeEventListener('mouseup', iec.evt_Note_lMouUp);
  }
  /*
    Note Edge Stuff
   */
  /**
   * Event: mouse over left note edge
   * @param e
   */
  evt_NoteEdge_Left_MouOver(e: MouseEvent): void { (e.target as HTMLDivElement).style.cursor = 'w-resize'; }
  /**
   * Event: mouse over right note edge
   * @param e
   */
  evt_NoteEdge_Right_MouOver(e: MouseEvent): void { (e.target as HTMLDivElement).style.cursor = 'e-resize'; }
  /**
   * Event: mouse left click on left note edge
   * @param e
   */
  evt_NoteEdge_Left_lMouDown(e: MouseEvent): void {
    holdingEdge = true;
    (e.target as HTMLDivElement).style.cursor = 'w-resize';
    let tmp_note = InputEditorComponent.inpEdComp.allNotes[(e.target as HTMLDivElement).id];
    // InputEditorComponent.inpEdComp.keyEditor.gripX = e.clientX;
    if (tmp_note == undefined) { tmp_note = changingNote; }
    if (changingNote == null) { changingNote = tmp_note; }
    if (heldEdge == null) { heldEdge = e.target; }
    document.addEventListener('mousemove', InputEditorComponent.inpEdComp.evt_NoteEdge_Left_MouMove, false);
    document.addEventListener('mouseup', InputEditorComponent.inpEdComp.evt_NoteEdge_Left_lMouUp);
  }
  /**
   * Event: mouse left click on right note edge
   * @param e
   */
  evt_NoteEdge_Right_lMouDown(e: MouseEvent) {
    holdingEdge = true;
    (e.target as HTMLDivElement).style.cursor = 'e-resize';
    let tmp_note = InputEditorComponent.inpEdComp.allNotes[(e.target as HTMLDivElement).id];
    // InputEditorComponent.inpEdComp.keyEditor.gripX = e.clientX;
    if (tmp_note == undefined) { tmp_note = changingNote; }
    if (changingNote == null) { changingNote = tmp_note; }
    if (heldEdge == null) { heldEdge = e.target; }
    document.addEventListener('mousemove', InputEditorComponent.inpEdComp.evt_NoteEdge_Right_MouMove, false);
    document.addEventListener('mouseup', InputEditorComponent.inpEdComp.evt_NoteEdge_Right_lMouUp);
  }
  /**
   * Event: mouse move over left note edge
   * @param e
   */
  evt_NoteEdge_Left_MouMove(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp;
    let tmp_ticks = iec.info.snapTicksAtX;
    let tmp_rightEdge = heldEdge.parentElement.childNodes[1];
    (e.target as HTMLDivElement).style.cursor = 'w-resize';

    if (changingNote !== null) {
      changingNote.part.moveEvent(changingNote.noteOn, tmp_ticks - changingNote.noteOn.ticks);
      // changingNote.part.moveEvent(changingNote.noteOn, );
      changingNote.part.moveEvent(changingNote.noteOff, -(tmp_ticks - changingNote.noteOn.ticks));

      InputEditorComponent.inpEdComp.song.update();
      let edgeBBoxes = createEdgeBBoxes(changingNote.bbox, 8);
      updateElementBBox(heldEdge, edgeBBoxes[0]);
      updateElementBBox(tmp_rightEdge, edgeBBoxes[1]);
    }
    else {
    }
  }
  /**
   * Event: mouse move over right note edge
   * @param e
   */
  evt_NoteEdge_Right_MouMove(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp;
    let tmp_ticks = iec.info.snapTicksAtX;
    let tmp_leftEdge = heldEdge.parentElement.childNodes[0];
    (e.target as HTMLDivElement).style.cursor = 'e-resize';
    if (changingNote !== null) {
      changingNote.part.moveEvent(changingNote.noteOff, tmp_ticks - changingNote.noteOff.ticks);

      InputEditorComponent.inpEdComp.song.update();
      let edgeBBoxes = createEdgeBBoxes(changingNote.bbox, 8);
      updateElementBBox(tmp_leftEdge, edgeBBoxes[0]);
      updateElementBBox(heldEdge, edgeBBoxes[1]);
    }
    else {

    }
  }
  /**
   * Event: left mouse click up on left note edge
   * @param e
   */
  evt_NoteEdge_Left_lMouUp(e: MouseEvent) {
    holdingEdge = false;
    changingNote = null;
    heldEdge = null;
    document.removeEventListener('mousemove', InputEditorComponent.inpEdComp.evt_NoteEdge_Left_MouMove, false);
    document.removeEventListener('mouseup', InputEditorComponent.inpEdComp.evt_NoteEdge_Left_lMouUp);
    InputEditorComponent.inpEdComp.song.update();
    (e.target as HTMLDivElement).style.cursor = 'default';
  }
  /**
   * Event: left mouse click up on right note edge
   * @param e
   */
  evt_NoteEdge_Right_lMouUp(e: MouseEvent) {
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
  evt_Grid_lMouDown(e: MouseEvent) { }

  evt_Grid_lMouUp(e: MouseEvent) { }

  /**
   * Event: left mouse double click on editor grid
   * @param e
   */
  evt_Grid_lMouDbl(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp;
    let elmt = (e.target as HTMLElement);
    let tmp_className = elmt.className;
    /**
     * if double clicking a note */
    if (tmp_className.indexOf('note') !== -1) {
      iec.currNote = iec.allNotes[elmt.id];
      iec.currPart = iec.currNote.part;
      return;
    }
    /**
     * if double clicking a blank section of a part */
    else if (tmp_className.indexOf('part') !== -1) {
      iec.currPart = iec.allParts[elmt.id];
      iec.currPart.addEvents(createNewNoteAtMouse(iec.currPart, iec));
      iec.song.update();
      return;
    }
    /**
     * if double clicking grid but current part is selected */
    else if (iec.currPart) {
      // currPart.addEvents(addNewNoteAtMouse());
      iec.song.update();
      return;
    }
    /**
     * if double clicking empty grid space */
    else {
      iec.currNote = null;
      iec.currPart = null;
      addPartAtMouse(iec);
      return;
    }
  }
  /**
   * Event: left mouse click down on general editor space
   * @param e
   */
  evt_Generic_lMouDown(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp;
    let elmt = (e.target as HTMLElement);
    let tmp_className = elmt.className;
    if (tmp_className.indexOf('note') !== -1) {
      if (iec.currNote !== null) { this.unselectNote(iec.currNote); }
      iec.currNote = iec.allNotes[elmt.id];
      if (iec.currNote !== null) { this.selectNote(iec.currNote); }
      iec.currPart = iec.currNote.part;
      if (iec.currPart !== null) { this.selectPart(iec.currPart); }
      return;
    } else if (tmp_className.indexOf('part') !== -1) {
      // keyEditor.setPlayheadToX(e.pageX);
      if (iec.currPart !== null) { this.unselectPart(iec.currPart); }
      iec.currPart = iec.allParts[elmt.id];
      if (iec.currPart !== null) { this.selectPart(iec.currPart); }
      if (iec.currNote !== null) { this.unselectNote(iec.currNote); }
      iec.currNote = null;
      return;
    } else {
      if (iec.currNote !== null) { this.unselectNote(iec.currNote); }
      iec.currNote = null;
      if (iec.currPart !== null) { this.unselectPart(iec.currPart); }
      iec.currPart = null;
      iec.keyEditor.setPlayheadToX(e.clientX - iec.info.editorFrameOffsetX);
      return;
    }
    // you could also use:
    //song.setPlayhead('ticks', keyEditor.xToTicks(e.pageX));
  }
  //#endregion
  /**
   * Creates and returns the two events that compose a MIDINote in the sequencer,
   * @param iec - static singleton
   * @param start - ticks to begin note
   * @param end - ticks to end note
   * @param pitch - pitch to assign note
   * @param vel - velocity to assign note
   */
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
 */
}
/**
 * Returns the two edge HtmlDivElements of a given note
 * @param note
 */
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

/**
 * Initialization of basic window events
 * @param iec
 */
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
/**
 * Initializes the context sensitive editor controls
 */
function initContextEvents() {
  InputEditorComponent.inpEdComp.song.addEventListener('play', () => { setElementValue(InputEditorComponent.inpEdComp.html.btn_Play, 'pause'); });
  InputEditorComponent.inpEdComp.song.addEventListener('pause', () => { setElementValue(InputEditorComponent.inpEdComp.html.btn_Play, 'play'); });
  InputEditorComponent.inpEdComp.song.addEventListener('stop', () => { setElementValue(InputEditorComponent.inpEdComp.html.btn_Play, 'play'); });

  InputEditorComponent.inpEdComp.html.div_Editor.addEventListener('mousedown', () => {
    InputEditorComponent.inpEdComp.html.div_currPart.innerHTML = 'Sel Part: ' + (InputEditorComponent.inpEdComp.currPart !== null ? InputEditorComponent.inpEdComp.currPart.id : 'none');
    InputEditorComponent.inpEdComp.html.div_currNote.innerHTML = 'Sel Note: ' + (InputEditorComponent.inpEdComp.currNote !== null ? InputEditorComponent.inpEdComp.currNote.id : 'none');
  });
}
/**
 * init of basic input events
 */
function initInputEvents() {
  let iec = InputEditorComponent.inpEdComp;
  /**
   * Text
   */
  iec.html.txt_KeyRangeStart.addEventListener('change', (e) => {
    iec.keyEditor.lowestNote = parseInt(iec.html.txt_KeyRangeStart.value);
    // iec.song.setPitchRange(iec.html.txt_KeyRangeStart.value, iec.keyEditor.highestNote);
    iec.keyEditor.updateSong(iec.song);
  });
  iec.html.txt_KeyRangeEnd.addEventListener('change', (e) => {
    iec.keyEditor.highestNote = parseInt(iec.html.txt_KeyRangeEnd.value);
    // iec.song.setPitchRange(iec.keyEditor.lowestNote, iec.html.txt_KeyRangeEnd.value);
    // iec.song.update();
    iec.keyEditor.updateSong(iec.song);
  });
  // listen for scale and draw events, a scale event is fired when you change the number of bars per page
  // a draw event is fired when you change the size of the viewport by resizing the browser window
  iec.keyEditor.addEventListener('scale draw', () => { draw(iec); });

  // listen for scroll events, the score automatically follows the song positon during playback: as soon as
  // the playhead moves off the right side of the screen, a scroll event is fired
  iec.keyEditor.addEventListener('scroll', (data) => { iec.html.div_Editor.scrollLeft = data.x; });
  /**
   * EXPERIMENTAL - Add notes and parts when double clicked in certain contexts
   */
  iec.html.div_Score.addEventListener('dblclick', (e) => { InputEditorComponent.inpEdComp.evt_Grid_lMouDbl(e); });
  // you can set the playhead at any position by clicking on the score
  /**
   * OR - if element clicked on is a part or note, it sets the current note / part to that element
   */
  iec.html.div_Score.addEventListener('mousedown', (e) => { InputEditorComponent.inpEdComp.evt_Generic_lMouDown(e); });
  /**
   * AUDIO CONTEXT CHECKER EVENT
   */
  iec.html.div_Editor.addEventListener('click', (e) => {
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
  iec.html.div_Editor.addEventListener('scroll', () => {
    iec.keyEditor.updateScroll(iec.html.div_Editor.scrollLeft, iec.html.div_Editor.scrollTop);
  }, false);
  /**
   * Score Mouse Movement Tracker
   */
  // iec.html.div_Score.addEventListener('mousemove', (e) => {
  window.addEventListener('mousemove', (e) => {
    e.preventDefault();
    let tmp_part = iec.keyEditor.selectedPart;
    let tmp_note = iec.keyEditor.selectedNote;

    // show the song position and pitch of the current mouse position; handy for debugging
    iec.info.screenX = e.screenX;
    iec.info.screenY = e.screenY;
    iec.info.pageX = e.pageX;
    iec.info.pageY = e.pageY;
    iec.info.clientX = e.clientX;
    iec.info.clientY = e.clientY;
    iec.info.mouseBarPos = iec.keyEditor.getPositionAt(iec.info.pageX).barsAsString;
    iec.info.editorScrollX = iec.html.div_Editor.scrollLeft;
    iec.info.editorScrollY = iec.html.div_Editor.scrollTop;
    iec.info.editorFrameOffsetY = iec.html.div_Editor.offsetTop;
    iec.info.editorFrameOffsetX = iec.html.div_Editor.offsetLeft;
    iec.info.headX = iec.keyEditor.getPlayheadX();
    iec.info.scrolledHeadX = iec.keyEditor.getPlayheadX(true);
    iec.info.snapTicksAtHead = iec.keyEditor.getTicksAt(iec.info.headX);
    iec.info.ticksAtHead = iec.keyEditor.getTicksAt(iec.info.headX, false);
    iec.info.scrollTicksAtHead = iec.keyEditor.getTicksAt(iec.info.scrolledHeadX, false);
    iec.info.ticksAtX = iec.keyEditor.getTicksAt(
      iec.info.clientX - iec.info.editorFrameOffsetX, false);
    iec.info.snapTicksAtX = iec.keyEditor.getTicksAt(
      iec.info.clientX - iec.info.editorFrameOffsetX, true);
    iec.html.div_MouseX.innerHTML =
      `client: (${iec.info.clientX}, ${iec.info.clientY}')` +
      `<br/>screen: (${iec.info.screenX}, ${iec.info.screenY})` +
      '<br/>editor-scrl: (' + iec.info.editorScrollX + ', ' + iec.info.editorScrollY + ')' +
      '<br/>page: (' + iec.info.pageX + ', ' + iec.info.pageY + ')' +
      '<br/>ticks-at-mouse: ' + iec.info.ticksAtX.toFixed(1) +
      '<br/>x Bar: ' + iec.info.mouseBarPos +
      '<br/>x-head: ' + iec.info.headX.toFixed(2) +
      '<br/>scrolled-x-head: ' + iec.info.scrolledHeadX.toFixed(2) +
      '<br/>snap-ticks-head: ' + iec.info.snapTicksAtHead.toFixed(0) +
      '<br/>ticks-head: ' + iec.info.ticksAtHead.toFixed(0);
    ;
    iec.info.mousePitchPos = iec.keyEditor.getPitchAt(iec.info.pageY - iec.html.div_Editor.offsetTop).number;
    iec.html.div_MouseY.innerHTML = 'y Pitch: ' + iec.info.mousePitchPos +
      '\nframe-offset-y: ' + iec.info.editorFrameOffsetY;
    // move part or note if selected
    if (tmp_part !== undefined) {
      iec.keyEditor.movePart(iec.info.pageX, iec.info.pageY);
    }
    if (tmp_note !== undefined) {
      iec.keyEditor.moveNote(iec.info.pageX, iec.info.pageY - iec.info.editorFrameOffsetY);
    }
  },
    false
  );
  /**
   * Grid
   */
  iec.html.slct_Snap.addEventListener('change', () => {
    iec.keyEditor.setSnapX(Number.parseInt(
      iec.html.slct_Snap.options[iec.html.slct_Snap.selectedIndex].value));
  }, false);
  /**
   * Buttons
   */
  iec.html.btn_Play.addEventListener('click', () => { iec.song.pause(); });
  iec.html.btn_Record.addEventListener('click', () => { iec.song.startRecording(); });
  iec.html.btn_Loop.addEventListener('click', () => { iec.song.loop = !iec.song.loop; });

  iec.html.btn_Stop.addEventListener('click', () => { iec.song.stop(); });
  iec.html.btn_Next.addEventListener('click', () => { iec.keyEditor.scroll('>'); });
  iec.html.btn_Prev.addEventListener('click', () => { iec.keyEditor.scroll('<'); });
  iec.html.btn_First.addEventListener('click', () => { iec.keyEditor.scroll('<<'); });
  iec.html.btn_Last.addEventListener('click', () => { iec.keyEditor.scroll('>>'); });
  iec.html.btn_AddPart.addEventListener('click', () => { addRandomPartAtPlayhead(iec); });
  /**
   * Sliders
   */
  iec.html.sldr_barsPerPage.addEventListener(
    'change',
    function (e) {
      var tmp_bpp = parseFloat((e.target as HTMLInputElement).value);
      iec.html.lbl_sldr_barsPerPage.innerHTML = '#bars ' + tmp_bpp;
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
/**
 * set generic element's value to val
 * @param ref_elmt
 * @param val
 */
function setElementValue(ref_elmt, val) { ref_elmt.value = val; }
/**
 * set slider element's various values
 * @param ref_elmt
 * @param val
 * @param min
 * @param max
 * @param step
 */
function setSliderValues(ref_elmt, val, min, max, step) {
  ref_elmt.min = min;
  ref_elmt.max = max;
  ref_elmt.step = step;
  ref_elmt.value = val;
}
//#region [rgba(120, 120, 0 ,0.15)] Draw Functions
/**
 * Editor Main Draw Function
 * @param iec
 */
function draw(iec: InputEditorComponent) {
  //Initialize all Grid HTML elements to blank
  iec.allNotes = new Array<Note>();
  iec.allParts = new Array<Part>();
  iec.html.divs_AllNotes = new Array<HTMLDivElement>();
  iec.html.divs_AllParts = new Array<HTMLDivElement>();
  iec.html.div_Parts.innerHTML = '';
  iec.html.div_Notes.innerHTML = '';
  iec.html.div_PitchLines.innerHTML = '';
  iec.html.div_BarLines.innerHTML = '';
  iec.html.div_BeatLines.innerHTML = '';
  iec.html.div_SixteenthLines.innerHTML = '';

  iec.keyEditor.horizontalLine.reset();
  iec.keyEditor.verticalLine.reset();
  iec.keyEditor.noteIterator.reset();
  iec.keyEditor.partIterator.reset();

  iec.html.div_Score.style.width = iec.keyEditor.width + 'px';
  let i = 0;
  while (iec.keyEditor.horizontalLine.hasNext('chromatic')) { drawHorizontalLine(iec.keyEditor.horizontalLine.next('chromatic')); }
  while (iec.keyEditor.verticalLine.hasNext('sixteenth')) { drawVerticalLine(iec.keyEditor.verticalLine.next('sixteenth')); }
  while (iec.keyEditor.noteIterator.hasNext()) { drawNote(iec.keyEditor.noteIterator.next(), iec); }
  while (iec.keyEditor.partIterator.hasNext()) { drawPart(iec.keyEditor.partIterator.next(), iec); }
}
/**
 * horizontal line iterator
 * @param ref_data
 */
function drawHorizontalLine(ref_data) {
  let div_HLine = document.createElement('div'),
    pitchHeight = InputEditorComponent.inpEdComp.keyEditor.pitchHeight;

  if (ref_data.note.blackKey === true) {
    div_HLine.className = 'pitch-line black-key';
  } else {
    div_HLine.className = 'pitch-line';
  }
  div_HLine.id = ref_data.note.fullName;
  div_HLine.innerHTML = ref_data.note.fullName;
  div_HLine.style.height = pitchHeight + 'px';
  div_HLine.style.top = ref_data.y + 'px';
  // tmp_div_HLine.y = ref_data.y;
  // if (iec !== null)
  InputEditorComponent.inpEdComp.html.div_PitchLines.appendChild(div_HLine);

}
/**
 * vertical line iterator
 * @param ref_data
 */
function drawVerticalLine(ref_data) {
  let tmp_type = ref_data.type,
    div_VLine = document.createElement('div');

  div_VLine.id = ref_data.position.barsAsString;
  div_VLine.className = ref_data.type + '-line';
  div_VLine.style.left = ref_data.x + 'px';
  div_VLine.style.width = '5px'; // if you make the width too small, the background image of sometimes disappears
  // tmp_div_VLine.x = ref_data.x;

  switch (tmp_type) {
    case 'bar':
      div_VLine.innerHTML = ref_data.position.barsAsString;
      // if (iec !== null)
      div_VLine.style.height = InputEditorComponent.inpEdComp.html.div_Score.scrollHeight.toString() + 'px';
      InputEditorComponent.inpEdComp.html.div_BarLines.appendChild(div_VLine);
      break;
    case 'beat':
      // if (iec !== null)
      InputEditorComponent.inpEdComp.html.div_BeatLines.appendChild(div_VLine);
      break;
    case 'sixteenth':
      // if (iec !== null)
      InputEditorComponent.inpEdComp.html.div_SixteenthLines.appendChild(div_VLine);
      break;
  }
}
/**
 * draw a given note in sequencer
 * @param ref_note
 * @param iec
 */
function drawNote(ref_note: Note, iec: InputEditorComponent) {
  const bbox = ref_note.bbox;
  const edgeBBoxes = createEdgeBBoxes(ref_note.bbox, 8);
  const div_Note = document.createElement('div');
  const img_Note_leftEdge = document.createElement('img');
  const img_Note_rightEdge = document.createElement('img');
  const div_Note_info = document.createElement('div');

  div_Note.id = ref_note.id;
  div_Note.setAttribute('pitch', ref_note.name);
  div_Note.className = 'note';
  // let tmpThing = iec.song.notes;
  // let tmp_vel = -1;
  // tmpThing.forEach((e: MIDINote) => {
  //   if (e.id == ref_note.id) {
  //     tmp_vel = e.velocity;
  //   }
  // });
  // tmp_div_Note_info.id = 'note-info';
  // tmp_div_Note_info.innerHTML = "   " + tmp_vel.toString();

  img_Note_leftEdge.id = div_Note.id;
  img_Note_leftEdge.className = 'note-edge';
  img_Note_leftEdge.src = 'assets/images/Editor-Arrow-Left.png';

  img_Note_rightEdge.id = div_Note.id;
  img_Note_rightEdge.className = 'note-edge';
  img_Note_rightEdge.src = 'assets/images/Editor-Arrow-Right.png';

  updateElementBBox(div_Note, bbox);
  updateElementBBox(img_Note_leftEdge, edgeBBoxes[0]);
  updateElementBBox(img_Note_rightEdge, edgeBBoxes[1]);

  // store note and div
  InputEditorComponent.inpEdComp.allNotes[ref_note.id] = ref_note;
  iec.html.divs_AllNotes[ref_note.id] = div_Note;
  div_Note.addEventListener('mouseover', (e) => InputEditorComponent.inpEdComp.evt_Note_MouOver(e), false);
  div_Note.addEventListener('mousedown', (e) => InputEditorComponent.inpEdComp.evt_Note_lMouDown(e), false);
  img_Note_leftEdge.addEventListener('mouseover', (e) => { InputEditorComponent.inpEdComp.evt_NoteEdge_Left_MouOver(e); });
  img_Note_leftEdge.addEventListener('mousedown', (e) => { InputEditorComponent.inpEdComp.evt_NoteEdge_Left_lMouDown(e); });
  img_Note_rightEdge.addEventListener('mouseover', (e) => { InputEditorComponent.inpEdComp.evt_NoteEdge_Right_MouOver(e); });
  img_Note_rightEdge.addEventListener('mousedown', (e) => { InputEditorComponent.inpEdComp.evt_NoteEdge_Right_lMouDown(e); });

  div_Note.append(img_Note_leftEdge);
  div_Note.append(img_Note_rightEdge);
  div_Note.append(div_Note_info);
  iec.html.div_Notes.appendChild(div_Note);
}
/**
 * draw a given part in the sequencer
 * @param ref_part
 * @param iec
 */
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
  iec.html.divs_AllParts[ref_part.id] = tmp_div_Part;
  tmp_div_Part.addEventListener('mousedown', InputEditorComponent.inpEdComp.evt_Part_lMouDown, false);
  iec.html.div_Parts.appendChild(tmp_div_Part);
}
/**
 * Fits element within its bounding box
 * @param element
 * @param bbox
 */
export function updateElementBBox(element, bbox: BBox) {
  element.style.left = bbox.x + 'px';
  element.style.top = bbox.y + 'px';
  element.style.width = bbox.width + 'px';
  element.style.height = bbox.height + 'px';
}
/**
 * resizes editor whenever the window's size or shape is changed
 */
function resize() {
  let iec = InputEditorComponent.inpEdComp;
  // let tmp_div_icons = document.getElementById('editor-input-icons');
  // let tmp_icons_w = tmp_div_icons.clientWidth;
  let tmp_icons_w = 64;
  let tmp_c = iec.html.div_Controls.getBoundingClientRect().height;
  let tmp_w = window.innerWidth - tmp_icons_w;
  let tmp_h = iec.editorHeight;

  // tell the key editor that the viewport has canged, necessary for auto scroll during playback
  iec.keyEditor.setViewport(tmp_w, tmp_h);
  // tmp_div_icons.style.width = tmp_icons_w + 'px';
  // tmp_div_icons.style.height = tmp_h + 'px';
  iec.html.div_Editor.style.width = tmp_w + 'px';
  iec.html.div_Editor.style.left = tmp_icons_w + 'px';
  iec.html.div_Editor.style.height = tmp_h + 'px';
}
/**
 * General Editor Render Loop
 */
function render() {
  let iec = InputEditorComponent.inpEdComp;
  let snapshot = iec.keyEditor.getSnapshot('key-editor');
  let tmp_div_Note: HTMLDivElement;
  let tmp_div_Part: HTMLDivElement;

  iec.html.div_Playhead.style.left = iec.keyEditor.getPlayheadX() - 10 + 'px';
  iec.html.div_PageNumbers.innerHTML =
    'page ' + iec.keyEditor.currentPage + ' of ' + iec.keyEditor.numPages;

  iec.html.div_BarsBeats.innerHTML = iec.song.barsAsString;
  const position = iec.keyEditor.getPositionAt(iec.keyEditor.getPlayheadX());
  if (position) {
    const tmp_hrMinSecMillisec = new Date(position.ticks * iec.song.millisPerTick);
    iec.html.div_Seconds.innerHTML =
      tmp_hrMinSecMillisec.getUTCHours() + ':'
      + tmp_hrMinSecMillisec.getUTCMinutes() + ':'
      + tmp_hrMinSecMillisec.getUTCSeconds() + '.'
      + tmp_hrMinSecMillisec.getUTCMilliseconds();
  }

  snapshot.notes.removed.forEach((note) => {
    iec.html.divs_AllNotes[note.id].removeEventListener('mousedown', InputEditorComponent.inpEdComp.evt_Note_lMouDown);
    iec.html.div_Notes.removeChild(document.getElementById(note.id));
  });

  snapshot.notes.new.forEach((note) => { drawNote(note, iec); });
  snapshot.notes.recorded.forEach((note) => { drawNote(note, iec); });
  snapshot.notes.recording.forEach((note) => { updateElementBBox(iec.html.divs_AllNotes[note.id], note.bbox); });
  // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
  snapshot.notes.changed.forEach((note) => {
    let elmt = iec.html.divs_AllNotes[note.id] as HTMLElement;
    elmt.setAttribute('pitch', note.name);
    updateElementBBox(elmt, note.bbox);
  });

  // stateChanged arrays contain elements that have become active or inactive
  snapshot.notes.stateChanged.forEach((note) => { InputEditorComponent.inpEdComp.setNoteActiveState(note, tmp_div_Note); });

  snapshot.parts.removed.forEach((part) => {
    iec.html.divs_AllParts[part.id].removeEventListener('mousedown', InputEditorComponent.inpEdComp.evt_Part_lMouDown);
    iec.html.div_Parts.removeChild(document.getElementById(part.id));
  });

  snapshot.parts.new.forEach((part) => { drawPart(part, iec); });

  // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
  snapshot.parts.changed.forEach((part) => { updateElementBBox(iec.html.divs_AllParts[part.id], part.bbox); });

  // stateChanged arrays contain elements that have become active or inactive
  snapshot.parts.stateChanged.forEach((part) => { InputEditorComponent.inpEdComp.setPartActiveState(part, tmp_div_Part); });

  if (snapshot.hasNewBars) {
    // set the new width of the score
    iec.html.div_Score.style.width = snapshot.newWidth + 'px';

    // clear the horizontal lines because the lines have to be drawn longer
    iec.html.div_PitchLines.innerHTML = '';

    // reset the index of the iterator because we're starting from 0 again
    iec.keyEditor.horizontalLine.reset();
    while (iec.keyEditor.horizontalLine.hasNext('chromatic')) { drawHorizontalLine(iec.keyEditor.horizontalLine.next('chromatic')); }

    // the index of the vertical line iterator has already been set to the right index by the key editor
    // so only the extra barlines will be drawn
    while (iec.keyEditor.verticalLine.hasNext('sixteenth')) { drawVerticalLine(iec.keyEditor.verticalLine.next('sixteenth')); }
  }
  //update head values if playing
  if (iec.song.playing) {
    iec.info.headX = iec.keyEditor.getPlayheadX();
    iec.info.scrolledHeadX = iec.keyEditor.getPlayheadX(true);
    iec.info.snapTicksAtHead = iec.keyEditor.getTicksAt(iec.info.headX);
    iec.info.ticksAtHead = iec.keyEditor.getTicksAt(iec.info.headX, false);
    iec.info.scrollTicksAtHead = iec.keyEditor.getTicksAt(iec.info.scrolledHeadX, false);
    iec.html.div_MouseX.innerHTML =
      'client: (' + iec.info.clientX + ', ' + iec.info.clientY + ')' +
      '<br/>|screen: (' + iec.info.screenX + ', ' + iec.info.screenY + ')' +
      '<br/>|editor-scrl: (' + iec.info.editorScrollX + ', ' + iec.info.editorScrollY + ')' +
      '<br/>|page: (' + iec.info.pageX + ', ' + iec.info.pageY + ')' +
      '<br/>|ticks-at-mouse: ' + iec.info.ticksAtX.toFixed(1) +
      '<br/>|x Bar: ' + iec.info.mouseBarPos +
      '<br/>|x-head: ' + iec.info.headX.toFixed(2) +
      '<br/>|scrolled-x-head: ' + iec.info.scrolledHeadX.toFixed(2) +
      '<br/>|snap-ticks-head: ' + iec.info.snapTicksAtHead +
      '<br/>|ticks-head: ' + iec.info.ticksAtHead;
  }
  requestAnimationFrame(render);
}

//#endregion



//#region [ rgba(200, 200, 200, 0.1) ] Random Generation Functions
/**
 * returns a random value between the min and the max
 * @param num_min
 * @param num_max
 * @param bool_round
 */
function getRandom(num_min, num_max, bool_round) {
  let tmp_r = Math.random() * (num_max - num_min) + num_min;
  if (bool_round === true) {
    return Math.round(tmp_r);
  } else {
    return tmp_r;
  }
}
/**
 * DEBUG - makes a random part for debug purposes
 * @param iec
 */
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
/**
 * inits a part with two notes at the pitch and ticks of the mouse's coordinates
 * @param iec
 */
function addPartAtMouse(iec: InputEditorComponent) {
  iec.keyEditor.setPlayheadToX(iec.info.clientX - iec.info.editorFrameOffsetX);
  let i;
  let tmp_ticks = 0;
  let tmp_numNotes = 2;
  let tmp_basePitch = iec.info.mousePitchPos;
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
  tmp_ticks = iec.info.ticksAtHead;

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
 * returns a new midinote with the given properties
 * @param start
 * @param end
 * @param pitch
 */
function createNewMIDINote(start: number, end: number, pitch: number): MIDINote {
  let tmp_velocity = 127;
  let tmp_noteOn = sequencer.createMidiEvent(start, InputEditorComponent.NOTE_ON, pitch, tmp_velocity);
  let tmp_noteOff = sequencer.createMidiEvent(end, InputEditorComponent.NOTE_OFF, pitch, 0);
  let tmp_midiNote = sequencer.createMidiNote(tmp_noteOn, tmp_noteOff);
  return tmp_midiNote;
}
/**
 * alternate to createNewMIDINote
 * @param start
 * @param end
 * @param pitch
 * @param velocity
 */
function createNewNoteEvents(start: number, end: number, pitch: number, velocity?: number): [MIDIEvent, MIDIEvent] {
  let tmp_velocity = (velocity == undefined ? 127 : velocity);
  let tmp_events = [];
  let tmp_noteOn = sequencer.createMidiEvent(start, InputEditorComponent.NOTE_ON, pitch, tmp_velocity);
  let tmp_noteOff = sequencer.createMidiEvent(end, InputEditorComponent.NOTE_OFF, pitch, 0);
  tmp_events.push(tmp_noteOn, tmp_noteOff);
  return [tmp_noteOn, tmp_noteOff];
}
/**
 * Adds a note at the mouse's coordinates to the selected part
 * @param tmp_part
 * @param iec
 */
function createNewNoteAtMouse(tmp_part, iec: InputEditorComponent) {
  let tmp_pitch = iec.info.mousePitchPos;
  let tmp_velocity = 127;
  let tmp_events = [];
  let tmp_noteLength = iec.song.ppq/*  * 2 */;
  let tmp_ticks = iec.info.ticksAtX;
  let tmp_noteOn;
  let tmp_noteOff;
  let tmp_note;
  // tmp_note = sequencer.createNote(pitch.number);
  tmp_noteOn = sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_ON, tmp_pitch, tmp_velocity);
  tmp_ticks += tmp_noteLength;
  tmp_noteOff = sequencer.createMidiEvent(tmp_ticks, InputEditorComponent.NOTE_OFF, tmp_pitch, 0);
  tmp_events.push(tmp_noteOn, tmp_noteOff);
  tmp_ticks = InputEditorComponent.inpEdComp.keyEditor.getTicksAt(InputEditorComponent.inpEdComp.info.screenX);
  console.log('added new note: \n ' +
    'pitch: ' + tmp_pitch + '\n' +
    'at ticks: ' + tmp_ticks + '\n' +
    'velocity: ' + tmp_velocity + '\n' +
    'length: ' + tmp_noteLength + '\n'
  );
  return tmp_events;
}
/**
 *  Compacts all song tracks onto single track, set to monitor, and set instrument to piano
 * @param ref_song
 */
function flattenTracks(ref_song) {
  ref_song.tracks.forEach(
    function (track) {
      track.setInstrument('piano');
      track.monitor = true;
      track.setMidiInput('all');
    }
  );
}
/**
 * Creates bounding boxes for note
 * @param bbox Bounding box of note
 * @param xPx Width of bounding box in pixels
 */
export function createEdgeBBoxes(bbox, xPx: number): [BBox, BBox] {
  let tmp_bbox_l = new BBox(null, 0 - xPx, 0, xPx, bbox.height);
  let tmp_bbox_r = new BBox(null, bbox.width, 0, xPx, bbox.height);
  return [tmp_bbox_l, tmp_bbox_r];
}
/**
 * holds many useful values needed to help make heartbeat-sequencer compatible with our solution
 */
export class EditorInfo {
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
  snapTicksAtX: number;
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
/**
 * contains all the separate elements in the editor for quick and frequently necessary reference
 */
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
  divs_AllNotes: Array<HTMLDivElement>;
  divs_AllParts: Array<HTMLDivElement>;
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
/**
 * abstraction class used to help keep relative locations of elements standardized and consistent
 */
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
export function numToPitch(i: number): string {
  switch (i) {
    case 43: return 'G2';
    case 42: return 'F#2';
    case 41: return 'F2';
    case 40: return 'E2';
    case 39: return 'D#2';
    case 38: return 'D2';
    case 37: return 'C#2';
    case 36: return 'C2';
    case 35: return 'B1';
    case 34: return 'A#1';
    case 33: return 'A1';
    case 32: return 'G#1';
    case 31: return 'G1';
    case 30: return 'F#1';
    case 29: return 'F1';
    case 28: return 'E1';
    case 27: return 'D#1';
    case 26: return 'D1';
    case 25: return 'C#1';
    case 24: return 'C1';
    case 23: return 'B0';
    case 22: return 'A#0';
    case 21: return 'A0';
    case 12: return 'C-1';
    case 0: return 'C-2';
  }
}
