import {InputConverterFunctions} from '../app/input-converter/input-converter-functions';
import {InputConverterComponent} from '../app/input-converter/input-converter.component';
import {numberToPitchString} from './Func';
import {Div} from './Gen';
import {InputEditorVisuals} from '../app/input-editor/input-editor-visuals';

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

  shift(x: number, y: number) {
    this.x += x;
    this.y += y;
  }

  place(x: number, y: number) {
    this.x = x;
    this.y = y;
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
  setDimension(w, h){
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
   * @param element
   */
  updateElementToBBox(element: HTMLElement) {
    element.style.left = this.x + 'px';
    element.style.top = this.y + 'px';
    element.style.width = this.width + 'px';
    element.style.height = this.height + 'px';
  }
}


export class Playhead {
  div: HTMLDivElement;
  inner: HTMLDivElement;
  bbox: BBox;
  startPos: [number, number];

  constructor(x, y, w, h) {
    this.div = Div('test-playhead');
    this.inner = Div('test-playhead-line');
    this.div.appendChild(this.inner);
    this.startPos = [x, y];
    this.bbox = new BBox(x, y, w, h);
    this.bbox.updateElementToBBox(this.div);
  }
  get xPos(): number {
    return this.bbox.x;
  }

  set StartPos(pos: [number, number]) {
    this.startPos = pos;
  }

  shiftUpdate(x: number, y: number) {
    this.bbox.shift(x, y);
    this.bbox.updateElementToBBox(this.div);
  }

  xPlaceUpdate(x: number) {
    this.bbox.x = x;
    this.bbox.updateElementToBBox(this.div);
  }

  placeUpdate(x: number, y: number) {
    this.bbox.place(x, y);
    this.bbox.updateElementToBBox(this.div);
  }

  reset() {
    this.placeUpdate(this.startPos[0], this.startPos[1]);
  }

}

export class Tracker {
  held = false;
  inpStart: number;
  inpEnd: number;
  htmlNote: HTMLNote;
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
    // this.div.addEventListener('mousemove', (me) => this.updateNotePos(me));
    this.start = start;
    this.bbox = new BBox(this.start, y, 0, 24);
    this.bbox.updateElementToBBox(this.div);
    const edges = InputEditorVisuals.createEdges(this.bbox, this.div);
    this.edgeL = edges[0];
    this.edgeR = edges[1];
    this.div.append(this.edgeL, this.edgeR);
  }

  updateNoteEnd(end: number) {
    this.end = end;
    this.bbox.width = this.end - this.start;
    this.bbox.updateElementToBBox(this.div);
  }

  updateNotePos(me: MouseEvent) {
    this.bbox.x = me.pageX - this.bbox.center;
    this.bbox.updateElementToBBox(this.div);
  }
}

export class EditorView {
  div: HTMLDivElement;
  score: HTMLDivElement;
  pitchCount = 24;
  pitchHeight: number;
  bbox: BBox;
  playhead: Playhead;

  constructor(x, y, w, h) {
    this.bbox = new BBox(x, y, w, h);
    this.div = document.getElementById('test-editor') as HTMLDivElement;
    this.score = Div('test-score');
    this.score.addEventListener('click', (me) => this.playhead.xPlaceUpdate(me.x));

    this.div.appendChild(this.score);
    this.bbox.updateElementToBBox(this.div);
    this.bbox.updateElementToBBox(this.score);

    const rect = this.div.getBoundingClientRect();
    // this.playhead = new Playhead(rect.x, rect.y, 5, h);
    this.playhead = new Playhead(0, 0, 5, h);
    this.pitchHeight = h / this.pitchCount;
    this.div.appendChild(this.playhead.div);
    window.addEventListener('resize', (uie) => this.updateDraw());
  }

  updateDraw() {
    let h = InputConverterComponent.inpConvComp.div.getBoundingClientRect().height;
    this.bbox.setDimension(window.innerWidth, h);
    this.bbox.updateElementToBBox(this.div);
    this.bbox.updateElementToBBox(this.score);
    this.pitchHeight = h / this.pitchCount;
    const rect = this.score.getBoundingClientRect();
    this.playhead.bbox.setHeight(h);
    this.playhead.StartPos = [rect.x, rect.y];
    this.playhead.reset();
  }
}

export class FPSTracker {
  fps: number = 0;
  avgFPS: number;
  fpsHistCnt: number = 15;
  fpsHistory: Queue<number> = new Queue<number>(this.fpsHistCnt);
  lastNow: number = performance.now();

  get average() {
    return Math.floor(this.fpsHistory.q.reduce((a, b) => a + b, 0) / this.fpsHistory.q.length);
  }

  constructor() {
  }

  update() {
    this.fps = Math.floor(1 / ((performance.now() - this.lastNow) / 1000));
    this.fpsHistory.qThru(this.fps);
    this.avgFPS = this.average;
    this.lastNow = performance.now();
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

  qThru(t: T): T {
    let pop: T;
    if (this.q.length === this.max) {
      pop = this.pop();
    }
    this.push(t);
    // console.log(pop === t);
    return pop;
  }
}
