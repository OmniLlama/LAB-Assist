import { Component, OnInit } from '@angular/core';
import { MIDIEvent, Note, MIDINote } from 'heartbeat-sequencer';
import { InputEditorComponent, updateElementBBox, getEdgeDivs, createEdgeBBoxes } from '../input-editor/input-editor.component';
import { InputDisplayComponent, GamepadObject, pads, xbBtns, ggBtns, scBtns, tknBtns, snkBtns } from '../input-display/input-display.component';
import * as JZZ from 'jzz';
import { GamepadType, ButtonNotationType } from 'src/Enums';
import jzz = require('jzz');
import jzzInpKbd = require('jzz-input-kbd');
import jzzSynOSC = require('jzz-synth-osc');

declare let sequencer: any;

@Component({
  selector: 'app-input-converter',
  templateUrl: './input-converter.component.html',
  styleUrls: ['./input-converter.component.sass']
})

export class InputConverterComponent implements OnInit {
  static inpConvComp: InputConverterComponent;
  events: MIDIEvent[];
  div_Editor: HTMLDivElement;
  div_editInputIcons: HTMLDivElement;
  inpEdCmp: InputEditorComponent;
  inpDispCmp: InputDisplayComponent;
  midiWidget;
  midiInKbd;
  midiOutPort;
  testController: GamepadObject;
  midi;
  inp;
  trackingNotes: boolean;
  recordingPrimed: boolean;
  trackedNotes: Array<[number, number, number]>; // startTicks, endTicks, pitch

  stxHeld: Array<boolean>;
  stxHeldNotes: Array<[MIDINote, number]>; // heldNote, currentTicks
  stxInpStarts: Array<number>;
  stxInpEnds: Array<number>;

  dpadHeld: Array<boolean>;
  dpadHeldNotes: Array<[MIDINote, number]>; // heldNote, currentTicks
  dpadInpStarts: Array<number>;
  dpadInpEnds: Array<number>;

  btnsHeld: Array<boolean>;
  btnHeldNotes: Array<[MIDINote, number]>; // heldNote, currentTicks
  btnInpStarts: Array<number>;
  btnInpEnds: Array<number>;
  deadZone = .5;
  constructor() { }

