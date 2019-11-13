// import { e_OnLoad } from "./heartbeat/examples/key_editor/editor/hb_main";

var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var controllers = {};
var rAF = window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.requestAnimationFrame;


var padHTMLShells = [];
function connecthandler(e) {
  addgamepad(e.gamepad);
}
function addgamepad(gamepad) {
  controllers[gamepad.index] = gamepad;
  var div_info = document.createElement("div");
  var div_cntrllr = document.createElement("div");
  // var shell = new gamepadHTMLShell();
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
  for (i = 0; i < gamepad.axes.length; i++) { div_axes.appendChild(createAxisMeter(i)); }

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
  delete controllers[gamepad.index];
}

function updateStatus() {
  scangamepads();
  /**
   * Controller Status Loop */
  for (j in controllers) {
    var controller = controllers[j];
    var d = document.getElementById("controller" + j);
    /**
     * Button Status Loop */
    var buttons = d.getElementsByClassName("button");
    for (var i = 0; i < controller.buttons.length; i++) {
      var b = buttons[i];
      var val = controller.buttons[i];
      var pressed = val == 1.0;
      if (typeof (val) == "object") {
        pressed = val.pressed;
        val = val.value;
      }
      var pct = Math.round(val * 100) + "%";
      b.style.backgroundSize = pct + " " + pct;
      if (pressed) {
        // If pressed, switches to the pressed version of the button's image
        let button = nameButton(i)
        let imageString = `<img src="assets/images/pressed_${button}.png" width=80px height=80px>`
        b.innerHTML = imageString
      } else {
        // If released/not pressed, switches to the regular version of the button's image
        let button = nameButton(i)
        let imageString = `<img src="assets/images/${button}.png" width=80px height=80px>`
        b.innerHTML = imageString;
      }
    }
    /**
     * Axis Status Loop */
    var axes = d.getElementsByClassName("axis");
    for (var i = 0; i < controller.axes.length; i++) {
      var a = axes[i];
      a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
      a.setAttribute("value", controller.axes[i]);
    }
  }
  rAF(updateStatus);
}

function scangamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
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
function createButtonIcon(ind, lbl) {
  var e = document.createElement("span");
  e.className = "button";
  //e.id = "b" + i;
  //e.innerHTML = nameButton(ind);

  // This allows me to manipulate the element and leave the current CSS styling.
  // This just adds a span which contains an image of the buttons
  let button = nameButton(ind)
  let imageString = `<img src="assets/images/${button}.png" width=80px height=80px>`
  e.innerHTML = imageString
  // e.innerHTML = i;
  return e;
}
function createAxisMeter(ind) {
  var l = document.createElement("h3");
  l.textContent = nameAxis(ind);
  var e = document.createElement("meter");
  e.className = "axis";
  //e.id = "a" + i;
  e.setAttribute("min", "-1");
  e.setAttribute("max", "1");
  e.setAttribute("value", "0");
  e.innerHTML = ind;
  l.appendChild(e);
  // return e;
  return e;
}
/**
 * Names the button with the proper designation based on button notation selection
 * @param {*} i - the button id number
 */
function nameButton(i) {
  switch (Number.parseInt(window.dispBtnNoteType)) {

    case ButtonNotationType.StreetFighter:
      switch (i) {
        // case 0: return "RP";
        // case 1: return "MK";
        // case 2: return "LP";
        // case 3: return "MP";
        // case 4: return "HP";
        // case 5: return "HK";
        // default: return i;
        case 0: return "a";
        case 1: return "b";
        case 2: return "x";
        case 3: return "y";
        case 4: return "l1";
        case 5: return "r1";
        case 6: return "l2";
        case 7: return "r2";
        default: return i;
      }

    case ButtonNotationType.GuiltyGear:
      {
        switch (i) {
          case 0: return "P";
          case 1: return "D";
          case 2: return "K";
          case 3: return "S";
          case 4: return "HS";
          case 5: return "SP";
          default: return i;
        }
      }
    case ButtonNotationType.SoulCalibur:
      {
        switch (i) {
          case 0: return "G";
          case 1: return "K";
          case 2: return "A";
          case 3: return "B";
          default: return i;
        }
      }
    case ButtonNotationType.Tekken:
      {
        switch (i) {
          case 0: return "LK";
          case 1: return "RK";
          case 2: return "LP";
          case 3: return "RP";
          default: return i;
        }
      }
    case ButtonNotationType.SNK:
      {
        switch (i) {
          case 0: return "B";
          case 1: return "D";
          case 2: return "A";
          case 3: return "C";
          default: return i;
        }
      }
    default:
      return i;
  }
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
    case 4: return "LT";
    case 5: return "RT";
    default:
      break;
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
  console.log("onload in gamepadtest reached!");
  // e_OnLoad();
}
function gamepadHTMLShell(title, axes, buttons) {
  this.padTitle = title;
  this.padAxes = axes;
  this.padButtons = buttons;
}

