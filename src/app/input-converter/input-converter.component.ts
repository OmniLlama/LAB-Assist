import {AfterViewInit, Component, OnInit} from '@angular/core';
import {
  InputDisplayComponent,
  pads,
  padObjs, URLDStrings, nameButton,
} from '../input-display/input-display.component';
import {GamepadType, ButtonNotationType, DirectionState, ButtonsState, xbBtns, OscillatorType} from 'src/helpers/Enums';

import {InputConverterEvents} from './input-converter-events';
import {InputConverterVisuals} from './input-converter-visuals';
import {EditorView, GamepadObject, Queue, Tracker} from '../../helpers/Defs';
import {AudioContextShell, ButtonHTMLShell} from '../../helpers/Shells';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {SubDiv} from '../../helpers/Gen';


@Component({
  selector: 'app-input-converter',
  templateUrl: './input-converter.component.html',
  styleUrls: ['./input-converter.component.sass']
})

export class InputConverterComponent implements OnInit, AfterViewInit {
  static inpConvComp: InputConverterComponent;
  activePadObj: GamepadObject;
  div: HTMLDivElement;
  div_ls: HTMLDivElement;
  div_rs: HTMLDivElement;
  div_dpad: HTMLDivElement;
  div_btns: HTMLDivElement;
  lsBtnShells: ButtonHTMLShell[] = new Array<ButtonHTMLShell>();
  rsBtnShells: ButtonHTMLShell[] = new Array<ButtonHTMLShell>();
  dpadBtnShells: ButtonHTMLShell[] = new Array<ButtonHTMLShell>();
  btnShells: ButtonHTMLShell[] = new Array<ButtonHTMLShell>();

  stateFrameCnt: number;
  stateChanged: boolean;
  lastLSState: DirectionState;
  lastRSState: DirectionState;
  lastDPadState: DirectionState;
  lastBtnsState: ButtonsState;
  div_inputHistory: HTMLDivElement;
  div_currInputHistory: HTMLDivElement;
  span_currInputFrameCnt: HTMLSpanElement;
  inputHistoryMax: number = 300;
  inputHistoryQueue: Queue<Node> = new Queue<Node>(this.inputHistoryMax);

  midiWidget;
  midiOutPort;
  midi;
  audioCtx: AudioContextShell;

  get audioOscTypes(): string[] {
    return Object.values(OscillatorType);
  }

  changeOscType(ty: string) {
    this.audioCtx.changeOscType(ty as OscillatorOptions['type']);
  }

  SetGain(val) {
    this.audioCtx.setGlobalGain(val);
  }

  get EditorView() {
    return InputEditorComponent.inpEdComp.edtrView;
  }

  ToggleEditorPlayState() {
    this.EditorView.togglePlayState();
  }

  StopEditorPlayState() {
    this.EditorView.stopPlayState();
  }

  EditorPlaying(): boolean {
    return this.EditorView.playing;
  }

  trackingNotes: boolean;
  liveUpdateHeldNotes: boolean = true;
  recordingPrimed: boolean = true;
  trackedNotes: Array<[number, number, number]>; // startTicks, endTicks, pitch
  lsTrackerGroup: Array<Tracker>;
  rsTrackerGroup: Array<Tracker>;
  dpadTrackerGroup: Array<Tracker>;
  btnTrackerGroup: Array<Tracker>;
  deadZone = .5;

  /**
   * DEBUG
   */
  playJingles = false;

  constructor() {
  }

  ngOnInit() {
    InputConverterComponent.inpConvComp = this;
    this.audioCtx = new AudioContextShell(new window.AudioContext(), 0.2);

  }

  ngAfterViewInit() {
    this.div = document.getElementById('editor-input-icons') as HTMLDivElement;
    this.div_inputHistory = document.getElementById('input-history') as HTMLDivElement;
    InputConverterVisuals.rAF((cb) => this.getController());
  }

  /**
   * Waits for, then receives the first controller that is added to the display component,
   * Initializes arrays that hold the various inputs and their respective notes
   */
  getController() {
    const icc = InputConverterComponent.inpConvComp;
    const iec = InputEditorComponent.inpEdComp;
    if (padObjs.length > 0 && !this.activePadObj) {
      this.activePadObj = padObjs[0];
      let padType = GamepadType[icc.activePadObj.type];
      console.log(padType);
      icc.div_ls = SubDiv(icc.div, 'editor-input-icons-left');
      icc.div_rs = SubDiv(icc.div, 'editor-input-icons-right');
      icc.div_dpad = SubDiv(icc.div, 'editor-input-icons-dpad');
      icc.div_btns = SubDiv(icc.div, 'editor-input-icons-btn');

      URLDStrings.forEach((dir) => {
        const shell = new ButtonHTMLShell(dir, 'editor-input-icon-direction', this.div_ls);
        icc.lsBtnShells.push(shell);
      });
      URLDStrings.forEach((name) => {
        const shell = new ButtonHTMLShell(name, 'editor-input-icon-direction', this.div_rs);
        icc.rsBtnShells.push(shell);
      });
      URLDStrings.forEach((name) => {
        const shell = new ButtonHTMLShell(name, 'editor-input-icon-direction', this.div_dpad);
        icc.dpadBtnShells.push(shell);
      });
      xbBtns.forEach((name) => {
        const shell = new ButtonHTMLShell(name, 'editor-input-icon-button', this.div_btns);
        icc.btnShells.push(shell);
      });
      icc.lsTrackerGroup = createTrackerGroup(4);
      icc.rsTrackerGroup = createTrackerGroup(4);
      icc.dpadTrackerGroup = createTrackerGroup(4);
      icc.btnTrackerGroup = createTrackerGroup(this.activePadObj.Btns.length);

      iec.edtrView.updateDraw();
      if (this.activePadObj) {
        icc.audioCtx.playAtFor(7, 0, .4)
          .playAtFor(5, .15, .3)
          .playAtFor(0, .3, .5);
        InputConverterVisuals.rAF((cb) => InputConverterEvents.updateController());
      }
    } else {
      InputConverterVisuals.rAF((cb) => icc.getController());
    }
  }
}

export function createTrackerGroup(cnt: number): Array<Tracker> {
  const arr = new Array<Tracker>();
  for (let i = 0; i < cnt; i++) {
    arr.push(new Tracker());
  }
  return arr;
}


