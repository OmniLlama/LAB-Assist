import { Component, OnInit } from '@angular/core';
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
export var controllers: Array<Gamepad>;
export var gamepadObjects: Array<GamepadObject>;
@Component({
  selector: 'app-input-display',
  templateUrl: './input-display.component.html',
  styleUrls: ['./input-display.component.sass'],
})
export class InputDisplayComponent implements OnInit {
  // controllers: Array<Gamepad>;
  gamepadObjects: Array<GamepadObject>;
  static inpDispCmp: InputDisplayComponent;
  mvNotTy: MovementNotationType;
  mvNotTypes = MovementNotationType;
  butNotTy: ButtonNotationType = ButtonNotationType.StreetFighter;
  butNotTypes = ButtonNotationType;
  mntKeys = Object.keys(MovementNotationType);
  bntKeys = Object.keys(ButtonNotationType);
  constructor() { }

  ngOnInit() {
    InputDisplayComponent.inpDispCmp = this;
    controllers = new Array<Gamepad>();
    gamepadObjects = new Array<GamepadObject>();
  }
  getControllers() { return controllers; }
}

var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var rAF = window.requestAnimationFrame;
var btnDivs: Array<HTMLDivElement>;

var padHTMLShells = [];
/**
 * Handles the connecting event of a gamepad
 * @param e event
 */
function connecthandler(e) {
  addgamepad(e.gamepad);
}
/**
 * The addgamepad function is large and does most of the work in this component.
 * First, it sets the current gamepad to the array of controllers.
 * Next, it creates a series of div elements where things such as gamepad info, gamepad buttons, and gamepad arrows will live.
 * After the divs, it creates the arrow icons through a switch statement.
 * After creating the arrows, the gamepad buttons are created through similar means.
 * @param gamepad gamepad to be added
 */
function addgamepad(gamepad) {
  controllers[gamepad.index] = gamepad;
  gamepadObjects[gamepad.index] = new GamepadObject(gamepad);
  btnDivs = new Array<HTMLDivElement>();
  var div_info = document.createElement("div");
  var div_cntrllr = document.createElement("div");
  div_cntrllr.className = "controller";
  div_cntrllr.setAttribute("id", "controller" + gamepad.index);

  //Create controller id title
  var title = document.createElement("h6");
  title.appendChild(document.createTextNode("gamepad: " + gamepad.id));
  div_info.appendChild(title);
  div_cntrllr.appendChild(div_info);
  var div_arrows = document.createElement("div");
  div_arrows.className = "grid3x3";
  for (let i = 0; i < 9; i++) {
    let singleArrow = document.createElement("div");
    singleArrow.className = "directionalArrows";

    switch (i) {
      case 0: singleArrow.innerHTML = `<img src="assets/images/left.png" width=80px height=80px>`; break;
      case 1: singleArrow.innerHTML = `<img src="assets/images/up.png" width=80px height=80px>`; break;
      case 2: singleArrow.innerHTML = `<img src="assets/images/up.png" width=80px height=80px>`; break;
      case 3: singleArrow.innerHTML = `<img src="assets/images/left.png" width=80px height=80px>`; break;
      case 4: singleArrow.innerHTML = `<img src="assets/images/ls.png" width=80px height=80px>`; break;
      case 5: singleArrow.innerHTML = `<img src="assets/images/right.png" width=80px height=80px>`; break;
      case 6: singleArrow.innerHTML = `<img src="assets/images/down.png" width=80px height=80px>`; break;
      case 7: singleArrow.innerHTML = `<img src="assets/images/down.png" width=80px height=80px>`; break;
      case 8: singleArrow.innerHTML = `<img src="assets/images/right.png" width=80px height=80px>`; break;
    }
    div_arrows.appendChild(singleArrow);
  }
  div_cntrllr.appendChild(div_arrows);


  //Create Button Icons
  var div_btns = document.createElement("div"); div_btns.className = "grid4x2";
  // var div_btns = document.createElement("div"); div_btns.className = "gamepad-buttons";
  // for (var i = 0; i < gamepad.buttons.length; i++) { div_btns.appendChild(createButtonIcon(i)); }
  let btnOrder = gamepadObjects[gamepad.index].getArcadeLayoutButtonNumbers();
  for (let btnNum of btnOrder) {
    let div = createButtonIcon(btnNum);
    div_btns.appendChild(div);
    btnDivs.push(div);
  }
  //Append Buttons to div
  div_cntrllr.appendChild(div_btns);

  // Create Axis Meters
  var div_axes = document.createElement("div"); div_axes.className = "axes";
  for (let i = 0; i < gamepad.axes.length / 4; i++) { div_axes.appendChild(createAxisMeter(i)); }
  //Append Meters to div
  div_cntrllr.appendChild(div_axes);

  padHTMLShells.push(new gamepadHTMLShell(title, div_axes, div_btns));
  //Hide start message
  document.getElementById("start").style.display = "none";
  document.getElementById("controllers").appendChild(div_cntrllr);
  // document.body.appendChild(div);
  rAF(updateStatus);
}
/**
 * Handles the disconnecting event of a gamepad
 * @param e event
 */
