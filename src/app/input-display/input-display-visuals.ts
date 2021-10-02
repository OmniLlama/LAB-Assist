import {InputDisplayFunctions} from './input-display-functions';
import {DirectionalHTMLShell, InputDisplayComponent} from './input-display.component';

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
      let dir: string = InputDisplayFunctions.directionalArrayIndexToDirection(i);
      img_dir.id = dir;
      img_dir.src = `assets/images/${InputDisplayFunctions.directionalArrayIndexToDirection(i)}.png`;

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
    const preString = 'assets/images/';
    const postString = `.png`;
    dirShell.dirs().forEach((d, i) => {
      if (i !== idx || i === 4) {
        d.img.src = preString + InputDisplayFunctions.directionalArrayIndexToDirection(i) + postString;
      } else {
        d.img.src = preString + 'pressed_' + InputDisplayFunctions.directionalArrayIndexToDirection(i) + postString;
      }
    });
  }
}

