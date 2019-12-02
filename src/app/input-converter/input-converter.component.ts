import { Component, OnInit } from '@angular/core';
import { MIDIEvent, Note } from 'heartbeat-sequencer';
import { InputEditorComponent } from '../input-editor/input-editor.component';
import { InputDisplayComponent } from '../input-display/input-display.component';
import { InputEvents } from 'webmidi';
import * as JZZ from 'jzz';
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
  midiTestIn;
  midiTestOut;
  testController: Gamepad;
  constructor() { }

  ngOnInit() {
  }
  ngAfterViewInit() {
    this.div_Editor = document.getElementById('editor') as HTMLDivElement;
    this.div_editInputIcons = document.getElementById('editor-input-icons') as HTMLDivElement;
    this.div_editInputIcons.addEventListener('mouseover', (e) => {
    });
    this.inpEdCmp = InputEditorComponent.inpEdComp;
    this.inpDispCmp = InputDisplayComponent.inpDispCmp;
    InputConverterComponent.inpConvComp = this;
    this.midiTestOut =
      JZZ().or('Cannot start MIDI engine!')
        .openMidiOut().or('Cannot open MIDI Out port!')
        .wait(10).send([0x90, 60, 127]) // note on
        .wait(100).send([0x80, 60, 0])  // note off
        .wait(100).send([0x90, 62, 127]) // note on
        .wait(100).send([0x80, 62, 0])  // note off
        .wait(100).send([0x90, 67, 127]) // note on
        .wait(100).send([0x80, 67, 0]);  // note off

    window.addEventListener("mousemove", (e) => this.getController(e));
  }
  getController(e) {
    if (InputDisplayComponent.inpDispCmp.getControllers().length != 0 && this.testController == null) {
      InputConverterComponent.inpConvComp.testController = InputDisplayComponent.inpDispCmp.getControllers()[0];
      window.removeEventListener("mousemove", (e) => this.getController(e));
      InputConverterComponent.inpConvComp.midiTestOut.send([0x90, 36, 127])
        .wait(20).send([0x80, 36, 0])
        .wait(20).send([0x90, 38, 127])
        .wait(20).send([0x80, 38, 0])
        .wait(20).send([0x90, 43, 127])
        .wait(20).send([0x80, 43, 0]);
      InputConverterComponent.inpConvComp.midiTestIn = JZZ().openMidiIn();
      this.midiTestIn.connect(InputConverterComponent.inpConvComp.midiTestOut);
      // let virtualInput = new Input('Virtual input name', true);
      window.addEventListener("mousemove", (e) => InputConverterComponent.inpConvComp.checkController(e));
      rAF(InputConverterComponent.inpConvComp.updateController);
    }
  }
  checkController(e) {
  }
  updateController() {
    if (InputDisplayComponent.inpDispCmp.getControllers()[0].buttons[0].pressed) {
      InputConverterComponent.inpConvComp.midiTestIn.send([0x90, 32, 127]);
    } else {
      InputConverterComponent.inpConvComp.midiTestIn.send([0x80, 32, 0]);
    }
    rAF(InputConverterComponent.inpConvComp.updateController);
  }
}
var midiData;
var rAF =
  // window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.requestAnimationFrame;
if (navigator.requestMIDIAccess) {
  navigator.requestMIDIAccess({
    sysex: false
  }).then(onMIDISuccess, onMIDIFailure);
  console.log("There totally is MIDI support in your browser");
} else {
  console.warn("No MIDI support in your browser");
}
function onMIDISuccess(data) {
  midiData = data;
}
function onMIDIFailure(data) {
}

export class InputConverter {
  notes: Note[];
  constructor() {

  }
}