function disconnecthandler(e) {
  removegamepad(e.gamepad);
}
/**
 * Handles the removing of a gamepad element from the controller array
 * @param gamepad
 */
function removegamepad(gamepad) {
  var d = document.getElementById("controller" + gamepad.index);
  document.body.removeChild(d);
  delete controllers[gamepad.index];
}
/**
 * The updateStatus function handles the updates that happen to gamepad input.
 * First, it iterates through all the buttons on the gamepad.
 * If any buttons are pressed, they will light up on the interface.
 * This is achieved by swapping the default image with a "pressed" image.
 * (lb.png and pressed_lb.png).
 * The same process then happens for the directional arrows on the gamepad.
 */
function updateStatus() {
  scangamepads();
  /**
   * Controller Status Loop */
  controllers.forEach((j, ind) => {
    // for (let h = 0; h < controllers.length; h++) {
    // var controller = controllers[j.id];
    var controller = j;
    var d = document.getElementById("controller" + j.index);
    /**
     * Button Status Loop */
    // var divs_Btns = d.getElementsByClassName("gamepad-buttons");
    // for (var i = 0; i < controller.buttons.length; i++) {
    for (let i of gamepadObjects[ind].getArcadeLayoutButtonNumbers()) {
      // for (var i = 0; i <= 7; i++) {
      // var b = divs_Btns[i] as HTMLDivElement;
      var b = btnDivs[i];
      if (b == undefined) { break; }
      var val = controller.buttons[i];
      var pressed = val.value > .8;
      if (typeof (val) == "object") {
        pressed = val.pressed;
        // val = val.value;
      }
      var pct = Math.round(val.value * 100) + "%";
      b.style.backgroundSize = pct + " " + pct;
      let imageString = 'a';
      let buttonString = 'a';
      if (pressed) {
        // If pressed, switches to the pressed version of the button's image
        buttonString = nameButton(i);
        imageString = `<img src="assets/images/pressed_${buttonString}.png" width=80px height=80px>`;
        b.innerHTML = imageString;
      } else {
        // If released/not pressed, switches to the regular version of the button's image
        buttonString = nameButton(i);
        imageString = `<img src="assets/images/${buttonString}.png" width=80px height=80px>`;
        b.innerHTML = imageString;
      }
    }
    /**
     * Get Axis Status */
    var axes = d.getElementsByClassName("axis");
    var leftAxis = axes[0]
    // var rightAxis = axes[1]
    var arrowsArray = d.getElementsByClassName('directionalArrows')
    getJoystickDirections(controller, leftAxis, arrowsArray)
  });

  rAF(updateStatus);
}
/**
 * The getJoystickDirections function looks at the axes of the controller.
 * Based on current axes information [0, 0, 0, 0].
 * You can tell what direction the joystick is going.
 * Based on the direction of the joystick, the correct image for that direction is chosen.
 * If the joystick is currently not going in any direction, all the icons will be reset to their regular image.
 * @param controller
 * @param leftAxis
 * @param arrowsArray
 */
