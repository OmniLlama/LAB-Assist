export class InputConverterFunctions {


  /**
   * Sends pitch based on which button was sent
   * @param ind
   */
  static getButtonChannel(ind: number) {
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
  static getDirectionChannelFromDPad(idx): number {
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
  static getDirectionChannelFromAxis(idx, val): number {
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
  static twoChannelSetsBy4Way(idx: number): [[number, number], [number, number]] {
    switch (idx) {
      case 0:
        return [[21, 22], [23, 20]];
      case 1:
        return [[17, 18], [19, 16]];
      case 2:
        return [[17, 18], [19, 16]];
    }
  }
}
