import {InputDisplayVisuals} from './input-display-visuals';
import {DirectionalHTMLShell} from '../../helpers/Shells';
import {DirectionState} from '../../helpers/Enums';

export class InputDisplayFunctions {
  /**
   * @param dirShell
   */
  static updateCurrentDirection(dirShell: DirectionalHTMLShell, dirState: DirectionState) {
    let dirIdx = -1;
    switch (dirState) {
      case DirectionState.None:
        break;
      case DirectionState.Up:
        dirIdx = 1;
        break;
      case DirectionState.Right:
        dirIdx = 5;
        break;
      case DirectionState.Left:
        dirIdx = 3;
        break;
      case DirectionState.Down:
        dirIdx = 7;
        break;
      case DirectionState.UpRight:
        dirIdx = 2;
        break;
      case DirectionState.UpLeft:
        dirIdx = 0;
        break;
      case DirectionState.DownLeft:
        dirIdx = 6;
        break;
      case DirectionState.DownRight:
        dirIdx = 8;
        break;
    }
    InputDisplayVisuals.resetDirections(dirShell, dirIdx);
  }
}
