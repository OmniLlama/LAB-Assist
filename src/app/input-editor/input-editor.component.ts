import {Component, OnInit, Inject, AfterViewInit} from '@angular/core';
import {InputConverterComponent} from '../input-converter/input-converter.component';
import {InputDisplayComponent} from '../input-display/input-display.component';
import {InputEditorEvents} from './input-editor-events';
import {EditorHTMLShell, EditorInfo, InputEditorFunctions} from './input-editor-functions';
import {InputEditorVisuals} from './input-editor-visuals';
import {EditorView, FPSTracker, HTMLNote, HTMLPart} from '../../helpers/Defs';

declare let sequencer: any;


@Component({
  selector: 'app-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.sass']
})
export class InputEditorComponent implements OnInit, AfterViewInit {
  static inpEdComp: InputEditorComponent;
  static inpEdEvts: InputEditorEvents;
  midiOutput;
  html: EditorHTMLShell;
  info: EditorInfo;
  midiFile;
  midiFileList;
  audCntxt: AudioContext;

  edtrView: EditorView;

  get PlayheadFramePos() {
    if (this.edtrView) {
      return this.edtrView.playhead.getPlayheadFramePos();
    }
  }

  currNote: HTMLNote = null;

  currNoteId(): string {
    return this.currNote ? this.currNote.id : 'none';
  }

  moveNote(me: MouseEvent) {
    if (this.currNote) {
      this.currNote.updateNotePos(this.edtrView.snapX(me.x));
    }
  }

  currPart: HTMLPart = null;
  noteList: Array<HTMLNote> = new Array<HTMLNote>();

  bppStart = 8;  // default: 16

  console: Console = window.console;
  alert = window.alert;
  rAF = window.requestAnimationFrame;
  output = document.getElementById('console');
  heldEdge;
  holdingEdge = false;

  constructor() {
  }

  ngOnInit() {
    InputEditorComponent.inpEdComp = this;

  }

  ngAfterViewInit(): void {
    this.init(this);
  }

  /**
   * Initialize Critical Components
   */
  init(iec: InputEditorComponent): void {
    const icc = InputConverterComponent.inpConvComp;
    iec.enableGUI(true);
    iec.edtrView = new EditorView(36, 240, 360,
      icc.div.getBoundingClientRect().height);
    InputEditorEvents.initKeyboard(iec);
    iec.edtrView.updateDraw();
  }

  /**
   * turns on GUI elements once all are properly initalized
   * @param flag - whether to turn on the GUI
   */
  enableGUI(flag) {
    const tmp_elmts = document.querySelectorAll('input, select');
    let tmp_elmt;
    tmp_elmts.forEach((e) => {
      tmp_elmt = e;
      tmp_elmt.disabled = !flag;
    });
  }
}


/**
 * Returns the two edge HtmlDivElements of a given note
 * @param note
 */
export function getNoteEdgeDivs(note: HTMLNote): [HTMLDivElement, HTMLDivElement, HTMLDivElement] {
  let tmp_noteDiv = document.getElementById(note.id) as HTMLDivElement;
  if (tmp_noteDiv != null) {
    return [tmp_noteDiv, tmp_noteDiv.children[0] as HTMLDivElement, tmp_noteDiv.children[1] as HTMLDivElement];
  } else {
    return null;
  }
}

/**
 * set generic element's value to val
 * @param ref_elmt
 * @param val
 */
export function setElementValue(ref_elmt, val) {
  ref_elmt.value = val;
}

/**
 * set slider element's various values
 * @param ref_elmt
 * @param val
 * @param min
 * @param max
 * @param step
 */
export function setSliderValues(ref_elmt, val, min, max, step) {
  ref_elmt.min = min;
  ref_elmt.max = max;
  ref_elmt.step = step;
  ref_elmt.value = val;
}

//#region [rgba(120, 120, 0 ,0.15)] Draw Functions

export let NOTE_OFF = 0x80;
export let NOTE_ON = 0x80;
export let MIDI_HEARTBEAT = 0x80;




