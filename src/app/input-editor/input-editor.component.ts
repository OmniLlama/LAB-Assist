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
    else {
      return -1;
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
    iec.edtrView = new EditorView(36, 240, 360,
      icc.div.getBoundingClientRect().height);
    InputEditorEvents.initKeyboard(iec);
    iec.edtrView.updateDraw();
  }
}





