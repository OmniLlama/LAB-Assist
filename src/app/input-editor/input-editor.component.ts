import {Component, OnInit, Inject, AfterViewInit} from '@angular/core';
import {
  Note,
  Part,
  MIDINote,
  Track,
  getMidiFiles,
  createSong,
  Instrument,
  Song,
  KeyEditor,
  createTrack,
  MIDIEvent
} from 'heartbeat-sequencer';
import {InputConverterComponent} from '../input-converter/input-converter.component';
import {InputDisplayComponent} from '../input-display/input-display.component';
import {InputEditorEvents} from './input-editor-events';
import {EditorHTMLShell, EditorInfo, InputEditorFunctions} from './input-editor-functions';
import {InputEditorVisuals} from './input-editor-visuals';
import { heartbeat, Heartbeat } from 'webdaw-modules';

declare let sequencer: any;


@Component({
  selector: 'app-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.sass']
})
export class InputEditorComponent implements OnInit, AfterViewInit {
  static seq = sequencer;
  // static NOTE_OFF = 0x80;
  // static NOTE_ON = 0x90;
  // static MIDI_HEARTBEAT = 0xFE;
  static inpEdComp: InputEditorComponent;
  static inpEdEvts: InputEditorEvents;
  testMethod = 1;
  midiOutput;
  html: EditorHTMLShell;
  info: EditorInfo;
  midiFile;
  keyEditor: KeyEditor;
  div_MidiFileList: HTMLDivElement;
  midiFileList;
  audCntxt: AudioContext;


  snapAmt;
  track: Track;
  tracks: Track[];
  instruments: Instrument[];
  song: Song;

  allNotes: Array<Note> = new Array<Note>(); // stores references to all midi notes;
  allParts: Array<Part> = new Array<Part>(); // stores references to all midi parts;
  currNote: Note = null;
  currPart: Part = null;
  flattenTracksToSingleTrack = true;

  bppStart = 8;  // default: 16

  console: Console = window.console;
  alert = window.alert;
  idc = InputDisplayComponent.inpDispCmp;
  icc = InputConverterComponent.inpConvComp;
  rAF = window.requestAnimationFrame;
  output = document.getElementById('console');
  heldEdge;
  changingNote;
  holdingEdge = false;

  constructor() {
  }

  ngOnInit() {
    InputEditorComponent.inpEdComp = this;
    this.info = new EditorInfo();
    this.html = new EditorHTMLShell();
    this.init(this);
  }

  ngAfterViewInit(): void {
  }

  /**
   * Initialize Critical Components
   */
  init(iec: InputEditorComponent): void {
    iec.info.edHTMLShell = this.html;
    iec.enableGUI(false);
    iec.song = InputEditorFunctions.initSong();
    if (iec.flattenTracksToSingleTrack) {
      InputEditorFunctions.flattenTracks(iec.song);
    }
    iec.keyEditor = InputEditorFunctions.createKeyEditor(iec);

    iec.instruments = sequencer.getInstruments();

    // set editor element values to editor defaults
    setElementValue(iec.html.txt_KeyRangeStart, iec.keyEditor.lowestNote);
    setElementValue(iec.html.txt_KeyRangeEnd, iec.keyEditor.highestNote);
    iec.html.txt_BPM.value = iec.song.bpm.toString();
    setSliderValues(iec.html.sldr_barsPerPage, iec.bppStart, 1, 32, 1);

    InputEditorVisuals.resize();
    InputEditorEvents.initContextEvents();
    InputEditorEvents.initInputEvents();
    InputEditorEvents.initWindowEvents(iec);

    iec.enableGUI(true);

    iec.html.slct_Snap.selectedIndex = 4;

    let tmp_event;
    tmp_event = document.createEvent('HTMLEvents');
    tmp_event.initEvent('change', false, false);
    iec.html.slct_Snap.dispatchEvent(tmp_event);

    InputEditorVisuals.draw(iec);
    InputEditorVisuals.render();
  }

  /**
   * OLD - Add midi files for testing
   */
  addAssetsToSequencer() {
    sequencer.addMidiFile({url: '../../assets/midi/test.mid'}, null);
    sequencer.addMidiFile({url: '../../assets/midi/minute_waltz.mid'}, null);
    sequencer.addMidiFile({url: '../../assets/midi/chpn_op66.mid'}, null);
    sequencer.addMidiFile({url: '../../assets/midi/Queen - Bohemian Rhapsody.mid'}, null);
  }

  /**
   * turns on GUI elements once all are properly initalized
   * @param flag - whether to turn on the GUI
   */
  enableGUI(flag) {
    const tmp_elmts = document.querySelectorAll('input, select');
    let tmp_elmt;
    tmp_elmts.forEach((e) => {
      tmp_elmt = e;
      tmp_elmt.disabled = !flag;
    });
  }

  /**
   * END InputEditorComponent Class -------|||||-----------------
   */
}


/**
 * Returns the two edge HtmlDivElements of a given note
 * @param note
 */
export function getEdgeDivs(note: MIDINote): [HTMLDivElement, HTMLDivElement, HTMLDivElement] {
  let tmp_noteDiv = document.getElementById(note.id) as HTMLDivElement;
  if (tmp_noteDiv != null) {
    return [tmp_noteDiv, tmp_noteDiv.children[0] as HTMLDivElement, tmp_noteDiv.children[1] as HTMLDivElement];
  } else {
    return null;
  }
}

/**
 * set generic element's value to val
 * @param ref_elmt
 * @param val
 */
export function setElementValue(ref_elmt, val) {
  ref_elmt.value = val;
}

/**
 * set slider element's various values
 * @param ref_elmt
 * @param val
 * @param min
 * @param max
 * @param step
 */
export function setSliderValues(ref_elmt, val, min, max, step) {
  ref_elmt.min = min;
  ref_elmt.max = max;
  ref_elmt.step = step;
  ref_elmt.value = val;
}

//#region [rgba(120, 120, 0 ,0.15)] Draw Functions

export let NOTE_OFF = 0x80;
export let NOTE_ON = 0x80;
export let MIDI_HEARTBEAT = 0x80;




