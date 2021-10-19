import {MovementTrail} from '../app/input-display/movement-trail';
import {InputDisplayVisuals} from '../app/input-display/input-display-visuals';
import {Div, SubImg} from './Gen';
import {IMG_EXT, IMG_DIR} from './Vals';
import {GamepadObject, htmlIdxToDirStr, nameButton} from '../app/input-display/input-display.component';

interface HTMLShell {
  div: HTMLDivElement;
}

class ButtonHTMLShell implements HTMLShell {
  div: HTMLDivElement;
  img: HTMLImageElement;
  name: string;

  constructor(name: string, className: string, parent) {
    this.name = name;
    this.div = Div(name, className);
    this.img = SubImg(this.div, name);
    parent.appendChild(this.div);
  }

  updateImgSrc(src: string) {
    this.img.src = `${IMG_DIR + src + IMG_EXT}`;
  }
}

export class GamepadHTMLShell implements HTMLShell {
  div: HTMLDivElement;
  padInfo: HTMLHeadElement;
  dirArrowSets: DirectionalHTMLShell[];
  padAxes: HTMLDivElement[];
  btnShells: ButtonHTMLShell[];
  btns_div: HTMLDivElement;

  constructor(padObj: GamepadObject) {
    this.div = Div('controller' + padObj.pad.index, 'controller');

    // Create controller id title
    this.padInfo = document.createElement('div');
    this.padInfo.appendChild(document.createTextNode('gamepad: ' + padObj.pad.id));
    this.div.appendChild(this.padInfo);

    // Create Arrow Sets
    this.dirArrowSets = new Array<DirectionalHTMLShell>();
    for (let i = 0; i < padObj.pad.axes.length / 2; i++) {
      this.dirArrowSets[i] = InputDisplayVisuals.CreateDirectionalArrows(i);
      this.div.appendChild(this.dirArrowSets[i].div);
    }
    this.dirArrowSets[2] = InputDisplayVisuals.CreateDirectionalArrows(2);
    this.div.appendChild(this.dirArrowSets[2].div);

    // Create Button Icons
    this.btns_div = Div('', 'btns4x2');
    this.btnShells = new Array<ButtonHTMLShell>();
    const btnOrder: number[] = padObj.btnLayout;
    for (const btnNum of btnOrder) {
      const btn = new ButtonHTMLShell(nameButton(btnNum), 'gamepad-buttons', this.btns_div);
      this.btnShells.push(btn);
    }
    // Append Buttons to div
    this.div.appendChild(this.btns_div);

    // Create Axis Meters
    // const div_axes: HTMLDivElement = document.createElement('div');
    // div_axes.className = 'axes';
    // for (let i = 0; i < gamepad.axes.length / 4; i++) {
    //   const sp = this.createAxisSpanElement(i);
    //   div_axes.appendChild(sp);
    //   this.dirDivs.push(sp);
    // }
    // Append Meters to div
    // this.div.appendChild(div_axes);
  }
}

export class DirectionalHTMLShell implements HTMLShell {
  div: HTMLDivElement;
  ul: ButtonHTMLShell;
  u: ButtonHTMLShell;
  ur: ButtonHTMLShell;
  l: ButtonHTMLShell;
  center_gap: HTMLDivElement;
  center: ButtonHTMLShell;
  r: ButtonHTMLShell;
  dl: ButtonHTMLShell;
  d: ButtonHTMLShell;
  dr: ButtonHTMLShell;
  tracer: HTMLDivElement;
  trail: MovementTrail;

  constructor(id: string, tracer) {
    this.div = document.createElement('div');
    this.div.className = 'dirs3x3';
    this.div.id = id;
    this.ul = new ButtonHTMLShell(htmlIdxToDirStr[0], `dirBtns-diag`, this.div);
    this.u = new ButtonHTMLShell(htmlIdxToDirStr[1], `dirBtns-ortho`, this.div);
    this.ur = new ButtonHTMLShell(htmlIdxToDirStr[2], `dirBtns-diag`, this.div);
    this.l = new ButtonHTMLShell(htmlIdxToDirStr[3], `dirBtns-ortho`, this.div);
    this.center_gap = Div('center');
    this.center = new ButtonHTMLShell(htmlIdxToDirStr[4], `dirBtns-ortho`, this.div);
    this.r = new ButtonHTMLShell(htmlIdxToDirStr[5], `dirBtns-ortho`, this.div);
    this.dl = new ButtonHTMLShell(htmlIdxToDirStr[6], `dirBtns-diag`, this.div);
    this.d = new ButtonHTMLShell(htmlIdxToDirStr[7], `dirBtns-ortho`, this.div);
    this.dr = new ButtonHTMLShell(htmlIdxToDirStr[8], `dirBtns-diag`, this.div);
    this.tracer = tracer;
    this.center.div.appendChild(this.tracer);
    this.trail = new MovementTrail(this.div);
  }

  htmlDirs() {
    return [this.ul, this.u, this.ur,
      this.l, this.center, this.r,
      this.dl, this.d, this.dr
    ];
  }

  numDirs() {
    return [this.dl, this.d, this.dr,
      this.l, this.center, this.r,
      this.ul, this.u, this.ur
    ];
  }

  updateTracer(pos) {
    this.tracer.style.left = Math.round(30 * pos[0]) + 'px';
    this.tracer.style.top = Math.round(30 * pos[1]) + 'px';
    this.trail.draw(this.getTracerPos());
  }

  getTracerPos() {
    const rect = this.tracer.getBoundingClientRect();
    return [rect.left + window.pageXOffset, rect.top + window.pageYOffset];
  }
}
