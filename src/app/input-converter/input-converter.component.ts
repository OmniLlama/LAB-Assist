import { Component, OnInit } from '@angular/core';
import { MIDIEvent, Note, MIDINote } from 'heartbeat-sequencer';
import { InputEditorComponent, updateElementBBox, getEdgeDivs, subdivBBox } from '../input-editor/input-editor.component';
import { InputDisplayComponent, ButtonNotationType } from '../input-display/input-display.component';
import * as JZZ from 'jzz';
// import * as WMT from 'web-midi-test';
declare let sequencer: any;

// import MT = require('midi-test');
// import easymidi = require('easymidi');
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
  testController: Gamepad;
  midi;
  inp;
  trackingNotes: boolean;
  trackedNotes: Array<[number, number, number]>; // startTicks, endTicks, pitch

  dirsHeld: Array<boolean>;
  dirHeldNotes: Array<[MIDINote, number]>; // heldNote, currentTicks
  dirInpStarts: Array<number>;
  dirInpEnds: Array<number>;

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
  getController() {
    let idc = InputDisplayComponent.inpDispCmp;
    let icc = InputConverterComponent.inpConvComp;
    if (idc.getControllers().length != 0 && icc.testController == null) {
      icc.testController = getPad();
      // window.removeEventListener("mousemove", (e) => icc.getController(e));
      icc.playControllerConnectedJingle();

      icc.dirsHeld = new Array<boolean>(getPad().axes.length * 2);
      icc.dirInpStarts = new Array<number>((getPad().axes.length * 2));
      icc.dirInpEnds = new Array<number>((getPad().axes.length * 2));
      icc.dirHeldNotes = new Array<[MIDINote, number]>((getPad().axes.length * 2));

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
  // inpPitch: string;
  deadZone = .5;
  updateController() {
    let icc = InputConverterComponent.inpConvComp;
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
    icc.testController = getPad();
    icc.testController.axes.forEach((a, ind) => {
      let pitchNum;
      if (a.valueOf() > icc.deadZone) {
        pitchNum = getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.dirsHeld[(ind * 2) + 1]) {
          icc.dirsHeld[(ind * 2) + 1] = true;
          icc.dirsHeld[(ind * 2)] = false;
          if (icc.trackingNotes) {
            icc.dirInpStarts[(ind * 2) + 1] = iec.edtrInfo.ticksAtHead;
            let thing = iec.createNote(iec, icc.dirInpStarts[(ind * 2) + 1], icc.dirInpStarts[(ind * 2) + 1] + 128, pitchNum, a.valueOf() * 127);
            icc.dirHeldNotes[(ind * 2) + 1] = [thing[0].midiNote, iec.edtrInfo.ticksAtHead];
          }
        }
      } else if (a.valueOf() < -icc.deadZone) {
        pitchNum = getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.dirsHeld[(ind * 2)]) {
          icc.dirsHeld[(ind * 2)] = true;
          icc.dirsHeld[(ind * 2) + 1] = false;
          if (icc.trackingNotes) {
            icc.dirInpStarts[(ind * 2)] = iec.edtrInfo.ticksAtHead;
            let thing = iec.createNote(iec, icc.dirInpStarts[(ind * 2)], icc.dirInpStarts[(ind * 2)] + 128, pitchNum, -a.valueOf() * 127);
            icc.dirHeldNotes[(ind * 2)] = [thing[0].midiNote, iec.edtrInfo.ticksAtHead];
          }
        }
      } else {
        icc.dirsHeld[(ind * 2)] = false;
        icc.dirsHeld[(ind * 2) + 1] = false;
      }
      if (icc.trackingNotes) {
        if (icc.dirsHeld[(ind * 2) + 1]) {
          icc.dirHeldNotes[(ind * 2) + 1][0].part.moveEvent(icc.dirHeldNotes[(ind * 2) + 1][0].noteOff,
            (iec.edtrInfo.ticksAtHead - icc.dirHeldNotes[(ind * 2) + 1][1]));
          icc.dirHeldNotes[(ind * 2) + 1][1] = iec.edtrInfo.ticksAtHead;
          iec.song.update();
          if (icc.dirHeldNotes[(ind * 2) + 1][0].id != undefined) {
            let noteAndEdges = getEdgeDivs(icc.dirHeldNotes[(ind * 2) + 1][0]);
            if (noteAndEdges != null) {
              updateElementBBox(noteAndEdges[1], subdivBBox(icc.dirHeldNotes[(ind * 2) + 1][0].bbox, 0.1, 0, 1, 0));
              updateElementBBox(noteAndEdges[2], subdivBBox(icc.dirHeldNotes[(ind * 2) + 1][0].bbox, 0.2, 0.8, 1, 0));
            }
          }
        } else if (icc.dirsHeld[(ind * 2)]) {
          icc.dirHeldNotes[(ind * 2)][0].part.moveEvent(icc.dirHeldNotes[(ind * 2)][0].noteOff,
            (iec.edtrInfo.ticksAtHead - icc.dirHeldNotes[(ind * 2)][1]));
          icc.dirHeldNotes[(ind * 2)][1] = iec.edtrInfo.ticksAtHead;
          iec.song.update();
          if (icc.dirHeldNotes[(ind * 2)][0].id != undefined) {
            let noteAndEdges = getEdgeDivs(icc.dirHeldNotes[(ind * 2)][0]);
            if (noteAndEdges != null) {
              updateElementBBox(noteAndEdges[1], subdivBBox(icc.dirHeldNotes[(ind * 2)][0].bbox, 0.1, 0, 1, 0));
              updateElementBBox(noteAndEdges[2], subdivBBox(icc.dirHeldNotes[(ind * 2)][0].bbox, 0.2, 0.8, 1, 0));
            }
          }
        } else if (!icc.dirsHeld[(ind * 2) + 1] && icc.dirHeldNotes[(ind * 2) + 1] != null) {
          icc.dirHeldNotes[(ind * 2) + 1] = null;
        } else if (!icc.dirsHeld[(ind * 2)] && icc.dirHeldNotes[(ind * 2)] != null) {
          icc.dirHeldNotes[(ind * 2)] = null;
        }
      }
    });
    var buttons = document.getElementsByClassName("editor-input-icon");
    icc.testController.buttons.forEach((b, ind) => {
      let pitch = getTestToneForButton(ind);
      //if PRESSED this frame
      if (b.pressed && !icc.btnsHeld[ind]) {
        icc.btnsHeld[ind] = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.btnInpStarts[ind] = iec.edtrInfo.ticksAtHead;
          let thing = iec.createNote(iec, icc.btnInpStarts[ind], icc.btnInpStarts[ind] + 128, getButtonPitch(ind));
          icc.btnHeldNotes[ind] = [thing[0].midiNote, iec.edtrInfo.ticksAtHead];
          console.log('hit button while playing');
        }
        //if RELEASED this frame
      } else if (!b.pressed && icc.btnsHeld[ind]) {
        //if RECORDING
        if (icc.trackingNotes) {
          icc.btnInpEnds[ind] = iec.edtrInfo.ticksAtHead;
          icc.midiOutPort.noteOff(0, pitch, 127);
          icc.trackedNotes.push([icc.btnInpStarts[ind], icc.btnInpEnds[ind], getButtonPitch(ind)]);
        }
        icc.btnsHeld[ind] = false;
      }
      // EXPERIMENTALISISISMZ
      if (icc.trackingNotes) {
        if (icc.btnsHeld[ind]) {
          icc.btnHeldNotes[ind][0].part.moveEvent(icc.btnHeldNotes[ind][0].noteOff,
            (iec.edtrInfo.ticksAtHead - icc.btnHeldNotes[ind][1]));
          icc.btnHeldNotes[ind][1] = iec.edtrInfo.ticksAtHead;
          iec.song.update();
          if (icc.btnHeldNotes[ind][0].id != undefined) {
            let noteAndEdges = getEdgeDivs(icc.btnHeldNotes[ind][0]);
            if (noteAndEdges != null) {
              updateElementBBox(noteAndEdges[1], subdivBBox(icc.btnHeldNotes[ind][0].bbox, 0.1, 0, 1, 0));
              updateElementBBox(noteAndEdges[2], subdivBBox(icc.btnHeldNotes[ind][0].bbox, 0.2, 0.8, 1, 0));
            }
          }
        }
        else if (!icc.btnsHeld[ind] && icc.btnHeldNotes[ind] != null) {
          icc.btnHeldNotes[ind] = null;
        }
      }
      var btn = buttons[ind] as HTMLDivElement;
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
  getSetHTMLElements(icc: InputConverterComponent) {
    icc.div_Editor = document.getElementById('editor') as HTMLDivElement;
    icc.div_editInputIcons = document.getElementById('editor-input-icons') as HTMLDivElement;
    icc.div_editInputIcons.addEventListener('mouseover', (e) => {
    });
  }
  playStartJingle() {
    let mtop = InputConverterComponent.inpConvComp.midiOutPort;
    // let mtip = InputConverterComponent.inpConvComp.midiInPort;
    mtop
      .note(0, 'C5', 127, 100).wait(100)
      .note(0, 'D5', 127, 100).wait(100)
      .note(0, 'G5', 127, 100);
  }
  playControllerConnectedJingle() {
    let mtop = InputConverterComponent.inpConvComp.midiOutPort;
    mtop
      .note(0, 'C3', 127, 100).wait(100)
      .note(0, 'D3', 127, 100).wait(100)
      .note(0, 'G3', 127, 100);
  }
}
export function getPad() {
  return InputDisplayComponent.inpDispCmp.getControllers()[0];
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
function onMIDIFailure(data) {
}
function MIDIStateChanged(data?): any {
  console.warn('MIDI State has changed!');
  return null;
}
var xbBtns = ['a', 'b', 'x', 'y', 'l1', 'r1', 'l2', 'r2'];
var psBtns = ['X', 'O', '[]', '^', 'l1', 'r1', 'l2', 'r2'];
var sfBtns = ['lk', 'mk', 'lp', 'mp', 'l1', 'hp', 'l2', 'hk'];
var ggBtns = ['P', 'D', 'K', 'S', 'HS', 'l1', 'l2', 'SP'];
var tknBtns = ['LK', 'RK', 'LP', 'RP'];
var scBtns = ['G', 'K', 'A', 'B'];
var snkBtns = ['B', 'D', 'A', 'C'];

export function nameButton(i) {
  switch (InputDisplayComponent.inpDispCmp.butNotTy) {
    case ButtonNotationType.StreetFighter:
      return (xbBtns[i] != undefined ? xbBtns[i] : i);
    // return (sfBtns[i] != undefined ? sfBtns[i] : i);
    case ButtonNotationType.GuiltyGear:
      return (ggBtns[i] != undefined ? ggBtns[i] : i);
    case ButtonNotationType.SoulCalibur:
      return (scBtns[i] != undefined ? scBtns[i] : i);
    case ButtonNotationType.Tekken:
      return (tknBtns[i] != undefined ? tknBtns[i] : i);
    case ButtonNotationType.SNK:
      return (snkBtns[i] != undefined ? snkBtns[i] : i);
  }
  return i;
}
export class InputConverter {
  notes: Note[];
  constructor() {

  }
}
