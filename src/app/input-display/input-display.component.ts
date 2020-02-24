import { Component, OnInit } from '@angular/core';
import {
  MovementNotationType,
  ButtonNotationType,
  GamepadTypeString,
  GamepadType
} from 'src/Enums';

export let pads: Array<Gamepad>;
export let gamepadObjects: Array<GamepadObject>;
const dirIconWidth = 'width=60px';
const dirIconHeight = 'height=60px';
const btnIconWidth = 'width=72px';
const btnIconHeight = 'height=72px';
@Component({
  selector: 'app-input-display',
  templateUrl: './input-display.component.html',
  styleUrls: ['./input-display.component.sass']
})
export class InputDisplayComponent implements OnInit {
  static rAF = window.requestAnimationFrame;
  static inpDispCmp: InputDisplayComponent;
  // controllers: Array<Gamepad>;
  gamepadObjects: Array<GamepadObject>;
  mvNotTy: MovementNotationType;
  mvNotTypes = MovementNotationType;
  butNotTy: ButtonNotationType = ButtonNotationType.StreetFighter;
  butNotTypes = ButtonNotationType;
  mntKeys = Object.keys(MovementNotationType);
  bntKeys = Object.keys(ButtonNotationType);
  btnDivs: Array<HTMLDivElement>;
  div_leftStick: HTMLDivElement;
  haveWebkitEvents = 'WebKitGamepadEvent' in window;
  haveEvents = 'GamepadEvent' in window;
  diagDeadzone = 0.4;
  orthoDeadzone = 0.75;

  padHTMLShells = [];
  constructor() { }

  ngOnInit(): void {
    InputDisplayComponent.inpDispCmp = this;
    pads = new Array<Gamepad>();
    gamepadObjects = new Array<GamepadObject>();
    /**
     * EVENTS
     */
    if (this.haveEvents) {
      window.addEventListener('gamepadconnected', e => this.connecthandler(e));
      window.addEventListener('gamepaddisconnected', e =>
        this.disconnecthandler(e)
      );
    } else if (this.haveWebkitEvents) {
      window.addEventListener('webkitgamepadconnected', e =>
        this.connecthandler(e)
      );
      window.addEventListener('webkitgamepaddisconnected', e =>
        this.disconnecthandler(e)
      );
    } else {
      setInterval(() => this.scangamepads(), 500);
    }
  }
  getControllers() {
    return pads;
  }
  /**
   * Names the axis based on the axis id number
   * @param {*} i - the axis id number
   */
  nameAxis(i): string {
    switch (i) {
      case 0:
        return 'LS X';
      case 1:
        return 'LS Y';
      case 2:
        return 'RS X';
      case 3:
        return 'RS Y';
      // case 4: return "LT";
      // case 5: return "RT";
      default:
        return null;
    }
  }
  /**
   * The createAxisMeter function gets passed one axis at a time, until there are 2 axes (x and y).
   * It then assigns each axis a default value of 0, min of -1, and max of 1 so that we can tell the direction of the joystick easily.
   * @param ind
   */
  createAxisSpanElement(ind): HTMLSpanElement {
    let axisName = this.nameAxis(ind);
    console.log(axisName);
    let elmt = document.createElement('span');
    elmt.className = 'axis';

    //e.id = "a" + i;
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
    gamepadObjects[gamepad.index] = new GamepadObject(gamepad);
    this.btnDivs = new Array<HTMLDivElement>();
    let div_info = document.createElement('div');
    let div_cntrllr = document.createElement('div');
    div_cntrllr.className = 'controller';
    div_cntrllr.setAttribute('id', 'controller' + gamepad.index);

    //Create controller id title
    let title = document.createElement('h6');
    title.appendChild(document.createTextNode('gamepad: ' + gamepad.id));
    div_info.appendChild(title);
    div_cntrllr.appendChild(div_info);
    let div_arrows: HTMLDivElement = document.createElement('div');
    div_arrows.className = 'grid3x3';
    for (let i = 0; i < 9; i++) {
      let arrow = document.createElement('div');
      switch (i) {
        case 1:
        case 3:
        case 5:
        case 7:
          arrow.className = 'directionalArrows';
          arrow.id = 'ortho';
          arrow.innerHTML = `<img src="assets/images/${this.arrayIndexToDirection(i)}.png"
          ${dirIconWidth} ${dirIconHeight}>`;
          break;
        case 0:
        case 2:
        case 6:
        case 8:
          arrow.className = 'directionalArrows';
          arrow.id = 'diag';
          arrow.innerHTML = `<img src="assets/images/${this.arrayIndexToDirection(i)}.png"
          ${dirIconWidth} ${dirIconHeight}>`;
          break;
        case 4:
          arrow.className = 'stickSpace';
          this.div_leftStick = document.createElement('div');
          this.div_leftStick.id = 'stick';
          this.div_leftStick.innerHTML = `<img src="assets/images/ls.png" ${dirIconWidth} ${dirIconHeight}>`;
          arrow.appendChild(this.div_leftStick);
          break;
      }
      div_arrows.appendChild(arrow);
    }

    div_cntrllr.appendChild(div_arrows);

    //Create Button Icons
    let div_btns: HTMLDivElement = document.createElement('div');
    div_btns.className = 'grid4x2';
    let btnOrder = gamepadObjects[gamepad.index].getArcadeLayoutButtonNumbers();
    for (let btnNum of btnOrder) {
      let div = this.createButtonIcon(btnNum);
      div_btns.appendChild(div);
      this.btnDivs.push(div);
    }
    //Append Buttons to div
    div_cntrllr.appendChild(div_btns);

    // Create Axis Meters
    let div_axes = document.createElement('div');
    div_axes.className = 'axes';
    for (let i = 0; i < gamepad.axes.length / 4; i++) {
      div_axes.appendChild(this.createAxisSpanElement(i));
    }
    //Append Meters to div
    div_cntrllr.appendChild(div_axes);

    this.padHTMLShells.push(new GamepadHTMLShell(title, div_axes, div_btns));
    //Hide start message
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
    let d = document.getElementById('controller' + gamepad.index);
    document.body.removeChild(d);
    delete pads[gamepad.index];
  }
  /**
   * Handles the connecting event of a gamepad
   * @param e event
   */
  connecthandler(e): void { this.addHtmlGamepad(e.gamepad); }

