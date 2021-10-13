export interface BBoxedElement {
  elmt: HTMLElement;
  bbox: BBox;
}

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

  constructor(x, y, w, h) {
    this.inner = document.createElement('div');
    this.inner.id = 'test-playhead-line';
    this.div = document.createElement('div');
    this.div.id = 'test-playhead';
    this.div.appendChild(this.inner);
    this.bbox = new BBox(null, x, y, w, h);
    this.bbox.updateElementToBBox(this.div);
  }

  get center() {
    return this.bbox.x + this.bbox.width / 2;
  }

  shiftUpdate(x: number, y: number) {
    this.bbox.shift(x, y);
    this.bbox.updateElementToBBox(this.div);
  }

  placeUpdate(x: number, y: number) {
    this.bbox.place(x, y);
    this.bbox.updateElementToBBox(this.div);
  }
}
