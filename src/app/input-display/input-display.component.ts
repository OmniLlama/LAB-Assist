import { Component, OnInit } from '@angular/core';


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
@Component({
  selector: 'app-input-display',
  templateUrl: './input-display.component.html',
  styleUrls: ['./input-display.component.sass'],
})
export class InputDisplayComponent implements OnInit {
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
    gamepads = new Array<Gamepad>();
  }
  getGamepads() { return gamepads; }
}

var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
export var gamepads: Array<Gamepad>;
var rAF = window.requestAnimationFrame;

var padHTMLShells = [];
function connecthandler(e) {
  addgamepad(e.gamepad);
}
function addgamepad(gamepad) {
  gamepads[gamepad.index] = gamepad;
  var div_info = document.createElement("div");
  var div_cntrllr = document.createElement("div");
  div_cntrllr.className = "controller";
  div_cntrllr.setAttribute("id", "controller" + gamepad.index);

  //Create controller id title
  var title = document.createElement("h3");
  title.appendChild(document.createTextNode("gamepad: " + gamepad.id));
  div_info.appendChild(title);
  div_cntrllr.appendChild(div_info);

  //Create Button Icons
  var div_btns = document.createElement("div"); div_btns.className = "gamepad-buttons";
  for (var i = 0; i < gamepad.buttons.length; i++) { div_btns.appendChild(createButtonIcon(i)); }
  //Append Buttons to div
  div_cntrllr.appendChild(div_btns);

  // Create Axis Meters
  var div_axes = document.createElement("div"); div_axes.className = "axes";
  for (i = 0; i < gamepad.axes.length / 2; i++) { div_axes.appendChild(createAxisMeter(i)); }

  //Append Meters to div
  div_cntrllr.appendChild(div_axes);

  padHTMLShells.push(new gamepadHTMLShell(title, div_axes, div_btns));
  //Hide start message
  document.getElementById("start").style.display = "none";
  document.getElementById("controllers").appendChild(div_cntrllr);
  // document.body.appendChild(div);
  rAF(updateStatus);
}

function disconnecthandler(e) {
  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  var d = document.getElementById("controller" + gamepad.index);
  document.body.removeChild(d);
  delete gamepads[gamepad.index];
}

function updateStatus() {
  scangamepads();
  /**
   * Controller Status Loop */
  gamepads.forEach((j) => {
    // for (let h = 0; h < controllers.length; h++) {
    // var controller = controllers[j.id];
    var controller = j;
    var d = document.getElementById("controller" + j.index);
    /**
     * Button Status Loop */
    var divs_Btns = d.getElementsByClassName("button");
    // for (var i = 0; i < controller.buttons.length; i++) {
    for (var i = 0; i <= 7; i++) {
      var b = divs_Btns[i] as HTMLDivElement;
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
     * Axis Status Loop */
    var axes = d.getElementsByClassName("axis");


    // for (var i = 0; i < controller.axes.length/2; i++) {
    //   var a = axes[i];
    //   // console.log(axes.length)
    //   // a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
    //   // console.log(axes[i].innerHTML)
    //   a.setAttribute("value", controller.axes[i]);
    // }

    var leftAxis = axes[0]
    var rightAxis = axes[1]

    if (controller.axes[0] < -0.75 && (controller.axes[1] < 0.4 && controller.axes[1] > -.4)) {
      leftAxis.innerHTML = `<img src="assets/images/pressed_left.png" width=80px height=80px>`
    } else if (controller.axes[1] < -0.75 && (controller.axes[0] < 0.4 && controller.axes[0] > -.4)) {
      leftAxis.innerHTML = `<img src="assets/images/pressed_up.png" width=80px height=80px>`
    } else if (controller.axes[0] > 0.75 && (controller.axes[1] < 0.4 && controller.axes[1] > -.4)) {
      leftAxis.innerHTML = `<img src="assets/images/pressed_right.png" width=80px height=80px>`
    } else if (controller.axes[1] > 0.75 && (controller.axes[0] < 0.4 && controller.axes[0] > -.4)) {
      leftAxis.innerHTML = `<img src="assets/images/pressed_down.png" width=80px height=80px>`
    } else {
      leftAxis.innerHTML = `<img src="assets/images/left.png" width=80px height=80px>`
    }

    if (controller.axes[2] < -0.75 && (controller.axes[3] < 0.4 && controller.axes[3] > -.4)) {
      rightAxis.innerHTML = `<img src="assets/images/pressed_left.png" width=80px height=80px>`
    } else if (controller.axes[3] < -0.75 && (controller.axes[2] < 0.4 && controller.axes[2] > -.4)) {
      rightAxis.innerHTML = `<img src="assets/images/pressed_up.png" width=80px height=80px>`
    } else if (controller.axes[2] > 0.75 && (controller.axes[3] < 0.4 && controller.axes[3] > -.4)) {
      rightAxis.innerHTML = `<img src="assets/images/pressed_right.png" width=80px height=80px>`
    } else if (controller.axes[3] > 0.75 && (controller.axes[2] < 0.4 && controller.axes[2] > -.4)) {
      rightAxis.innerHTML = `<img src="assets/images/pressed_down.png" width=80px height=80px>`
    } else {
      rightAxis.innerHTML = `<img src="assets/images/right.png" width=80px height=80px>`
    }
    if (Math.abs(controller.axes[0]) >= .75) {
    }
  });

  rAF(updateStatus);
}

function scangamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (!(gamepads[i].index in gamepads)) {
        addgamepad(gamepads[i]);
      } else {
        gamepads[gamepads[i].index] = gamepads[i];
      }
    }
  }
}
function createButtonIcon(ind) {
  let button = nameButton(ind)
  var e = document.createElement("span");
  e.className = "button";
  // This if allows me to post the button images to the page for the game. (If Street fighter doesn't need SELECT,
  // there won't be a broken image link for a SELECT button on the page)
  if (button != null) {
    // This allows me to manipulate the element and leave the current CSS styling.
    // This just adds a span which contains an image of the buttons
    let imageString = `<img src="assets/images/${button}.png" width=80px height=80px>`
    e.innerHTML = imageString
  }
  //e.id = "b" + i;
  //e.innerHTML = nameButton(ind);
  // e.innerHTML = i;
  return e;
}

