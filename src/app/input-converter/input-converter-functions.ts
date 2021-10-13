export class InputConverterFunctions {
  static numberToPitchString(n: number): string {
    const noteLetter = n % 12;
    const noteOctave = Math.floor(n / 12) - 1;
    let str = '';
    switch (noteLetter) {
      case 0:
        str = 'C';
        break;
      case 1:
        str = 'C#';
        break;
      case 2:
        str = 'D';
        break;
      case 3:
        str = 'D#';
        break;
      case 4:
        str = 'E';
        break;
      case 5:
        str = 'F';
        break;
      case 6:
        str = 'F#';
        break;
      case 7:
        str = 'G';
        break;
      case 8:
        str = 'G#';
        break;
      case 9:
        str = 'A';
        break;
      case 10:
        str = 'A#';
        break;
      case 11:
        str = 'B';
        break;
      default:
        break;
    }
    str += noteOctave;
    return str;
  }

  /**
   * Sends pitch based on which button was sent
   * @param ind
   */
  static getButtonPitch(ind: number) {
    switch (ind) {
      case 0: return 11;
      case 1: return 10;
      case 2: return 9;
      case 3: return 8;
      case 4: return 7;
      case 5: return 6;
      case 6: return 5;
      case 7: return 4;
      case 8: return 3;
      case 9: return 2;
      case 10: return 1;
      case 11: return 0;
    }
  }

  /**
   * Sends pitch based on which d-pad input direction was sent
   * @param ind
   */
  static getDirectionPitchFromDPad(ind): number {
    switch (ind) {
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
   * @param ind
   */
  static getDirectionPitchFromAxis(ind, val): number {
    switch (ind) {
      case 0:
        if (val > 0) {
          return 16;
        } else {
          return 17;
        }
      case 1:
        if (val > 0) {
          return 18;
        } else {
          return 17;
        }
      case 2:
        if (val > 0) {
          return 20;
        } else {
          return 21;
        }
      case 3:
        if (val > 0) {
          return 23;
        } else {
          return 22;
        }
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
