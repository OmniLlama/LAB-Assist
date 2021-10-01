import {InputDisplayFunctions} from './input-display-functions';
import {DirectionalHTMLShell, InputDisplayComponent} from './input-display.component';

const dirIconWidth = 'width=60px';
const dirIconHeight = 'height=60px';
const btnIconWidth = 'width=72px';
const btnIconHeight = 'height=72px';
const dirSetId = {0: 'left', 1: 'right', 2: 'dpad'};
const tracerId = {0: 'ls', 1: 'rs', 2: 'dpad'};
export class InputDisplayVisuals {

  static CreateDirectionalArrows(idc: InputDisplayComponent, n: number): DirectionalHTMLShell {
    const div_arrows: HTMLDivElement = document.createElement('div');
    div_arrows.className = 'grid3x3';
    // div_arrows.id = `${n === 0 ? 'left' : 'right'}`;

    div_arrows.id = `${dirSetId[n]}`;
    for (let i = 0; i < 9; i++) {
      let arrow = document.createElement('div');
      switch (i) {
        case 1:
        case 3:
        case 5:
        case 7:
          arrow.className = `directionalArrows`;
          arrow.id = `${div_arrows.id}-ortho`;
          break;
        case 0:
        case 2:
        case 6:
        case 8:
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
    // let div_stick = (n == 0 ? idc.div_leftStick : idc.div_rightStick);
    let div_tracer = document.createElement('div');
    div_tracer.id = `${div_arrows.id}-tracer`;
    div_tracer.className = 'tracer';
    let img_tracer: HTMLImageElement = document.createElement('img');
    img_tracer.src = `assets/images/${tracerId[n]}.png`;
    div_tracer.appendChild(img_tracer);
    let dirHTMLShell = new DirectionalHTMLShell(div_arrows, div_arrows.children, div_tracer);
    return dirHTMLShell;
  }

  /**
   * All the icons will be reset to their regular image, save for a single arrow element if any.
   * @param dirShell
   * @param idx  */
  static resetDirections(dirShell: DirectionalHTMLShell, idx = -1) {
    let preString = 'assets/images/';
    let postString = `.png`;
    dirShell.dirs().forEach((d, i) => {
      if (i !== idx || i === 4) {
        d.img.src = preString + this.getDirectionString(i) + postString;
      } else {
        d.img.src = preString + 'pressed_' + this.getDirectionString(i) + postString;
      }
    });
  }

  /**
   * The returnXboxArrows function gets passed a button index.
   * If the index is found in the list, the image tag string for that joystick direction will get returned.
   * This function is used to make all the other arrows look "non-pressed" when the user changes the joystick direction.
   * @param i */
  static getDirectionString(i: number): string {
    let s: string;
    switch (i) {
      case 0:
        s = `up_left`;
        break;
      case 1:
        s = `up`;
        break;
      case 2:
        s = `up_right`;
        break;
      case 3:
        s = `left`;
        break;
      case 4:
        s = `center`;
        break;
      case 5:
        s = `right`;
        break;
      case 6:
        s = `down_left`;
        break;
      case 7:
        s = `down`;
        break;
      case 8:
        s = `down_right`;
        break;
      default:
        s = `up`;
        break;
    }
    return s;
  }
}

