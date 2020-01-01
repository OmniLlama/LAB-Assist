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
