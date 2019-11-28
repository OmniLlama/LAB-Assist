import { Component, OnInit } from '@angular/core';
import { MIDIEvent, Note } from 'heartbeat-sequencer';
import { InputEditorComponent } from '../input-editor/input-editor.component';
import { InputDisplayComponent } from '../input-display/input-display.component';
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
  constructor() { }

  ngOnInit() {
  }
  ngAfterViewInit() {
    this.div_Editor = document.getElementById('editor') as HTMLDivElement;
    this.div_editInputIcons = document.getElementById('editor-input-icons') as HTMLDivElement;
    this.div_editInputIcons.addEventListener('mouseover', (e) => {
      // events = Heartbeat.song;
    });
    this.inpEdCmp = InputEditorComponent.inpEdComp;
    this.inpDispCmp = InputDisplayComponent.inpDispCmp;
  }

}
export class InputConverter {
  notes: Note[];

  constructor() {

  }
}
