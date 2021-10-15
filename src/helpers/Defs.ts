import {MIDINote} from '../heartbeat/build';
import {InputConverterFunctions} from '../app/input-converter/input-converter-functions';
import {InputConverterComponent} from '../app/input-converter/input-converter.component';

export class BBox {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(box: BBox = null, x, y, w, h) {
    if (box !== null) {
      this.x = box.x;
      this.y = box.y;
      this.width = box.width;
      this.height = box.height;
    } else {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
    }
    return this;
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
   * Fits element within its bounding box
   * @param element
   * @param bbox
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
  AABB = {
    collide(el1, el2) {
      const rect1 = el1.getBoundingClientRect();
      const rect2 = el2.getBoundingClientRect();

      return !(
        rect1.top > rect2.bottom ||
        rect1.right < rect2.left ||
        rect1.bottom < rect2.top ||
        rect1.left > rect2.right
      );
    },

    inside(el1, el2) {
      const rect1 = el1.getBoundingClientRect();
      const rect2 = el2.getBoundingClientRect();

      return (
        rect1.top <= rect2.bottom && rect1.bottom >= rect2.top && rect1.left <= rect2.right && rect1.right >= rect2.left
      );
    }
  };

  constructor(x, y, w, h) {
    this.inner = document.createElement('div');
    this.inner.id = 'test-playhead-line';
    this.div = document.createElement('div');
    this.div.id = 'test-playhead';
    this.div.appendChild(this.inner);
    this.startPos = [x, y];
    this.bbox = new BBox(null, x, y, w, h);
    this.bbox.updateElementToBBox(this.div);
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
  heldNote: MIDINote; // heldNote, currentTicks
  inpStart: number;
  inpEnd: number;
  htmlNote: HTMLNote;
}

export class HTMLNote {
  static idCntr = 0;
  start: number;
  end: number;
  pitch: number;
  div: HTMLDivElement;
  bbox: BBox;
  active: boolean;

  get name() {
    return InputConverterFunctions.numberToPitchString(this.pitch);
  }

  get id() {
    return this.div.id;
  }

  constructor(pitch: number, start: number, y: number) {
    this.pitch = pitch;
    this.div = document.createElement('div');
    this.div.className = 'note';
    HTMLNote.idCntr++;
    this.div.id = `N${HTMLNote.idCntr}`;
    this.div.setAttribute('pitch', InputConverterFunctions.numberToPitchString(this.pitch));
    // this.div.addEventListener('mousemove', (me) => this.updateNotePos(me));
    this.start = start;
    this.bbox = new BBox(null, this.start, y, 0, 24);
    this.bbox.updateElementToBBox(this.div);
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
    this.bbox = new BBox(null, x, y, w, h);
    // this.div = document.createElement('div');
    // this.div.id = 'test-editor';
    this.div = document.getElementById('test-editor') as HTMLDivElement;
    this.score = document.createElement('div');
    this.score.id = 'test-score';
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
    this.bbox.setHeight(h);
    this.bbox.setWidth(window.innerWidth);
    this.bbox.updateElementToBBox(this.div);
    this.bbox.updateElementToBBox(this.score);
    this.pitchHeight = h / this.pitchCount;
    const rect = this.score.getBoundingClientRect();
    this.playhead.bbox.setHeight(h);
    this.playhead.StartPos = [rect.x, rect.y];
    this.playhead.reset();
  }
}

