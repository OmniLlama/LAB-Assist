import {Component, OnInit} from '@angular/core';
import {
  MovementNotationType,
  ButtonNotationType,
  GamepadTypeString,
  GamepadType, ButtonLayoutOrder,
  xbBtns, ggBtns, scBtns, tknBtns, snkBtns, axisToAnalogName
} from 'src/helpers/Enums';
import {InputDisplayFunctions} from './input-display-functions';
import {InputDisplayVisuals} from './input-display-visuals';
import {InputDisplayEvents} from './input-display-events';
import {MovementTrail} from './movement-trail';
import {IMG_END, IMG_SRC} from '../../helpers/Vals';
import {Img} from '../../helpers/Gen';
import {InputConverterEvents} from '../input-converter/input-converter-events';
import {InputConverterComponent} from '../input-converter/input-converter.component';
import {InputEditorComponent} from '../input-editor/input-editor.component';

export let pads: Array<Gamepad>;
export let padObjs: Array<GamepadObject>;
export const dirSetId = {0: 'left', 1: 'right', 2: 'dpad'};
export const tracerAssnId = {0: 'ls', 1: 'rs', 2: 'dpad'};
export const htmlIdxToDirStr = {
  0: `up_left`,
  1: `up`,
  2: `up_right`,
  3: `left`,
  4: `center`,
  5: `right`,
  6: `down_left`,
  7: `down`,
  8: `down_right`
};

@Component({
  selector: 'app-input-display',
  templateUrl: './input-display.component.html',
  styleUrls: ['./input-display.component.sass']
})
export class InputDisplayComponent implements OnInit {
  static rAF = window.requestAnimationFrame;
  static inpDispCmp: InputDisplayComponent;
  gamepadObjects: Array<GamepadObject>;
  mvNotTy: MovementNotationType;
  mvNotTypes = MovementNotationType;
  butNotTy: ButtonNotationType = ButtonNotationType.StreetFighter;
  butNotTypes = ButtonNotationType;
  mntKeys = Object.keys(MovementNotationType);
  bntKeys = Object.keys(ButtonNotationType);
  btnDivs: Array<HTMLDivElement>;
  dirDivs: Array<HTMLSpanElement>;

  diagDeadzone = 0.4;
  orthoDeadzone = 0.75;

  useLeftStick = true;
  useRightStick = true;
  useDPad = true;

  constructor() {
  }

  ngOnInit(): void {
    const haveWebkitEvents = 'WebKitGamepadEvent' in window;
    const haveEvents = 'GamepadEvent' in window;
    InputDisplayComponent.inpDispCmp = this;
    pads = new Array<Gamepad>();
    padObjs = new Array<GamepadObject>();
    /**
     * EVENTS
     */
    if (haveEvents) {
      window.addEventListener('gamepadconnected', e => InputDisplayEvents.connecthandler(e, this));
      window.addEventListener('gamepaddisconnected', e =>
        InputDisplayEvents.disconnecthandler(e, this)
      );
    } else if (haveWebkitEvents) {
      window.addEventListener('webkitgamepadconnected', e =>
        InputDisplayEvents.connecthandler(e, this)
      );
      window.addEventListener('webkitgamepaddisconnected', e =>
        InputDisplayEvents.disconnecthandler(e, this)
      );
    } else {
      setInterval(() => this.scangamepads(), 500);
    }
  }

  getControllers() {
    return pads;
  }

  /**
   * The createAxisMeter function gets passed one axis at a time, until there are 2 axes (x and y).
   * It then assigns each axis a default value of 0, min of -1, and max of 1 so that we can tell the direction of the joystick easily.
   */
  createAxisSpanElement(ind): HTMLSpanElement {
    const axisName = axisToAnalogName[ind];
    console.log(axisName);
    const elmt = document.createElement('span');
    elmt.className = 'axis';
    elmt.setAttribute('min', '-1');
    elmt.setAttribute('max', '1');
    elmt.setAttribute('value', '0');
    return elmt;
  }