function getJoystickDirections(controller, leftAxis, arrowsArray) {
  // First handle diagonal directions, and override them with Left/Right/Up/Down if needed
  if (controller.axes[0] < -0.4 && controller.axes[1] < -0.4) {
    arrowsArray[0].innerHTML = `<img src="assets/images/pressed_up_left.png" width=80px height=80px>`;
    let index = 0;
    resetArrows(arrowsArray, index);
  } else if (controller.axes[0] < -0.4 && controller.axes[1] > 0.4) {
    arrowsArray[6].innerHTML = `<img src="assets/images/pressed_down_left.png" width=80px height=80px>`;
    let index = 6;
    resetArrows(arrowsArray, index);
  } else if (controller.axes[0] > 0.4 && controller.axes[1] < -0.4) {
    arrowsArray[2].innerHTML = `<img src="assets/images/pressed_up_right.png" width=80px height=80px>`;
    let index = 2;
    resetArrows(arrowsArray, index);
  } else if (controller.axes[0] > 0.4 && controller.axes[1] > 0.4) {
    arrowsArray[8].innerHTML = `<img src="assets/images/pressed_down_right.png" width=80px height=80px>`;
    let index = 8;
    resetArrows(arrowsArray, index);
  }

  // Now handle all the regular directions, if the constraints for diagonal directions are not met
  else if (controller.axes[0] < -0.75 && (controller.axes[1] < 0.4 && controller.axes[1] > -.4)) {
    arrowsArray[3].innerHTML = `<img src="assets/images/pressed_left.png" width=80px height=80px>`;
    let index = 3;
    resetArrows(arrowsArray, index);
  } else if (controller.axes[1] < -0.75 && (controller.axes[0] < 0.4 && controller.axes[0] > -.4)) {
    arrowsArray[1].innerHTML = `<img src="assets/images/pressed_up.png" width=80px height=80px>`;
    let index = 1;
    resetArrows(arrowsArray, index);
  } else if (controller.axes[0] > 0.75 && (controller.axes[1] < 0.4 && controller.axes[1] > -.4)) {
    arrowsArray[5].innerHTML = `<img src="assets/images/pressed_right.png" width=80px height=80px>`;
    let index = 5;
    resetArrows(arrowsArray, index);
  } else if (controller.axes[1] > 0.75 && (controller.axes[0] < 0.4 && controller.axes[0] > -.4)) {
    arrowsArray[7].innerHTML = `<img src="assets/images/pressed_down.png" width=80px height=80px>`;
    let index = 7;
    resetArrows(arrowsArray, index);
  } else {
    arrowsArray[0].innerHTML = `<img src="assets/images/up_left.png" width=80px height=80px>`;
    arrowsArray[1].innerHTML = `<img src="assets/images/up.png" width=80px height=80px>`;
    arrowsArray[2].innerHTML = `<img src="assets/images/up_right.png" width=80px height=80px>`;
    arrowsArray[3].innerHTML = `<img src="assets/images/left.png" width=80px height=80px>`;
    arrowsArray[4].innerHTML = `<img src="assets/images/ls.png" width=80px height=80px>`;
    arrowsArray[5].innerHTML = `<img src="assets/images/right.png" width=80px height=80px>`;
    arrowsArray[6].innerHTML = `<img src="assets/images/down_left.png" width=80px height=80px>`;
    arrowsArray[7].innerHTML = `<img src="assets/images/down.png" width=80px height=80px>`;
    arrowsArray[8].innerHTML = `<img src="assets/images/down_right.png" width=80px height=80px>`;
  }

  // Same as above, but now for the Right Stick
  // if ( controller.axes[2] < -0.4 && controller.axes[3] < -0.4 ) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_up_left.png" width=80px height=80px>`
  // } else if ( controller.axes[2] < -0.4 && controller.axes[3] > 0.4 ) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_down_left.png" width=80px height=80px>`
  // } else if ( controller.axes[2] > 0.4 && controller.axes[3] < -0.4 ) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_up_right.png" width=80px height=80px>`
  // } else if ( controller.axes[2] > 0.4 && controller.axes[3] > 0.4 ) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_down_right.png" width=80px height=80px>`
  // }

  //   else if ( controller.axes[2] < -0.75 && ( controller.axes[3] < 0.4 && controller.axes[3] > -.4 )) {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_left.png" width=80px height=80px>`
  // } else if (controller.axes[3] < -0.75 && ( controller.axes[2] < 0.4 && controller.axes[2] > -.4 ))  {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_up.png" width=80px height=80px>`
  // }  else if (controller.axes[2] > 0.75 && ( controller.axes[3] < 0.4 && controller.axes[3] > -.4 ))  {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_right.png" width=80px height=80px>`
  // } else if (controller.axes[3] > 0.75 && ( controller.axes[2] < 0.4 && controller.axes[2] > -.4 ))  {
  //   rightAxis.innerHTML = `<img src="assets/images/pressed_down.png" width=80px height=80px>`
  // } else {
  //   rightAxis.innerHTML = `<img src="assets/images/rs.png" width=80px height=80px>`
  // }
}

