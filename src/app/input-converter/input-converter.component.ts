import { Component, OnInit } from '@angular/core';
import { MIDIEvent, Note, MIDINote } from 'heartbeat-sequencer';
import { InputEditorComponent, updateElementBBox, getEdgeDivs, createEdgeBBoxes } from '../input-editor/input-editor.component';
import { InputDisplayComponent, ButtonNotationType, GamepadObject, GamepadTypeString, GamepadType, controllers, xbBtns, ggBtns, scBtns, tknBtns, snkBtns } from '../input-display/input-display.component';
import * as JZZ from 'jzz';
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
  trackedNotes: Array<[number, number, number]>; // startTicks, endTicks, pitch

  dirsHeld: Array<boolean>;
  dirHeldNotes: Array<[MIDINote, number]>; // heldNote, currentTicks
  dirInpStarts: Array<number>;
  dirInpEnds: Array<number>;

  dpadHeld: Array<boolean>;
  dpadHeldNotes: Array<[MIDINote, number]>; // heldNote, currentTicks
  dpadInpStarts: Array<number>;
  dpadInpEnds: Array<number>;

  btnsHeld: Array<boolean>;
  btnHeldNotes: Array<[MIDINote, number]>; // heldNote, currentTicks
  btnInpStarts: Array<number>;
  btnInpEnds: Array<number>;
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
    this.midiOutPort =
      JZZ().or('Cannot start MIDI engine!')
        .openMidiOut().or('Cannot open MIDI Out port!')
        .and(function () { console.log('MIDI-Out:', this.name()); });
    this.midiWidget = JZZ.Widget();
    // window.addEventListener("mousemove", (e) => this.getController(e));
    this.playStartJingle();
    JZZ().refresh();
    rAF(this.getController);
  }
  /**
   * Waits for, then receives the first controller that is added to the display component,
   * Initializes arrays that hold the various inputs and their respective notes
   */
  getController() {
    let idc = InputDisplayComponent.inpDispCmp;
    let icc = InputConverterComponent.inpConvComp;
    if (controllers !== undefined && controllers.length != 0 && icc.testController == null) {
      let ctlr = (controllers[0] !== undefined ? controllers[0] : controllers[1]);
      icc.testController = new GamepadObject(ctlr);
      let thing = GamepadType[icc.testController.type];
      console.log(thing);

      icc.playControllerConnectedJingle();

      icc.dirsHeld = new Array<boolean>(getPad().axes.length * 2);
      icc.dirInpStarts = new Array<number>((getPad().axes.length * 2));
      icc.dirInpEnds = new Array<number>((getPad().axes.length * 2));
      icc.dirHeldNotes = new Array<[MIDINote, number]>((getPad().axes.length * 2));

      icc.dpadHeld = new Array<boolean>(4);
      icc.dpadInpStarts = new Array<number>(4);
      icc.dpadInpEnds = new Array<number>(4);
      icc.dpadHeldNotes = new Array<[MIDINote, number]>(4);

      icc.btnsHeld = new Array<boolean>(getPad().buttons.length);
      icc.btnInpStarts = new Array<number>(getPad().buttons.length);
      icc.btnInpEnds = new Array<number>(getPad().buttons.length);
      icc.btnHeldNotes = new Array<[MIDINote, number]>(getPad().buttons.length);
      if (getPad() != null && getPad() != undefined) {
        rAF(icc.updateController);
      }
    }
    else {
      rAF(icc.getController);
    }
  }
  deadZone = .5;
  /**
   * Updates all controller values,
   * First, the Axes,
   * Then, the D-Pad buttons
   * then, the Eight main buttons
   */
  updateController() {
    let icc = InputConverterComponent.inpConvComp;
    let idc = InputDisplayComponent.inpDispCmp;
    let iec = InputEditorComponent.inpEdComp;
    if (iec.song.playing && !icc.trackingNotes) {
      icc.trackedNotes = new Array<[number, number, number]>();
      icc.trackingNotes = true;
    }
    else if (!iec.song.playing && icc.trackingNotes) {
      // icc.trackedNotes.forEach(note => {
      //   iec.createNote(iec, note[0], note[1], note[2]);
      // });
      icc.trackedNotes = null;
      iec.song.update();
      icc.trackingNotes = false;
    }
    /**
     * Update Controller Axes
     */
    getPad().axes.forEach((a, ind) => {
      let i1 = (ind * 2);
      let i2 = (ind * 2) + 1;
      let pitchNum;
      if (a.valueOf() > icc.deadZone) {
        pitchNum = getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.dirsHeld[i2]) {
          icc.dirsHeld[i2] = true;
          icc.dirsHeld[i1] = false;
          if (icc.trackingNotes) {
            icc.dirInpStarts[i2] = iec.info.ticksAtHead;
            let thing = iec.createNote(iec,
              icc.dirInpStarts[i2],
              icc.dirInpStarts[i2] + 128,
              pitchNum, a.valueOf() * 127);
            icc.dirHeldNotes[i2] = [thing[0].midiNote, iec.info.ticksAtHead];
          }
        }
      } else if (a.valueOf() < -icc.deadZone) {
        pitchNum = getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.dirsHeld[i1]) {
          icc.dirsHeld[i1] = true;
          icc.dirsHeld[i2] = false;
          if (icc.trackingNotes) {
            icc.dirInpStarts[i1] = iec.info.ticksAtHead;
            let thing = iec.createNote(iec,
              icc.dirInpStarts[i1],
              icc.dirInpStarts[i1] + 128,
              pitchNum, -a.valueOf() * 127);
            icc.dirHeldNotes[i1] = [thing[0].midiNote, iec.info.ticksAtHead];
          }
        }
      } else {
        icc.dirsHeld[i1] = false;
        icc.dirsHeld[i2] = false;
      }
      if (icc.trackingNotes) {
        if (icc.dirsHeld[i2]) {
          icc.dirHeldNotes[i2][0].part.moveEvent(icc.dirHeldNotes[i2][0].noteOff,
            (iec.info.ticksAtHead - icc.dirHeldNotes[i2][1]));
          icc.dirHeldNotes[i2][1] = iec.info.ticksAtHead;
          iec.song.update();
        } else if (icc.dirsHeld[i1]) {
          icc.dirHeldNotes[i1][0].part.moveEvent(icc.dirHeldNotes[i1][0].noteOff,
            (iec.info.ticksAtHead - icc.dirHeldNotes[i1][1]));
          icc.dirHeldNotes[i1][1] = iec.info.ticksAtHead;
          iec.song.update();
        } else if (!icc.dirsHeld[i2] && icc.dirHeldNotes[i2] != null) {
          icc.dirHeldNotes[i2] = null;
        } else if (!icc.dirsHeld[i1] && icc.dirHeldNotes[i1] != null) {
          icc.dirHeldNotes[i1] = null;
        }
      }
    });
    /**
     * Update Controller Digital Pad
     */
    let dPadBtns: GamepadButton[] = new Array<GamepadButton>();
    let dpadIconDivs = document.getElementsByClassName("editor-input-icon-direction");
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
        //if RECORDING
        if (icc.trackingNotes) {
          icc.dpadInpEnds[ind] = iec.info.ticksAtHead;
          icc.midiOutPort.noteOff(0, pitch, 127);
          icc.trackedNotes.push([icc.dpadInpStarts[ind], icc.dpadInpEnds[ind], pitch]);
        }
        icc.dpadHeld[ind] = false;
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
        if (typeof (b) == "object") {
          pressed = b.pressed;
        }
        var pct = Math.round(b.value * 100) + "%";
        btn.style.backgroundSize = pct + " " + pct;
        let imageString = 'a';
        let buttonString;
        switch (ind) {
          case 0:
            buttonString = 'up';
            break;
          case 1:
            buttonString = 'down';
            break;
          case 2:
            buttonString = 'left';
            break;
          case 3:
            buttonString = 'right';
            break;
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
    let btnIconDivs = document.getElementsByClassName("editor-input-icon");
    let btns = new Array<GamepadButton>();
    for (let i of icc.testController.getArcadeLayoutButtonNumbers()) { btns.push(getPad().buttons[i]); }
    btns.forEach((b, ind) => {
      let pitch = getTestToneForButton(ind);
      //if PRESSED this frame
      if (b.pressed && !icc.btnsHeld[ind]) {
        icc.btnsHeld[ind] = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.btnInpStarts[ind] = iec.info.ticksAtHead;
          let thing = iec.createNote(iec, icc.btnInpStarts[ind], icc.btnInpStarts[ind] + 128, getButtonPitch(ind));
          icc.btnHeldNotes[ind] = [thing[0].midiNote, iec.info.ticksAtHead];
        }
        //if RELEASED this frame
      } else if (!b.pressed && icc.btnsHeld[ind]) {
        //if RECORDING
        if (icc.trackingNotes) {
          icc.btnInpStarts[ind] = iec.info.ticksAtHead;
          icc.btnInpEnds[ind] = iec.info.ticksAtHead;
          icc.midiOutPort.noteOff(0, pitch, 127);
          icc.trackedNotes.push([icc.btnInpStarts[ind], icc.btnInpEnds[ind], getButtonPitch(ind)]);
        }
        icc.btnsHeld[ind] = false;
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
      var btn = btnIconDivs[ind] as HTMLDivElement;
      if (btn != undefined) {
        var pressed = b.value > .8;
        if (typeof (b) == "object") {
          pressed = b.pressed;
        }
        var pct = Math.round(b.value * 100) + "%";
        btn.style.backgroundSize = pct + " " + pct;
        let imageString = 'a';
        let buttonString = 'a';
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
  getSetHTMLElements(icc: InputConverterComponent) {
    icc.div_Editor = document.getElementById('editor') as HTMLDivElement;
    icc.div_editInputIcons = document.getElementById('editor-input-icons') as HTMLDivElement;
    icc.div_editInputIcons.addEventListener('mouseover', (e) => {
    });
  }
  /**
   * Boot Jingle
   */
  playStartJingle() {
    let mtop = InputConverterComponent.inpConvComp.midiOutPort;
    // let mtip = InputConverterComponent.inpConvComp.midiInPort;
    mtop
      .note(0, 'C5', 127, 100).wait(100)
      .note(0, 'D5', 127, 100).wait(100)
      .note(0, 'G5', 127, 100);
  }
  /**
   * Controller Connected Jingle
   */
  playControllerConnectedJingle() {
    let mtop = InputConverterComponent.inpConvComp.midiOutPort;
    mtop
      .note(0, 'C3', 127, 100).wait(100)
      .note(0, 'D3', 127, 100).wait(100)
      .note(0, 'G3', 127, 100);
  }
}
export function getPad() {
  return controllers[0] !== undefined ? controllers[0] : controllers[1];

}
function getTestToneForButton(ind) {
  switch (ind) {
    case 0: return 'C4';
    case 1: return 'D4';
    case 2: return 'E4';
    case 3: return 'F4';
    case 4: return 'G4';
    case 5: return 'A4';
    case 6: return 'B4';
    case 7: return 'C5';

    default: return 'C#6';
  }
}

function getDirectionPitchFromDPad(ind): number {
  switch (ind) {
    case 0: return 32;
    case 1: return 31;
    case 2: return 30;
    case 3: return 29;
  }
}
function getDirectionPitchFromAxis(ind, val): number {
  switch (ind) {
    case 0:
      if (val > 0) { return 39; }
      else { return 40; }
    case 1:
      if (val > 0) { return 37; }
      else { return 38; }
    case 2:
      if (val > 0) { return 35; }
      else { return 36; }
    case 3:
      if (val > 0) { return 33; }
      else { return 34; }
  }
}
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
  console.log("There totally is MIDI support in your browser");
} else {
  console.warn("No MIDI support in your browser");
}
function onMIDISuccess(mAcc) {
  midiAccess = mAcc;
  inputs = midiAccess.inputs;
  outputs = midiAccess.outputs;
  midiAccess.onstatechange += JZZ().onChange;
}
function onMIDIFailure(data) { }

export function nameButton(i) {
  switch (InputDisplayComponent.inpDispCmp.butNotTy) {
    case ButtonNotationType.StreetFighter:
      return (xbBtns[i] !== undefined ? xbBtns[i] : i);
    // return (sfBtns[i] != undefined ? sfBtns[i] : i);
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
