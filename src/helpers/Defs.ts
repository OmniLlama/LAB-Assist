import {createTrackerGroup, InputConverterComponent} from '../app/input-converter/input-converter.component';
import {normalizeVector, numberToPitchString} from './Func';
import {Div, SubDiv} from './Gen';
import {InputEditorVisuals} from '../app/input-editor/input-editor-visuals';
import {InputEditorEvents} from '../app/input-editor/input-editor-events';
import {ButtonLayoutType, ButtonsState, DirectionState, GamepadType, GamepadTypeString} from './Enums';
import {GamepadHTMLShell} from './Shells';
import {frameDelayMS, dNowMS, frameJitter} from '../app/app.component';
import {FPS_60_MS} from './Vals';

export class BBox {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  shift(x: number = null, y: number = null) {
    this.x += x ?? 0;
    this.y += y ?? 0;
  }

  place(x: number = null, y: number = null) {
    this.x = x ?? this.x;
    this.y = y ?? this.y;
  }

  setAll(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  setWidth(w: number) {
    this.width = w;
  }

  setHeight(h: number) {
    this.height = h;
  }

  setDimension(w, h) {
    this.width = w;
    this.height = h;
  }

  setFromDom(dom: DOMRect) {
    this.x = dom.x;
    this.y = dom.y;
    this.width = dom.width;
    this.height = dom.height;
  }

  get center() {
    return this.width / 2;
  }

  get pageCenter() {
    return this.x + this.center;
  }

  /**
   * Fits element within this bounding box
   */
  updateElementTransformToBBox(element: HTMLElement) {
    element.style.transform = `translate(${this.x}px , ${this.y}px)`;
  }

  /**
   * Fits element within this bounding box
   */
  updateElementToBBox(element: HTMLElement) {
    element.style.left = this.x + 'px';
    element.style.top = this.y + 'px';
    element.style.width = this.width + 'px';
    element.style.height = this.height + 'px';
  }
}

export class Playhead {
  edtrView: EditorView;
  div: HTMLDivElement;
  inner: HTMLDivElement;
  bbox: BBox;
  startPos: [number, number];
  playPos: number;

  get scrolledXStartPos() {
    return this.startPos[0] + window.scrollX;
  }

  get scrolledYStartPos() {
    return this.startPos[1] + window.scrollY;
  }

  constructor(view: EditorView, x, y, w, h) {
    this.edtrView = view;
    this.div = Div('test-playhead');
    this.inner = SubDiv(this.div, 'test-playhead-line');
    this.startPos = [x, y];
    this.bbox = new BBox(x, y, w, h);
    this.bbox.updateElementToBBox(this.div);
    // this.bbox.updateElementTransformToBBox(this.div);
  }

  get xPos(): number {
    return this.bbox.x;
  }

  set StartPos(pos: [number, number]) {
    this.startPos = pos;
  }

  playUpdate() {
    this.bbox.shift(this.edtrView.pxPrFrm - (this.edtrView.pxPrFrm * frameJitter));
    this.bbox.updateElementToBBox(this.div);
  }

  shiftUpdate(x: number, y: number) {
    this.bbox.shift(x, y);
    // this.bbox.updateElementTransformToBBox(this.div);
    this.bbox.updateElementToBBox(this.div);
  }

  xShiftUpdate(x: number) {
    this.bbox.shift(
      x + this.bbox.x < this.startPos[0] ? this.startPos[0] : x
    );
    // this.bbox.updateElementTransformToBBox(this.div);
    this.bbox.updateElementToBBox(this.div);
  }

  xPlaceUpdate(x: number) {
    this.bbox.place(x);
    // this.bbox.updateElementTransformToBBox(this.div);
    this.bbox.updateElementToBBox(this.div);
  }

  placeUpdate(x: number, y: number) {
    this.bbox.place(x, y);
    // this.bbox.updateElementTransformToBBox(this.div);
    this.bbox.updateElementToBBox(this.div);
    this.playPos = this.getPlayheadFramePos();
  }

