import {Component, OnInit} from '@angular/core';
import {
  axisToAnalogName,
  ButtonLayoutOrder,
  ButtonNotationType,
  GamepadType,
  GamepadTypeString,
  ggBtns,
  MovementNotationType,
  scBtns,
  snkBtns,
  tknBtns,
  xbBtns
} from 'src/helpers/Enums';
import {InputDisplayFunctions} from './input-display-functions';
import {InputDisplayEvents} from './input-display-events';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {GamepadHTMLShell} from '../../helpers/Shells';
import {FPSTracker} from '../../helpers/Defs';

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

      lDirShell.div.style.display = this.useLeftStick ? 'inline-block' : 'none';
      lDirShell.updateTracer([pO.Axes[0], pO.Axes[1]]);
      rDirShell.div.style.display = this.useRightStick ? 'inline-block' : 'none';
      rDirShell.updateTracer([pO.Axes[2], pO.Axes[3]]);
      dpDirShell.div.style.display = this.useDPad ? 'inline-block' : 'none';
      dpDirShell.updateTracer([dpVec[0], dpVec[1]]);

      if (this.useDPad && pO.DPad.some(dir => dir.pressed)) {
        const padArr = new Array<boolean>(4);
        pO.DPad.forEach((d, i) => {
          padArr[i] = d.pressed;
        });
        InputDisplayFunctions.processDigitalDirectionalInput(padArr, dpDirShell);
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

  get Axes(): readonly number[] {
    return this.pad.axes;
  }

  get Btns(): readonly GamepadButton[] {
    return this.pad.buttons;
  }

  get DPad(): readonly GamepadButton[] {
    const bs = new Array<GamepadButton>();
    this.getDPadButtonNumbers().forEach((b, i) => {
      bs[i] = this.pad.buttons[b];
    });
    return bs;
  }

  get DPadURLD(): readonly GamepadButton[] {
    const bns = this.getDPadButtonNumbers();
    const bs = [this.pad.buttons[bns[0]], this.pad.buttons[bns[3]], this.pad.buttons[bns[2]], this.pad.buttons[bns[1]]];
    return bs;
  }

  DPadToVector(): [number, number] {
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