  /**
   * Handles the disconnecting event of a gamepad
   * @param e event
   */
  disconnecthandler(e): void { this.removegamepad(e.gamepad); }

  /**
   * The scangamepads function scans for any gamepads that are connected.
   * If a gamepad is detected and is currently not in the controller array, it will be added to the array.
   */
  scangamepads() {
    let gamepads;
    if (navigator.getGamepads) {
      gamepads = navigator.getGamepads();
    }
    for (var i = 0; i < gamepads.length; i++) {
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
    pads.forEach((j, ind) => {
      var pad = j;
      var d = document.getElementById('controller' + j.index);
      /**
       * Button Status Loop */
      for (let i of gamepadObjects[ind].getArcadeLayoutButtonNumbers()) {
        let b = this.btnDivs[i];
        if (b == undefined) {
          break;
        }
        let val = pad.buttons[i];
        let pressed = val.value > 0.8;
        if (typeof val == 'object') {
          pressed = val.pressed;
        }
        var pct = Math.round(val.value * 100) + '%';
        b.style.backgroundSize = pct + ' ' + pct;
        let imageString = 'a';
        let buttonString = 'a';
        if (pressed) {
          // If pressed, switches to the pressed version of the button's image
          buttonString = nameButton(i);
          imageString = `<img src="assets/images/pressed_${buttonString}.png">`;
          b.innerHTML = imageString;
        } else {
          // If released/not pressed, switches to the regular version of the button's image
          buttonString = nameButton(i);
          imageString = `<img src="assets/images/${buttonString}.png">`;
          b.innerHTML = imageString;
        }
      }
      /**
       * Get Axis Status */
      var axes = d.getElementsByClassName('axis');
      var arrowsArray = d.getElementsByClassName('directionalArrows');

      let normAxes = normalizeVector(pad.axes[0], pad.axes[1]);

      this.div_leftStick.style.left = Math.round(24 * pad.axes[0]) + 'px';
      this.div_leftStick.style.top = Math.round(24 * pad.axes[1]) + 'px';
      if (normAxes[2] > this.orthoDeadzone) {
        getJoystickDirections(normAxes[0], normAxes[1], arrowsArray);
      }
      else resetArrows(arrowsArray);
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
    var e = document.createElement('div');
    e.className = 'gamepad-buttons';
    if (button != null) {
      // let imageString = `<img src="assets/images/${button}.png" ${btnIconWidth} ${btnIconHeight}>`;
      let imageString = `<img src="assets/images/${button}.png">`;
      e.innerHTML = imageString;
    }
    return e;
  }
  arrayIndexToDirection(i) {
    switch (i) {
      case 0: return `up_left`;
      case 1: return `up`;
      case 2: return `up_right`;
      case 3: return `left`;
      case 4: return `ls`;
      case 5: return `right`;
      case 6: return `down_left`;
      case 7: return `down`;
      case 8: return `down_right`;
    }
  }
}

/**
 * The getJoystickDirections function looks at the axes of the controller.
 * Based on current axes information [0, 0, 0, 0].
 * You can tell what direction the joystick is going.
 * Based on the direction of the joystick, the correct image for that direction is chosen.
 * If the joystick is currently not going in any direction, all the icons will be reset to their regular image.
 * @param pad
 * @param horiAxis
 * @param arrowsArray
 */
function getJoystickDirections(horiAxis, vertAxis, arrowsArray) {
  let idc = InputDisplayComponent.inpDispCmp;
  let preString = '<img src="assets/images/';
  let postString = `.png" ${dirIconWidth} ${dirIconHeight}>`;
  // let stick = idc.div_leftStick;

  // First handle diagonal directions, and override them with Left/Right/Up/Down if needed
  if (horiAxis < -idc.diagDeadzone && vertAxis < -idc.diagDeadzone) {
    arrowsArray[0].innerHTML = `${preString}pressed_up_left${postString}`;
    let index = 0;
    resetArrows(arrowsArray, index);
  } else if (horiAxis < -idc.diagDeadzone && vertAxis > idc.diagDeadzone) {
    arrowsArray[5].innerHTML = `${preString}pressed_down_left${postString}`;
    let index = 5;
    resetArrows(arrowsArray, index);
  } else if (horiAxis > idc.diagDeadzone && vertAxis < -idc.diagDeadzone) {
    arrowsArray[2].innerHTML = `${preString}pressed_up_right${postString}`;
    let index = 2;
    resetArrows(arrowsArray, index);
  } else if (horiAxis > idc.diagDeadzone && vertAxis > idc.diagDeadzone) {
    arrowsArray[7].innerHTML = `${preString}pressed_down_right${postString}`;
    let index = 7;
    resetArrows(arrowsArray, index);
  }

  // Now handle all the regular directions, if the constraints for diagonal directions are not met
  else if (
    horiAxis < -idc.orthoDeadzone &&
    vertAxis < Math.abs(idc.diagDeadzone)
  ) {
    arrowsArray[3].innerHTML = `${preString}pressed_left${postString}`;
    let index = 3;
    resetArrows(arrowsArray, index);
  } else if (
    vertAxis < -idc.orthoDeadzone &&
    horiAxis < Math.abs(idc.diagDeadzone)
  ) {
    arrowsArray[1].innerHTML = `${preString}pressed_up${postString}`;
    let index = 1;
    resetArrows(arrowsArray, index);
  } else if (
    horiAxis > idc.orthoDeadzone &&
    vertAxis < Math.abs(idc.diagDeadzone)
  ) {
    arrowsArray[4].innerHTML = `${preString}pressed_right${postString}`;
    let index = 4;
    resetArrows(arrowsArray, index);
  } else if (
    vertAxis > idc.orthoDeadzone &&
    horiAxis < Math.abs(idc.diagDeadzone)
  ) {
    arrowsArray[6].innerHTML = `${preString}pressed_down${postString}`;
    let index = 6;
    resetArrows(arrowsArray, index);
  } else {
    for (let i = 0; i < 9; i++) {
      let arrow = document.createElement('div');
      arrow.className = 'directionalArrows';
      arrowsArray[i].innerHTML = `${preString}${idc.arrayIndexToDirection(
        i
      )}${postString}`;
    }
  }

  // Same as above, but now for the Right Stick
  // if ( controller.axes[2] < -this.diagDeadzone && controller.axes[3] < -this.diagDeadzone ) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_up_left.png" ${dirIconWidth} ${dirIconHeight}>`
  // } else if ( controller.axes[2] < -this.diagDeadzone && controller.axes[3] > this.diagDeadzone ) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_down_left.png" ${dirIconWidth} ${dirIconHeight}>`
  // } else if ( controller.axes[2] > this.diagDeadzone && controller.axes[3] < -this.diagDeadzone ) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_up_right.png" ${dirIconWidth} ${dirIconHeight}>`
  // } else if ( controller.axes[2] > this.diagDeadzone && controller.axes[3] > this.diagDeadzone ) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_down_right.png" ${dirIconWidth} ${dirIconHeight}>`
  // }

  //   else if ( controller.axes[2] < -0.75 && ( controller.axes[3] < this.diagDeadzone && controller.axes[3] > -.4 )) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_left.png" ${dirIconWidth} ${dirIconHeight}>`
  // } else if (controller.axes[3] < -0.75 && ( controller.axes[2] < this.diagDeadzone && controller.axes[2] > -.4 ))  {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_up.png" ${dirIconWidth} ${dirIconHeight}>`
  // }  else if (controller.axes[2] > 0.75 && ( controller.axes[3] < this.diagDeadzone && controller.axes[3] > -.4 ))  {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_right.png" ${dirIconWidth} ${dirIconHeight}>`
  // } else if (controller.axes[3] > 0.75 && ( controller.axes[2] < this.diagDeadzone && controller.axes[2] > -.4 ))  {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_down.png" ${dirIconWidth} ${dirIconHeight}>`
  // } else {
  //   rightAxis.innerHTML = `<img src="assets/images/rs.png" ${dirIconWidth} ${dirIconHeight}>`
  // }
  // function getDirectionsFromAxes(ns: number, we: number) {
  //   if (ns < -idc.diagDeadzone && we < -idc.diagDeadzone) {
  //     arrowsArray[0].innerHTML = `<img src="assets/images/pressed_up_left.png" width=64px height=64px>`;
  //     let index = 0;
  //     resetArrows(arrowsArray, index);
  //   } else if (ns < -idc.diagDeadzone && we > idc.diagDeadzone) {
  //     arrowsArray[6].innerHTML = `<img src="assets/images/pressed_down_left.png" width=64px height=64px>`;
  //     let index = 6;
  //     resetArrows(arrowsArray, index);
  //   } else if (ns > idc.diagDeadzone && we < -idc.diagDeadzone) {
  //     arrowsArray[2].innerHTML = `<img src="assets/images/pressed_up_right.png" width=64px height=64px>`;
  //     let index = 2;
  //     resetArrows(arrowsArray, index);
  //   } else if (ns > idc.diagDeadzone && we > idc.diagDeadzone) {
  //     arrowsArray[8].innerHTML = `<img src="assets/images/pressed_down_right.png" width=64px height=64px>`;
  //     let index = 8;
  //     resetArrows(arrowsArray, index);
  //   }

  //   // Now handle all the regular directions, if the constraints for diagonal directions are not met
  //   else if (ns < -0.75 && (we < Math.abs(idc.diagDeadzone))) {
  //     arrowsArray[3].innerHTML = `<img src="assets/images/pressed_left.png" width=64px height=64px>`;
  //     let index = 3;
  //     resetArrows(arrowsArray, index);
  //   } else if (we < -0.75 && (ns < Math.abs(idc.diagDeadzone))) {
  //     arrowsArray[1].innerHTML = `<img src="assets/images/pressed_up.png" width=64px height=64px>`;
  //     let index = 1;
  //     resetArrows(arrowsArray, index);
  //   } else if (ns > 0.75 && (we < Math.abs(idc.diagDeadzone))) {
  //     arrowsArray[5].innerHTML = `<img src="assets/images/pressed_right.png" width=64px height=64px>`;
  //     let index = 5;
  //     resetArrows(arrowsArray, index);
  //   } else if (pad.axes[1] > 0.75 && (ns < Math.abs(idc.diagDeadzone))) {
  //     arrowsArray[7].innerHTML = `<img src="assets/images/pressed_down.png" width=64px height=64px>`;
  //     let index = 7;
  //     resetArrows(arrowsArray, index);
  //   }
  // }
}

/**
 * The getJoystickDirections function looks at the axes of the controller.
 * Based on current axes information [0, 0, 0, 0].
 * You can tell what direction the joystick is going.
 * Based on the direction of the joystick, the correct image for that direction is chosen.
 *  If the joystick is currently not going in any direction, all the icons will be reset to their regular image.
 * @param arrowsArray
 * @param index  */
function resetArrows(arrowsArray, index = -1) {
  for (let i = 0; i < arrowsArray.length; i++) {
    if (i != index) {
      arrowsArray[i].innerHTML = returnXboxArrowImgElmt(i);
    }
  }
}

export var xbBtns = ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt'];
export var psBtns = ['X', 'O', '[]', '^', 'l1', 'r1', 'l2', 'r2'];
export var sfBtns = ['lk', 'mk', 'lp', 'mp', 'l1', 'hp', 'l2', 'hk'];
export var ggBtns = ['P', 'D', 'K', 'S', 'HS', 'l1', 'l2', 'SP'];
export var tknBtns = ['LK', 'RK', 'LP', 'RP'];
export var scBtns = ['G', 'K', 'A', 'B'];
export var snkBtns = ['B', 'D', 'A', 'C'];

/**
 * The returnXboxArrows function gets passed a button index.
 * If the index is found in the list, the image tag string for that joystick direction will get returned.
 * This function is used to make all the other arrows look "non-pressed" when the user changes the joystick direction.
 * @param i */
function returnXboxArrowImgElmt(i: number): string {
  let s: string;
  switch (i) {
    case 0: s = `up_left`; break;
    case 1: s = `up`; break;
    case 2: s = `up_right`; break;
    case 3: s = `left`; break;
    // case 4: s = `ls`; break;
    case 4: s = `right`; break;
    case 5: s = `down_left`; break;
    case 6: s = `down`; break;
    case 7: s = `down_right`; break;
    default: s = `up`; break;
  }
  return `<img src="assets/images/${s}.png" ${dirIconWidth} ${dirIconHeight}>`;
}

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

/**
 * not used much, but still necessary collection of elements for each controller */
class GamepadHTMLShell {
  padTitle: HTMLHeadElement;
  padAxes: HTMLDivElement[];
  padButtons: HTMLDivElement[];
  constructor(title, axes, buttons) {
    this.padTitle = title;
    this.padAxes = axes;
    this.padButtons = buttons;
  }
}
/**
 * layer class to traditional gamepad API, handles many of the adaptations and customizations needed for our highly modular design */
export class GamepadObject {
  type: GamepadType;
  pad: Gamepad;
  axes: number[];
  buttons: GamepadButton[];
  connected: boolean = false;
  id: string;
  index: number;
  mapping: string;
  timestamp: number;
  vibrationActuator: GamepadHapticActuator;
  constructor(gp, ax?, btns?, conn?, id?, ind?, map?, ts?, vibra?, ty?) {
    if (gp !== null && gp !== undefined) {
      this.pad = gp;
      this.type = this.getType(gp.id);
      this.axes = gp.axes;
      this.buttons = gp.buttons;
      this.connected = gp.connected;
      this.id = gp.id;
      this.index = gp.index;
      this.mapping = gp.mapping;
      this.timestamp = gp.timestamp;
      this.vibrationActuator = gp.vibrationActuator;
    } else {
      this.axes = ax;
      this.buttons = btns;
      this.connected = conn;
      this.id = id;
      this.index = ind;
      this.type = ty;
      this.mapping = map;
      this.timestamp = ts;
      this.vibrationActuator = vibra;
    }
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
export function vectorMagnitude(v1, v2): number {
  return Math.sqrt(v1 ** 2 + v2 ** 2);
}
export function normalizeVector(v1, v2): Array<number> {
  let v = vectorMagnitude(v1, v2);
  return [v1 / v, v2 / v, v];
}