  ngOnInit() {
    InputConverterComponent.inpConvComp = this;
    let port = JZZ().openMidiIn(1).or('MIDI-In: Cannot open!');
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
        .and(function () { console.log('MIDI-Out:', this.name()); });
    this.midiWidget = JZZ.Widget();
    this.playStartJingle();
    JZZ().refresh();
    rAF((cb) => this.getController());
  }
  /**
   * Waits for, then receives the first controller that is added to the display component,
   * Initializes arrays that hold the various inputs and their respective notes
   */
  getController() {
    let idc = InputDisplayComponent.inpDispCmp;
    let icc = InputConverterComponent.inpConvComp;
    if (pads !== undefined && pads.length != 0 && icc.testController == null) {
      let ctlr = (pads[0] !== undefined ? pads[0] : pads[1]);
      icc.testController = new GamepadObject(ctlr);
      let thing = GamepadType[icc.testController.type];
      console.log(thing);

      icc.playControllerConnectedJingle();

      icc.stxHeld = new Array<boolean>(getPad().axes.length * 2);
      icc.stxInpStarts = new Array<number>((getPad().axes.length * 2));
      icc.stxInpEnds = new Array<number>((getPad().axes.length * 2));
      icc.stxHeldNotes = new Array<[MIDINote, number]>((getPad().axes.length * 2));

      icc.dpadHeld = new Array<boolean>(4);
      icc.dpadInpStarts = new Array<number>(4);
      icc.dpadInpEnds = new Array<number>(4);
      icc.dpadHeldNotes = new Array<[MIDINote, number]>(4);

      icc.btnsHeld = new Array<boolean>(getPad().buttons.length);
      icc.btnInpStarts = new Array<number>(getPad().buttons.length);
      icc.btnInpEnds = new Array<number>(getPad().buttons.length);
      icc.btnHeldNotes = new Array<[MIDINote, number]>(getPad().buttons.length);
      if (getPad() != null && getPad() != undefined) {
        rAF((cb) => icc.updateController());
      }
    }
    else {
      rAF((cb) => icc.getController());
    }
  }
  /**
   * Updates all controller values, First, the Axes, then, the D-Pad buttons. finally, the Eight main buttons
   */
  updateController(): void {
    let icc = InputConverterComponent.inpConvComp;
    let idc = InputDisplayComponent.inpDispCmp;
    let iec = InputEditorComponent.inpEdComp;
    if (iec.song.playing && !icc.trackingNotes) {
      icc.trackedNotes = new Array<[number, number, number]>();
      icc.trackingNotes = true;
    }
    else if (!iec.song.playing && icc.trackingNotes) {
      icc.trackedNotes = null;
      iec.song.update();
      icc.trackingNotes = false;
    }
    /**
     * Update Controller Axes */
    getPad().axes.forEach((a, ind) => {
      let i1 = (ind * 2);
      let i2 = (ind * 2) + 1;
      let pitchNum;
      if (a.valueOf() > icc.deadZone) {
        pitchNum = getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.stxHeld[i2]) {
          icc.stxHeld[i2] = true;
          icc.stxHeld[i1] = false;
          if (icc.trackingNotes) {
            icc.stxInpStarts[i2] = iec.info.ticksAtHead;
            let thing = iec.createNote(iec,
              icc.stxInpStarts[i2],
              icc.stxInpStarts[i2] + 128,
              pitchNum, a.valueOf() * 127);
            icc.stxHeldNotes[i2] = [thing[0].midiNote, iec.info.ticksAtHead];
          }
        }
      } else if (a.valueOf() < -icc.deadZone) {
        pitchNum = getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.stxHeld[i1]) {
          icc.stxHeld[i1] = true;
          icc.stxHeld[i2] = false;
          if (icc.trackingNotes) {
            icc.stxInpStarts[i1] = iec.info.ticksAtHead;
            let thing = iec.createNote(iec,
              icc.stxInpStarts[i1],
              icc.stxInpStarts[i1] + 128,
              pitchNum, -a.valueOf() * 127);
            icc.stxHeldNotes[i1] = [thing[0].midiNote, iec.info.ticksAtHead];
          }
        }
      } else {
        icc.stxHeld[i1] = false;
        icc.stxHeld[i2] = false;
      }
      if (icc.trackingNotes) {
        if (icc.stxHeld[i2]) {
          icc.stxHeldNotes[i2][0].part.moveEvent(icc.stxHeldNotes[i2][0].noteOff,
            (iec.info.ticksAtHead - icc.stxHeldNotes[i2][1]));
          icc.stxHeldNotes[i2][1] = iec.info.ticksAtHead;
          iec.song.update();
        } else if (icc.stxHeld[i1]) {
          icc.stxHeldNotes[i1][0].part.moveEvent(icc.stxHeldNotes[i1][0].noteOff,
            (iec.info.ticksAtHead - icc.stxHeldNotes[i1][1]));
          icc.stxHeldNotes[i1][1] = iec.info.ticksAtHead;
          iec.song.update();
        } else if (!icc.stxHeld[i2] && icc.stxHeldNotes[i2] != null) {
          icc.stxHeldNotes[i2] = null;
        } else if (!icc.stxHeld[i1] && icc.stxHeldNotes[i1] != null) {
          icc.stxHeldNotes[i1] = null;
        }
      }
    });
    /**
     * Update Controller Digital Pad
     */
    let dPadBtns: GamepadButton[] = new Array<GamepadButton>();
    let dpadIconDivs = document.getElementsByClassName('editor-input-icon-direction');
    for (let i of icc.testController.getDPadButtonNumbers()) { dPadBtns.push(getPad().buttons[i]); }
    dPadBtns.forEach((b, ind) => {
      let pitch = getDirectionPitchFromDPad(ind);
      if (b.pressed && !icc.dpadHeld[ind]) {
        icc.dpadHeld[ind] = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.dpadInpStarts[ind] = iec.info.ticksAtHead;
          let thing = iec.createNote(iec, icc.dpadInpStarts[ind], icc.dpadInpStarts[ind] + 128, pitch);
          icc.dpadHeldNotes[ind] = [thing[0].midiNote, iec.info.ticksAtHead];
          console.log('hit button while playing');
        }
        //if RELEASED this frame
      } else if (!b.pressed && icc.dpadHeld[ind]) {
        icc.dpadHeld[ind] = false;
        icc.midiOutPort.noteOff(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.dpadInpEnds[ind] = iec.info.ticksAtHead;
          icc.trackedNotes.push([icc.dpadInpStarts[ind], icc.dpadInpEnds[ind], pitch]);
        }
      }
      // EXPERIMENTALISISISMZ
      if (icc.trackingNotes) {
        if (icc.dpadHeld[ind]) {
          icc.dpadHeldNotes[ind][0].part.moveEvent(icc.dpadHeldNotes[ind][0].noteOff,
            (iec.info.scrollTicksAtHead - icc.dpadHeldNotes[ind][1]));
          icc.dpadHeldNotes[ind][1] = iec.info.ticksAtHead;
          iec.song.update();
        }
        else if (!icc.dpadHeld[ind] && icc.dpadHeldNotes[ind] != null) {
          icc.dpadHeldNotes[ind] = null;
        }
      }
      var btn = dpadIconDivs[ind] as HTMLDivElement;
      if (btn != undefined) {
        var pressed = b.value > .8;
        if (typeof (b) === 'object') {
          pressed = b.pressed;
        }
        let pct: string = Math.round(b.value * 100) + '%';
        btn.style.backgroundSize = pct + ' ' + pct;
        let imageString = 'a';
        let buttonString;
        switch (ind) {
          case 0: buttonString = 'up'; break;
          case 1: buttonString = 'down'; break;
          case 2: buttonString = 'left'; break;
          case 3: buttonString = 'right'; break;
        }
        if (pressed) {
          // If pressed, switches to the pressed version of the button's image
          imageString = `<img id="icon-img" src="assets/images/pressed_${buttonString}.png">`;
          btn.innerHTML = imageString;
        } else {
          // If released/not pressed, switches to the regular version of the button's image
          imageString = `<img id="icon-img" src="assets/images/${buttonString}.png" >`;
          btn.innerHTML = imageString;
        }
      }
    });

    /**
     * Update Controller Buttons
     */
    let btnIconDivs = document.getElementsByClassName('editor-input-icon');
    let btns: readonly GamepadButton[] = getPad().buttons;
    let harmMinScaleArr: number[] = [0, 2, 3, 5, 7, 8, 11, 12]; //harmonic minor scale
    let majScaleArr: number[] = [0, 2, 4, 5, 7, 9, 11, 12]; //major scale
    let scale: number[] = harmMinScaleArr;
    let rootNote: number = 51;
    btns.forEach((b, ind) => {
      if(ind >= scale.length) return;
      let pitch: string = getPitchStringFromNumber(scale[ind] + rootNote);
      //if PRESSED this frame
      if (b.pressed && !icc.btnsHeld[ind]) {
        icc.btnsHeld[ind] = true;
        if (dPadBtns.some((b) => b.pressed)) {
          console.log('should be fuckin bending, idk');
        }
        else {
        }
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.btnInpStarts[ind] = iec.info.ticksAtHead;
          let thing = iec.createNote(iec, icc.btnInpStarts[ind], icc.btnInpStarts[ind] + 128, getButtonPitch(ind));
          icc.btnHeldNotes[ind] = [thing[0].midiNote, iec.info.ticksAtHead];
        }
        //if RELEASED this frame
      } else if (!b.pressed && icc.btnsHeld[ind]) {
        icc.btnsHeld[ind] = false;
        icc.midiOutPort.noteOff(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.btnInpStarts[ind] = iec.info.ticksAtHead;
          icc.btnInpEnds[ind] = iec.info.ticksAtHead;
          icc.trackedNotes.push([icc.btnInpStarts[ind], icc.btnInpEnds[ind], getButtonPitch(ind)]);
        }
      }
      // EXPERIMENTALISISISMZ
      if (icc.trackingNotes) {
        if (icc.btnsHeld[ind]) {
          icc.btnHeldNotes[ind][0].part.moveEvent(icc.btnHeldNotes[ind][0].noteOff,
            (iec.info.scrollTicksAtHead - icc.btnHeldNotes[ind][1]));
          icc.btnHeldNotes[ind][1] = iec.info.ticksAtHead;
          iec.song.update();
        }
        else if (!icc.btnsHeld[ind] && icc.btnHeldNotes[ind] != null) {
          icc.btnHeldNotes[ind] = null;
        }
      }
      let btn = btnIconDivs[ind] as HTMLDivElement;
      if (btn != undefined) {
        let pressed = b.value > .8;
        if (typeof (b) === 'object') {
          pressed = b.pressed;
        }
        let pct = Math.round(b.value * 100) + '%';
        btn.style.backgroundSize = pct + ' ' + pct;
        let imageString = 'a';
        let buttonString;
        if (pressed) {
          // If pressed, switches to the pressed version of the button's image
          buttonString = nameButton(ind);
          imageString = `<img id="icon-img" src="assets/images/pressed_${buttonString}.png">`;
          btn.innerHTML = imageString;
        } else {
          // If released/not pressed, switches to the regular version of the button's image
          buttonString = nameButton(ind);
          imageString = `<img id="icon-img" src="assets/images/${buttonString}.png" >`;
          btn.innerHTML = imageString;
        }
      }
    });

    JZZ().refresh();
    rAF(icc.updateController);
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
    let mtop = InputConverterComponent.inpConvComp.midiOutPort;
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
    let mtop = InputConverterComponent.inpConvComp.midiOutPort;
    mtop
      .note(0, 'A4', 127, 100).wait(33)
      .note(0, 'C#5', 127, 100).wait(33)
      .note(0, 'F5', 127, 100).wait(33)
      .note(0, 'G6', 127, 100).wait(66)
      .note(0, 'A6', 127, 100).wait(33)
      .note(0, 'C6', 127, 100).wait(166)
      .note(0, 'F6', 127, 100);
  }
  setRecordPrime(b){
    console.log("priming record");
    
    this.recordingPrimed = !this.recordingPrimed;
  }
}
/**
 * returns first likely instance of a controller to act as main interface
 */
