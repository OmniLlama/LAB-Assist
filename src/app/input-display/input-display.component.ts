import { Component, OnInit } from "@angular/core";
import {
  MovementNotationType,
  ButtonNotationType,
  GamepadTypeString,
  GamepadType
} from "src/Enums";
import { InputConverterComponent } from '../input-converter/input-converter.component';
import { InputDisplayFunctions } from './input-display-functions';
import { InputDisplayVisuals } from './input-display-visuals';
import { InputDisplayEvents } from './input-display-events';

export let pads: Array<Gamepad>;
export let padObjs: Array<GamepadObject>;

@Component({
  selector: "app-input-display",
  templateUrl: "./input-display.component.html",
  styleUrls: ["./input-display.component.sass"]
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
  haveWebkitEvents = "WebKitGamepadEvent" in window;
  haveEvents = "GamepadEvent" in window;
  diagDeadzone: number = 0.4;
  orthoDeadzone: number = 0.75;

  useDPad: boolean = true;
  constructor() { }

  ngOnInit(): void {
    InputDisplayComponent.inpDispCmp = this;
    pads = new Array<Gamepad>();
    padObjs = new Array<GamepadObject>();
    /**
     * EVENTS
     */
    if (this.haveEvents) {
      window.addEventListener("gamepadconnected", e => InputDisplayEvents.connecthandler(e, this));
      window.addEventListener("gamepaddisconnected", e =>
        InputDisplayEvents.disconnecthandler(e, this)
      );
    } else if (this.haveWebkitEvents) {
      window.addEventListener("webkitgamepadconnected", e =>
        InputDisplayEvents.connecthandler(e, this)
      );
      window.addEventListener("webkitgamepaddisconnected", e =>
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
   * @param ind
   */
  createAxisSpanElement(ind): HTMLSpanElement {
    let axisName = this.nameAxis(ind);
    console.log(axisName);
    let elmt = document.createElement("span");
    elmt.className = "axis";

    //e.id = "a" + i;
    elmt.setAttribute("min", "-1");
    elmt.setAttribute("max", "1");
    elmt.setAttribute("value", "0");
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
    let div_info: HTMLDivElement = document.createElement("div");
    let div_cntrllr: HTMLDivElement = document.createElement("div");
    div_cntrllr.className = "controller";
    div_cntrllr.setAttribute("id", "controller" + gamepad.index);

    //Create controller id title
    let title: HTMLHeadingElement = document.createElement("h6");
    title.appendChild(document.createTextNode("gamepad: " + gamepad.id));
    div_info.appendChild(title);
    div_cntrllr.appendChild(div_info);


    // div_cntrllr.appendChild(InputDisplayVisuals.CreateDirectionalArrows(this, 0));
    let arwSets = new Array<HTMLDivElement>();
    for (let i = 0; i < gamepad.axes.length / 2; i++) {

      arwSets[i] = InputDisplayVisuals.CreateDirectionalArrows(this, i);
      div_cntrllr.appendChild(arwSets[i]);
    }
    //Create Button Icons
    let div_btns: HTMLDivElement = document.createElement("div");
    div_btns.className = "grid4x2";
    let btnOrder: number[] = padObjs[
      gamepad.index
    ].getArcadeLayoutButtonNumbers();
    for (let btnNum of btnOrder) {
      let div = this.createButtonIcon(btnNum);
      div_btns.appendChild(div);
      this.btnDivs.push(div);
    }
    //Append Buttons to div
    div_cntrllr.appendChild(div_btns);

    this.axisDivs = new Array<HTMLSpanElement>();
    // Create Axis Meters
    let div_axes: HTMLDivElement = document.createElement("div");
    div_axes.className = "axes";
    for (let i = 0; i < gamepad.axes.length / 4; i++) {
      let sp = this.createAxisSpanElement(i);
      div_axes.appendChild(sp);
      this.axisDivs.push(sp);
    }
    //Append Meters to div
    div_cntrllr.appendChild(div_axes);

    padObjs[gamepad.index].html = new GamepadHTMLShell(
      div_cntrllr,
      title,
      this.axisDivs,
      this.btnDivs,
      arwSets
    );
    //Hide start message
    document.getElementById("start").style.display = "none";
    document.getElementById("controllers").appendChild(div_cntrllr);
    // document.body.appendChild(div);
    InputDisplayComponent.rAF(cb => this.updateStatus());
  }
  /**
   * Handles the removing of a gamepad element from the controller array
   * @param gamepad
   */
  removegamepad(gamepad): void {
    let d = document.getElementById("controller" + gamepad.index);
    document.body.removeChild(d);
    delete pads[gamepad.index];
  }


  /**
   * The scangamepads function scans for any gamepads that are connected.
   * If a gamepad is detected and is currently not in the controller array, it will be added to the array.
   */
  scangamepads() {
    let gamepads;
    if (navigator.getGamepads) { gamepads = navigator.getGamepads(); }
    for (var i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        if (!(gamepads[i].index in pads)) {
          this.addHtmlGamepad(gamepads[i]);
        } else { pads[gamepads[i].index] = gamepads[i]; }
      }
    }
  }
  updateStatus(): void {
    this.scangamepads();
    /**
     * Controller Status Loop */
    padObjs.forEach((padObj, ind) => {
      padObj.pad = pads[padObj.pad.index];
      var pad = navigator.getGamepads()[padObj.pad.index];
      var d = padObj.html.parent;
      /**
       * Button Status Loop */
      for (let i of padObjs[ind].getArcadeLayoutButtonNumbers()) {
        let b = this.btnDivs[i];
        if (b == undefined) {
          break;
        }
        let val = pad.buttons[i];
        let pressed = val.value > 0.8;
        if (typeof val == "object") {
          pressed = val.pressed;
        }
        // var pct = Math.round(val.value * 100) + "%";
        // b.style.backgroundSize = pct + " " + pct;
        let buttonString = nameButton(i);
        let imageString = `<img src="assets/images/${pressed ? 'pressed_' : ''}${buttonString}.png">`;
        b.innerHTML = imageString;
      }
      /**
       * Get Axis Status */

      // var divs_arrows = d.getElementsByClassName("directionalArrows");
      var divs_arrowL = padObj.html.dirArrowSets[0];
      var divs_arrowR = padObj.html.dirArrowSets[1];

      let normAxesL = normalizeVector(pad.axes[0], pad.axes[1]);
      let normAxesR = normalizeVector(pad.axes[2], pad.axes[3]);

      // this.div_leftStick.style.left = Math.round(24 * pad.axes[0]) + "px";
      // this.div_leftStick.style.top = Math.round(24 * pad.axes[1]) + "px";
      // this.div_rightStick.style.left = Math.round(24 * pad.axes[2]) + "px";
      // this.div_rightStick.style.top = Math.round(24 * pad.axes[3]) + "px";
      if (this.useDPad && padObj.DPad().some(dir => dir.pressed)) {
        let padArr = new Array<boolean>(4);
        padObj.DPad().forEach((d, i) => {
          padArr[i] = d.pressed;
        });
        processDirectionalInput(padArr, divs_arrowL);
      }
      if (normAxesL[0] > this.orthoDeadzone) {
        InputDisplayFunctions.processJoystickDirections(normAxesL[0], normAxesL[1], divs_arrowL.children);
      }
      else InputDisplayVisuals.resetArrows(divs_arrowL);
      if (normAxesR[0] > this.orthoDeadzone) {
        InputDisplayFunctions.processJoystickDirections(normAxesR[0], normAxesR[1], divs_arrowR.children);
      }
      else InputDisplayVisuals.resetArrows(divs_arrowL);
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
    let button = nameButton(ind);
    var e = document.createElement("div");
    e.className = "gamepad-buttons";
    if (button != null) {
      // let imageString = `<img src="assets/images/${button}.png" ${btnIconWidth} ${btnIconHeight}>`;
      let imageString = `<img src="assets/images/${button}.png">`;
      e.innerHTML = imageString;
    }
    return e;
  }

  /**
   * Names the axis based on the axis id number
   * @param {*} i - the axis id number
   */
  nameAxis(i): string {
    switch (i) {
      case 0: return "LS X";
      case 1: return "LS Y";
      case 2: return "RS X";
      case 3: return "RS Y";
      default: return null;
    }
  }
}

function processDirectionalInput(dirArr: boolean[], arwArr) {
  let idc = InputDisplayComponent.inpDispCmp;
  let preString = '<img src="assets/images/';
  let postString = `.png">`;

  // First handle diagonal directions, and override them with Left/Right/Up/Down if needed
  if (dirArr[2] && dirArr[0]) {
    arwArr[0].innerHTML = `${preString}pressed_up_left${postString}`;
    InputDisplayVisuals.resetArrows(arwArr, 0);
  } else if (dirArr[2] && dirArr[1]) {
    arwArr[5].innerHTML = `${preString}pressed_down_left${postString}`;
    InputDisplayVisuals.resetArrows(arwArr, 5);
  } else if (dirArr[3] && dirArr[0]) {
    arwArr[2].innerHTML = `${preString}pressed_up_right${postString}`;
    InputDisplayVisuals.resetArrows(arwArr, 2);
  } else if (dirArr[3] && dirArr[1]) {
    arwArr[7].innerHTML = `${preString}pressed_down_right${postString}`;
    InputDisplayVisuals.resetArrows(arwArr, 7);
  }

  // Now handle all the regular directions, if the constraints for diagonal directions are not met
  else if (dirArr[2]) {
    arwArr[3].innerHTML = `${preString}pressed_left${postString}`;
    InputDisplayVisuals.resetArrows(arwArr, 3);
  } else if (dirArr[0]) {
    arwArr[1].innerHTML = `${preString}pressed_up${postString}`;
    InputDisplayVisuals.resetArrows(arwArr, 1);
  } else if (dirArr[3]) {
    arwArr[4].innerHTML = `${preString}pressed_right${postString}`;
    InputDisplayVisuals.resetArrows(arwArr, 4);
  } else if (dirArr[1]) {
    arwArr[6].innerHTML = `${preString}pressed_down${postString}`;
    InputDisplayVisuals.resetArrows(arwArr, 6);
  }
  else
    InputDisplayVisuals.resetArrows(arwArr);
}





export var xbBtns = ["a", "b", "x", "y", "lb", "rb", "lt", "rt"];
export var psBtns = ["X", "O", "[]", "^", "l1", "r1", "l2", "r2"];
export var sfBtns = ["lk", "mk", "lp", "mp", "l1", "hp", "l2", "hk"];
export var ggBtns = ["P", "D", "K", "S", "HS", "l1", "l2", "SP"];
export var tknBtns = ["LK", "RK", "LP", "RP"];
export var scBtns = ["G", "K", "A", "B"];
export var snkBtns = ["B", "D", "A", "C"];



/**
 * Names the button with the proper designation based on button notation selection
 * @param {*} i - the button id number */
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
  let v = vectorMagnitude(v1, v2);
  return [v1 / v, v2 / v, v];
}
/**
 * not used much, but still necessary collection of elements for each controller */
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
 * layer class to traditional gamepad API, handles many of the adaptations and customizations needed for our highly modular design */
export class GamepadObject {
  type: GamepadType;
  pad: Gamepad;
  Axes(): readonly number[] {
    return this.pad.axes;
  }
  Btns(): readonly GamepadButton[] {
    return this.pad.buttons;
  }
  html: GamepadHTMLShell;
  constructor(gp) {
    if (gp !== null && gp !== undefined) {
      this.pad = gp;
      this.type = this.getType(gp.id);
    } else {
    }
  }
  DPad(): readonly GamepadButton[] {
    let bs = new Array<GamepadButton>();
    this.getDPadButtonNumbers().forEach((b, i) => {
      bs[i] = this.pad.buttons[b];
    });
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

