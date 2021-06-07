import { InputDisplayFunctions } from './input-display-functions';
import { InputDisplayComponent } from './input-display.component';

const dirIconWidth = 'width=60px';
const dirIconHeight = 'height=60px';
const btnIconWidth = 'width=72px';
const btnIconHeight = 'height=72px';
export class InputDisplayVisuals {

  static CreateDirectionalArrows(idc: InputDisplayComponent, n: number): HTMLDivElement {
    const div_arrows: HTMLDivElement = document.createElement('div');
    // const div_stickSpace: HTMLDivElement = document.createElement('div');
    div_arrows.className = 'grid3x3';
    div_arrows.id = `${n === 0 ? 'left' : 'right'}`;
    for (let i = 0; i < 9; i++) {
      let arrow = document.createElement('div');
      switch (i) {
        case 1: case 3: case 5: case 7:
          arrow.className = `directionalArrows`;
          arrow.id = `${div_arrows.id}-ortho`;
          break;
        case 0: case 2: case 6: case 8:
          arrow.className = `directionalArrows`;
          arrow.id = `${div_arrows.id}-diag`;
          break;
        case 4:
          arrow.className = `directionalArrows`;
          arrow.id = `center`;
          break;

      }
      let img_dir: HTMLImageElement = document.createElement('img');
      let dir: string = InputDisplayFunctions.arrayIndexToDirection(i);
      img_dir.id = dir;
      img_dir.src = `assets/images/${InputDisplayFunctions.arrayIndexToDirection(i)}.png`;
      arrow.appendChild(img_dir);
      div_arrows.appendChild(arrow);
    }
    // div_stickSpace.className = "stickSpace";
    let div_stick = (n == 0 ? idc.div_leftStick : idc.div_rightStick);
    let div_tempStick = document.createElement("div");
    div_tempStick.id = `${div_arrows.id}-stick`;
    div_tempStick.innerHTML = `<img src="assets/images/${n == 0 ? 'ls' : 'rs'}.png" ${dirIconWidth} ${dirIconHeight}>`;
    div_stick = div_tempStick;
    // div_stickSpace.appendChild(div_stick);
    // div_arrows.appendChild(div_stickSpace);
    return div_arrows;
  }
  /**
   * All the icons will be reset to their regular image, save for a single arrow element if any.
   * @param arwArr
   * @param idx  */
  static resetArrows(arwArr, idx = -1) {
    let preString = '<img src="assets/images/';
    let postString = `.png">`;
    for (let i = 0; i < arwArr.length; i++) {
      if (i !== idx) {
        arwArr[i].innerHTML = this.returnXboxArrowImgElmt(i);
        continue;
      }
      switch (idx) {
        case 0: arwArr[0].innerHTML = `${preString}pressed_up_left${postString}`; break;
        case 1: arwArr[1].innerHTML = `${preString}pressed_up${postString}`; break;
        case 2: arwArr[2].innerHTML = `${preString}pressed_up_right${postString}`; break;
        case 3: arwArr[3].innerHTML = `${preString}pressed_left${postString}`; break;
        // case 4: arwArr[4].innerHTML = `${preString}pressed_right${postString}`; break;
        case 5: arwArr[5].innerHTML = `${preString}pressed_right${postString}`; break;
        case 6: arwArr[6].innerHTML = `${preString}pressed_down_left${postString}`; break;
        case 7: arwArr[7].innerHTML = `${preString}pressed_down${postString}`; break;
        case 8: arwArr[8].innerHTML = `${preString}pressed_down_right${postString}`; break;
        default:
          break;
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
      case 4: s = `ls`; break;
      case 5: s = `right`; break;
      case 6: s = `down_left`; break;
      case 7: s = `down`; break;
      case 8: s = `down_right`; break;
      default: s = `up`; break;
    }
    return `<img src="assets/images/${s}.png">`;
  }
}
