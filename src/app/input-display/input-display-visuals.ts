import {InputDisplayFunctions} from './input-display-functions';
import {dirSetStr} from './input-display.component';
import {DirectionalHTMLShell} from '../../helpers/Shells';
import {Div, Img, SubImg} from '../../helpers/Gen';



export class InputDisplayVisuals {

  static CreateDirectionalHtmlShell(n: number): DirectionalHTMLShell {
    let div_tracer = Div(`${dirSetStr[n]}-tracer`, 'tracer');
    SubImg(div_tracer, dirSetStr[n]);
    let dirHTMLShell = new DirectionalHTMLShell(dirSetStr[n], div_tracer);
    return dirHTMLShell;
  }

  /**
   * @param dirShell
   * @param idx
   * */
  static resetDirections(dirShell: DirectionalHTMLShell, idx = -1) {
    dirShell.htmlDirs().forEach((d, i) => {
      if (i !== idx || i === 4) {
        d.updateImg(false);
      } else {
        d.updateImg(true);
      }
    });
  }

}

