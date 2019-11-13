import { Component, OnInit } from '@angular/core';
import { MIDIFileJSON } from "heartbeat-sequencer";

declare const sequencer: any;
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
    // setTimeout(() => { this.Pause(); }, 1000);
    this.dbMidiFiles = sequencer.getMidiFiles();
    this.ol_midiList = document.getElementById('midi-file-list');
    if (this.dbMidiFiles.length != 0) {
      this.dbMidiFiles.forEach(mfj => {
        let li_midiFile = document.createElement('li');
        li_midiFile.innerHTML = mfj.name;
        this.ol_midiList.appendChild(li_midiFile);
      });
    }
    else {
      let li_midiFile = document.createElement('li');
      li_midiFile.innerHTML = 'no MIDI files found, ya dumb!';
      this.ol_midiList.appendChild(li_midiFile);
    }
  }
}