  /**
   * The addgamepad function is large and does most of the work in this component.
   * First, it sets the current gamepad to the array of controllers.
   * Next, it creates a series of div elements where things such as gamepad info, gamepad buttons, and gamepad arrows will live.
   * After the divs, it creates the arrow icons through a switch statement.
   * After creating the arrows, the gamepad buttons are created through similar means.
   * @param gamepad gamepad to be added
   */
  addHtmlGamepad(gamepad: Gamepad): void {
    pads[gamepad.index] = gamepad;
    padObjs[gamepad.index] = new GamepadObject(gamepad);
    // Hide start message
    document.getElementById('start').style.display = 'none';
    document.getElementById('controllers').appendChild(padObjs[gamepad.index].html.div);
    InputEditorComponent.inpEdComp.edtrView.updateDraw();
    InputDisplayComponent.rAF(cb => this.updateStatus());
  }

  /**
   * Handles the removing of a gamepad element from the controller array
   * @param gamepad
   */
  removegamepad(gamepad): void {
    const d = document.getElementById('controller' + gamepad.index);
    document.body.removeChild(d);
    delete pads[gamepad.index];
  }


  /**
   * The scangamepads function scans for any gamepads that are connected.
   * If a gamepad is detected and is currently not in the controller array, it will be added to the array.
   */
  scangamepads() {
    let gamepads;
    if (navigator.getGamepads) {
      gamepads = navigator.getGamepads();
    }
    for (const pad of gamepads) {
      if (pad) {
        if (!(pad.index in pads)) {
          this.addHtmlGamepad(pad);
        } else {
          pads[pad.index] = pad;
        }
      }
    }
  }

  updateStatus(): void {
    this.scangamepads();
    /**
     * Controller Status Loop
     */
    padObjs.forEach((pO, ind) => {
      /*
      REPLACE WITH UPDATE EVENT SOOOOONN
       */
      pO.pad = pads[pO.pad.index];

      for (const i of pO.btnLayout) {
        const val = pO.pad.buttons[i];
        const pressed = val.value > 0.8;
        pO.html.btnShells[i].updateImgSrc((pressed ? 'pressed_' : '') + nameButton(i));
      }
      /**
       * Get Axis Status */

      const lDirShell = pO.html.dirArrowSets[0];
      const rDirShell = pO.html.dirArrowSets[1];
      const dpDirShell = pO.html.dirArrowSets[2];
      const dpVec = pO.DPadToVector();

      lDirShell.updateTracer([pO.pad.axes[0], pO.pad.axes[1]]);
      lDirShell.div.style.display = this.useLeftStick ? 'inline-block' : 'none';
      rDirShell.updateTracer([pO.pad.axes[2], pO.pad.axes[3]]);
      rDirShell.div.style.display = this.useRightStick ? 'inline-block' : 'none';
      dpDirShell.updateTracer([dpVec[0], dpVec[1]]);
      dpDirShell.div.style.display = this.useDPad ? 'inline-block' : 'none';

      if (this.useDPad && pO.DPad.some(dir => dir.pressed)) {
        const padArr = new Array<boolean>(4);
        pO.DPad.forEach((d, i) => {
          padArr[i] = d.pressed;
        });
        // InputDisplayFunctions.processDigitalDirectionalInput(padArr, divs_arrowDP.children);
      }
      InputDisplayFunctions.processJoystickDirections(pO.pad.axes[0], pO.pad.axes[1], this.orthoDeadzone, this.diagDeadzone, lDirShell);
      InputDisplayFunctions.processJoystickDirections(pO.pad.axes[2], pO.pad.axes[3], this.orthoDeadzone, this.diagDeadzone, rDirShell);
    });

    InputDisplayComponent.rAF(cb => this.updateStatus());
  }


  arrangeButtons(layout: ButtonLayoutOrder) {
  }


}


/**
 * Names the button with the proper designation based on button notation selection
 * @param {*} i - the button id number
 */
