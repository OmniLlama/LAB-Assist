export enum DirectionState {
  None = 0,
  Up = 1 << 0,
  Right = 1 << 1,
  Left = 1 << 2,
  Down = 1 << 3
}

export enum ControllerState {
  None = 0,
  UpLS = 1 << 0,
  RightLS = 1 << 1,
  LeftLS = 1 << 2,
  DownLS = 1 << 3,
  UpRS = 1 << 4,
  RightRS = 1 << 5,
  LeftRS = 1 << 6,
  DownRS = 1 << 7,
  UpDPad = 1 << 8,
  RightDPad = 1 << 9,
  LeftDPad = 1 << 10,
  DownDPad = 1 << 11,
  BtnA = 1 << 12,
  BtnB = 1 << 13,
  BtnX = 1 << 14,
  BtnY = 1 << 15,
  BtnLB = 1 << 16,
  BtnRB = 1 << 17,
  BtnLT = 1 << 18,
  BtnRT = 1 << 19,
  BtnLSC = 1 << 20,
  BtnRSC = 1 << 21,
  BtnSel = 1 << 22,
  BtnSta = 1 << 23,
}

export enum ButtonState {
  Off = 0,
  Down = 1,
  Held = 2,
  Up = 3
}

export enum ButtonLayoutOrder {
  Linear = 'linear',
  Arcade = 'arcade'
}

export enum GamepadType {
  Generic,
  XInput,
  Playstation,
  Qanba
}

export enum GamepadTypeString {
  Generic = 'generic',
  XInput = 'xinput',
  Playstation = '054c',
  Qanba = '2c22',
}

export enum MovementNotationType {
  Numeric = 'n',
  Directional = 'd',
  TruncatedDirectional = 'td',
  Motional = 'm',
  TruncatedMotional = 'tm'
}

export enum ButtonNotationType {
  Numeric = 'num',
  StreetFighter = 'sf',
  SNK = 'snk',
  Netherrealm = 'nrs',
  Tekken = 'tkn',
  SoulCalibur = 'sc',
  GuiltyGear = 'gg',
  Playstation = 'ps',
  Xbox = 'xb'
}

export let xbBtns = ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'select', 'start', 'lsc', 'rsc'];
export let psBtns = ['X', 'O', '[]', '^', 'l1', 'r1', 'l2', 'r2'];
export let sfBtns = ['lk', 'mk', 'lp', 'mp', 'l1', 'hp', 'l2', 'hk'];
export let ggBtns = ['P', 'D', 'K', 'S', 'HS', 'l1', 'l2', 'SP'];
export let tknBtns = ['LK', 'RK', 'LP', 'RP'];
export let scBtns = ['G', 'K', 'A', 'B'];
export let snkBtns = ['B', 'D', 'A', 'C'];

/**
 * Names the axis based on the axis id number
 * @param i - the axis id number
 */
export const axisToAnalogName = {
  0: 'LS X', 1: 'LS Y', 2: 'RS X', 3: 'RS Y'
};

