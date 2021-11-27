import {MovementTrail} from '../app/input-display/movement-trail';
import {InputDisplayVisuals} from '../app/input-display/input-display-visuals';
import {Div, Span, SubImg} from './Gen';
import {htmlIdxToDirStr, nameButton} from '../app/input-display/input-display.component';
import {AxisToAnalogName} from './Enums';
import {clamp, pitchNumToFrequency} from './Func';
import {GamepadObject} from './Defs';

interface HTMLShell {
  div: HTMLDivElement;
}

export class ButtonHTMLShell implements HTMLShell {
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
  acts_div: HTMLDivElement;
  actBtnShells: ButtonHTMLShell[];
  funcs_div: HTMLDivElement;
  funcBtnShells: ButtonHTMLShell[];
  axes_div: HTMLDivElement;
  pad2WayAxes: TwoWayAxisShell[];

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



    // Create Action Button Icons
    this.actBtnShells = new Array<ButtonHTMLShell>();
    this.acts_div = Div(null, 'btns4xY');
    for (const btnNum of padObj.actionButtonLayout) {
      const btn = new ButtonHTMLShell(nameButton(btnNum), 'gamepad-buttons', this.acts_div);
      this.actBtnShells.push(btn);
    }
    this.div.appendChild(this.acts_div);
    // Create Function Button Icons
    this.funcBtnShells = new Array<ButtonHTMLShell>();
    this.funcs_div = Div(null, 'funcs1x4');
    for (const btnNum of padObj.functionButtonLayout) {
      const btn = new ButtonHTMLShell(nameButton(btnNum), 'gamepad-functions', this.funcs_div);
      this.funcBtnShells.push(btn);
    }
    this.div.appendChild(this.funcs_div);

    // Create Axis Meters
    this.pad2WayAxes = new Array<TwoWayAxisShell>();
    this.axes_div = document.createElement('div');
    this.axes_div.className = 'axes';
    for (let i = 0; i < padObj.pad.axes.length; i++) {
      const axis = new TwoWayAxisShell(AxisToAnalogName[i]);
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

export class AudioContextShell {
  ctx: AudioContext;
  globalGain: GainNode;
  globalComp: DynamicsCompressorNode;
  oscs: Array<OscillatorShell>;

  constructor(ctx: AudioContext, startGain: number) {
    this.ctx = ctx;
    this.globalGain = new GainNode(this.ctx);
    this.globalGain.gain.setValueAtTime(startGain, this.currentTime);
    this.globalGain.connect(this.ctx.destination);
    this.globalComp = new DynamicsCompressorNode(this.ctx);
    this.globalComp.connect(this.globalGain);
    this.oscs = new Array<OscillatorShell>();
    for (let i = 0; i < 24; i++) {
      this.oscs.push(new OscillatorShell(this.ctx, this.globalComp, 'triangle', pitchNumToFrequency(69 - i)));
    }
  }

  get currentTime() {
    return this.ctx.currentTime;
  }

  setGlobalGain(val: number) {
    this.globalGain.gain.setValueAtTime(val, this.currentTime);
  }
  playAtFor(idx: number, delay: number, dur: number): AudioContextShell {
    this.oscs[idx].start(delay);
    this.oscs[idx].stop(dur);
    return this;
  }

  playFor(idx: number, dur: number): AudioContextShell {
    this.oscs[idx].start();
    this.oscs[idx].stop(dur);
    return this;
  }
}

export class OscillatorShell {
  node: OscillatorNode;
  ctx: AudioContext;
  parent: AudioNode;

  constructor(ctx: AudioContext, parentNode: AudioNode, type: OscillatorOptions['type'], freq: OscillatorOptions['frequency']) {
    this.ctx = ctx;
    this.node = new OscillatorNode(ctx, {type, frequency: freq});
    this.parent = parentNode;
    this.node.connect(parentNode);
  }

  start(delay: number = 0) {
    this.node.start(this.ctx.currentTime + delay);
  }

  stop(delay: number = 0) {
    this.node.stop(this.ctx.currentTime + delay);
    this.regenNode();
    // this.delay(delay).then(() => this.regenNode());
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  regenNode() {
    this.node = new OscillatorNode(this.ctx, {type: this.node.type, frequency: this.node.frequency.value});
    this.node.connect(this.parent);
  }
}
