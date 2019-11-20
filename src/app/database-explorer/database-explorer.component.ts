import { Component, OnInit } from '@angular/core';
import { MIDIFileJSON } from "heartbeat-sequencer";

declare var sequencer: any;
@Component({
  selector: 'app-database-explorer',
  templateUrl: './database-explorer.component.html',
  styleUrls: ['./database-explorer.component.sass']
})
export class DatabaseExplorerComponent implements OnInit {
  dbMidiFiles: MIDIFileJSON[];
  ol_midiList: HTMLElement;
  constructor() { }

  Pause() { }

  ngOnInit() {
  }
}


