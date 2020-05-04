import { Component, OnInit, Inject } from '@angular/core';
import { Note, Part, MIDINote, Track, getMidiFiles, createSong, Instrument, Song, KeyEditor, createTrack, MIDIEvent } from "heartbeat-sequencer";
import { InputConverterComponent } from '../input-converter/input-converter.component';
import { InputDisplayComponent } from '../input-display/input-display.component';
import { InputEditorEvents } from './input-editor-events';
import { EditorHTMLShell, EditorInfo, InputEditorFunctions } from './input-editor-functions';
import { InputEditorVisuals } from './input-editor-visuals';
declare let sequencer: any;


@Component({
  selector: 'app-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.sass']
})
export class InputEditorComponent implements OnInit {
  static seq = sequencer;
  static NOTE_OFF = 0x80;
  static NOTE_ON = 0x90;
  static MIDI_HEARTBEAT = 0xFE;
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

  pitchStart = 21;
  pitchEnd = 32;
  pitchHeight = 28;
  timeSigNom = 3;
  timeSigDenom = 4;
  snapAmt;
  editorHeight = ((this.pitchEnd - this.pitchStart + 2) * this.pitchHeight);
  track: Track;
  tracks: Track[];
  instruments: Instrument[];
  song: Song;

  allNotes: Array<Note> = new Array<Note>(); // stores references to all midi notes;
  allParts: Array<Part> = new Array<Part>(); // stores references to all midi parts;
  currNote: Note = null;
  currPart: Part = null;
  flattenTracksToSingleTrack = true;

  bppStart = 8;  //default: 16

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
    if (this.song.tracks.length == 0) {
      let tr = sequencer.createTrack('AutoTrack');
      this.song.addTrack(tr);
      this.song.update();
    }
    if (this.track == undefined) {
      this.track = this.song.tracks[0];
    }
    this.track.recordEnabled = 'midi';
    this.track.setMidiInput('all');
    this.track.update();
    this.song.update();
  }
  /**
   * Initialize Critical Components
   * @param iec
   */
  init(iec: InputEditorComponent): void {
    this.info.edHTMLShell = this.html;
    this.enableGUI(false);


    this.song = InputEditorFunctions.initSong();
    if (iec.flattenTracksToSingleTrack) { this.flattenTracks(iec.song); }
    iec.keyEditor = InputEditorFunctions.createKeyEditor(iec);

    iec.instruments = sequencer.getInstruments();

    //set editor element values to editor defaults
    setElementValue(iec.html.txt_KeyRangeStart, iec.keyEditor.lowestNote);
    setElementValue(iec.html.txt_KeyRangeEnd, iec.keyEditor.highestNote);
    iec.html.txt_BPM.value = this.song.bpm.toString();
    setSliderValues(iec.html.sldr_barsPerPage, this.bppStart, 1, 32, 1);

    InputEditorVisuals.resize();
    InputEditorEvents.initContextEvents();
    InputEditorEvents.initInputEvents();
    InputEditorEvents.initWindowEvents(iec);

    this.enableGUI(true);

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
    sequencer.addMidiFile({ url: '../../assets/midi/test.mid' }, null);
    sequencer.addMidiFile({ url: '../../assets/midi/minute_waltz.mid' }, null);
    sequencer.addMidiFile({ url: '../../assets/midi/chpn_op66.mid' }, null);
    sequencer.addMidiFile({ url: '../../assets/midi/Queen - Bohemian Rhapsody.mid' }, null);
  }
  /**
   * turns on GUI elements once all are properly initalized
   * @param flag - whether to turn on the GUI
   */
  enableGUI(flag) {
    let tmp_elements = document.querySelectorAll('input, select');
    let tmp_element;
    let tmp_maxi = tmp_elements.length;
    for (let i = 0; i < tmp_maxi; i++) {
      tmp_element = tmp_elements[i];
      tmp_element.disabled = !flag;
    }
  }
  /**
   * UTILITY - needed for sequencer compatability
   * @param song
   */
  flattenTracks(song: Song) {
    song.tracks.forEach(
      (track) => {
        track.setInstrument('sinewave');
        track.monitor = true;
        track.setMidiInput('all', true);
      }
    );
  }
  /**
   * Set Element value to val
   * @param elmt HTML Element
   * @param val value
   */
  setElementValue(elmt, val: string) { elmt.value = val; }
  setSliderValues(elmt, val: string, min: number, max: number, step: number) {
    elmt.min = min;
    elmt.max = max;
    elmt.step = step;
    elmt.value = val;
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
  if (tmp_noteDiv != null)
    return [tmp_noteDiv, tmp_noteDiv.children[0] as HTMLDivElement, tmp_noteDiv.children[1] as HTMLDivElement]
  else
    return null;
}

/**
 * set generic element's value to val
 * @param ref_elmt
 * @param val
 */
export function setElementValue(ref_elmt, val) { ref_elmt.value = val; }
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





