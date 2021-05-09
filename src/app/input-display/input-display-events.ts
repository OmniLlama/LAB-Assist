import {InputDisplayComponent} from './input-display.component';

export class InputDisplayEvents {
  /**
   * Handles the connecting event of a gamepad
   * @param e event
   */
  static connecthandler(e, idc: InputDisplayComponent): void {
    idc.addHtmlGamepad(e.gamepad);
  }

  /**
   * Handles the disconnecting event of a gamepad
   * @param e event
   */
  static disconnecthandler(e, idc: InputDisplayComponent): void {
    idc.removegamepad(e.gamepad);
  }
}
