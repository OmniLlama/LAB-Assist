import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ButtonsState, DirectionState, OscillatorType} from 'src/helpers/Enums';

import {InputConverterEvents} from './input-converter-events';
import {InputConverterVisuals} from './input-converter-visuals';
import {GamepadObject, Queue} from '../../helpers/Defs';
import {AudioContextShell, ButtonHTMLShell} from '../../helpers/Shells';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {InputTrackerSet} from '../../helpers/Defs/Trackers';


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
  trackerSet: InputTrackerSet;
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
    InputConverterVisuals.rAF((cb) => InputConverterEvents.getController());
  }


}


