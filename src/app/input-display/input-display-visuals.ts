import {InputDisplayFunctions} from './input-display-functions';
import {dirSetId, htmlIdxToDirStr, nameButton, tracerAssnId} from './input-display.component';
import {IMG_EXT, IMG_DIR} from '../../helpers/Vals';
import {DirectionalHTMLShell} from '../../helpers/Shells';
import {Div, Img, SubImg} from '../../helpers/Gen';



export class InputDisplayVisuals {

  static CreateDirectionalArrows(n: number): DirectionalHTMLShell {
    let div_tracer = Div(`${tracerAssnId[n]}-tracer`, 'tracer');
    SubImg(div_tracer, tracerAssnId[n]);
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
        d.updateImgSrc(htmlIdxToDirStr[i]);
      } else {
        d.updateImgSrc('pressed_' + htmlIdxToDirStr[i]);
      }
    });
  }

}

