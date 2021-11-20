export class InputConverterFunctions {


  /**
   * Sends pitch based on which button was sent
   * @param ind
   */
  static getButtonPitch(ind: number) {
    switch (ind) {
      case 0:
        return 11;
      case 1:
        return 10;
      case 2:
        return 9;
      case 3:
        return 8;
      case 4:
        return 7;
      case 5:
        return 6;
      case 6:
        return 5;
      case 7:
        return 4;
      case 8:
        return 3;
      case 9:
        return 2;
      case 10:
        return 1;
      case 11:
        return 0;
    }
  }

  /**
   * Sends pitch based on which d-pad input direction was sent
   * @param idx
   */
  static getDirectionPitchFromDPad(idx): number {
    switch (idx) {
      case 0:
        return 15;
      case 1:
        return 14;
      case 2:
        return 13;
      case 3:
        return 12;
    }
  }

  /**
   * Sends pitch based on which axis direction was sent
   * @param idx
   */
  static getDirectionPitchFromAxis(idx, val): number {
    switch (idx) {
      case 0:
        return val > 0 ? 22 : 21;
      case 1:
        return val > 0 ? 20 : 23;
      case 2:
        return val > 0 ? 18 : 17;
      case 3:
        return val > 0 ? 16 : 19;
    }
  }

  static nameDPadDirection(i): string {
    switch (i) {
      case 0:
        return 'up';
      case 1:
        return 'right';
      case 2:
        return 'left';
      case 3:
        return 'down';
    }
    return i;
  }
}
