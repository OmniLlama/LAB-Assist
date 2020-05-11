import { InputEditorFunctions } from '../input-editor/input-editor-functions';
import { InputConverterComponent, nameButton } from './input-converter.component';
import { InputDisplayComponent } from '../input-display/input-display.component';
import { InputEditorComponent } from '../input-editor/input-editor.component';
import { InputConverterFunctions } from './input-converter-functions';
import * as JZZ from 'jzz';
import { InputConverterVisuals } from './input-converter-visuals';

export class InputConverterEvents {
  /**
     * Updates all controller values, First, the Axes, then, the D-Pad buttons. finally, the Eight main buttons
     */
  static updateController(): void {
    let icc = InputConverterComponent.inpConvComp;
    let idc = InputDisplayComponent.inpDispCmp;
    let iec = InputEditorComponent.inpEdComp;
    let padObj = icc.testPadObj;
    // if(!this.recordingPrimed) return;
    if (iec.song.playing && !icc.trackingNotes) {
      icc.trackedNotes = new Array<[number, number, number]>();
      icc.trackingNotes = true;
    }
    else if (!iec.song.playing && icc.trackingNotes) {
      icc.trackedNotes = null;
      iec.song.update();
      icc.trackingNotes = false;
    }
    /**
     * Update Controller Axes */
    padObj.pad.axes.forEach((a, ind) => {
      let i = (ind * 2);
      let j = (ind * 2) + 1;
      let pitchNum;
      if (a.valueOf() > icc.deadZone) {
        pitchNum = InputConverterEvents.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.stxHeld[j]) {
          icc.stxHeld[j] = true;
          icc.stxHeld[i] = false;
          if (icc.trackingNotes) {
            icc.stxInpStarts[j] = iec.info.totalTicksAtHead;
            let thing = InputEditorFunctions.createNoteEvents(iec,
              icc.stxInpStarts[j],
              icc.stxInpStarts[j] + 128,
              pitchNum, a.valueOf() * 127);
            icc.stxHeldNotes[j] = [thing[0].midiNote, iec.info.totalTicksAtHead];
          }
        }
      } else if (a.valueOf() < -icc.deadZone) {
        pitchNum = InputConverterEvents.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.stxHeld[i]) {
          icc.stxHeld[i] = true;
          icc.stxHeld[j] = false;
          if (icc.trackingNotes) {
            icc.stxInpStarts[i] = iec.info.totalTicksAtHead;
            let thing = InputEditorFunctions.createNoteEvents(iec,
              icc.stxInpStarts[i],
              icc.stxInpStarts[i] + 128,
              pitchNum, -a.valueOf() * 127);
            icc.stxHeldNotes[i] = [thing[0].midiNote, iec.info.totalTicksAtHead];
          }
        }
      } else {
        icc.stxHeld[i] = false;
        icc.stxHeld[j] = false;
      }
      if (icc.trackingNotes) {
        if (icc.stxHeld[j]) {
          icc.stxHeldNotes[j][0].part.moveEvent(icc.stxHeldNotes[j][0].noteOff,
            (iec.info.totalTicksAtHead - icc.stxHeldNotes[j][1]));
          icc.stxHeldNotes[j][1] = iec.info.totalTicksAtHead;
        } else if (icc.stxHeld[i]) {
          icc.stxHeldNotes[i][0].part.moveEvent(icc.stxHeldNotes[i][0].noteOff,
            (iec.info.totalTicksAtHead - icc.stxHeldNotes[i][1]));
          icc.stxHeldNotes[i][1] = iec.info.totalTicksAtHead;
        } else if (!icc.stxHeld[j] && icc.stxHeldNotes[j] != null) {
          icc.stxHeldNotes[j] = null;
        } else if (!icc.stxHeld[i] && icc.stxHeldNotes[i] != null) {
          icc.stxHeldNotes[i] = null;
        }
      }
    });
    /**
     * Update Controller Digital Pad
     */
    let dPadBtns: readonly GamepadButton[] = padObj.DPad();
    let dpadIconDivs = document.getElementsByClassName('editor-input-icon-direction');
    dPadBtns.forEach((b, ind) => {
      let pitch = InputConverterFunctions.getDirectionPitchFromDPad(ind);
      if (b.pressed && !icc.dpadHeld[ind]) {
        icc.dpadHeld[ind] = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.dpadInpStarts[ind] = iec.info.scrollTicksAtHead;
          let noteEvts = InputEditorFunctions.createNoteEvents(iec, icc.dpadInpStarts[ind], icc.dpadInpStarts[ind] + 128, pitch);
          icc.dpadHeldNotes[ind] = [noteEvts[0].midiNote, iec.info.scrollTicksAtHead];
          // icc.heldNotes.push(icc.dpadHeldNotes[ind]);
          console.log('hit button while playing');
        }
        //if RELEASED this frame
      } else if (!b.pressed && icc.dpadHeld[ind]) {
        icc.dpadHeld[ind] = false;
        icc.midiOutPort.noteOff(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.dpadInpEnds[ind] = iec.info.scrollTicksAtHead;
          icc.trackedNotes.push([icc.dpadInpStarts[ind], icc.dpadInpEnds[ind], pitch]);
          if (!icc.liveUpdateHeldNotes)
            icc.dpadHeldNotes[ind][0].part.moveEvent(icc.dpadHeldNotes[ind][0].noteOff, (iec.info.scrollTicksAtHead - icc.dpadHeldNotes[ind][0].noteOff.ticks));
          // icc.heldNotes.splice(icc.heldNotes.indexOf(icc.heldNotes[ind]), 1);
        }

      }
      // EXPERIMENTALISISISMZ
      if (icc.trackingNotes) {
        icc.updateHeldNote(icc.dpadHeld[ind], icc.dpadHeldNotes[ind], ind, iec.info.scrollTicksAtHead, icc.liveUpdateHeldNotes)
      }
      var btn = dpadIconDivs[ind] as HTMLDivElement;
      if (btn != undefined) {
        var pressed = b.value > .8;
        if (typeof (b) === 'object') {
          pressed = b.pressed;
        }
        let pct: string = Math.round(b.value * 100) + '%';
        btn.style.backgroundSize = pct + ' ' + pct;
        let imageStr = 'a', dirStr: string;
        switch (ind) {
          case 0: dirStr = 'up'; break;
          case 1: dirStr = 'down'; break;
          case 2: dirStr = 'left'; break;
          case 3: dirStr = 'right'; break;
        }
        imageStr = `<img id="icon-img" src="assets/images/${pressed ? 'pressed_' : ''}${dirStr}.png">`;
        btn.innerHTML = imageStr;
      }
    });
    /**
         * Update Controller Buttons
         */
    let btnIconDivs = document.getElementsByClassName('editor-input-icon');
    let harmMinScaleArr: number[] = [0, 2, 3, 5, 7, 8, 11, 12]; //harmonic minor scale
    let majScaleArr: number[] = [0, 2, 4, 5, 7, 9, 11, 12]; //major scale
    let scale: number[] = harmMinScaleArr;
    let rootNote: number = 51;
    padObj.pad.buttons.forEach((b, ind) => {
      if (ind >= scale.length) return;
      let pitch: string = InputConverterFunctions.getPitchStringFromNumber(scale[ind] + rootNote);
      //if PRESSED this frame
      if (b.pressed && !icc.btnsHeld[ind]) {
        icc.btnsHeld[ind] = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackingNotes) {
          icc.btnInpStarts[ind] = iec.info.scrollTicksAtHead;
          let thing = InputEditorFunctions.createNoteEvents(iec, icc.btnInpStarts[ind], icc.btnInpStarts[ind] + 128, InputConverterFunctions.getButtonPitch(ind));
          icc.btnHeldNotes[ind] = [thing[0].midiNote, iec.info.scrollTicksAtHead];
          // icc.heldNotes.push(icc.dpadHeldNotes[ind]);
        }
        //if RELEASED this frame
      } else if (!b.pressed && icc.btnsHeld[ind]) {
        icc.btnsHeld[ind] = false;
        icc.midiOutPort.noteOff(0, pitch, 127);

        //if RECORDING
        if (icc.trackingNotes) {
          icc.btnInpStarts[ind] = iec.info.scrollTicksAtHead;
          icc.btnInpEnds[ind] = iec.info.scrollTicksAtHead;
          icc.trackedNotes.push([icc.btnInpStarts[ind], icc.btnInpEnds[ind], InputConverterFunctions.getButtonPitch(ind)]);
          if (!icc.liveUpdateHeldNotes)
            icc.btnHeldNotes[ind][0].part.moveEvent(icc.btnHeldNotes[ind][0].noteOff, (iec.info.scrollTicksAtHead - icc.btnHeldNotes[ind][0].noteOff.ticks));
          // icc.heldNotes.splice(icc.heldNotes.indexOf(icc.heldNotes[ind]), 1);
        }
      }
      // EXPERIMENTALISISISMZ
      if (icc.trackingNotes) {
        icc.updateHeldNote(icc.btnsHeld[ind], icc.btnHeldNotes[ind], ind, iec.info.scrollTicksAtHead, icc.liveUpdateHeldNotes);
      }
      let btn = btnIconDivs[ind] as HTMLDivElement;
      if (btn != undefined) {
        let pressed = b.value > .8;
        if (typeof (b) === 'object') {
          pressed = b.pressed;
        }
        let pct = Math.round(b.value * 100) + '%';
        btn.style.backgroundSize = pct + ' ' + pct;
        let btnStr = nameButton(ind);
        let imgStr = `<img id="icon-img" src="assets/images/${pressed ? 'pressed_' : ''}${btnStr}.png">`;
        btn.innerHTML = imgStr;
      }
    });
    if (icc.trackingNotes) {
      icc.heldNotes = icc.heldNotes.filter((x) => x !== undefined);
      if (icc.liveUpdateHeldNotes) {
        // icc.heldNotes.forEach((n) => { n[0].part.moveEvent(n[0].noteOff, (iec.info.scrollTicksAtHead - n[0].noteOff.ticks)); });
        // icc.heldNotes.forEach((n, i) => { this.updateHeldNotes(()) });
      }
    }

    iec.song.update();
    JZZ().refresh();
    InputConverterVisuals.rAF(InputConverterEvents.updateController);
  }
  /**
  * Sends pitch based on which axis direction was sent
  * @param ind
  */
  static getDirectionPitchFromAxis(ind, val): number {
    switch (ind) {
      case 0: if (val > 0) { return 39; } else { return 40; }
      case 1: if (val > 0) { return 37; } else { return 38; }
      case 2: if (val > 0) { return 35; } else { return 36; }
      case 3: if (val > 0) { return 33; } else { return 34; }
    }
  }
}

