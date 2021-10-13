import {AfterViewInit, Component, OnInit} from '@angular/core';
import {MIDIEvent, Note, MIDINote, Track, Part} from '../../heartbeat/build';
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
import * as jzzInpKbd from 'jzz-input-kbd';
import * as jzzSynOSC from 'jzz-synth-osc';
import * as jzzTiny from 'jzz-synth-tiny';

import {InputConverterEvents} from './input-converter-events';
import {InputConverterVisuals} from './input-converter-visuals';
import {BBox, Tracker} from '../../Defs';


@Component({
  selector: 'app-input-converter',
  templateUrl: './input-converter.component.html',
  styleUrls: ['./input-converter.component.sass']
})

export class InputConverterComponent implements OnInit, AfterViewInit {
  static inpConvComp: InputConverterComponent;
  events: MIDIEvent[];

  div: HTMLDivElement;
  midiWidget;
  midiInKbd;
  midiOutPort;
  testPadObj: GamepadObject;
  midi;
  trackNotes: boolean;
  liveUpdateHeldNotes: boolean;
  recordingPrimed: boolean = true;
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
    this.div = document.getElementById('editor-input-icons') as HTMLDivElement;
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


