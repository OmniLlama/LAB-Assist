import {Instrument, Note, Part, KeyEditor, MIDIEvent, MIDINote, Song} from '../../heartbeat/build';
import {InputEditorComponent} from './input-editor.component';

;
declare let sequencer: any;

const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;
const MIDI_HEARTBEAT = 0xFE;

export class InputEditorFunctions {
  // iec: InputEditorComponent = InputEditorComponent.inpEdComp;
  /**
   * returns a random value between the min and the max
   * @param min
   * @param max
   * @param round
   */
  static getRandom(min: number, max: number, round: boolean) {
    let rand = Math.random() * (max - min) + min;
    if (round === true) {
      return Math.round(rand);
    } else {
      return rand;
    }
  }

  /**
   * alternate to createNewMIDINote
   * @param start
   * @param end
   * @param pitch
   * @param velocity
   */
  static createNewNoteEvents(start: number, end: number, pitch: number, velocity?: number): [MIDIEvent, MIDIEvent] {
    const tmp_velocity = (velocity === undefined ? 127 : velocity);
    const tmp_noteOn = sequencer.createMidiEvent(start, NOTE_ON, pitch, tmp_velocity);
    const tmp_noteOff = sequencer.createMidiEvent(end, NOTE_OFF, pitch, tmp_velocity);
    return [tmp_noteOn, tmp_noteOff];
  }

  /**
   * Creates and returns the two events that compose a MIDINote in the sequencer,
   * @param start - ticks to begin note
   * @param end - ticks to end note
   * @param pitch - pitch to assign note
   * @param vel - velocity to assign note
   */
  // static createNoteFromTicks(start: number, end: number, pitch: number, vel: number, part: Part): MIDINote {
  static createNoteFromTicks(start: number, end: number, pitch: number, vel: number, part: Part): [MIDIEvent, MIDIEvent] {
    const iec = InputEditorComponent.inpEdComp;
    if (!iec.song.getPart(part.id)) {
      iec.track.addPartAt(part, ['ticks', start]);
    }
    const noteEvts = this.createNewNoteEvents(start, end, pitch, vel);
    if (part) {
      part.addEvents(noteEvts);
    } else {
      part = sequencer.createPart();
      part.addEvents(noteEvts);
    }
    // iec.currPart = part;
    sequencer.createNote(noteEvts[0], noteEvts[1]);
    InputEditorFunctions.UpdateTrack(iec);
    part.update();
    // InputEditorFunctions.UpdateSong(iec);
    return noteEvts;
  }

  /**
   * DEBUG - makes a random part for debug purposes
   * @param iec
   */
  static addRandomPartAtPlayhead(iec: InputEditorComponent) {
    let tmp_ticks = 0;
    let tmp_numNotes = this.getRandom(4, 8, true);
    let tmp_spread = 5;
    let tmp_basePitch = this.getRandom(
      iec.keyEditor.lowestNote + tmp_spread,
      iec.keyEditor.highestNote - tmp_spread,
      true
    );
    let tmp_part = sequencer.createPart();
    let tmp_events = [];
    let tmp_noteLength = iec.song.ppq / 2;
    let tmp_pitch;
    let tmp_velocity;

    for (let i = 0; i < tmp_numNotes; i++) {
      tmp_pitch = tmp_basePitch + this.getRandom(-tmp_spread, tmp_spread, true);
      tmp_velocity = this.getRandom(50, 127, true);

      tmp_events.push(sequencer.createMidiEvent(tmp_ticks, NOTE_ON, tmp_pitch, tmp_velocity));
      tmp_ticks += tmp_noteLength;
      tmp_events.push(sequencer.createMidiEvent(tmp_ticks, NOTE_OFF, tmp_pitch, 0));
      tmp_ticks += tmp_noteLength;
    }
    tmp_ticks = iec.keyEditor.getTicksAt(iec.keyEditor.getPlayheadX());

    tmp_part.addEvents(tmp_events);
    iec.track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
    InputEditorFunctions.UpdateSong(iec);
  }

  /**
   * inits a part with two notes at the pitch and ticks of the mouse's coordinates
   * @param iec
   */
  static addPartAtMouse(iec: InputEditorComponent) {
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
      tmp_velocity = this.getRandom(50, 127, true);

      tmp_events.push(sequencer.createMidiEvent(tmp_ticks, NOTE_ON, tmp_pitch, tmp_velocity));
      tmp_ticks += tmp_noteLength;
      tmp_events.push(sequencer.createMidiEvent(tmp_ticks, NOTE_OFF, tmp_pitch, 0));
      tmp_ticks += tmp_noteLength;
    }
    tmp_ticks = iec.info.totalTicksAtHead;

