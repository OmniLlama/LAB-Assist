import {InputEditorFunctions} from '../input-editor/input-editor-functions';
import {InputConverterComponent, nameButton, Tracker} from './input-converter.component';
import {InputDisplayComponent} from '../input-display/input-display.component';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {InputConverterFunctions} from './input-converter-functions';
import * as JZZ from 'jzz';
import {InputConverterVisuals} from './input-converter-visuals';
import {MIDINote} from 'heartbeat-sequencer';

export class InputConverterEvents {
  /**
   * Updates all controller values, First, the Axes, then, the D-Pad buttons. finally, the Eight main buttons
   */
  static updateController(): void {
    let icc = InputConverterComponent.inpConvComp;
    let idc = InputDisplayComponent.inpDispCmp;
    let iec = InputEditorComponent.inpEdComp;
    let padObj = icc.testPadObj;
    if (iec.song.playing && !icc.trackNotes) {
      icc.trackedNotes = new Array<[number, number, number]>();
      icc.trackNotes = true;
    } else if (!iec.song.playing && icc.trackNotes) {
      icc.trackedNotes = null;
      iec.song.update();
      icc.trackNotes = false;
    }
    /**
     * Update Controller Axes */
    padObj.pad.axes.forEach((a, ind) => {
      const i = (ind * 2);
      const j = (ind * 2) + 1;
      let pitchNum;
      if (a.valueOf() > icc.deadZone) {
        pitchNum = InputConverterEvents.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.stxHeld[j]) {
          icc.stxHeld[j] = true;
          icc.stxHeld[i] = false;
          if (icc.trackNotes) {
            icc.stxInpStarts[j] = iec.info.scrollTicksAtHead;
            let thing = InputEditorFunctions.createNoteEvents(
              icc.stxInpStarts[j],
              icc.stxInpStarts[j] + 128,
              pitchNum,
              a.valueOf() * 127);
            icc.stxHeldNotes[j] = [thing[0].midiNote, iec.info.scrollTicksAtHead];
          }
        }
      } else if (a.valueOf() < -icc.deadZone) {
        pitchNum = InputConverterEvents.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!icc.stxHeld[i]) {
          icc.stxHeld[i] = true;
          icc.stxHeld[j] = false;
          if (icc.trackNotes) {
            icc.stxInpStarts[i] = iec.info.scrollTicksAtHead;
            let thing = InputEditorFunctions.createNoteEvents(
              icc.stxInpStarts[i],
              icc.stxInpStarts[i] + 128,
              pitchNum, -a.valueOf() * 127);
            icc.stxHeldNotes[i] = [thing[0].midiNote, iec.info.scrollTicksAtHead];
          }
        }
      } else {
        icc.stxHeld[i] = false;
        icc.stxHeld[j] = false;
      }
      if (icc.trackNotes) {
        if (icc.stxHeld[j]) {
          icc.stxHeldNotes[j][0].part.moveEvent(icc.stxHeldNotes[j][0].noteOff,
            (iec.info.scrollTicksAtHead - icc.stxHeldNotes[j][1]));
          icc.stxHeldNotes[j][1] = iec.info.scrollTicksAtHead;
        } else if (icc.stxHeld[i]) {
          icc.stxHeldNotes[i][0].part.moveEvent(icc.stxHeldNotes[i][0].noteOff,
            (iec.info.scrollTicksAtHead - icc.stxHeldNotes[i][1]));
          icc.stxHeldNotes[i][1] = iec.info.scrollTicksAtHead;
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
      // let dPadBtns: readonly GamepadButton[] = padObj.DPad();
    let dPadBtns: readonly GamepadButton[] = padObj.DPadURLD();
    // let dpadIconDivs = document.getElementsByClassName('editor-input-icon-direction');
    let dpadIconDivs = Array.from(document.getElementById('editor-input-icons-dir').querySelectorAll('div'));
    dPadBtns.forEach((b, idx) => {
      let trkr = icc.dpadTrackGroup[idx];
      let pitch = InputConverterFunctions.getDirectionPitchFromDPad(idx);
      if (b.pressed && !trkr.held) {
        trkr.held = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackNotes) {
          InputConverterEvents.startTracker(trkr, iec.info.scrollTicksAtHead, pitch);
        }
        //if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        trkr.held = false;
        icc.midiOutPort.noteOff(0, pitch, 127);
        //if RECORDING
        if (icc.trackNotes) {
          InputConverterEvents.endTracker(trkr, iec.info.scrollTicksAtHead, pitch, icc.trackedNotes, icc.liveUpdateHeldNotes);
        }

      }
      // EXPERIMENTALISISISMZ
      if (icc.trackNotes) {
        InputConverterEvents.updateHeldNote(icc.dpadHeld[idx], trkr.heldNote, idx, iec.info.scrollTicksAtHead, icc.liveUpdateHeldNotes);
      }
      let btn = dpadIconDivs[idx] as HTMLDivElement;
      if (btn != undefined) {
        let pressed = b.value > .8;
        if (typeof (b) === 'object') {
          pressed = b.pressed;
        }
        let pct: string = Math.round(b.value * 100) + '%';
        btn.style.backgroundSize = pct + ' ' + pct;
        let imageStr = 'a', dirStr: string;
        switch (idx) {
          case 0:
            dirStr = 'up';
            break;
          case 1:
            dirStr = 'down';
            break;
          case 2:
            dirStr = 'left';
            break;
          case 3:
            dirStr = 'right';
            break;
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
    padObj.pad.buttons.forEach((b, idx) => {
      if (idx >= scale.length) {
        return;
      }
      let trkr = icc.btnTrackGroup[idx];
      let pitch: string = InputConverterFunctions.getPitchStringFromNumber(scale[idx] + rootNote);
      //if PRESSED this frame
      if (b.pressed && !trkr.held) {
        trkr.held = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackNotes) {
          InputConverterEvents.startTracker(trkr,
            iec.info.scrollTicksAtHead,
            InputConverterFunctions.getButtonPitch(idx));
        }
        //if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        trkr.held = false;
        icc.midiOutPort.noteOff(0, pitch, 127);

        //if RECORDING
        if (icc.trackNotes) {
          InputConverterEvents.endTracker(trkr,
            iec.info.scrollTicksAtHead,
            InputConverterFunctions.getButtonPitch(idx),
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        }
      }
      // EXPERIMENTALISISISMZ
      if (icc.trackNotes) {
        InputConverterEvents.updateHeldNote(icc.btnsHeld[idx], trkr.heldNote, idx, iec.info.scrollTicksAtHead, icc.liveUpdateHeldNotes);
      }
      let btn = btnIconDivs[idx] as HTMLDivElement;
      if (btn != undefined) {
        let pressed = b.value > .8;
        if (typeof (b) === 'object') {
          pressed = b.pressed;
        }
        let pct = Math.round(b.value * 100) + '%';
        btn.style.backgroundSize = pct + ' ' + pct;
        let btnStr = nameButton(idx);
        let imgStr = `<img id="icon-img" src="assets/images/${pressed ? 'pressed_' : ''}${btnStr}.png">`;
        btn.innerHTML = imgStr;
      }
    });
    if (icc.trackNotes) {
      // icc.heldNotes = icc.heldNotes.filter((x) => x);
      // icc.trackedNotes = icc.trackedNotes.filter((x) => x);
      // console.log(icc.trackedNotes.length);
      if (icc.liveUpdateHeldNotes) {
        // icc.heldNotes.forEach((n) => { n[0].part.moveEvent(n[0].noteOff, (iec.info.scrollTicksAtHead - n[0].noteOff.ticks)); });
        // icc.heldNotes.forEach((n, i) => { this.updateHeldNotes(()) });
      }
    }

    iec.song.update();
    // JZZ().refresh();
    InputConverterVisuals.rAF(InputConverterEvents.updateController);
  }

  /**
   * Sends pitch based on which axis direction was sent
   * @param ind
   */
  static getDirectionPitchFromAxis(ind, val): number {
    switch (ind) {
      case 0:
        if (val > 0) {
          return 39;
        } else {
          return 40;
        }
      case 1:
        if (val > 0) {
          return 37;
        } else {
          return 38;
        }
      case 2:
        if (val > 0) {
          return 35;
        } else {
          return 36;
        }
      case 3:
        if (val > 0) {
          return 33;
        } else {
          return 34;
        }
    }
  }

  static startTrackedNote(ticks: number, pitch: number, starts: number[], heldNotes: Array<[MIDINote, number]>, i: number) {
    starts[i] = ticks;
    let noteEvts = InputEditorFunctions.createNoteEvents(starts[i], starts[i] + 128, pitch);
    heldNotes[i] = [noteEvts[0].midiNote, ticks];
    // console.log('hit button while playing');
  }


  static updateHeldNote(held: boolean, heldNote: MIDINote, idx: number, pos: number, liveUpdate: boolean) {
    if (held) {
      if (liveUpdate) {
        heldNote.part.moveEvent(heldNote.noteOff, (pos - heldNote.noteOff.ticks));
      }
      // heldNote[1] = pos;
    }
    // else if (!held && heldNote != null) {
    //   heldNote[idx] = null;
    // }
  }

  static endTrackedNote(ticks: number, pitch: number, starts: number[], ends: number[], heldNote: [MIDINote, number], trackedNotes: Array<[number, number, number]>,
                        i: number, liveUpdate = false) {
    ends[i] = ticks;
    trackedNotes.push([starts[i], ends[i], pitch]);
    if (!liveUpdate) {
      heldNote[0].part.moveEvent(heldNote[0].noteOff, (ticks - heldNote[0].noteOff.ticks + 128));
    }
  }

  static startTracker(trkr: Tracker, ticks: number, pitch: number) {
    trkr.inpStart = ticks;
    let noteEvts = InputEditorFunctions.createNoteEvents(trkr.inpStart, trkr.inpStart + 128, pitch);
    trkr.heldNote = noteEvts[0].midiNote;
  }

  static endTracker(trkr: Tracker, ticks: number, pitch: number, trackedNotes: Array<[number, number, number]>,
                    liveUpdate = false) {
    trkr.inpEnd = ticks;
    trackedNotes.push([trkr.inpStart, trkr.inpEnd, pitch]);
    if (!liveUpdate) {
      trkr.heldNote.part.moveEvent(trkr.heldNote.noteOff, (ticks - trkr.heldNote.noteOff.ticks + 128));
    }
  }
}

