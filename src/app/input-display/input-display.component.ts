import {Component, OnInit} from '@angular/core';
import {
  MovementNotationType,
  ButtonNotationType,
  GamepadTypeString,
  GamepadType
} from 'src/Enums';
import {InputConverterComponent} from '../input-converter/input-converter.component';
import {InputDisplayFunctions} from './input-display-functions';
import {InputDisplayVisuals} from './input-display-visuals';
import {InputDisplayEvents} from './input-display-events';

export let pads: Array<Gamepad>;
export let padObjs: Array<GamepadObject>;

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
  axisDivs: Array<HTMLSpanElement>;
  div_leftStick: HTMLDivElement;
  div_rightStick: HTMLDivElement;
  haveWebkitEvents = 'WebKitGamepadEvent' in  window;
  haveEvents = 'GamepadEvent'  in  window;
  diagDeadzone = 0.4;
  orthoDeadzone = 0.75;

  useDPad = true;

  constructor() {
  }

  ngOnInit(): void {
    InputDisplayComponent.inpDispCmp = this;
    pads = new Array<Gamepad>();
    padObjs = new Array<GamepadObject>();
    /**
     * EVENTS
     */
    if (this.haveEvents) {
      window.addEventListener('gamepadconnected', e => InputDisplayEvents.connecthandler(e, this));
      window.addEventListener('gamepaddisconnected', e =>
        InputDisplayEvents.disconnecthandler(e, this)
      );
    } else if (this.haveWebkitEvents) {
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
    const axisName = this.nameAxis(ind);
    console.log(axisName);
    const elmt = document.createElement('span');
    elmt.className = 'axis';

    // e.id = "a" + i;
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
    this.btnDivs = new Array<HTMLDivElement>();
    const div_info: HTMLDivElement = document.createElement('div');
    const div_cntrllr: HTMLDivElement = document.createElement('div');
    div_cntrllr.className = 'controller';
    div_cntrllr.setAttribute('id', 'controller' + gamepad.index);

    // Create controller id title
    const title: HTMLHeadingElement = document.createElement('h6');
    title.appendChild(document.createTextNode('gamepad: ' + gamepad.id));
    div_info.appendChild(title);
    div_cntrllr.appendChild(div_info);


    const arwSets = new Array<HTMLDivElement>();
    for (let i = 0; i < gamepad.axes.length / 2; i++) {

      arwSets[i] = InputDisplayVisuals.CreateDirectionalArrows(this, i);
      div_cntrllr.appendChild(arwSets[i]);
    }
    // Create Button Icons
    const div_btns: HTMLDivElement = document.createElement('div');
    div_btns.className = 'grid4x2';
    const btnOrder: number[] = padObjs[
      gamepad.index
      ].getArcadeLayoutButtonNumbers();
    for (const btnNum of btnOrder) {
      const div = this.createButtonIcon(btnNum);
      div_btns.appendChild(div);
      this.btnDivs.push(div);
    }
    // Append Buttons to div
    div_cntrllr.appendChild(div_btns);

    this.axisDivs = new Array<HTMLSpanElement>();
    // Create Axis Meters
    const div_axes: HTMLDivElement = document.createElement('div');
    div_axes.className = 'axes';
    for (let i = 0; i < gamepad.axes.length / 4; i++) {
      const sp = this.createAxisSpanElement(i);
      div_axes.appendChild(sp);
      this.axisDivs.push(sp);
    }
    // Append Meters to div
    div_cntrllr.appendChild(div_axes);

    padObjs[gamepad.index].html = new GamepadHTMLShell(
      div_cntrllr,
      title,
      this.axisDivs,
      this.btnDivs,
      arwSets
    );
    // Hide start message
    document.getElementById('start').style.display = 'none';
    document.getElementById('controllers').appendChild(div_cntrllr);
    // document.body.appendChild(div);
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
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        if (!(gamepads[i].index in pads)) {
          this.addHtmlGamepad(gamepads[i]);
        } else {
          pads[gamepads[i].index] = gamepads[i];
        }
      }
    }
  }

  updateStatus(): void {
    this.scangamepads();
    /**
     * Controller Status Loop
     */
    padObjs.forEach((padObj, ind) => {
      padObj.pad = pads[padObj.pad.index];
      const pad = navigator.getGamepads()[padObj.pad.index];
      const d = padObj.html.parent;
      const prestring = 'assets/images/';
      const poststring = '.png';
      /**
       * Button Status Loop
       */
      for (const i of padObjs[ind].getArcadeLayoutButtonNumbers()) {
        const b = this.btnDivs[i];
        if (b === undefined) {
          break;
        }
        const val = pad.buttons[i];
        let pressed = val.value > 0.8;
        if (typeof val === 'object') {
          pressed = val.pressed;
        }
        // var pct = Math.round(val.value * 100) + "%";
        // b.style.backgroundSize = pct + " " + pct;
        const buttonString = nameButton(i);
        const imageString = `${prestring + (pressed ? 'pressed_' : '') + buttonString + poststring}`;
        (b.firstChild as HTMLImageElement).src = imageString;
      }
      /**
       * Get Axis Status */

      const divs_arrowL = padObj.html.dirArrowSets[0];
      const divs_arrowR = padObj.html.dirArrowSets[1];
      const divs_arrowDP = padObj.html.dirArrowSets[2];

      const normAxesL = normalizeVector(pad.axes[0], pad.axes[1]);
      const normAxesR = normalizeVector(pad.axes[2], pad.axes[3]);

      // this.div_leftStick.style.left = Math.round(24 * pad.axes[0]) + "px";
      // this.div_leftStick.style.top = Math.round(24 * pad.axes[1]) + "px";
      // this.div_rightStick.style.left = Math.round(24 * pad.axes[2]) + "px";
      // this.div_rightStick.style.top = Math.round(24 * pad.axes[3]) + "px";
      if (this.useDPad && padObj.DPad().some(dir => dir.pressed)) {
        const padArr = new Array<boolean>(4);
        padObj.DPad().forEach((d, i) => {
          padArr[i] = d.pressed;
        });
        // InputDisplayFunctions.processDigitalDirectionalInput(padArr, divs_arrowDP.children);
      }
      InputDisplayFunctions.processJoystickDirections(pad.axes[0], pad.axes[1], this.orthoDeadzone, this.diagDeadzone, divs_arrowL.children);
      InputDisplayFunctions.processJoystickDirections(pad.axes[2], pad.axes[3], this.orthoDeadzone, this.diagDeadzone, divs_arrowR.children);
    });

    InputDisplayComponent.rAF(cb => this.updateStatus());
  }

  /**
   * The createButtonIcon creates the gamepad button icons.
   * Button inputs have unique indexes based on specific controllers, and we specified the inputs below.
   * If (0) is passed into this function, an image will come up for the Xbox A button.
   * This function sets the default images by DOM manipulation, which get changed by the scangamepads function above.
   * @param ind
   */
  createButtonIcon(ind: number): HTMLDivElement {
    const button = nameButton(ind);
    const e = document.createElement('div');
    e.className = 'gamepad-buttons';
    if (button != null) {
      // let imageString = `<img src="assets/images/${button}.png" ${btnIconWidth} ${btnIconHeight}>`;
      const imageString = `<img src="assets/images/${button}.png">`;
      e.innerHTML = imageString;
    }
    return e;
  }

  /**
   * Names the axis based on the axis id number
   * @param i - the axis id number
   */
  nameAxis(i: number): string {
    switch (i) {
      case 0:
        return 'LS X';
      case 1:
        return 'LS Y';
      case 2:
        return 'RS X';
      case 3:
        return 'RS Y';
      default:
        return null;
    }
  }
}


