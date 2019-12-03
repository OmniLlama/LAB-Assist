import { Component, OnInit } from '@angular/core';
import { MIDIEvent, Note, MIDINote } from 'heartbeat-sequencer';
import { InputEditorComponent, updateElementBBox, getEdgeDivs, subdivBBox } from '../input-editor/input-editor.component';
import { InputDisplayComponent, ButtonNotationType } from '../input-display/input-display.component';
import * as JZZ from 'jzz';
import { MIDI, Widget } from 'jzz';
import { CurrencyPipe } from '@angular/common';
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
  midiInPort;
  midiInKbd;
  midiOutPort;
  testController: Gamepad;
  midi;
  inp;
  trackingNotes: boolean;
  // startTicks, endTicks, pitch
  trackedNotes: Array<[number, number, number]>;
  btnsHeld: Array<boolean>;
  // heldNote, currentTicks
  heldNotes: Array<[MIDINote, number]>;
  inpStarts: Array<number>;
  inpEnds: Array<number>;
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
        .openMidiOut()
        .or('Cannot open MIDI Out port!')
        .and(function () { console.log('MIDI-Out:', this.name()); });
    this.midiInPort = JZZ().openMidiIn(0);
    this.midiWidget = JZZ.Widget();
    this.midiInPort.connect(InputConverterComponent.inpConvComp.midiOutPort);
    this.midiInPort.connect(this.midiWidget);
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
      window.addEventListener("mousemove", (e) => icc.checkController(e));
      icc.playControllerConnectedJingle();
      icc.inpStarts = new Array<number>(getPad().buttons.length);
      icc.inpEnds = new Array<number>(getPad().buttons.length);
      icc.btnsHeld = new Array<boolean>(icc.testController.buttons.length);
      icc.heldNotes = new Array<[MIDINote, number]>(icc.testController.buttons.length);
      if (icc.testController != null && icc.testController != undefined) {
        rAF(icc.updateController);
      }
    }
    else {
      rAF(icc.getController);
    }
  }
  checkController(e) {
  }
  // inpPitch: string;

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
    icc.testController.buttons.forEach((b, ind) => {
      let pitch = getTestTone(ind);
      //if PRESSED this frame
      if (b.pressed && !icc.btnsHeld[ind]) {
        icc.btnsHeld[ind] = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.inpStarts[ind] = iec.edtrInfo.ticksAtHead;
          let thing = iec.createNote(iec, icc.inpStarts[ind], icc.inpStarts[ind] + 128, getButtonPitch(ind));
          icc.heldNotes[ind] = [thing[0].midiNote, iec.edtrInfo.ticksAtHead];
          console.log('hit button while playing');
        }
        //if RELEASED this frame
      } else if (!b.pressed && icc.btnsHeld[ind]) {
        //if RECORDING
        if (icc.trackingNotes) {
          icc.inpEnds[ind] = iec.edtrInfo.ticksAtHead;
          icc.midiOutPort.noteOff(0, pitch, 127);
          icc.trackedNotes.push([icc.inpStarts[ind], icc.inpEnds[ind], getButtonPitch(ind)]);
        }
        icc.btnsHeld[ind] = false;
      }
      // EXPERIMENTALISISISMZ
      if (icc.trackingNotes) {
        if (icc.btnsHeld[ind]) {
          icc.heldNotes[ind][0].part.moveEvent(icc.heldNotes[ind][0].noteOff,
            (iec.edtrInfo.ticksAtHead - icc.heldNotes[ind][1]));
          icc.heldNotes[ind][1] = iec.edtrInfo.ticksAtHead;
          iec.song.update();
          if (icc.heldNotes[ind][0].id != undefined) {
            let noteAndEdges = getEdgeDivs(icc.heldNotes[ind][0]);
            if (noteAndEdges != null) {
              updateElementBBox(noteAndEdges[1], subdivBBox(icc.heldNotes[ind][0].bbox, 0.1, 0, 1, 0));
              updateElementBBox(noteAndEdges[2], subdivBBox(icc.heldNotes[ind][0].bbox, 0.2, 0.8, 1, 0));
            }
          }
        }
        else if (!icc.btnsHeld[ind] && icc.heldNotes[ind] != null) {
          icc.heldNotes[ind] = null;
        }
      }
    });
    var buttons = document.getElementsByClassName("editor-input-icon");
    for (var i = 0; i <= 7; i++) {
      var b = buttons[i] as HTMLDivElement;
      var val = getPad().buttons[i];
      var pressed = val.value > .8;
      if (typeof (val) == "object") {
        pressed = val.pressed;
        // val = val.value;
      }
      var pct = Math.round(val.value * 100) + "%";
      b.style.backgroundSize = pct + " " + pct;
      let imageString = 'a';
      let buttonString = 'a';
      if (pressed) {
        // If pressed, switches to the pressed version of the button's image
        buttonString = nameButton(i);
        imageString = `<img id="icon-img" src="assets/images/pressed_${buttonString}.png">`;
        b.innerHTML = imageString;
      } else {
        // If released/not pressed, switches to the regular version of the button's image
        buttonString = nameButton(i);
        imageString = `<img id="icon-img" src="assets/images/${buttonString}.png" >`;
        b.innerHTML = imageString;
      }
    }
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
function getTestTone(ind) {
  switch (ind) {
    case 0:
      return 'C4';
    case 1:
      return 'D4';
    case 2:
      return 'E4';
    case 3:
      return 'F4';
    case 4:
      return 'G4';
    case 5:
      return 'A4';
    case 6:
      return 'B4';
    case 7:
      return 'C5';
    default:
      return 'C#6';
  }
}
function getButtonPitch(ind) {
  switch (ind) {
    case 0:
      return 28;
    case 1:
      return 27;
    case 2:
      return 26;
    case 3:
      return 25;
    case 4:
      return 24;
    case 5:
      return 23;
    case 6:
      return 22;
    case 7:
      return 21;
    default:
      return 12;
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
function onMIDIOutSuccess() {

}
function MIDIStateChanged(data?): any {
  console.warn('MIDI State has changed!');
  return null;
}
export function nameButton(i) {
  switch (InputDisplayComponent.inpDispCmp.butNotTy) {
    case ButtonNotationType.StreetFighter:
      switch (i) {
        case 0: return "a";
        case 1: return "b";
        case 2: return "x";
        case 3: return "y";
        case 4: return "l1";
        case 5: return "r1";
        case 6: return "l2";
        case 7: return "r2";
        default: return null;
      }

    case ButtonNotationType.GuiltyGear:
      {
        switch (i) {
          case 0: return "P";
          case 1: return "D";
          case 2: return "K";
          case 3: return "S";
          case 4: return "HS";
          case 5: return "SP";
          default: return i;
        }
      }
    case ButtonNotationType.SoulCalibur:
      {
        switch (i) {
          case 0: return "G";
          case 1: return "K";
          case 2: return "A";
          case 3: return "B";
          default: return i;
        }
      }
    case ButtonNotationType.Tekken:
      {
        switch (i) {
          case 0: return "LK";
          case 1: return "RK";
          case 2: return "LP";
          case 3: return "RP";
          default: return i;
        }
      }
    case ButtonNotationType.SNK:
      {
        switch (i) {
          case 0: return "B";
          case 1: return "D";
          case 2: return "A";
          case 3: return "C";
          default: return i;
        }
      }
    default:
      return i;
  }
  return i;
}
export class InputConverter {
  notes: Note[];
  constructor() {

  }
}