/**
 * The getJoystickDirections function looks at the axes of the controller.
 * Based on current axes information [0, 0, 0, 0].
 * You can tell what direction the joystick is going.
 * Based on the direction of the joystick, the correct image for that direction is chosen.
 *  If the joystick is currently not going in any direction, all the icons will be reset to their regular image.
 * @param arrowsArray
 * @param index
 */
function resetArrows(arrowsArray, index) {
  for (let i = 0; i < arrowsArray.length; i++) {
    if (i != index) {
      arrowsArray[i].innerHTML = returnXboxArrows(i);
    }
  }
}
/**
 * The scangamepads function scans for any gamepads that are connected.
 * If a gamepad is detected and is currently not in the controller array, it will be added to the array.
 */
// In order to compile, I had to comment out the ternary statement.
// webkitGetGamepads shows up as not being available on navigator when using Typescript for whatever reason :(
function scangamepads() {
  //var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  var gamepads;
  if (navigator.getGamepads) {
    gamepads = navigator.getGamepads();
  }
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (!(gamepads[i].index in controllers)) {
        addgamepad(gamepads[i]);
      } else {
        controllers[gamepads[i].index] = gamepads[i];
      }
    }
  }
}
/**
 * The createButtonIcon creates the gamepad button icons.
 * Button inputs have unique indexes based on specific controllers, and we specified the inputs below.
 * If (0) is passed into this function, an image will come up for the Xbox A button.
 * This function sets the default images by DOM manipulation, which get changed by the scangamepads function above.
 * @param ind
 */
function createButtonIcon(ind) {
  let button = nameButton(ind)
  var e = document.createElement("div");
  e.className = "gamepad-buttons";
  // This if allows me to post the button images to the page for the game. (If Street fighter doesn't need SELECT,
  // there won't be a broken image link for a SELECT button on the page)
  if (button != null) {
    // This allows me to manipulate the element and leave the current CSS styling.
    // This just adds a span which contains an image of the buttons
    let imageString = `<img src="assets/images/${button}.png" width=80px height=80px>`;
    e.innerHTML = imageString;
  }
  //e.id = "b" + i;
  //e.innerHTML = nameButton(ind);
  // e.innerHTML = i;
  return e;
}
/**
 * The createAxisMeter function gets passed one axis at a time, until there are 2 axes (x and y).
 * It then assigns each axis a default value of 0, min of -1, and max of 1 so that we can tell the direction of the joystick easily.
 * @param ind
 */
function createAxisMeter(ind) {
  let axisName = nameAxis(ind);
  console.log(axisName)
  var e = document.createElement("span");
  e.className = "axis";

  //e.id = "a" + i;
  e.setAttribute("min", "-1");
  e.setAttribute("max", "1");
  e.setAttribute("value", "0");
  // let imageString = `<img src="assets/images/left.png" width=80px height=80px>`
  // e.innerHTML = imageString;
  // return e;
  return e;
}
export var xbBtns = ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt'];
export var psBtns = ['X', 'O', '[]', '^', 'l1', 'r1', 'l2', 'r2'];
export var sfBtns = ['lk', 'mk', 'lp', 'mp', 'l1', 'hp', 'l2', 'hk'];
export var ggBtns = ['P', 'D', 'K', 'S', 'HS', 'l1', 'l2', 'SP'];
export var tknBtns = ['LK', 'RK', 'LP', 'RP'];
export var scBtns = ['G', 'K', 'A', 'B'];
export var snkBtns = ['B', 'D', 'A', 'C'];

/**
 * The returnXboxArrows function gets passed a button index.
 * If the index is found in the list, the image tag string for that joystick direction will get returned.
 * This function is used to make all the other arrows look "non-pressed" when the user changes the joystick direction.
 * @param i
 */
function returnXboxArrows(i) {
  switch (i) {
    case 0: return `<img src="assets/images/up_left.png" width=80px height=80px>`;
    case 1: return `<img src="assets/images/up.png" width=80px height=80px>`;
    case 2: return `<img src="assets/images/up_right.png" width=80px height=80px>`;
    case 3: return `<img src="assets/images/left.png" width=80px height=80px>`;
    case 4: return `<img src="assets/images/ls.png" width=80px height=80px>`;
    case 5: return `<img src="assets/images/right.png" width=80px height=80px>`;
    case 6: return `<img src="assets/images/down_left.png" width=80px height=80px>`;
    case 7: return `<img src="assets/images/down.png" width=80px height=80px>`;
    case 8: return `<img src="assets/images/down_right.png" width=80px height=80px>`;
  }
}


/**
 * Names the button with the proper designation based on button notation selection
 * @param {*} i - the button id number
 */