function createAxisMeter(ind) {
  let axisName = nameAxis(ind);
  console.log(axisName)
  var e = document.createElement("span");
  e.className = "axis";

  //e.id = "a" + i;
  e.setAttribute("min", "-1");
  e.setAttribute("max", "1");
  e.setAttribute("value", "0");
  let imageString = `<img src="assets/images/left.png" width=80px height=80px>`
  e.innerHTML = imageString;
  // return e;
  return e;
}
var xbBtns = ['a', 'b', 'x', 'y', 'l1', 'r1', 'l2', 'r2'];
var psBtns = ['X', 'O', '[]', '^', 'l1', 'r1', 'l2', 'r2'];
var sfBtns = ['lk', 'mk', 'lp', 'mp', 'l1', 'hp', 'l2', 'hk'];
var ggBtns = ['P', 'D', 'K', 'S', 'HS', 'l1', 'l2', 'SP'];
var tknBtns = ['LK', 'RK', 'LP', 'RP'];
var scBtns = ['G', 'K', 'A', 'B'];
var snkBtns = ['B', 'D', 'A', 'C'];
/**
 * Names the button with the proper designation based on button notation selection
 * @param {*} i - the button id number
 */
export function nameButton(i) {
  switch (InputDisplayComponent.inpDispCmp.butNotTy) {
    case ButtonNotationType.StreetFighter:
      return (xbBtns[i] != undefined ? xbBtns[i] : i);
    // return (sfBtns[i] != undefined ? sfBtns[i] : i);
    case ButtonNotationType.GuiltyGear:
      return (ggBtns[i] != undefined ? ggBtns[i] : i);
    case ButtonNotationType.SoulCalibur:
      return (scBtns[i] != undefined ? scBtns[i] : i);
    case ButtonNotationType.Tekken:
      return (tknBtns[i] != undefined ? tknBtns[i] : i);
    case ButtonNotationType.SNK:
      return (snkBtns[i] != undefined ? snkBtns[i] : i);
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
class GamepadObject {
  axes: number[];
  buttons: GamepadButton;
  connected: boolean = false;
  id: string;
  index: number;
  mapping: string;
  timestamp: number;
  vibrationActuator: GamepadHapticActuator;
  constructor(gp, a, b, c, i1, i2, m, ts, va) {
    if (gp !== null) {
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
      this.mapping = m;
      this.timestamp = ts;
      this.vibrationActuator = va;
    }
  }
}

