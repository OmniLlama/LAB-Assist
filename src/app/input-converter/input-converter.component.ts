import { Component, OnInit } from '@angular/core';
import { MIDIEvent, Note } from 'heartbeat-sequencer';
import { InputEditorComponent } from '../input-editor/input-editor.component';
import { InputDisplayComponent } from '../input-display/input-display.component';
import { InputEvents } from 'webmidi';
@Component({
  selector: 'app-input-converter',
  templateUrl: './input-converter.component.html',
  styleUrls: ['./input-converter.component.sass']
})
export class InputConverterComponent implements OnInit {
  events: MIDIEvent[];
  div_Editor: HTMLDivElement;
  div_editInputIcons: HTMLDivElement;
  inpEdCmp: InputEditorComponent;
  inpDispCmp: InputDisplayComponent;
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

    window.addEventListener("mousemove", (e) => this.getController(e));
  }
  getController(e) {
    if (InputDisplayComponent.inpDispCmp.getControllers().length != 0) {
      this.testController = InputDisplayComponent.inpDispCmp.getControllers()[0];
      window.removeEventListener("mousemove", (e) => this.getController(e));
      // let virtualInput = new Input('Virtual input name', true);
      window.addEventListener("mousemove", (e) => this.checkController(e));
    }
  }
  checkController(e) {
  }
}
var midiData;
// declare var require: any;
// var easymidi = require('easymidi');
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