  reset(yOnly: boolean) {
    this.placeUpdate(yOnly ? this.bbox.x : this.scrolledXStartPos, this.scrolledYStartPos);
  }

  getPlayheadFramePos() {
    return (this.bbox.x - this.startPos[0]) / this.edtrView.pxPrFrm;
  }
}


export class HTMLPart {
  static idCntr = 0;
  div: HTMLDivElement;
  bbox: BBox;

  constructor() {

  }

  get id() {
    return this.div.id;
  }

}

export class HTMLNote {
  static idCntr = 0;
  start: number;
  end: number;
  pitch: number;
  div: HTMLDivElement;
  bbox: BBox;
  active: boolean;
  edgeL: HTMLImageElement;
  edgeR: HTMLImageElement;

  get name() {
    return numberToPitchString(this.pitch);
  }

  get id() {
    return this.div.id;
  }

  constructor(pitch: number, start: number, y: number) {
    this.pitch = pitch;
    HTMLNote.idCntr++;
    this.div = Div(`N${HTMLNote.idCntr}`, 'note');
    this.div.setAttribute('pitch', numberToPitchString(this.pitch));
    this.start = start;
    this.bbox = new BBox(this.start, y, 0, 24);
    this.bbox.updateElementToBBox(this.div);
    const edges = InputEditorVisuals.createEdges(this, this.bbox, this.div);
    this.edgeL = edges[0];
    this.edgeR = edges[1];
    this.div.append(this.edgeL, this.edgeR);
    this.div.addEventListener('mousedown', (me) =>
      InputEditorEvents.Note_lMouDown(me));
    this.edgeL.addEventListener('mousedown', (me) =>
      InputEditorEvents.NoteEdge_Left_lMouDown(me));
    this.edgeR.addEventListener('mousedown', (me) =>
      InputEditorEvents.NoteEdge_Right_lMouDown(me));
  }

  modifyNoteStart(start: number) {
    this.updateNoteStart(start);
    this.finishNote(start, this.end);
  }

  modifyNoteEnd(end: number) {
    this.updateNoteEnd(end);
    this.finishNote(this.start, end);
  }

  updateNoteStart(start: number) {
    this.bbox.place(start);
    this.start = start;
    this.bbox.setWidth(this.end - this.start);
    this.bbox.updateElementToBBox(this.div);
    // this.bbox.updateElementTransformToBBox(this.div);
  }

  updateNoteEnd(end: number) {
    this.end = end;
    this.bbox.setWidth(this.end - this.start);
    this.bbox.updateElementToBBox(this.div);
    // this.bbox.updateElementTransformToBBox(this.div);
  }

  finishNote(start: number, end: number) {
    this.start = start;
    this.end = end;
    this.bbox.setWidth(this.end - this.start);
    this.bbox.updateElementToBBox(this.div);
    // this.bbox.updateElementTransformToBBox(this.div);
    this.edgeR.style.left = `${this.bbox.width}px`;
  }

  updateNotePos(me) {
    this.bbox.x = me.pageX - this.bbox.center;
    // this.bbox.updateElementTransformToBBox(this.div);
    this.bbox.updateElementToBBox(this.div);
  }

}
class HTMLNoteEdge {
  note: HTMLNote;
  constructor(note: HTMLNote) {
    this.note = note;
  }
}
export class EditorView {
  div: HTMLDivElement;
  score: HTMLDivElement;
  trackedNotes: HTMLDivElement;
  trackingNotes: HTMLDivElement;
  pitchCount = 24;
  pitchHeight: number;
  bbox: BBox;
  playhead: Playhead;
  playing: boolean;
  convX: number = 0;
  convY: number = 0;
  pxPrFrm: number = 4;

