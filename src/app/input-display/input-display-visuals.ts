import {InputDisplayFunctions} from './input-display-functions';
import {dirSetId, htmlIdxToDirStr, nameButton, tracerAssnId} from './input-display.component';
import {IMG_END, IMG_SRC} from '../../helpers/Vals';
import {DirectionalHTMLShell} from '../../helpers/Shells';
import {Div, Img} from '../../helpers/Gen';



export class InputDisplayVisuals {

  static CreateDirectionalArrows(n: number): DirectionalHTMLShell {
    let div_tracer = Div(`${tracerAssnId[n]}-tracer`, 'tracer');
    div_tracer.appendChild(Img(tracerAssnId[n]));
    let dirHTMLShell = new DirectionalHTMLShell(dirSetId[n], div_tracer);
    return dirHTMLShell;
  }

  /**
   * @param dirShell
   * @param idx
   * */
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