export function nameButton(i) {
  switch (InputDisplayComponent.inpDispCmp.butNotTy) {
    case ButtonNotationType.StreetFighter: return (xbBtns[i] !== undefined ? xbBtns[i] : null);
    case ButtonNotationType.GuiltyGear: return (ggBtns[i] !== undefined ? ggBtns[i] : i);
    case ButtonNotationType.SoulCalibur: return (scBtns[i] !== undefined ? scBtns[i] : i);
    case ButtonNotationType.Tekken: return (tknBtns[i] !== undefined ? tknBtns[i] : i);
    case ButtonNotationType.SNK: return (snkBtns[i] !== undefined ? snkBtns[i] : i);
  }
  return i;
}
/**
 * Names the axis based on the axis id number
 * @param {*} i - the axis id number
 */
function nameAxis(i) {
  switch (i) {
    case 0: return "LS X";
    case 1: return "LS Y";
    case 2: return "RS X";
    case 3: return "RS Y";
    // case 4: return "LT";
    // case 5: return "RT";
    default:
      return null;
  }
}
/**
 * EVENTS
 */
if (haveEvents) {
  window.addEventListener("gamepadconnected", connecthandler);
  window.addEventListener("gamepaddisconnected", disconnecthandler);
} else if (haveWebkitEvents) {
  window.addEventListener("webkitgamepadconnected", connecthandler);
  window.addEventListener("webkitgamepaddisconnected", disconnecthandler);
} else {
  setInterval(scangamepads, 500);
}

window.onload = function () {
  // console.log("onload in gamepadtest reached!");
}
/**
 * not used much, but still necessary collection of elements for each controller
 */
class gamepadHTMLShell {
  padTitle: HTMLHeadElement;
  padAxes: HTMLDivElement[];
  padButtons: HTMLDivElement[];
  constructor(title, axes, buttons) {
    this.padTitle = title;
    this.padAxes = axes;
    this.padButtons = buttons;
  }
}
/**
 * layer class to traditional gamepad API, handles many of the adaptations and customizations needed for our highly modular design
 */
export class GamepadObject {
  type: GamepadType;
  pad: Gamepad;
  axes: number[];
  buttons: GamepadButton[];
  connected: boolean = false;
  id: string;
  index: number;
  mapping: string;
  timestamp: number;
  vibrationActuator: GamepadHapticActuator;
  constructor(gp, a?, b?, c?, i1?, i2?, m?, ts?, va?, ty?) {
    if (gp !== null && gp !== undefined) {
      this.pad = gp;
      this.type = this.getType(gp.id);
      this.axes = gp.axes;
      this.buttons = gp.buttons;
      this.connected = gp.connected;
      this.id = gp.id;
      this.index = gp.index;
      this.mapping = gp.mapping;
      this.timestamp = gp.timestamp;
      this.vibrationActuator = gp.vibrationActuator;
    } else {
      this.axes = a;
      this.buttons = b;
      this.connected = c;
      this.id = i1;
      this.index = i2;
      this.type = ty;
      this.mapping = m;
      this.timestamp = ts;
      this.vibrationActuator = va;
    }
  }
  /**
   * parses the manufacturer and other info to determine the type of layout needed
   * @param str
   */
  getType(str: string): GamepadType {
    str = str.toLowerCase();
    if (str.includes(GamepadTypeString.XInput)) { return GamepadType.XInput; }
    else if (str.includes(GamepadTypeString.Playstation)) { return GamepadType.Playstation; }
    else if (str.includes(GamepadTypeString.Qanba)) { return GamepadType.Qanba; }
    else { return GamepadType.Generic; }
  }
  /**
   * returns the order that the main buttons should be presented, depending upon the manufacturer and standard
   */
  getArcadeLayoutButtonNumbers(): number[] {
    switch (this.type) {
      case GamepadType.XInput:
        // return [2, 3, 5, 4, 0, 1, 7, 6];
        return [0, 1, 2, 3, 4, 5, 6, 7];
      default:
        return [0, 1, 2, 3, 4, 5, 6, 7];
      // return [0, 0, 0, 0, 0, 0, 0, 0];
    }
  }
  /**
 * returns the order that the d-pads buttons should be presented, depending upon the manufacturer and standard
 */
  getDPadButtonNumbers(): number[] {
    switch (this.type) {
      case GamepadType.XInput:
        return [12, 13, 14, 15];
      default:
        return [12, 13, 14, 15];
    }
  }
}

