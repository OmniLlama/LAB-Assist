import {MovementTrail} from '../app/input-display/movement-trail';
import {InputDisplayVisuals} from '../app/input-display/input-display-visuals';
import {Div, Span, SubDiv, SubImg, SubSpan} from './Gen';
import {htmlIdxToDirStr, nameButton} from '../app/input-display/input-display.component';
import {AxisToAnalogName, DirectionState} from './Enums';
import {clamp, pitchNumToFrequency} from './Func';
import {GamepadObject} from './Defs';
import {InputDisplayFunctions} from '../app/input-display/input-display-functions';

interface HTMLShell {
  div: HTMLDivElement;
}

export class ButtonHTMLShell implements HTMLShell {
  div: HTMLDivElement;
  img: HTMLImageElement;
  pressedImg: HTMLImageElement;
  name: string;

  constructor(name: string, className: string, parent = null) {
    this.name = name;
    this.div = Div(name, className);
    this.img = SubImg(this.div, name);
    this.pressedImg = SubImg(this.div, name + '_pressed');
    this.pressedImg.style.display = 'none';
    if (parent) {
      parent.appendChild(this.div);
    }
  }

  setParent(parent) {
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
  btnShells: ButtonHTMLShell[];
  pad2WayAxes: TwoWayAxisShell[];
  acts_div: HTMLDivElement;
  funcs_div: HTMLDivElement;
  axes_div: HTMLDivElement;

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
    for (let i = 0; i < padObj.Btns.length; i++) {
      const btn = new ButtonHTMLShell(nameButton(i), 'gamepad-buttons');
      this.btnShells.push(btn);
    }
    // Append Action Button Icons
    this.acts_div = SubDiv(this.div, null, 'btns4xY');
    for (const btnNum of padObj.ActionButtonLayout) {
      this.btnShells[btnNum].setParent(this.acts_div);
    }
    // Append Function Button Icons
    this.funcs_div = SubDiv(this.div, null, 'funcs1x4');
    for (const btnNum of padObj.FunctionButtonLayout) {
      this.btnShells[btnNum].setParent(this.funcs_div);
    }

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

  updateShell(use: boolean, axes: [number, number], dirState: DirectionState) {
    this.div.style.display = use ? 'inline-block' : 'none';
    InputDisplayFunctions.updateCurrentDirection(this, dirState);
    if (use) {
      this.updateTracer(axes);
    }
  }
}

export class TwoWayAxisShell implements HTMLShell {
  div: HTMLDivElement;
  neg_span: HTMLSpanElement;
  pos_span: HTMLSpanElement;

  constructor(name: string) {
    this.div = Div(name, 'two-way-axis');
    this.neg_span = SubSpan(this.div, `${name}-neg`, 'two-way-axis-neg');
    this.pos_span = SubSpan(this.div, `${name}-pos`, 'two-way-axis-pos');
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
  oscTy: OscillatorOptions['type'] = 'sine';
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
      this.oscs.push(new OscillatorShell(this.ctx, this.globalComp, this.oscTy, pitchNumToFrequency(69 - i)));
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

  changeOscType(type: OscillatorOptions['type']) {
    this.oscTy = type;
    this.oscs.forEach((osc) => {
      osc.turnOverType(type);
    });
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
  }

  turnOverType(type: OscillatorOptions['type']) {
    // this.node.stop();
    this.regenNode(type);
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  regenNode(type: OscillatorOptions['type'] = this.node.type, freq: OscillatorOptions['frequency'] = this.node.frequency.value) {
    this.node = new OscillatorNode(this.ctx, {type, frequency: freq});
    this.node.connect(this.parent);
  }
}
