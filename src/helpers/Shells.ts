import {MovementTrail} from '../app/input-display/movement-trail';
import {InputDisplayVisuals} from '../app/input-display/input-display-visuals';
import {Div, Span, SubImg} from './Gen';
import {IMG_EXT, IMG_DIR_BASE} from './Vals';
import {htmlIdxToDirStr, nameButton} from '../app/input-display/input-display.component';
import {axisToAnalogName} from './Enums';
import {clamp} from './Func';
import {GamepadObject} from './Defs';

interface HTMLShell {
  div: HTMLDivElement;
}

class ButtonHTMLShell implements HTMLShell {
  div: HTMLDivElement;
  img: HTMLImageElement;
  pressedImg: HTMLImageElement;
  name: string;

  constructor(name: string, className: string, parent) {
    this.name = name;
    this.div = Div(name, className);
    this.img = SubImg(this.div, name);
    this.pressedImg = SubImg(this.div, name + '_pressed');
    this.pressedImg.style.display = 'none';
    parent.appendChild(this.div);
  }

  updateImg(pressed: boolean) {
    this.img.style.display = pressed ? 'none' : 'block';
    this.pressedImg.style.display = pressed ? 'block' : 'none';
  }
}

export class GamepadHTMLShell implements HTMLShell {
  div: HTMLDivElement;
  padInfo: HTMLHeadElement;
  dirArrowSets: DirectionalHTMLShell[];
  axes_div: HTMLDivElement;
  pad2WayAxes: TwoWayAxisShell[];
  btns_div: HTMLDivElement;
  btnShells: ButtonHTMLShell[];

  constructor(padObj: GamepadObject) {
    this.div = Div('controller' + padObj.pad.index, 'controller');

    // Create controller id title
    this.padInfo = document.createElement('div');
    this.padInfo.appendChild(document.createTextNode('gamepad: ' + padObj.pad.id));
    this.div.appendChild(this.padInfo);

    // Create Arrow Sets
    this.dirArrowSets = new Array<DirectionalHTMLShell>();
    for (let i = 0; i < padObj.pad.axes.length / 2; i++) {
      this.dirArrowSets[i] = InputDisplayVisuals.CreateDirectionalHtmlShell(i);
      this.div.appendChild(this.dirArrowSets[i].div);
    }
    this.dirArrowSets[2] = InputDisplayVisuals.CreateDirectionalHtmlShell(2);
    this.div.appendChild(this.dirArrowSets[2].div);

    // Create Button Icons
    this.btnShells = new Array<ButtonHTMLShell>();
    this.btns_div = Div(null, 'btns4x2');
    const btnOrder: number[] = padObj.btnLayout;
    for (const btnNum of btnOrder) {
      const btn = new ButtonHTMLShell(nameButton(btnNum), 'gamepad-buttons', this.btns_div);
      this.btnShells.push(btn);
    }
    // Append Buttons to div
    this.div.appendChild(this.btns_div);

    // Create Axis Meters
    this.pad2WayAxes = new Array<TwoWayAxisShell>();
    this.axes_div = document.createElement('div');
    this.axes_div.className = 'axes';
    for (let i = 0; i < padObj.pad.axes.length; i++) {
      const axis = new TwoWayAxisShell(axisToAnalogName[i]);
      this.pad2WayAxes.push(axis);
      this.axes_div.appendChild(axis.div);
    }
    //Append Meters to div
    this.div.appendChild(this.axes_div);
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
    return [rect.left + window.scrollX, rect.top + window.scrollY];
  }
}

export class TwoWayAxisShell implements HTMLShell {
  div: HTMLDivElement;
  neg_span: HTMLSpanElement;
  pos_span: HTMLSpanElement;

  constructor(name: string) {
    this.div = Div(name, 'two-way-axis');
    this.neg_span = Span(name + '-neg', 'two-way-axis-neg');
    this.pos_span = Span(name + '-pos', 'two-way-axis-pos');
    this.div.appendChild(this.neg_span);
    this.div.appendChild(this.pos_span);
  }

  updateAxis(val: number) {
    this.div.setAttribute('value', `${val}`);
    this.pos_span.style.width = `${clamp(val * 100, 0, 100)}%`;
    this.neg_span.style.width = `${clamp(-val * 100, 0, 100)}%`;
  }
}

export class AxisShell implements HTMLShell {
  div: HTMLDivElement;
  span: HTMLSpanElement;
  constructor(name: string) {
    this.div = Div(name, 'axis');
    this.span = Span(name + '-span', 'axis-span');
  }
  updateAxis(val: number) {
    this.div.setAttribute('value', `${val}`);
    this.span.style.width = `${clamp(val * 100, 0, 100)}%`;
  }
}
