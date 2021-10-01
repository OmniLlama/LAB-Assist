/// <reference types="webmidi" />

import {loadMusicXMLFile} from './load_musicxml_file';

export {loadMusicXMLFile};

export as namespace sqcr;

// export interface Sequencer {
//
// }

export function createSong(config: any): Song;

export function createTrack(name: string): Track;

export function createPart(name?: string): Part;

export function createNote(start: MIDIEvent, end: MIDIEvent): MIDINote;

export function createKeyEditor(song: Song, config: any): KeyEditor;

export function getMidiFile(path: string, exact_match: boolean): MIDIFileJSON;

export function getMidiFiles(): MIDIFileJSON[];

export function addMidiFile(args: { url: string }, callback: (mf: MIDIFileJSON) => void): void;

export function addAssetPack(ap: AssetPack, callback: () => void): void;

export function getInstruments(): Instrument[];

export function ready(): Promise<boolean>;

export function getNoteNumber(step: string, octave: number): number;

export function createMidiEvent(ticks: number, type: number, data1: number, data2?: number): MIDIEvent;

export function processEvent(event: MIDIEvent, instrument: string): void;

export function stopProcessEvents(): void;

export let isPlaying: boolean;

// export function initMidi(cb): void
export function getDevices();

export let browser: string;
export let midiInputs: WebMidi.MIDIInput[];
export let midiOutputs: WebMidi.MIDIOutput[];

export interface Sequencer {
  createNote: (startEvt: MIDIEvent, endEvt: MIDIEvent) => Note;
}

export as namespace Heartbeat;

export interface SongPosition {
  bar?: number;
  beat?: number;
  sixteenth?: number;
  tick?: number;
  ticks: number;
  timestamp: number;
  barsAsString: string;
  activeColumn: number;
}

export type Listener = {
  [key: string]: any
};