  constructor(x, y, w, h) {
    this.convX = InputConverterComponent.inpConvComp.div.getBoundingClientRect().width;
    this.bbox = new BBox(x, y, w, h);
    this.div = document.getElementById('test-editor') as HTMLDivElement;
    this.score = SubDiv(this.div, 'test-score');
    this.score.addEventListener('click', (me) => this.playhead.xPlaceUpdate(this.snapX(me.x)));
    this.trackedNotes = SubDiv(this.div, 'tracked-notes');
    this.trackingNotes = SubDiv(this.div, 'tracking-notes');
    this.bbox.updateElementToBBox(this.div);
    this.bbox.updateElementToBBox(this.score);

    this.playhead = new Playhead(this, 0, 0, 5, h);
    this.pitchHeight = h / this.pitchCount;
    this.div.appendChild(this.playhead.div);
    window.addEventListener('resize', (uie) => this.updateDraw());
  }

  updateDraw() {
    const cnvRect = InputConverterComponent.inpConvComp.div.getBoundingClientRect();
    this.convX = cnvRect.width;
    this.convY = cnvRect.height;
    const h = this.convY;
    this.bbox.place(cnvRect.x + cnvRect.width, cnvRect.y);
    this.bbox.setDimension(window.innerWidth, h);
    this.bbox.updateElementToBBox(this.div);
    // this.bbox.updateElementTransformToBBox(this.div);
    this.bbox.updateElementToBBox(this.score);
    // this.bbox.updateElementTransformToBBox(this.score);
    this.pitchHeight = h / this.pitchCount;
    const rect = this.score.getBoundingClientRect();
    this.playhead.bbox.setHeight(h);
    this.playhead.StartPos = [this.bbox.x, rect.y];
    // this.playhead.StartPos = [this.bbox.x, 0];
    this.playhead.reset(false);
  }

  playUpdate() {
    if (this.playing) {
      this.playhead.playUpdate();
    }
  }

  stopPlayState() {
    this.setPlayState(false);
    this.playhead.reset(false);
    this.updateDraw();
  }

  togglePlayState() {
    this.playing = !this.playing;
  }

  setPlayState(playing: boolean) {
    this.playing = playing;
  }

  snapX(xPos: number) {
    return Math.max(Math.floor(xPos / this.pxPrFrm) * this.pxPrFrm, 0);
  }
}

export class FPSTracker {
  fps: number = 0;
  avgFPS: number;
  fpsHistMax: number = 5;
  fpsHistory: Queue<number> = new Queue<number>(this.fpsHistMax);
  now: number = 0;
  lastNow: number = 0;
  dNow: number;

  get average() {
    return Math.ceil(this.fpsHistory.q.reduce((a, b) => a + b, 0) / this.fpsHistory.q.length);
  }

  update(): number {
    this.now = performance.now();
    this.dNow = this.now - this.lastNow;
    this.fps = Math.floor(1 / ((this.now - this.lastNow) / 1000));
    this.fpsHistory.qThru(this.fps);
    this.avgFPS = this.average;
    this.lastNow = this.now;
    return FPS_60_MS - this.dNow;
  }
}

export class Queue<T> {
  q: T[] = [];
  max: number;

  constructor(max) {
    this.max = max;
  }

  push(val: T) {
    this.q.push(val);
  }

  pop(): T | undefined {
    return this.q.shift();
  }

  qThru(t: T): T | undefined {
    let pop: T;
    if (this.q.length === this.max) {
      pop = this.pop();
    }
    this.push(t);
    return pop;
  }

}

/**
 * layer class to traditional gamepad API, handles many of the adaptations and customizations needed
 */
export class GamepadObject {
  type: GamepadType;
  pad: Gamepad;
  html: GamepadHTMLShell;

  useLS: boolean = true;
  useRS: boolean = true;
  useDPad: boolean = true;

  get UsedDirs(): Array<boolean> {
    return [this.useLS, this.useRS, this.useDPad];
  }

  activeInEditor: boolean;

