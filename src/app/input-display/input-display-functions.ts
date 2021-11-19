import {InputDisplayVisuals} from './input-display-visuals';
import {DirectionalHTMLShell} from '../../helpers/Shells';
import {DirectionState} from '../../helpers/Enums';

export class InputDisplayFunctions {
  static directionalArrayIndexToDirectionString(i): string {
    switch (i) {
      case 0:
        return `up_left`;
      case 1:
        return `up`;
      case 2:
        return `up_right`;
      case 3:
        return `left`;
      case 4:
        return `center`;
      case 5:
        return `right`;
      case 6:
        return `down_left`;
      case 7:
        return `down`;
      case 8:
        return `down_right`;
      default:
        return `up`;
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
   * @param dirShell
   */
  static updateCurrentDirection(dirShell: DirectionalHTMLShell, dirState: DirectionState) {
    // First handle diagonal directions, and override them with Left/Right/Up/Down if needed
    let dirIdx = -1;
    if (dirState === DirectionState.UpLeft) {
      dirIdx = 0;
    } else if (dirState === DirectionState.DownLeft) {
      dirIdx = 6;
    } else if (dirState === DirectionState.UpRight) {
      dirIdx = 2;
    } else if (dirState === DirectionState.DownRight) {
      dirIdx = 8;
    }

    // Now handle all the regular directions, if the constraints for diagonal directions are not met
    else if (dirState === DirectionState.Left) {
      dirIdx = 3;
    } else if (dirState === DirectionState.Up) {
      dirIdx = 1;
    } else if (dirState === DirectionState.Right) {
      dirIdx = 5;
    } else if (dirState === DirectionState.Down) {
      dirIdx = 7;
    }
    InputDisplayVisuals.resetDirections(dirShell, dirIdx);
  }
}
