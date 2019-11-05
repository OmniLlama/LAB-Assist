var MovementNotationType = {
    Numeric: 1,
    Directional: 2,
    TruncatedDirectional: 3,
    Motional: 4,
    TruncatedMotional: 5
};
var ButtonNotationType = {
    Numeric: 1,
    StreetFighter: 2,
    SNK: 3,
    Netherrealm: 4,
    Tekken: 5,
    SoulCalibur: 6,
    GuiltyGear: 7
};


var convMvmtNoteTypeIn = MovementNotationType.Numeric;
var convMvmtNoteTypeOut = MovementNotationType.Directional;
var convBtnNoteTypeIn = ButtonNotationType.Numeric;
var convBtnNoteTypeOut = ButtonNotationType.Numeric;
var dispBtnNoteType = ButtonNotationType.StreetFighter;

outStr = "";
inStr = "";
splitChar = ' ';

testInputs = ["236HP", "F D DF + MP", "lp, lp, Forward, lk, hp"];

function ButtonLayout(zero, one, two, three, four, five) {
    this.btn0 = zero;
    this.btn1 = one;
    this.btn2 = two;
    this.btn3 = three;
    this.btn4 = four;
    this.btn5 = five;
}
ggBtnLayout = ButtonLayout("P", "K", "S", "HS", "D", "SP");
currBtnLayout = ButtonLayout(0, 1, 2, 3, 4, 5);
testBtnLayout = ButtonLayout(2, 4, 0, 5, 3, 1);

var convInpStr = document.getElementById("convInpStr");
// convInpStr.addEventListener("change", changeInput);
// $(document).ready($("#convBtn").click(convertInput));
// $(document).ready(initConverter);

var mvmtInElmt = document.getElementById("mvmtIn");
var mvmtOutElmt = document.getElementById("mvmtOut");
var btnInElmt = document.getElementById("btnIn");
var btnOutElmt = document.getElementById("btnOut");
var dispBtnElmt = document.getElementById("dispBtn");
// mvmtInElmt.addEventListener("change", function () { convMvmtNoteTypeIn = ChangeEnum(mvmtInElmt, mvmtInElmt.value); });
// mvmtOutElmt.addEventListener("change", function () { convMvmtNoteTypeOut = ChangeEnum(mvmtOutElmt, mvmtOutElmt.value); });
// btnInElmt.addEventListener("change", function () { convBtnNoteTypeIn = ChangeEnum(btnInElmt, btnInElmt.value); });
// btnOutElmt.addEventListener("change", function () { convBtnNoteTypeOut = ChangeEnum(btnOutElmt, btnOutElmt.value); });

// dispBtnElmt.addEventListener("change", function () { dispBtnNoteType = ChangeDisplayEnum(dispBtnElmt, dispBtnElmt.value); });


function initConverter() {
    changeInput();
    mvmtInElmt.value = convMvmtNoteTypeIn;
    mvmtOutElmt.value = convMvmtNoteTypeOut;
    btnInElmt.value = convBtnNoteTypeIn;
    btnOutElmt.value = convBtnNoteTypeOut;
    dispBtnElmt.value = dispBtnNoteType;
}
function changeInput() {
    var inStrArea = document.getElementById("convInpStr");
    inStr = inStrArea.value;
    console.log("changing");
}
function convertInput() {
    tempInStr = inStr;
    strTokes = tempInStr.split(splitChar);
    console.log("Token Cnt: " + strTokes.length + " | " + strTokes.toString());
    if (convMvmtNoteTypeIn != convMvmtNoteTypeOut) {
        ProcessInputs(strTokes);
    }
    else
        console.log("same notation type selected for input and output, please select 2 different notations");
    outStr = inStr;
    displayOutput();
}
function displayOutput() {
    console.log("converting : " + inStr + " ==> " + outStr);
    var outStrh3 = document.getElementById("outStrh3");
    if (outStrh3 != null)
        outStrh3.textContent = outStr;
}

function ProcessInputs(strArr) {
    str = "";
    for (var i in strArr) {
        ProcessToken(strArr[i]);
        str.concat(strArr[i]);
    }
    console.log(str);
}
function ProcessToken(tok) {
    var tok1;
    var tok2;
    console.log("   Proccing Token: " + tok);

    switch (convMvmtNoteTypeIn) {
        case MovementNotationType.Numeric:
            tok1 = tok.split(/[A-Za-z]/)[0];
            break;
        case MovementNotationType.Directional:
            break;
        case MovementNotationType.TruncatedDirectional:
            break;
    }
    switch (convBtnNoteTypeIn) {
        case ButtonNotationType.Numeric:
            tok1 = tok.split(/[A-Za-z]/)[0];
            break;
        case ButtonNotationType.StreetFighter:
            break;
        case ButtonNotationType.SNK:
            break;
        case ButtonNotationType.Netherrealm:
            break;
        case ButtonNotationType.Tekken:
            break;
        case ButtonNotationType.SoulCalibur:
            break;
    }
    for (var t in tok) {
        ProcessCharacter(tok[t]);
    }
}
function ProcessMovementCharacter(ch) {}
function ProcessButtonCharacter(ch) {}
function ProcessCharacter(ch) {
    console.log("       Proccing Character: " + ch);
}


function ChangeEnum(e, v) {
    e.value = v;
    console.log("Changed enum " + e.toString() + " to " + e.value.toString());
    return v;
}
function ChangeDisplayEnum(e, v) {
    e.value = v;
    dispBtnNoteType = v;
    for(var i = 0; i < window.padHTMLShells.length; i++)
    {
        var btnIcons = window.padHTMLShells[i].padButtons;
        for (var j = 0; j < btnIcons.childNodes.length; j++)
        {
            btnIcons.childNodes[j].innerHTML = nameButton(j);
        }
    }
}