export interface Song {
  getPart: (data) => Part;
  ppq: number;
  nominator: number;
  denominator: number;
  beat: number;
  sixteenth: number;
  tick: number;
  ticks: number;
  activeNotes: Array<MIDIEvent>;
  id: string;
  name: string;
  loop: boolean;
  playing: boolean;
  bpm: number;
  durationTicks: number;
  millisPerTick: number;
  parts: Array<Part>;
  tracks: Array<Track>;
  listeners: Listener;
  loopEndPosition: SongPosition;
  bars: number; // number of bars in Song
  bar: number; // current bar position
  barsAsString: string; // current position in bars
  events: Array<MIDIEvent>;
  timeEvents: Array<MIDIEvent>;
  notes: Array<MIDINote>;
  useMetronome: boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  update: (updateTimeEvents?: boolean) => void;
  startRecording: () => void;
  setTempo: (bpm: number, update?: boolean) => void;
  addEventListener: (event: string, typeOrCallback: any, callback?: (arg?: any) => void) => void;
  addMidiEventListener: (event: string, callback: (arg?: any) => void) => void;
  removeEventListener: (type: string) => void;
  setLoop: (loop?: boolean) => void;
  setLeftLocator: (type: string, bar: number, beat?: number, sixteenth?: number, tick?: number) => void;
  setRightLocator: (type: string, bar: number, beat?: number, sixteenth?: number, tick?: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  addEvents: (events: Array<MIDIEvent>) => void;
  addTimeEvents: (events: Array<MIDIEvent>) => void;
  removeTimeEvents: () => void;
  setTrackSolo: (t: Track, f: boolean) => void;
  getPosition: () => SongPosition;
  addTrack: (t: Track) => void;
  paused: boolean;
  //new stuff??
  //
  //
  setPlayhead: (type: string, value: number) => void;
  setPitchRange: (min: any, max: any) => void;
  setTimeSignature: (nominator: number, denominator: number, update?: boolean) => void;
}

export interface MIDIEvent {
  id: string;
  bar: number;
  type: number;
  data1: number;
  data2: number;
  ticks: number;
  command: number;
  noteName: string;
  noteNumber: number;
  velocity: number;
  midiNote: MIDINote;
  muted: boolean;
  song: null | Heartbeat.Song;
  track: null | Track;
  part: null | Part;
  clone: () => this;
  transpose: (semi: number) => void;
}

export type Note = {
  name: string
  octave: number
  fullName: string
  number: number
  frequency: number
  blackKey: boolean
  //new values
  //
  //
  id: string
  bbox: any
  active: boolean
  mute: boolean
  part: Part
};

export interface MIDINote extends MIDIEvent {
  trackId: string;
  track: Track;
  number: number;
  noteOn: MIDIEvent;
  noteOff: MIDIEvent;
  durationTicks: number;
  note: Note;
  name: string;
  bbox;
  mute: (flag: boolean) => void;
}

export interface Part {
  id: string;
  name: string;
  events: Array<MIDIEvent>;
  needsUpdate: boolean;
  eventsById: { [id: string]: MIDIEvent };
  addEvents: (events: Array<MIDIEvent>) => void;
  moveEvent: (event: MIDIEvent, ticks: Number) => void;
  removeEvents: (events: Array<MIDIEvent>, part?: Part) => void;
  transposeAllEvents: (semi: number) => void;
  update: () => void;
  bbox: {
    x: number
    y: number
    width: number
    height: number
  };
  //new ones
  //
  //
  active: boolean;
  mute: boolean;
  notes: Note[];
}

export type Track = {
  id: string
  name: string
  parts: Array<Part>
  events: Array<MIDIEvent>
  needsUpdate: boolean
  partsById: { [id: string]: Part }
  audioLatency: number
  monitor: boolean
  mute: boolean
  recordEnabled

  addPart: (part: Part) => void
  addPartAt: (part: Part, type: [string, number]) => void
  removeEvents: (events: Array<MIDIEvent>) => void
  removeAllEvents: () => void
  processMidiEvent: (event: MIDIEvent | Array<MIDIEvent>) => void
  setMidiInput: (id: string, flag?: boolean) => void
  setMidiOutput: (id: string, flag?: boolean) => void
  setInstrument: (id: string) => void
  removePart: (part: Part) => void
  update: () => void
};

export type InstrumentMapping = {
  [id: string]: {
    [id: string]: string
  }
};

export interface Instrument {
  name: string;
  mapping: InstrumentMapping;
}

export interface AssetPack {
  instruments: Array<Instrument>;
  midifiles: Array<string>;
}

export interface MIDIPortsObject {
  [id: string]: WebMidi.MIDIPort;
}

export interface MIDIFileJSON {
  id: string;
  url: string;
  name: string;
  ppq: number;
  bpm: number;
  nominator: number;
  denominator: number;
  tracks: Array<Track>;
  timeEvents: Array<MIDIEvent>;
}

export type MIDIFileDataTrack = {
  name: string, events: Array<MIDIEvent>
};

export type MIDIFileData = {
  ppq: number
  bpm: number
  nominator: number
  denominator: number,
  name: string,
  timeEvents: Array<MIDIEvent>,
  tracks: Array<MIDIFileDataTrack>,
};


// config file that gets loaded when the app starts
export interface Config {
  midiFiles: Array<string>;
  assetPacks: Array<string>;
  instruments: Array<string>;
  tempoMin: number;
  tempoMax: number;
  granularity: number;
  granularityOptions: Array<number>;
}

export interface SongInfo {
  tracks: Array<any>;
  bars: number;
  ppq: number;
  nominator: number;
  denominator: number;
}

// export type MIDIPort = {
//   id: string
//   connection: string
//   manufacturer: string
//   name: string
//   state: string
//   type: string
//   verions: string
//   onstatechange: () => void
//   addEventListener: (type: string, callback: (m: WebMidi.MIDIMessageEvent) => void) => void
//   removeEventListener: (type: string, callback: (m: WebMidi.MIDIMessageEvent) => void) => void
// }

export type LineData = {
  x: number
  y: number
  bar: number
  beat: number
  sixteenth: number
  type: string
};

export type KeyEditor = {
  xToTicks: (x: number, snap?: boolean) => number;
  ticksToX: (ticks: number) => number
  yToPitch: (y: number) => Heartbeat.MIDINote
  pitchToY: (noteNumber: number) => number
  setPlayheadToX: (x: number) => void
  getPlayheadX: (compensateForScroll?: boolean) => number
  setBarsPerPage: (bbp: number) => void

  startMoveNote: (note: Note, x: number, y: number) => void
  stopMoveNote: () => void
  moveNote: (x: number, y: number, updateSong?: boolean) => void
  startMovePart: (part: Part, x: number, y: number) => void
  stopMovePart: () => void
  movePart: (x: number, y: number, updateSong?: boolean) => void
  removeNote: (note: Note) => void
  removePart: (part: Part) => void
  setViewport: (width: number, height: number) => void
  setSnapX: (snap: number) => void
  verticalLine: {
    next: (type: string) => LineData,
    hasNext: (type: string) => LineData,
    reset: () => void,
  }
  horizontalLine: {
    next: (type: string) => LineData
    hasNext: (type: string) => LineData
    reset: () => void
  }
  selectedPart: Part
  song: Song
  getSnapshot: (song?, id?) => SnapShot
  //new ones
  //
  //
  currentPage: number
  numPages: number
  gripX: number
  gripY: number
  pitchHeight: number
  highestNote: number
  lowestNote: number
  scroll: (action) => void
  updateScroll: (x: number, y: number) => void
  scrollY: number
  getTicksAt: (x: number, snap?: boolean) => number
  getPitchAt: (y: number) => Note
  getPositionAt: (x: number) => SongPosition
  addEventListener: (event: string, typeOrCallback: any, callback?: (arg?: any) => void) => void
  selectedNote: Note
  getEventRect: (event: MIDIEvent) => any
  //Added stuff
  //
  noteIterator
  partIterator
  width
  updateSong(a: any): void
};

export type SnapShot = {
  events: {
    active: MIDIEvent[]
    inActive: MIDIEvent[]
    recorded: MIDIEvent[]
    new: MIDIEvent[]
    changed: MIDIEvent[]
    removed: MIDIEvent[]
    stateChanged: MIDIEvent[]
  },

  notes: {
    active: Note[]
    inActive: Note[]
    recorded: Note[]
    recording: Note[]
    new: Note[]
    changed: Note[]
    removed: Note[]
    stateChanged: Note[]
  },

  parts: {
    active: Part[]
    inActive: Part[]
    new: Part[]
    changed: Part[]
    removed: Part[]
    stateChanged: Part[]

  },


  hasNewBars: boolean
  newWidth: number

  pageNo: number
  lastPage: number
};

export type AudioEvent = {
  buffer?: AudioBuffer;
  path?: string;
};
