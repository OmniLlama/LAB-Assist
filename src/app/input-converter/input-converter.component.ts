import {AfterViewInit, Component, OnInit} from '@angular/core';
import {
  InputDisplayComponent,
  pads,
  padObjs, URLDStrings, nameButton,
} from '../input-display/input-display.component';
import * as JZZ from 'jzz';
import {GamepadType, ButtonNotationType, DirectionState, ButtonsState, xbBtns} from 'src/helpers/Enums';
import * as jzzInpKbd from 'jzz-input-kbd';

import {InputConverterEvents} from './input-converter-events';
import {InputConverterVisuals} from './input-converter-visuals';
import {EditorView, GamepadObject, Queue, Tracker} from '../../helpers/Defs';
import {AudioContextShell, ButtonHTMLShell} from '../../helpers/Shells';
import {InputEditorComponent} from '../input-editor/input-editor.component';


@Component({
  selector: 'app-input-converter',
  templateUrl: './input-converter.component.html',
  styleUrls: ['./input-converter.component.sass']
})

export class InputConverterComponent implements OnInit, AfterViewInit {
  static inpConvComp: InputConverterComponent;
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
  testPadObj: GamepadObject;
  midi;
  audioCtx: AudioContextShell;

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
    const port = JZZ().openMidiIn(1).or('MIDI-In: Cannot open!');
    this.midi = JZZ.MIDI;
    console.warn(port.name);
    this.audioCtx = new AudioContextShell(new window.AudioContext(), 0.2);
    this.div = document.getElementById('editor-input-icons') as HTMLDivElement;
    this.div_inputHistory = document.getElementById('input-history') as HTMLDivElement;
  }

  ngAfterViewInit() {
    jzzInpKbd(JZZ);
    this.midiOutPort =
      JZZ().or('Cannot start MIDI engine!')
        .openMidiOut().or('Cannot open MIDI Out port!')
        .and(function() {
          console.log('MIDI-Out:', this.name());
        });
    this.midiWidget = JZZ.Widget();
    this.playStartJingle();
    JZZ().refresh();
    InputConverterVisuals.rAF((cb) => this.getController());
  }

  /**
   * Waits for, then receives the first controller that is added to the display component,
   * Initializes arrays that hold the various inputs and their respective notes
   */
  getController() {
    const icc = InputConverterComponent.inpConvComp;
    const iec = InputEditorComponent.inpEdComp;
    if (pads !== undefined && pads.length !== 0 && icc.testPadObj == null) {
      let pad = (pads[0] !== undefined ? pads[0] : pads[1]);
      let padObj = (padObjs[0] !== undefined ? padObjs[0] : padObjs[1]);
      icc.testPadObj = padObj;
      let padType = GamepadType[icc.testPadObj.type];
      console.log(padType);

      icc.playControllerConnectedJingle();
      icc.div_ls = document.getElementById('editor-input-icons-left') as HTMLDivElement;
      icc.div_rs = document.getElementById('editor-input-icons-right') as HTMLDivElement;
      icc.div_dpad = document.getElementById('editor-input-icons-dpad') as HTMLDivElement;
      icc.div_btns = document.getElementById('editor-input-icons-btn') as HTMLDivElement;
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
      icc.btnTrackerGroup = createTrackerGroup(getPad().buttons.length);

      iec.edtrView.updateDraw();
      if (getPad()) {
        icc.audioCtx.playAtFor(7, 0, .4)
          .playAtFor(5, .15, .3)
          .playAtFor(0, .3, .5);
        InputConverterVisuals.rAF((cb) => InputConverterEvents.updateController());
      }
    } else {
      InputConverterVisuals.rAF((cb) => icc.getController());
    }
  }

  /**
   * Boot Jingle
   */
  playStartJingle() {
    if (!this.playJingles) {
      return;
    }
    const mtop = InputConverterComponent.inpConvComp.midiOutPort;
    mtop
      .wait(200)
      .note(0, 'C5', 127, 100).wait(66)
      .note(0, 'C4', 127, 100).wait(66)
      .note(0, 'A#4', 127, 100).wait(99)
      .note(0, 'C#5', 127, 100).wait(33);
  }

  /**
   * Controller Connected Jingle
   */
  playControllerConnectedJingle() {
    if (!this.playJingles) {
      return;
    }
    const mtop = InputConverterComponent.inpConvComp.midiOutPort;
    mtop
      .note(0, 'A4', 127, 100).wait(33)
      .note(0, 'C#5', 127, 100).wait(33)
      .note(0, 'F5', 127, 100).wait(33)
      .note(0, 'G6', 127, 100).wait(66)
      .note(0, 'A6', 127, 100).wait(33)
      .note(0, 'C6', 127, 100).wait(166)
      .note(0, 'F6', 127, 100);
  }

}


/**
 * returns first likely instance of a controller to act as main interface
 */
export function getPad() {
  return pads[0] !== undefined ? pads[0] : pads[1];
}


let midiAccess;
let inputs;
let outputs;

/**
 * MIDI success procedures
 * @param mAcc
 */
function onMIDISuccess(mAcc) {
  midiAccess = mAcc;
  inputs = midiAccess.inputs;
  outputs = midiAccess.outputs;
  midiAccess.onstatechange += JZZ().onChange;
}

/**
 * MIDI Failure procedures
 * @param data
 */
function onMIDIFailure(data) {
}

export function createTrackerGroup(cnt: number): Array<Tracker> {
  const arr = new Array<Tracker>();
  for (let i = 0; i < cnt; i++) {
    arr.push(new Tracker());
  }
  return arr;
}