  vertDZ: number = 0.4;
  horiDZ: number = 0.5;
  trigDZ: number = .8;
  lsDirState: DirectionState;
  rsDirState: DirectionState;
  dpadDirState: DirectionState;

  get DirStates() {
    return [this.lsDirState, this.rsDirState, this.dpadDirState];
  }

  dpadBtns: readonly GamepadButton[];

  funcBtnCnt: number = 4;
  btns: readonly GamepadButton[];
  btnsState: ButtonsState;
  btnLayoutTy: ButtonLayoutType = ButtonLayoutType.Arcade;
  btnLayout: number[];

  get ActionButtonLayout() {
    return this.btnLayout.slice(0, -this.funcBtnCnt);
  }

  get FunctionButtonLayout() {
    return this.btnLayout.slice(-this.funcBtnCnt);
  }

  constructor(gp) {
    if (gp !== null && gp !== undefined) {
      this.pad = gp;
      this.type = this.getType(gp.id);
      this.btnLayout = this.getButtonLayout();
      this.html = new GamepadHTMLShell(this);
      this.dpadBtns = this.DPadURLD;
    } else {
    }
  }

  axisByIdx(idx: number): number {
    return this.pad.axes[idx];
  }

  axisPair(idx: number): [number, number] {
    return [this.axisByIdx(idx * 2), this.axisByIdx(idx * 2 + 1)];
  }

  get AxisPairs(): Array<[number, number]> {
    const pairs = new Array<[number, number]>();
    for (let i = 0; i < this.Axes.length / 2; i++) {
      pairs.push(this.axisPair(i));
    }
    return pairs;
  }

  get Axes(): readonly number[] {
    return this.pad.axes;
  }

  get Btns(): readonly GamepadButton[] {
    return this.pad.buttons;
  }

  get DPad(): readonly GamepadButton[] {
    const bs = new Array<GamepadButton>();
    this.getDPadButtonNumbers().forEach((b, i) => {
      bs[i] = this.pad.buttons[b];
    });
    return bs;
  }

  get DPadURLD(): readonly GamepadButton[] {
    const bns = this.getDPadButtonNumbers();
    const bs = [this.pad.buttons[bns[0]], this.pad.buttons[bns[3]], this.pad.buttons[bns[2]], this.pad.buttons[bns[1]]];
    return bs;
  }

  get DirVecs(): Array<[number, number]> {
    return this.AxisPairs.concat(this.DPadToVector());
  }


  updateGamepad(gamepads: Gamepad[]) {
    this.pad = gamepads[this.pad.index];
    this.dpadBtns = this.DPadURLD;
    this.btns = this.Btns;
    this.lsDirState = (this.axisByIdx(1) < -this.vertDZ ? DirectionState.Up : 0) |
      (this.axisByIdx(0) > this.horiDZ ? DirectionState.Right : 0) |
      (this.axisByIdx(0) < -this.horiDZ ? DirectionState.Left : 0) |
      (this.axisByIdx(1) > this.vertDZ ? DirectionState.Down : 0);
    this.rsDirState = (this.axisByIdx(3) < -this.vertDZ ? DirectionState.Up : 0) |
      (this.axisByIdx(2) > this.horiDZ ? DirectionState.Right : 0) |
      (this.axisByIdx(2) < -this.horiDZ ? DirectionState.Left : 0) |
      (this.axisByIdx(3) > this.vertDZ ? DirectionState.Down : 0);
    this.dpadDirState = (this.dpadBtns[0].pressed ? DirectionState.Up : 0) |
      (this.dpadBtns[1].pressed ? DirectionState.Right : 0) |
      (this.dpadBtns[2].pressed ? DirectionState.Left : 0) |
      (this.dpadBtns[3].pressed ? DirectionState.Down : 0);
    this.btnsState = (this.btns[0].pressed ? ButtonsState.BtnA : 0) |
      (this.btns[1].pressed ? ButtonsState.BtnB : 0) |
      (this.btns[2].pressed ? ButtonsState.BtnX : 0) |
      (this.btns[3].pressed ? ButtonsState.BtnY : 0) |
      (this.btns[4].pressed ? ButtonsState.BtnLB : 0) |
      (this.btns[5].pressed ? ButtonsState.BtnRB : 0) |
      (this.btns[6].pressed ? ButtonsState.BtnLT : 0) |
      (this.btns[7].pressed ? ButtonsState.BtnRT : 0) |
      (this.btns[8].pressed ? ButtonsState.BtnSel : 0) |
      (this.btns[9].pressed ? ButtonsState.BtnSta : 0) |
      (this.btns[10].pressed ? ButtonsState.BtnLSC : 0) |
      (this.btns[11].pressed ? ButtonsState.BtnRSC : 0);
  }

