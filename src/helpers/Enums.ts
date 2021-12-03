export enum DirectionState {
  None = 0,
  Up = 1 << 0,
  Right = 1 << 1,
  Left = 1 << 2,
  Down = 1 << 3,
  UpRight = DirectionState.Up | DirectionState.Right,
  UpLeft = DirectionState.Up | DirectionState.Left,
  DownLeft = DirectionState.Down | DirectionState.Left,
  DownRight = DirectionState.Down | DirectionState.Right
}

export enum ButtonsState {
  None = 0,
  BtnA = 1 << 0,
  BtnB = 1 << 1,
  BtnX = 1 << 2,
  BtnY = 1 << 3,
  BtnLB = 1 << 4,
  BtnRB = 1 << 5,
  BtnLT = 1 << 6,
  BtnRT = 1 << 7,
  BtnSel = 1 << 8,
  BtnSta = 1 << 9,
  BtnLSC = 1 << 10,
  BtnRSC = 1 << 11
}

export enum ButtonState {
  Off = 0,
  Down = 1,
  Held = 2,
  Up = 3
}

export enum ButtonLayoutType {
  Arcade = 'arcade',
  Linear = 'linear',
  FacesLeft = 'faces-left',
  FacesMiddle= 'faces-middle'
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

export const xbBtns = ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'select', 'start', 'lsc', 'rsc'];
export const psBtns = ['X', 'O', '[]', '^', 'l1', 'r1', 'l2', 'r2'];
export const sfBtns = ['lk', 'mk', 'lp', 'mp', 'l1', 'hp', 'l2', 'hk'];
export const ggBtns = ['P', 'D', 'K', 'S', 'HS', 'l1', 'l2', 'SP'];
export const tknBtns = ['LK', 'RK', 'LP', 'RP'];
export const scBtns = ['G', 'K', 'A', 'B'];
export const snkBtns = ['B', 'D', 'A', 'C'];

/**
 * Names the axis based on the axis id number
 * @param i - the axis id number
 */
export const AxisToAnalogName = {
  0: 'LS X', 1: 'LS Y', 2: 'RS X', 3: 'RS Y'
};

