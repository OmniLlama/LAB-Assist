import { InputDisplayVisuals } from './input-display-visuals';
import {DirectionalHTMLShell, InputDisplayComponent} from './input-display.component';

export class InputDisplayFunctions {
  static arrayIndexToDirection(i) {
    switch (i) {
      case 0: return `up_left`;
      case 1: return `up`;
      case 2: return `up_right`;
      case 3: return `left`;
      case 4: return `center`;
      case 5: return `right`;
      case 6: return `down_left`;
      case 7: return `down`;
      case 8: return `down_right`;
    }
  }
  /**
 * The getJoystickDirections function looks at the axes of the controller.
 * Based on current axes information [0, 0, 0, 0].
 * You can tell what direction the joystick is going.
 * Based on the direction of the joystick, the correct image for that direction is chosen.
 * If the joystick is currently not going in any direction, all the icons will be reset to their regular image.
 * @param horiAxis
 * @param vertAxis
 * @param ddz diagonal deadzone
 * @param odz orthogonal deadzone
 * @param dirShell
 */
  static processJoystickDirections(horiAxis: number, vertAxis: number, odz: number, ddz: number, dirShell: DirectionalHTMLShell) {
    // First handle diagonal directions, and override them with Left/Right/Up/Down if needed
    let dirIdx = -1;
    if (horiAxis < -ddz && vertAxis < -ddz) {
      dirIdx = 0;
      // InputDisplayVisuals.resetArrows(arwArr, 0);
    } else if (horiAxis < -ddz && vertAxis > ddz) {
      dirIdx = 6;
      // InputDisplayVisuals.resetArrows(arwArr, 6);
    } else if (horiAxis > ddz && vertAxis < -ddz) {
      dirIdx = 2;
      // InputDisplayVisuals.resetArrows(arwArr, 2);
    } else if (horiAxis > ddz && vertAxis > ddz) {
      dirIdx = 8;
      // InputDisplayVisuals.resetArrows(arwArr, 8);
    }

    // Now handle all the regular directions, if the constraints for diagonal directions are not met
    else if (horiAxis < -odz && Math.abs(vertAxis) < ddz) {
      dirIdx = 3;
      // InputDisplayVisuals.resetArrows(arwArr, 3);
    } else if (vertAxis < -odz && Math.abs(horiAxis) < ddz) {
      dirIdx = 1;
      // InputDisplayVisuals.resetArrows(arwArr, 1);
    } else if (horiAxis > odz && Math.abs(vertAxis) < ddz) {
      dirIdx = 5;
      // InputDisplayVisuals.resetArrows(arwArr, 5);
    } else if (vertAxis > odz && Math.abs(horiAxis) < ddz) {
      dirIdx = 7;
      // InputDisplayVisuals.resetArrows(arwArr, 7);
    } else {
      dirIdx = -1;
    }
    InputDisplayVisuals.resetDirections(dirShell, dirIdx);
    // arwArr[4].style.width = horiAxis * 128;
    // arwArr[4].children[0].style.top = vertAxis * 128;
    // arwArr[4].style.offsetX = horiAxis * 128;
    // arwArr[4].style.offsetY = vertAxis * 128;
  }
  static processDigitalDirectionalInput(dirArr: boolean[], dirShell: DirectionalHTMLShell) {


    // First handle diagonal directions, and override them with Left/Right/Up/Down if needed
    if (dirArr[2] && dirArr[0]) {
      InputDisplayVisuals.resetDirections(dirShell, 0);
    } else if (dirArr[2] && dirArr[1]) {
      InputDisplayVisuals.resetDirections(dirShell, 5);
    } else if (dirArr[3] && dirArr[0]) {
      InputDisplayVisuals.resetDirections(dirShell, 2);
    } else if (dirArr[3] && dirArr[1]) {
      InputDisplayVisuals.resetDirections(dirShell, 7);
    }

    // Now handle all the regular directions, if the constraints for diagonal directions are not met
    else if (dirArr[2]) {
      InputDisplayVisuals.resetDirections(dirShell, 3);
    } else if (dirArr[0]) {
      InputDisplayVisuals.resetDirections(dirShell, 1);
    } else if (dirArr[3]) {
      InputDisplayVisuals.resetDirections(dirShell, 4);
    } else if (dirArr[1]) {
      InputDisplayVisuals.resetDirections(dirShell, 6);
    }
    else
      InputDisplayVisuals.resetDirections(dirShell);
  }
}