  DPadToVector(): [number, number] {
    return normalizeVector(
      (this.DPad[2].pressed ? -1 : 0) +
      (this.DPad[3].pressed ? 1 : 0),
      (this.DPad[0].pressed ? -1 : 0) +
      (this.DPad[1].pressed ? 1 : 0),
      true);
  }

  /**
   * parses the manufacturer and other info to determine the type of layout needed
   * @param str
   */
  getType(str: string): GamepadType {
    str = str.toLowerCase();
    if (str.includes(GamepadTypeString.XInput)) {
      return GamepadType.XInput;
    } else if (str.includes(GamepadTypeString.Playstation)) {
      return GamepadType.Playstation;
    } else if (str.includes(GamepadTypeString.Qanba)) {
      return GamepadType.Qanba;
    } else {
      return GamepadType.Generic;
    }
  }


  /**
   * returns the order that the d-pads buttons should be presented, depending upon the manufacturer and standard
   */
  getDPadButtonNumbers(): number[] {
    switch (this.type) {
      case GamepadType.XInput:
        return [12, 13, 14, 15];
      default:
        return [12, 13, 14, 15];
    }
  }

  getButtonLayout(): number[] {
    switch (this.btnLayoutTy) {
      case ButtonLayoutType.Arcade:
        return [2, 3, 5, 4, 0, 1, 7, 6, 8, 9, 10, 11];
      case ButtonLayoutType.Linear:
        return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      case ButtonLayoutType.FacesLeft:
        return [2, 3, 4, 5, 0, 1, 6, 7, 8, 9, 10, 11];
      case ButtonLayoutType.FacesMiddle:
        return [4, 2, 3, 5, 6, 0, 1, 7, 8, 9, 10, 11];
    }
  }

  changeButtonLayout(layoutTy: ButtonLayoutType) {
    if (layoutTy === this.btnLayoutTy) {
      return;
    }
    this.btnLayoutTy = layoutTy;
    this.btnLayout = this.getButtonLayout();
    this.html.acts_div.innerHTML = '';
    for (const btnNum of this.ActionButtonLayout) {
      this.html.acts_div.appendChild(this.html.btnShells[btnNum].div);
    }
    this.html.funcs_div.innerHTML = '';
    for (const btnNum of this.FunctionButtonLayout) {
      this.html.funcs_div.appendChild(this.html.btnShells[btnNum].div);
    }
  }
}

export class Tracker {
  held = false;
  inpStart: number;
  inpEnd: number;
  htmlNote: HTMLNote;
}

export class InputTrackerSet {
  lsGroup: Array<Tracker>;
  rsGroup: Array<Tracker>;
  dpadGroup: Array<Tracker>;
  btnGroup: Array<Tracker>;

  constructor(pO: GamepadObject) {
    this.lsGroup = createTrackerGroup(4);
    this.rsGroup = createTrackerGroup(4);
    this.dpadGroup = createTrackerGroup(4);
    this.btnGroup = createTrackerGroup(pO.Btns.length);
  }

}
