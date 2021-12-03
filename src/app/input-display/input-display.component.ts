import {Component, OnInit} from '@angular/core';
import {
  ButtonLayoutType,
  ButtonNotationType,
  ButtonsState,
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
import {GamepadObject} from '../../helpers/Defs';
import {decToBin} from '../../helpers/Func';

export let pads: Array<Gamepad>;
export let padObjs: Array<GamepadObject>;
export const dirSetId = {0: 'left', 1: 'right', 2: 'dpad'};
export const tracerAssnId = {0: 'ls', 1: 'rs', 2: 'dpad'};

export const URLDStrings = ['up', 'right', 'left', 'down'];
export const htmlIdxToDirStr = {
  0: `up-left`,
  1: `up`,
  2: `up-right`,
  3: `left`,
  4: `center`,
  5: `right`,
  6: `down-left`,
  7: `down`,
  8: `down-right`
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
  testState: string = '';

  mvNotTy: MovementNotationType;
  butNotTy: ButtonNotationType = ButtonNotationType.Xbox;
  butNotTypes = ButtonNotationType;
  mntKeys = Object.keys(MovementNotationType);
  bntKeys = Object.keys(ButtonNotationType);
  layoutVals = Object.values(ButtonLayoutType);
  controllers_div = document.getElementById('controllers');

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
    // InputEditorComponent.inpEdComp.edtrView.updateDraw();
    InputDisplayComponent.rAF(cb => this.updateStatus());
  }

  removeHtmlGamepad(gamepad: Gamepad): void {
    // Hide start message
    document.getElementById('start').style.display = 'none';
    document.getElementById('controllers').removeChild(padObjs[gamepad.index].html.div);
    pads[gamepad.index] = null;
    padObjs[gamepad.index] = null;
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
      pO.updateGamepad(pads);
      pO.actionButtonLayout.forEach((b, i) => {
        const val = pO.pad.buttons[b];
        const pressed = val.value > 0.8;
        pO.html.btnShells[b].updateImg(pressed);
      });
      pO.functionButtonLayout.forEach((b, i) => {
        const val = pO.pad.buttons[b];
        const pressed = val.value > 0.8;
        pO.html.btnShells[b].updateImg(pressed);
      });
      /**
       * Get Axes Status */

      const lDirShell = pO.html.dirArrowSets[0];
      const rDirShell = pO.html.dirArrowSets[1];
      const dpDirShell = pO.html.dirArrowSets[2];
      const dpVec = pO.DPadToVector();

      pO.html.pad2WayAxes[0].updateAxis(pO.axisByIdx(0));
      pO.html.pad2WayAxes[1].updateAxis(pO.axisByIdx(1));
      pO.html.pad2WayAxes[2].updateAxis(pO.axisByIdx(2));
      pO.html.pad2WayAxes[3].updateAxis(pO.axisByIdx(3));
      lDirShell.div.style.display = this.useLeftStick ? 'inline-block' : 'none';
      lDirShell.updateTracer(pO.axisPair(0));
      rDirShell.div.style.display = this.useRightStick ? 'inline-block' : 'none';
      rDirShell.updateTracer(pO.axisPair(1));
      dpDirShell.div.style.display = this.useDPad ? 'inline-block' : 'none';
      dpDirShell.updateTracer([dpVec[0], dpVec[1]]);

      if (this.useDPad
        // && pO.DPad.some(dir => dir.pressed)
      ) {
        const padArr = new Array<boolean>(4);
        pO.DPad.forEach((d, i) => {
          padArr[i] = d.pressed;
        });
        InputDisplayFunctions.updateCurrentDirection(dpDirShell, pO.dpadDirState);
      }
      InputDisplayFunctions.updateCurrentDirection(lDirShell, pO.lsDirState);
      InputDisplayFunctions.updateCurrentDirection(rDirShell, pO.rsDirState);
      this.testState = `${decToBin(pO.lsDirState)} ${decToBin(pO.rsDirState)} ${decToBin(pO.dpadDirState)} ${decToBin(pO.btnsState)}`;
    });
    InputDisplayComponent.rAF(cb => this.updateStatus());

  }


  rearrangeButtons(layout: string) {
    if (padObjs[0]) {
      padObjs[0].changeButtonLayout(layout as ButtonLayoutType);
    }
  }


}


/**
 * Names the button with the proper designation based on button notation selection
 * @param {*} i - the button id number
 */
export function nameButton(i: number): any {
  switch (InputDisplayComponent.inpDispCmp.butNotTy) {
    case ButtonNotationType.Xbox:
      return xbBtns[i] !== undefined ? xbBtns[i] : null;
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