export let xbBtns = ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt'];
export let psBtns = ['X', 'O', '[]', '^', 'l1', 'r1', 'l2', 'r2'];
export let sfBtns = ['lk', 'mk', 'lp', 'mp', 'l1', 'hp', 'l2', 'hk'];
export let ggBtns = ['P', 'D', 'K', 'S', 'HS', 'l1', 'l2', 'SP'];
export let tknBtns = ['LK', 'RK', 'LP', 'RP'];
export let scBtns = ['G', 'K', 'A', 'B'];
export let snkBtns = ['B', 'D', 'A', 'C'];


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

export function vectorMagnitude(v1, v2): number {
  return Math.sqrt(v1 ** 2 + v2 ** 2);
}

export function normalizeVector(v1, v2): Array<number> {
  const v = vectorMagnitude(v1, v2);
  return [v1 / v, v2 / v, v];
}

/**
 * not used much, but still necessary collection of elements for each controller
 */
class GamepadHTMLShell {
  parent: HTMLElement;
  padTitle: HTMLHeadElement;
  dirArrowSets: HTMLDivElement[];
  padAxes: HTMLDivElement[];
  padButtons: HTMLDivElement[];

  constructor(rent, title, axes, buttons, arwSets) {
    this.parent = rent;
    this.padTitle = title;
    this.padAxes = axes;
    this.padButtons = buttons;
    this.dirArrowSets = arwSets;
  }
}

/**
 * layer class to traditional gamepad API, handles many of the adaptations and customizations needed for our highly modular design
 */
export class GamepadObject {
  constructor(gp) {
    if (gp !== null && gp !== undefined) {
      this.pad = gp;
      this.type = this.getType(gp.id);
    } else {
    }
  }

  type: GamepadType;
  pad: Gamepad;
  html: GamepadHTMLShell;

  Axes(): readonly number[] {
    return this.pad.axes;
  }

  Btns(): readonly GamepadButton[] {
    return this.pad.buttons;
  }

  DPad(): readonly GamepadButton[] {
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
   * returns the order that the main buttons should be presented, depending upon the manufacturer and standard
   */
  getArcadeLayoutButtonNumbers(): number[] {
    switch (this.type) {
      case GamepadType.XInput:
        // return [2, 3, 5, 4, 0, 1, 7, 6];
        return [0, 1, 2, 3, 4, 5, 6, 7];
      default:
        return [0, 1, 2, 3, 4, 5, 6, 7];
      // return [0, 0, 0, 0, 0, 0, 0, 0];
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
}

