import { InputDisplayVisuals } from './input-display-visuals';
import { InputDisplayComponent } from './input-display.component';

export class InputDisplayFunctions {
  static arrayIndexToDirection(i) {
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
 * @param arwArr
 */
  static processJoystickDirections(horiAxis: number, vertAxis: number, odz: number, ddz: number, arwArr) {
    let idc = InputDisplayComponent.inpDispCmp;
    let preString = '<img src="assets/images/';
    let postString = `.png">`;

    // First handle diagonal directions, and override them with Left/Right/Up/Down if needed
    if (horiAxis < -ddz && vertAxis < -ddz) {
      InputDisplayVisuals.resetArrows(arwArr, 0);
    } else if (horiAxis < -ddz && vertAxis > ddz) {
      // arwArr[5].innerHTML = `${preString}pressed_down_left${postString}`;
      InputDisplayVisuals.resetArrows(arwArr, 5);
    } else if (horiAxis > ddz && vertAxis < -ddz) {
      // arwArr[2].innerHTML = `${preString}pressed_up_right${postString}`;
      InputDisplayVisuals.resetArrows(arwArr, 2);
    } else if (horiAxis > ddz && vertAxis > ddz) {
      // arwArr[7].innerHTML = `${preString}pressed_down_right${postString}`;
      InputDisplayVisuals.resetArrows(arwArr, 7);
    }

    // Now handle all the regular directions, if the constraints for diagonal directions are not met
    else if (horiAxis < -odz && Math.abs(vertAxis) < ddz) {
      // arwArr[3].innerHTML = `${preString}pressed_left${postString}`;
      InputDisplayVisuals.resetArrows(arwArr, 3);
    } else if (vertAxis < -odz && Math.abs(horiAxis) < ddz) {
      // arwArr[1].innerHTML = `${preString}pressed_up${postString}`;
      InputDisplayVisuals.resetArrows(arwArr, 1);
    } else if (horiAxis > odz && Math.abs(vertAxis) < ddz) {
      // arwArr[4].innerHTML = `${preString}pressed_right${postString}`;
      InputDisplayVisuals.resetArrows(arwArr, 4);
    } else if (vertAxis > odz && Math.abs(horiAxis) < ddz) {
      // arwArr[6].innerHTML = `${preString}pressed_down${postString}`;
      InputDisplayVisuals.resetArrows(arwArr, 6);
    } else {
      for (let i = 0; i < 9; i++) {
        // let arrow = document.createElement("div");
        // arrow.className = "directionalArrows";
        // arwArr[i].innerHTML = `${preString}${InputDisplayFunctions.arrayIndexToDirection(i)}${postString}`;
      }
    }
  }
  static processDigitalDirectionalInput(dirArr: boolean[], arwArr) {


    // First handle diagonal directions, and override them with Left/Right/Up/Down if needed
    if (dirArr[2] && dirArr[0]) {
      InputDisplayVisuals.resetArrows(arwArr, 0);
    } else if (dirArr[2] && dirArr[1]) {
      InputDisplayVisuals.resetArrows(arwArr, 5);
    } else if (dirArr[3] && dirArr[0]) {
      InputDisplayVisuals.resetArrows(arwArr, 2);
    } else if (dirArr[3] && dirArr[1]) {
      InputDisplayVisuals.resetArrows(arwArr, 7);
    }

    // Now handle all the regular directions, if the constraints for diagonal directions are not met
    else if (dirArr[2]) {
      InputDisplayVisuals.resetArrows(arwArr, 3);
    } else if (dirArr[0]) {
      InputDisplayVisuals.resetArrows(arwArr, 1);
    } else if (dirArr[3]) {
      InputDisplayVisuals.resetArrows(arwArr, 4);
    } else if (dirArr[1]) {
      InputDisplayVisuals.resetArrows(arwArr, 6);
    }
    else
      InputDisplayVisuals.resetArrows(arwArr);
  }
}
