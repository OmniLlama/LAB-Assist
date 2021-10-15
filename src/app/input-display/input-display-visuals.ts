import {InputDisplayFunctions} from './input-display-functions';
import {DirectionalHTMLShell, dirSetId, htmlIdxToDirStr, nameButton, tracerAssnId} from './input-display.component';
import {IMG_END, IMG_SRC} from '../../helpers/Vals';



export class InputDisplayVisuals {

  static CreateDirectionalArrows(n: number): DirectionalHTMLShell {
    // const div_arrows: HTMLDivElement = document.createElement('div');
    // div_arrows.className = 'dirs3x3';
    // div_arrows.id = `${dirSetId[n]}`;
    // for (let i = 0; i < 9; i++) {
    //   let arrow = document.createElement('div');
    //   switch (i) {
    //     case 1:
    //     case 3:
    //     case 5:
    //     case 7:
    //       arrow.className = `directionalArrows`;
    //       arrow.id = `${div_arrows.id}-ortho`;
    //       break;
    //     case 0:
    //     case 2:
    //     case 6:
    //     case 8:
    //       arrow.className = `directionalArrows`;
    //       arrow.id = `${div_arrows.id}-diag`;
    //       break;
    //     case 4:
    //       arrow.className = `directionalArrows`;
    //       arrow.id = `center`;
    //       break;
    //
    //   }
    //   let img_dir: HTMLImageElement = document.createElement('img');
    //   let dir: string = InputDisplayFunctions.directionalArrayIndexToDirectionString(i);
    //   // img_dir.id = dir;
    //   img_dir.src = `assets/images/${dir}.png`;
    //
    //   arrow.appendChild(img_dir);
    //   div_arrows.appendChild(arrow);
    // }
    let div_tracer = document.createElement('div');
    div_tracer.id = `${tracerAssnId[n]}-tracer`;
    div_tracer.className = 'tracer';
    let img_tracer: HTMLImageElement = document.createElement('img');
    img_tracer.src = `assets/images/${tracerAssnId[n]}.png`;
    div_tracer.appendChild(img_tracer);

    let dirHTMLShell = new DirectionalHTMLShell(dirSetId[n], div_tracer);
    return dirHTMLShell;
  }

  /**
   * All the icons will be reset to their regular image, save for a single arrow element if any.
   * @param dirShell
   * @param idx  */
  static resetDirections(dirShell: DirectionalHTMLShell, idx = -1) {
    dirShell.htmlDirs().forEach((d, i) => {
      if (i !== idx || i === 4) {
        d.img.src = IMG_SRC + htmlIdxToDirStr[i] + IMG_END;
      } else {
        d.img.src = IMG_SRC + 'pressed_' + htmlIdxToDirStr[i] + IMG_END;
      }
    });
  }

}