export function nameButton(i: number): any {
  switch (InputDisplayComponent.inpDispCmp.butNotTy) {
    case ButtonNotationType.StreetFighter:
      return xbBtns[i] !== undefined ? xbBtns[i] : null;
    case ButtonNotationType.GuiltyGear:
      return ggBtns[i] !== undefined ? ggBtns[i] : i;
    case ButtonNotationType.SoulCalibur:
      return scBtns[i] !== undefined ? scBtns[i] : i;
    case ButtonNotationType.Tekken:
      return tknBtns[i] !== undefined ? tknBtns[i] : i;
    case ButtonNotationType.SNK:
      return snkBtns[i] !== undefined ? snkBtns[i] : i;
  }
  return i;
}


/**
 *
 * @param v1 - x
 * @param v2 - y
 * @return [number, number, number] - [normalizedX, normalizedY, magnitude]
 *
 */


interface HTMLShell {
  div: HTMLDivElement;
}

class ButtonHTMLShell implements HTMLShell {
  div: HTMLDivElement;
  img: HTMLImageElement;
  name: string;

  constructor(name, className, parent) {
    this.div = document.createElement('div');
    this.div.className = className;
    this.div.id = name;
    this.name = name;
    this.img = Img(name);
    this.div.appendChild(this.img);
    parent.appendChild(this.div);
  }

  updateImgSrc(src) {
    this.img.src = `${IMG_SRC + src + IMG_END}`;
  }
}

/**
 * not used much, but still necessary collection of elements for each controller
 */
class GamepadHTMLShell implements HTMLShell {
  div: HTMLDivElement;
  padInfo: HTMLHeadElement;
  dirArrowSets: DirectionalHTMLShell[];
  padAxes: HTMLDivElement[];
  btnShells: ButtonHTMLShell[];
  btns_div: HTMLDivElement;

  constructor(padObj: GamepadObject) {
    this.div = document.createElement('div');
    this.div.className = 'controller';
    this.div.id = 'controller' + padObj.pad.index;

    // Create controller id title
    this.padInfo = document.createElement('div');
    const title: HTMLHeadingElement = document.createElement('h6');
    title.appendChild(document.createTextNode('gamepad: ' + padObj.pad.id));
    this.padInfo.appendChild(title);
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
    this.btns_div = document.createElement('div');
    this.btnShells = new Array<ButtonHTMLShell>();
    this.btns_div.className = 'btns4x2';
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
    this.center_gap = document.createElement('div');
    this.center_gap.id = 'center';
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

/**
 * layer class to traditional gamepad API, handles many of the adaptations and customizations needed for our highly modular design
 */
export class GamepadObject {
  type: GamepadType;
  pad: Gamepad;
  html: GamepadHTMLShell;
  btnLayout: number[];

  constructor(gp) {
    if (gp !== null && gp !== undefined) {
      this.pad = gp;
      this.type = this.getType(gp.id);
      this.btnLayout = this.getArcadeLayoutButtonNumbers();
      this.html = new GamepadHTMLShell(this);
    } else {
    }
  }

  Axes(): readonly number[] {
    return this.pad.axes;
  }

  Btns(): readonly GamepadButton[] {
    return this.pad.buttons;
  }

  get DPad(): readonly GamepadButton[] {
    const bs = new Array<GamepadButton>();
    this.getDPadButtonNumbers().forEach((b, i) => {
      bs[i] = this.pad.buttons[b];
    });
    return bs;
  }

  DPadURLD(): readonly GamepadButton[] {
    const bns = this.getDPadButtonNumbers();
    const bs = [this.pad.buttons[bns[0]], this.pad.buttons[bns[3]], this.pad.buttons[bns[2]], this.pad.buttons[bns[1]]];
    return bs;
  }

  DPadToVector() {
    return [
      (this.DPad[2].pressed ? -1 : 0) +
      (this.DPad[3].pressed ? 1 : 0),
      (this.DPad[0].pressed ? -1 : 0) +
      (this.DPad[1].pressed ? 1 : 0)];
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

  getArcadeLayoutButtonNumbers(): number[] {
    switch (this.type) {
      case GamepadType.XInput:
        return [2, 3, 5, 4, 0, 1, 7, 6];
      default:
        return [0, 1, 2, 3, 4, 5, 6, 7];
    }
  }
}

