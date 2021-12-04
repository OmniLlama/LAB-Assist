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

export let pads: Array<Gamepad> = new Array<Gamepad>();
export let padObjs: Array<GamepadObject> = new Array<GamepadObject>();

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

  testState: string = '';

  mvNotTy: MovementNotationType;
  butNotTy: ButtonNotationType = ButtonNotationType.Xbox;
  butNotTypes = ButtonNotationType;
  mntKeys = Object.keys(MovementNotationType);
  bntKeys = Object.keys(ButtonNotationType);
  layoutVals = Object.values(ButtonLayoutType);
  controllers_div: HTMLDivElement;

  diagDeadzone = 0.4;
  orthoDeadzone = 0.75;


  // useLeftStick = true;
  // useRightStick = true;
  // useDPad = true;

  toggleLS() {
    if (padObjs && padObjs[0]) {
      padObjs[0].useLS = !padObjs[0].useLS;
    }
  }

  toggleRS() {
    if (padObjs && padObjs[0]) {
      padObjs[0].useRS = !padObjs[0].useRS;
    }
  }

  toggleDPad() {
    if (padObjs && padObjs[0]) {
      padObjs[0].useDPad = !padObjs[0].useDPad;
    }
  }

  useLS() {
    if (padObjs && padObjs[0]) {
      return padObjs[0].useLS;
    }
    return false;
  }

  useRS() {
    if (padObjs && padObjs[0]) {
      return padObjs[0].useRS;
    }
    return false;
  }

  useDPad() {
    if (padObjs && padObjs[0]) {
      return padObjs[0].useDPad;
    }
    return false;
  }

  constructor() {
  }

  ngOnInit(): void {
    const haveWebkitEvents = 'WebKitGamepadEvent' in window;
    const haveEvents = 'GamepadEvent' in window;
    InputDisplayComponent.inpDispCmp = this;
    this.controllers_div = document.getElementById('controllers') as HTMLDivElement;
    pads = new Array<Gamepad>();
    padObjs = new Array<GamepadObject>();

    if (haveEvents) {
      window.addEventListener('gamepadconnected', e =>
        InputDisplayEvents.connecthandler(e, this));
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

  addHtmlGamepad(gamepad: Gamepad): void {
    pads[gamepad.index] = gamepad;
    padObjs[gamepad.index] = new GamepadObject(gamepad);
    document.getElementById('start').style.display = 'none';
    this.controllers_div.appendChild(padObjs[gamepad.index].html.div);
    // InputEditorComponent.inpEdComp.edtrView.updateDraw();
    InputDisplayComponent.rAF(cb => this.updateStatus());
  }

  removeHtmlGamepad(gamepad: Gamepad): void {
    // Hide start message
    document.getElementById('start').style.display = 'block';
    this.controllers_div.removeChild(padObjs[gamepad.index].html.div);
    delete pads[gamepad.index];
    delete padObjs[gamepad.index];
    InputDisplayComponent.rAF(cb => this.updateStatus());
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
      pO.ActionButtonLayout.forEach((b) => {
        const val = pO.pad.buttons[b];
        const pressed = val.value > 0.8;
        pO.html.btnShells[b].updateImg(pressed);
      });
      pO.FunctionButtonLayout.forEach((b) => {
        const val = pO.pad.buttons[b];
        const pressed = val.value > 0.8;
        pO.html.btnShells[b].updateImg(pressed);
      });
      pO.html.pad2WayAxes.forEach((axis, idx) => {
        axis.updateAxis(pO.axisByIdx(idx));
      });
      pO.html.dirArrowSets.forEach((dir, idx) => {
        const vec = pO.DirVecs[idx];
        dir.updateShell(pO.UsedDirs[idx], (idx === 2 ? pO.DPadToVector() : vec), pO.DirStates[idx]);
      });
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


