import { InputDisplayFunctions } from './input-display-functions';
import { InputDisplayComponent } from './input-display.component';

const dirIconWidth = "width=60px";
const dirIconHeight = "height=60px";
const btnIconWidth = "width=72px";
const btnIconHeight = "height=72px";
export class InputDisplayVisuals {

  static CreateDirectionalArrows(idc: InputDisplayComponent, n: number): HTMLDivElement{
    let div_arrows: HTMLDivElement = document.createElement("div");
    div_arrows.className = "grid3x3";
    div_arrows.id = `${n == 0 ? 'left' : 'right'}`;
    for (let i = 0; i < 9; i++) {
      let arrow = document.createElement("div");
      switch (i) {
        case 1: case 3: case 5: case 7:
          arrow.className = `directionalArrows`;
          arrow.id = `${div_arrows.id}-ortho`;
          arrow.innerHTML = `<img src="assets/images/${InputDisplayFunctions.arrayIndexToDirection(
            i
          )}.png"
          ${dirIconWidth} ${dirIconHeight}>`;
          break;
        case 0: case 2: case 6: case 8:
          arrow.className = `directionalArrows`;
          arrow.id = `${div_arrows.id}-diag`;
          arrow.innerHTML = `<img src="assets/images/${InputDisplayFunctions.arrayIndexToDirection(
            i
          )}.png"
          ${dirIconWidth} ${dirIconHeight}>`;
          break;
        case 4:
          arrow.className = "stickSpace";
          let stick = (n == 0 ? idc.div_leftStick : idc.div_rightStick);
          let tempStick = document.createElement("div");
          tempStick.id = `${div_arrows.id}-stick`;
          tempStick.innerHTML = `<img src="assets/images/${n == 0 ? 'ls' : 'rs'}.png" ${dirIconWidth} ${dirIconHeight}>`;
          stick = tempStick;
          arrow.appendChild(stick);
          break;
      }
      div_arrows.appendChild(arrow);
    }
    return div_arrows;
  }
  /**
   * The getJoystickDirections function looks at the axes of the controller.
   * Based on current axes information [0, 0, 0, 0].
   * You can tell what direction the joystick is going.
   * Based on the direction of the joystick, the correct image for that direction is chosen.
   *  If the joystick is currently not going in any direction, all the icons will be reset to their regular image.
   * @param arwArr
   * @param index  */
  static resetArrows(arwArr, index = -1) {
    for (let i = 0; i < arwArr.length; i++) {
      if (i != index) {
        arwArr[i].innerHTML = this.returnXboxArrowImgElmt(i);
      }
    }
  }
  /**
   * The returnXboxArrows function gets passed a button index.
   * If the index is found in the list, the image tag string for that joystick direction will get returned.
   * This function is used to make all the other arrows look "non-pressed" when the user changes the joystick direction.
   * @param i */
  static returnXboxArrowImgElmt(i: number): string {
    let s: string;
    switch (i) {
      case 0: s = `up_left`; break;
      case 1: s = `up`; break;
      case 2: s = `up_right`; break;
      case 3: s = `left`; break;
      case 4: s = `right`; break;
      case 5: s = `down_left`; break;
      case 6: s = `down`; break;
      case 7: s = `down_right`; break;
      default: s = `up`; break;
    }
    return `<img src="assets/images/${s}.png" ${dirIconWidth} ${dirIconHeight}>`;
  }
}
