import { Component, OnInit } from '@angular/core';
import { MIDIFileJSON } from 'heartbeat-sequencer';
import * as firebase from 'firebase/app';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

declare var sequencer: any;
@Component({
  selector: 'app-database-explorer',
  templateUrl: './database-explorer.component.html',
  styleUrls: ['./database-explorer.component.sass']
})
export class DatabaseExplorerComponent implements OnInit {

  dbMidiFiles: MIDIFileJSON[];
  ol_midiList: HTMLElement;
  sequences: Observable<any[]>;
  seq;
  test: Observable<any[]>;
  constructor(/* db: AngularFirestore */) {
    // this.sequences = db.collection('Sequences').valueChanges();
    // // this.seq = db.collection('Sequences').doc('QCF LP+MP');
    // this.test = db.collection('test').valueChanges();
  }

  Pause() { }

  ngOnInit() {
    // firebase.initializeApp(this.firebaseConfig);
    // firebase.analytics();
  }
}