export function getPad() { return pads[0] !== undefined ? pads[0] : pads[1]; }
/**
 * Sends pitch based on which d-pad input direction was sent
 * @param ind
 */
function getDirectionPitchFromDPad(ind): number {
  switch (ind) {
    case 0: return 32;
    case 1: return 31;
    case 2: return 30;
    case 3: return 29;
  }
}
/**
 * Sends pitch based on which axis direction was sent
 * @param ind
 */
function getDirectionPitchFromAxis(ind, val): number {
  switch (ind) {
    case 0: if (val > 0) { return 39; } else { return 40; }
    case 1: if (val > 0) { return 37; } else { return 38; }
    case 2: if (val > 0) { return 35; } else { return 36; }
    case 3: if (val > 0) { return 33; } else { return 34; }
  }
}
/**
 * Sends pitch based on which button was sent
 * @param ind
 */
function getButtonPitch(ind) {
  switch (ind) {
    case 0: return 28; //E1
    case 1: return 27; //D#1
    case 2: return 26; //D1
    case 3: return 25; //C#1
    case 4: return 24; //C1
    case 5: return 23; //B0
    case 6: return 22; //A#0
    case 7: return 21; //A0

    default: return 12; //C0
  }
}
let midiAccess;
let inputs;
let outputs;
let rAF = window.requestAnimationFrame;
if (JZZ.requestMIDIAccess) {
  JZZ.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
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
function onMIDIFailure(data) { }

/**
 * returns the button name, based on the components selected notation type
 * @param i button number
 */
export function nameButton(i) {
  switch (InputDisplayComponent.inpDispCmp.butNotTy) {
    case ButtonNotationType.StreetFighter: return (xbBtns[i] !== undefined ? xbBtns[i] : i);
    case ButtonNotationType.GuiltyGear: return (ggBtns[i] !== undefined ? ggBtns[i] : i);
    case ButtonNotationType.SoulCalibur: return (scBtns[i] !== undefined ? scBtns[i] : i);
    case ButtonNotationType.Tekken: return (tknBtns[i] !== undefined ? tknBtns[i] : i);
    case ButtonNotationType.SNK: return (snkBtns[i] !== undefined ? snkBtns[i] : i);
  }
  return i;
}

export function getPitchStringFromNumber(n: number): string {
  let noteLetter = n % 12;
  let noteOctave = (n / 12);
  let str = '';
  switch (noteLetter) {
    case 0: str = 'C'; break;
    case 1: str = 'C#'; break;
    case 2: str = 'D'; break;
    case 3: str = 'D#'; break;
    case 4: str = 'E'; break;
    case 5: str = 'F'; break;
    case 6: str = 'F#'; break;
    case 7: str = 'G'; break;
    case 8: str = 'G#'; break;
    case 9: str = 'A'; break;
    case 10: str = 'A#'; break;
    case 11: str = 'B'; break;
    default:
      break;
  }
  switch (true) {
    case (noteOctave < 1): str += '0'; break;
    case (noteOctave < 2): str += '1'; break;
    case (noteOctave < 3): str += '2'; break;
    case (noteOctave < 4): str += '3'; break;
    case (noteOctave < 5): str += '4'; break;
    case (noteOctave < 6): str += '5'; break;
    case (noteOctave < 7): str += '6'; break;
    case (noteOctave < 8): str += '7'; break;
    case (noteOctave < 9): str += '8'; break;
    default:
      break;
  }
  return str;
}
