// import {Instrument, Note, Part, KeyEditor, MIDIEvent, MIDINote, Song} from 'heartbeat-sequencer';
import {InputEditorComponent} from './input-editor.component';
import {BBox, HTMLNote, HTMLPart, Tracker} from '../../helpers/Defs';
import {InputEditorVisuals} from './input-editor-visuals';
import {InputConverterFunctions} from '../input-converter/input-converter-functions';

;
declare let sequencer: any;

const NOTE_OFF = 0x80;
const NOTE_ON = 0x90;
const MIDI_HEARTBEAT = 0xFE;

export class InputEditorFunctions {

  static testCreateNote(trkr: Tracker, pitch: number) {
    let iec = InputEditorComponent.inpEdComp;
    trkr.htmlNote = new HTMLNote(pitch, iec.edtrView.playhead.bbox.pageCenter,
      iec.edtrView.playhead.bbox.y + ((iec.edtrView.pitchCount - pitch) * iec.edtrView.pitchHeight));
    iec.edtrView.score.appendChild(trkr.htmlNote.div);
    iec.noteList[trkr.htmlNote.id] = trkr.htmlNote;
  }

  static testUpdateNote(trkr: Tracker) {
    let iec = InputEditorComponent.inpEdComp;
    trkr.htmlNote.updateNoteEnd(iec.edtrView.playhead.bbox.pageCenter);
  }

  static testFinishNote(trkr: Tracker) {
    let iec = InputEditorComponent.inpEdComp;
    trkr.htmlNote.updateNoteEnd(iec.edtrView.playhead.bbox.pageCenter);
    trkr.htmlNote = null;

  }


  //#region [rgba(200, 0, 0, 0.05)] Selection Visuals Methods
  /**
   * Set properties in note required for active state
   * @param note
   * @param div_Note
   */
  static setNoteActiveState(note: HTMLNote) {
    const div_Note = note.div;
    if (note.active) {
      div_Note.className = 'note note-active';
    } else {
      div_Note.className = 'note';
    }
  }

  /**
   * set properties in note required for selected state
   * @param note
   */
  static selectNote(note: HTMLNote) {
    let div_Note = note.div;
    div_Note.className = 'note note-selected';
  }

  /**
   * set properties in note required for unselected state
   * @param note
   */
  static unselectNote(note: HTMLNote) {
    let div_Note = note.div;
    div_Note.className = 'note';
  }

  /**
   *  set properties in part required for selected state
   * @param part
   */
  static selectPart(part: HTMLPart) {
    let div_Part = part.div;
    div_Part.className = 'part part-selected';
  }

  /**
   *  set properties in part required for unselected state
   * @param part
   */
  static unselectPart(part: HTMLPart) {
    let div_Part = part.div;
    div_Part.className = 'part';
  }

  //#endregion
  /**
   * returns a random value between the min and the max
   * @param min
   * @param max
   * @param round
   */
  static getRandom(min: number, max: number, round: boolean) {
    const rand = Math.random() * (max - min) + min;
    if (round === true) {
      return Math.round(rand);
    } else {
      return rand;
    }
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
  currNote = null;
  currPart = null;

  flattenTracksToSingleTrack = true;
  edHTMLShell = new EditorHTMLShell();

  pitchStart = 21;
  pitchEnd = 40;
  pitchHeight = 28;
  timeSigNom = 3;
  timeSigDenom = 4;
  editorHeight = ((this.pitchEnd - this.pitchStart + 2) * this.pitchHeight);

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

