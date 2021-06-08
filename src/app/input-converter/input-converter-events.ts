import {InputEditorFunctions} from '../input-editor/input-editor-functions';
import {InputConverterComponent, nameButton, Tracker} from './input-converter.component';
import {InputDisplayComponent} from '../input-display/input-display.component';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {InputConverterFunctions} from './input-converter-functions';
import * as JZZ from 'jzz';
import {InputConverterVisuals} from './input-converter-visuals';
import {MIDINote, Part} from 'heartbeat-sequencer';

declare let sequencer: any;

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
      icc.stxPart = sequencer.createPart(),
        icc.dpadPart = sequencer.createPart(),
        icc.btnPart = sequencer.createPart();
      iec.song.tracks[0].addPartAt(icc.stxPart, ['ticks', iec.info.scrollTicksAtHead]);
      iec.song.tracks[0].addPartAt(icc.dpadPart, ['ticks', iec.info.scrollTicksAtHead]);
      iec.song.tracks[0].addPartAt(icc.btnPart, ['ticks', iec.info.scrollTicksAtHead]);
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
      const neg = icc.stxTrackerGroup[i];
      const pos = icc.stxTrackerGroup[j];
      let pitchNum;
      if (a.valueOf() > icc.deadZone) {
        pitchNum = InputConverterEvents.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!pos.held) {
          pos.held = true;
          neg.held = false;
          if (icc.trackNotes) {
            pos.inpStart = iec.info.scrollTicksAtHead;
            let thing = InputEditorFunctions.createNoteFromTicks(
              pos.inpStart,
              pos.inpStart + 128,
              pitchNum,
              a.valueOf() * 127,
              icc.stxPart);
            pos.heldNote = thing[0].midiNote;
          }
        }
      } else if (a.valueOf() < -icc.deadZone) {
        pitchNum = InputConverterEvents.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!neg.held) {
          pos.held = false;
          neg.held = true;
          if (icc.trackNotes) {
            neg.inpStart = iec.info.scrollTicksAtHead;
            let thing = InputEditorFunctions.createNoteFromTicks(
              neg.inpStart,
              neg.inpStart + 128,
              pitchNum,
              -a.valueOf() * 127,
              icc.stxPart
            );
            neg.heldNote = thing[0].midiNote;
          }
        }
      } else {
        neg.held  = false;
        pos.held = false;
      }
      if (icc.trackNotes) {
        if (pos.held) {
          pos.heldNote.part.moveEvent(pos.heldNote.noteOff,
            (iec.info.scrollTicksAtHead - pos.heldNote.noteOff.ticks));
          pos.inpEnd = iec.info.scrollTicksAtHead;
        } else if (neg.held) {
          neg.heldNote.part.moveEvent(neg.heldNote.noteOff,
            (iec.info.scrollTicksAtHead - neg.heldNote.noteOff.ticks)
          );
          neg.inpEnd = iec.info.scrollTicksAtHead;
        } else if (!pos.held && pos.heldNote != null) {
          pos.heldNote = null;
        } else if (!neg.held && neg.heldNote != null) {
          neg.heldNote = null;
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
      let trkr = icc.dpadTrackerGroup[idx];
      let pitch = InputConverterFunctions.getDirectionPitchFromDPad(idx);
      if (b.pressed && !trkr.held) {
        trkr.held = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackNotes) {
          InputConverterEvents.startTracker(trkr,
            iec.info.scrollTicksAtHead,
            pitch,
            icc.dpadPart
          );
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
          case 0: dirStr = 'up'; break;
          case 1: dirStr = 'down'; break;
          case 2: dirStr = 'left'; break;
          case 3: dirStr = 'right'; break;
        }
        imageStr = `assets/images/${pressed ? 'pressed_' : ''}${dirStr}.png`;
        const img = (btn.firstChild as HTMLImageElement);
        img.id = 'icon-img';
        img.src = imageStr;
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
      let trkr = icc.btnTrackerGroup[idx];
      let pitch: string = InputConverterFunctions.getPitchStringFromNumber(scale[idx] + rootNote);
      //if PRESSED this frame
      if (b.pressed && !trkr.held) {
        trkr.held = true;
        icc.midiOutPort.noteOn(0, pitch, 127);
        //if RECORDING
        if (icc.trackNotes) {
          InputConverterEvents.startTracker(trkr,
            iec.info.scrollTicksAtHead,
            InputConverterFunctions.getButtonPitch(idx),
            icc.btnPart);
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
        let imgStr = `assets/images/${pressed ? 'pressed_' : ''}${btnStr}.png`;;
        (btn.firstChild as HTMLImageElement).src = imgStr;
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
    let noteEvts = InputEditorFunctions.createNoteFromTicks(starts[i], starts[i] + 128, pitch);
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

  static startTracker(trkr: Tracker, ticks: number, pitch: number, part?: Part) {
    trkr.inpStart = ticks;
    let noteEvts = InputEditorFunctions.createNoteFromTicks(trkr.inpStart, trkr.inpStart + 128, pitch, null, part);
    trkr.heldNote = noteEvts[0].midiNote;
  }

  static endTracker(trkr: Tracker, ticks: number, pitch: number, trackedNotes: Array<[number, number, number]>,
                    liveUpdate = false) {
    trkr.inpEnd = ticks;
    trackedNotes.push([trkr.inpStart, trkr.inpEnd, pitch]);
    if (!liveUpdate) {
      trkr.heldNote.part.moveEvent(trkr.heldNote.noteOff, (ticks - trkr.heldNote.noteOff.ticks
        // + 128
      ));
    }
  }
}

