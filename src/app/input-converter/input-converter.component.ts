import {AfterViewInit, Component, OnInit} from '@angular/core';
import {MIDIEvent, Note, MIDINote, Track, Part} from 'heartbeat-sequencer';
import {InputEditorComponent, getEdgeDivs} from '../input-editor/input-editor.component';
import {
  InputDisplayComponent,
  GamepadObject,
  pads,
  padObjs,
  xbBtns,
  ggBtns,
  scBtns,
  tknBtns,
  snkBtns
} from '../input-display/input-display.component';
import * as JZZ from 'jzz';
import {GamepadType, ButtonNotationType} from 'src/Enums';
import jzz = require('jzz');
import jzzInpKbd = require('jzz-input-kbd');
import jzzSynOSC = require('jzz-synth-osc');
import {InputEditorFunctions} from '../input-editor/input-editor-functions';
import {InputDisplayEvents} from '../input-display/input-display-events';
import {InputConverterEvents} from './input-converter-events';
import {InputConverterVisuals} from './input-converter-visuals';

declare let sequencer: any;

@Component({
  selector: 'app-input-converter',
  templateUrl: './input-converter.component.html',
  styleUrls: ['./input-converter.component.sass']
})

export class InputConverterComponent implements OnInit, AfterViewInit {
  static inpConvComp: InputConverterComponent;
  events: MIDIEvent[];
  div_Editor: HTMLDivElement;
  div_editInputIcons: HTMLDivElement;
  inpEdCmp: InputEditorComponent;
  inpDispCmp: InputDisplayComponent;
  midiWidget;
  midiInKbd;
  midiOutPort;
  testPadObj: GamepadObject;
  midi;
  trackNotes: boolean;
  liveUpdateHeldNotes: boolean;
  recordingPrimed: boolean;
  trackedNotes: Array<[number, number, number]>; // startTicks, endTicks, pitch

  backupPart: Part;
  stxPart: Part;
  stxTrackerGroup: Array<Tracker>;

  dpadPart: Part;
  dpadTrackerGroup: Array<Tracker>;

  btnPart: Part;
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
  }

  ngAfterViewInit() {
    this.getSetHTMLElements(this);
    this.inpEdCmp = InputEditorComponent.inpEdComp;
    this.inpDispCmp = InputDisplayComponent.inpDispCmp;
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
    const idc = InputDisplayComponent.inpDispCmp;
    const icc = InputConverterComponent.inpConvComp;
    if (pads !== undefined && pads.length !== 0 && icc.testPadObj == null) {
      let pad = (pads[0] !== undefined ? pads[0] : pads[1]);
      let padObj = (padObjs[0] !== undefined ? padObjs[0] : padObjs[1]);
      icc.testPadObj = padObj;
      let thing = GamepadType[icc.testPadObj.type];
      console.log(thing);

      icc.playControllerConnectedJingle();

      icc.stxTrackerGroup = createTrackerGroup(getPad().axes.length * 2);
      icc.dpadTrackerGroup = createTrackerGroup(4);
      icc.btnTrackerGroup = createTrackerGroup(getPad().buttons.length);

      if (getPad()) {
        InputConverterVisuals.rAF((cb) => InputConverterEvents.updateController());
      }
    } else {
      InputConverterVisuals.rAF((cb) => icc.getController());
    }
  }

  /**
   *  Initialize the html element properties
   * @param icc
   */
  getSetHTMLElements(icc: InputConverterComponent): void {
    icc.div_Editor = document.getElementById('editor') as HTMLDivElement;
    icc.div_editInputIcons = document.getElementById('editor-input-icons') as HTMLDivElement;
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
    // .note(0, 'D6', 127, 100).wait(45)
    // .note(0, 'F7', 127, 100).wait(50)
    // .note(0, 'G#7', 127, 100).wait(83)
    // .note(0, 'C#8', 127, 100);
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

export class Tracker {
  held = false;
  heldNote: MIDINote; // heldNote, currentTicks
  inpStart: number;
  inpEnd: number;

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
if (JZZ.requestMIDIAccess) {
  JZZ.requestMIDIAccess({sysex: false}).then(onMIDISuccess, onMIDIFailure);
  console.log('There totally is MIDI support in your browser');
} else {
  console.warn('No MIDI support in your browser');
}

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

/**
 * returns the button name, based on the components selected notation type
 * @param i button number
 */
export function nameButton(i) {
  switch (InputDisplayComponent.inpDispCmp.butNotTy) {
    case ButtonNotationType.StreetFighter:
      return (xbBtns[i] !== undefined ? xbBtns[i] : i);
    case ButtonNotationType.GuiltyGear:
      return (ggBtns[i] !== undefined ? ggBtns[i] : i);
    case ButtonNotationType.SoulCalibur:
      return (scBtns[i] !== undefined ? scBtns[i] : i);
    case ButtonNotationType.Tekken:
      return (tknBtns[i] !== undefined ? tknBtns[i] : i);
    case ButtonNotationType.SNK:
      return (snkBtns[i] !== undefined ? snkBtns[i] : i);
  }
  return i;
}

export function createTrackerGroup(cnt: number): Array<Tracker> {
  const arr = new Array<Tracker>();
  for (let i = 0; i < cnt; i++) {
    arr.push(new Tracker());
  }
  return arr;
}