    tmp_part.addEvents(tmp_events);
    iec.track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
    InputEditorFunctions.UpdateTrack(iec);
    InputEditorFunctions.UpdateSong(iec);
  }

  //#endregion


  /**
   * returns a new midinote with the given properties
   * @param start
   * @param end
   * @param pitch
   */
  static createNewMIDINote(start: number, end: number, pitch: number): MIDINote {
    let tmp_velocity = 127;
    let tmp_noteOn = sequencer.createMidiEvent(start, NOTE_ON, pitch, tmp_velocity);
    let tmp_noteOff = sequencer.createMidiEvent(end, NOTE_OFF, pitch, 0);
    let tmp_midiNote = sequencer.createMidiNote(tmp_noteOn, tmp_noteOff);
    return tmp_midiNote;
  }

  /**
   * Adds a note at the mouse's coordinates to the selected part
   * @param tmp_part
   * @param iec
   */
  static createNewNoteAtMouse(tmp_part, iec: InputEditorComponent) {
    let tmp_pitch = iec.info.mousePitchPos;
    let tmp_velocity = 127;
    let tmp_events = [];
    let tmp_noteLength = iec.song.ppq/*  * 2 */;
    let tmp_ticks = iec.info.ticksAtX;
    let tmp_noteOn;
    let tmp_noteOff;
    let tmp_note;
    // tmp_note = sequencer.createNote(pitch.number);
    tmp_noteOn = sequencer.createMidiEvent(tmp_ticks, NOTE_ON, tmp_pitch, tmp_velocity);
    tmp_ticks += tmp_noteLength;
    tmp_noteOff = sequencer.createMidiEvent(tmp_ticks, NOTE_OFF, tmp_pitch, 0);
    tmp_events.push(tmp_noteOn, tmp_noteOff);
    tmp_ticks = iec.keyEditor.getTicksAt(iec.info.screenX);
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
  static flattenTracks(ref_song: Song) {
    ref_song.tracks.forEach((track) => {
        track.setInstrument('piano');
        track.monitor = true;
        track.setMidiInput('all');
      }
    );
  }

  //#region [rgba(200, 0, 0, 0.05)] Selection Visuals Methods
  /**
   * Set properties in note required for active state
   * @param note
   * @param div_Note
   */
  static setNoteActiveState(note: Note, div_Note) {
    div_Note = document.getElementById(note.id);
    if (div_Note !== null && note.part.mute === false && note.mute !== true) {
      if (note.active) {
        div_Note.className = 'note note-active';
      } else if (note.active === false) {
        div_Note.className = 'note';
      }
    }
  }

  /**
   * set properties in note required for selected state
   * @param note
   */
  static selectNote(note: Note) {
    let div_Note = document.getElementById(note.id);
    if (div_Note !== null && note.part.mute === false && note.mute !== true) {
      div_Note.className = 'note note-selected';
    }
  }

  /**
   * set properties in note required for unselected state
   * @param note
   */
  static unselectNote(note: Note) {
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
  static setPartActiveState(part: Part, div_Part: HTMLDivElement) {
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
  static selectPart(part: Part) {
    let div_Part = document.getElementById(part.id);
    if (part.mute === false) {
      div_Part.className = 'part part-selected';
    }
  }

  /**
   *  set properties in part required for unselected state
   * @param part
   */
  static unselectPart(part: Part) {
    let div_Part = document.getElementById(part.id);
    if (part.mute === false) {
      if (div_Part !== null) {
        div_Part.className = 'part';
      }
    }
  }

  //#endregion
  /**
   * Initializes Song and its properties in the editor
   */
  static initSong(): Song {

    let song: Song;
    const iec = InputEditorComponent.inpEdComp;
    let tmp_midiFiles = sequencer.getMidiFiles();
    let tmp_midiFile = tmp_midiFiles[0];
    if (tmp_midiFile !== undefined) {
      song = sequencer.createSong(tmp_midiFile);
    } else {
      song = sequencer.createSong({
        bpm: 200,
        nominator: 3,
        denominator: 4,
        useMetronome: true
      });
    }
    if (song.tracks[0]) {
      iec.track = song.tracks[0];
    } else {
      iec.track = sequencer.createTrack('newTrack');
      song.addTrack(iec.track);
    }
    song.update();
    return song;
  }

  static initKeyEditor(iec: InputEditorComponent): KeyEditor {
    let tmp_icons_w = 128;
    let tmp_w = window.innerWidth - tmp_icons_w;
    let tmp_h = iec.info.editorHeight;
    let keyEditor = sequencer.createKeyEditor(iec.song, {
      // keyListener: true,
      viewportHeight: tmp_h,
      viewportWidth: tmp_w,
      pitchHeight: iec.info.pitchHeight,
      lowestNote: iec.info.pitchStart,
      highestNote: iec.info.pitchEnd,
      barsPerPage: iec.bppStart
    });
    return keyEditor;
  }


  static UpdateTrack(iec: InputEditorComponent) {
    iec.track.update();
  }

  static UpdateSong(iec: InputEditorComponent) {
    iec.song.update();
  }

  static numToPitch(i: number): string {
    switch (i) {
      case 43:
        return 'G2';
      case 42:
        return 'F#2';
      case 41:
        return 'F2';
      case 40:
        return 'E2';
      case 39:
        return 'D#2';
      case 38:
        return 'D2';
      case 37:
        return 'C#2';
      case 36:
        return 'C2';
      case 35:
        return 'B1';
      case 34:
        return 'A#1';
      case 33:
        return 'A1';
      case 32:
        return 'G#1';
      case 31:
        return 'G1';
      case 30:
        return 'F#1';
      case 29:
        return 'F1';
      case 28:
        return 'E1';
      case 27:
        return 'D#1';
      case 26:
        return 'D1';
      case 25:
        return 'C#1';
      case 24:
        return 'C1';
      case 23:
        return 'B0';
      case 22:
        return 'A#0';
      case 21:
        return 'A0';
      case 12:
        return 'C-1';
      case 0:
        return 'C-2';
    }
  }

}

export class BBox {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(box: BBox = null, x, y, w, h) {
    if (box !== null) {
      this.x = box.x;
      this.y = box.y;
      this.width = box.width;
      this.height = box.height;
    } else {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
    }
    return this;
  }
}

/**
 * holds many useful values needed to help make heartbeat-sequencer compatible with our solution
 */
export class EditorInfo {
  pageX: number = 0;
  pageY: number = 0;
  clientX: number = 0;
  clientY: number = 0;
  screenX: number = 0;
  screenY: number = 0;
  editorX: number = 0;
  editorY: number = 0;

  headX: number = 0;
  scrolledHeadX: number = 0;
  mouseBarPos: string;
  mousePitchPos: number;

  editorFrameOffsetY = 0;
  editorFrameOffsetX = 0;
  editorScrollX = 0;
  editorScrollY = 0;
  snapTicksAtX: number = 0;
  ticksAtX: number = 0;
  totalTicksAtHead: number = 0;
  snapTotalTicksAtHead: number = 0;
  scrollTicksAtHead: number = 0;
  snapScrollTicksAtHead: number = 0;
  instruments: Instrument[];
  currNote = null;
  currPart = null;
  allNotes: Note[];
  allParts: Part[];
  flattenTracksToSingleTrack = true;
  edHTMLShell = new EditorHTMLShell();

  pitchStart = 21;
  pitchEnd = 40;
  pitchHeight = 28;
  timeSigNom = 3;
  timeSigDenom = 4;
  editorHeight = ((this.pitchEnd - this.pitchStart + 2) * this.pitchHeight);

  UpdateInfo(me: MouseEvent, ke: KeyEditor) {
    if (me !== null) {
      this.screenX = me.screenX;
      this.screenY = me.screenY;
      this.pageX = me.pageX;
      this.pageY = me.pageY;
      this.clientX = me.clientX;
      this.clientY = me.clientY;
      this.editorX = me.pageX - this.editorFrameOffsetX;
      this.editorY = me.pageY - this.editorFrameOffsetY;
    }
    this.mouseBarPos = ke.getPositionAt(this.pageX - (this.editorFrameOffsetX)).barsAsString;
    this.editorScrollX = this.edHTMLShell.div_Editor.scrollLeft;
    this.editorScrollY = this.edHTMLShell.div_Editor.scrollTop;
    this.editorFrameOffsetY = this.edHTMLShell.div_Editor.offsetTop;
    this.editorFrameOffsetX = this.edHTMLShell.div_Editor.offsetLeft;
    this.headX = ke.getPlayheadX();
    this.scrolledHeadX = ke.getPlayheadX(true);
    this.totalTicksAtHead = ke.getTicksAt(this.headX, false);
    this.snapTotalTicksAtHead = ke.getTicksAt(this.headX);
    this.scrollTicksAtHead = ke.getTicksAt(this.scrolledHeadX, false);
    this.snapScrollTicksAtHead = ke.getTicksAt(this.scrolledHeadX);
    this.mousePitchPos = ke.getPitchAt(this.pageY - this.edHTMLShell.div_Editor.offsetTop - (this.pitchHeight / 2)).number;
    this.ticksAtX = ke.getTicksAt(
      this.clientX - this.editorFrameOffsetX, false);
    this.snapTicksAtX = ke.getTicksAt(
      this.clientX - this.editorFrameOffsetX, true);
  }

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

  tbl_DBGInfo: HTMLTableElement;

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
      this.tbl_DBGInfo = document.getElementById('debug-info') as HTMLTableElement,
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
    this.divs_AllNotes = new Array<HTMLDivElement>(),
      this.divs_AllParts = new Array<HTMLDivElement>();
    return this;
  }
}

