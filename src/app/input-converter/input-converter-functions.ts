export class InputConverterFunctions {
  static getPitchStringFromNumber(n: number): string {
    const noteLetter = n % 12;
    const noteOctave = (n / 12);
    let str = '';
    switch (noteLetter) {
      case 0: str = 'C'; break;
      case 1: str = 'C#'; break;
      case 2: str = 'D'; break;
      case 3: str = 'D#'; break;
      case 4: str = 'E'; break;
      case 5: str = 'F'; break;
      case 6: str = 'F#'; break;
      case 7: str = 'G'; break;
      case 8: str = 'G#'; break;
      case 9: str = 'A'; break;
      case 10: str = 'A#'; break;
      case 11: str = 'B'; break;
      default:
        break;
    }
    switch (true) {
      case (noteOctave < 1): str += '0'; break;
      case (noteOctave < 2): str += '1'; break;
      case (noteOctave < 3): str += '2'; break;
      case (noteOctave < 4): str += '3'; break;
      case (noteOctave < 5): str += '4'; break;
      case (noteOctave < 6): str += '5'; break;
      case (noteOctave < 7): str += '6'; break;
      case (noteOctave < 8): str += '7'; break;
      case (noteOctave < 9): str += '8'; break;
      default:
        break;
    }
    return str;
  }
  /**
   * Sends pitch based on which button was sent
   * @param ind
   */
  static getButtonPitch(ind: number) {
    switch (ind) {
      case 0: return 28; //E1
      case 1: return 27; //D#1
      case 2: return 26; //D1
      case 3: return 25; //C#1
      case 4: return 24; //C1
      case 5: return 23; //B0
      case 6: return 22; //A#0
      case 7: return 21; //A0

      default: return 12; //C0
    }
  }
  /**
 * Sends pitch based on which d-pad input direction was sent
 * @param ind
 */
  static getDirectionPitchFromDPad(ind): number {
    switch (ind) {
      case 0: return 32;
      case 1: return 31;
      case 2: return 30;
      case 3: return 29;
    }
  }
}
