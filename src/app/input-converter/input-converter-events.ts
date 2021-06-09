import {InputEditorFunctions} from '../input-editor/input-editor-functions';
import {InputConverterComponent, nameButton, Tracker} from './input-converter.component';
import {GamepadObject, InputDisplayComponent} from '../input-display/input-display.component';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {InputConverterFunctions} from './input-converter-functions';
import * as JZZ from 'jzz';
import {InputConverterVisuals} from './input-converter-visuals';
import {MIDINote, Part, Track} from 'heartbeat-sequencer';

declare let sequencer: any;

export class InputConverterEvents {
  /**
   * Updates all controller values, First, the Axes, then, the D-Pad buttons. finally, the Eight main buttons
   */
  static updateController(): void {
    const icc = InputConverterComponent.inpConvComp;
    const idc = InputDisplayComponent.inpDispCmp;
    const iec = InputEditorComponent.inpEdComp;
    const padObj = icc.testPadObj;
    if (iec.song.playing && !icc.trackNotes) {
      InputConverterEvents.startTrackingNotes(icc);

    } else if (!iec.song.playing && icc.trackNotes) {
      InputConverterEvents.stopTrackingNotes(icc, iec);
    }


    InputConverterEvents.updateControllerStxTrackers(padObj, iec.info.scrollTicksAtHead);
    InputConverterEvents.updateControllerDPadTrackers(padObj, iec.info.scrollTicksAtHead);
    InputConverterEvents.updateControllerButtonTrackers(padObj, iec.info.scrollTicksAtHead);

    // InputEditorFunctions.UpdateSong(iec);
    // JZZ().refresh();
    InputConverterVisuals.rAF(InputConverterEvents.updateController);
  }

  static updateControllerStxTrackers(padObj: GamepadObject, currTicks: number) {
    /**
     * Update Controller Axes
     */
    padObj.pad.axes.forEach((a, ind) => {
      const i = (ind * 2);
      const j = (ind * 2) + 1;
      const icc = InputConverterComponent.inpConvComp;
      const neg = icc.stxTrackerGroup[i];
      const pos = icc.stxTrackerGroup[j];
      let pitchNum;
      if (a.valueOf() > icc.deadZone) {
        pitchNum = InputConverterEvents.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!pos.held) {
          pos.held = true;
          neg.held = false;
          if (icc.trackNotes) {
            icc.stxPart = icc.stxPart != null ? icc.stxPart : sequencer.createPart();
            InputConverterEvents.startTracker(pos,
              currTicks,
              pitchNum,
              icc.stxPart
            );
          }
        }
      } else if (a.valueOf() < -icc.deadZone) {
        pitchNum = InputConverterEvents.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!neg.held) {
          pos.held = false;
          neg.held = true;
          if (icc.trackNotes) {
            icc.stxPart = icc.stxPart != null ? icc.stxPart : sequencer.createPart();
            InputConverterEvents.startTracker(neg,
              currTicks,
              pitchNum,
              icc.stxPart
            );
          }
        }
      } else {
        neg.held = false;
        pos.held = false;
      }
      if (icc.trackNotes) {
        if (pos.held) {
          InputConverterEvents.updateTracker(pos,
            currTicks,
            icc.liveUpdateHeldNotes);
        } else if (neg.held) {
          InputConverterEvents.updateTracker(neg,
            currTicks,
            icc.liveUpdateHeldNotes);
        }
        if (!pos.held && pos.heldNote != null) {
          InputConverterEvents.endTracker(pos,
            currTicks,
            pitchNum,
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        }
        if (!neg.held && neg.heldNote != null) {
          InputConverterEvents.endTracker(neg,
            currTicks,
            pitchNum,
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        }
      }
    });
  }

  static updateControllerDPadTrackers(padObj: GamepadObject, currTicks: number) {
    /**
     * Update Controller Digital Pad
     */
      // let dPadBtns: readonly GamepadButton[] = padObj.DPad();
    let dPadBtns: readonly GamepadButton[] = padObj.DPadURLD();
    let dpadIconDivs = Array.from(document.getElementById('editor-input-icons-dir').querySelectorAll('div'));
    const icc = InputConverterComponent.inpConvComp;
    dPadBtns.forEach((b, idx) => {
      let trkr = icc.dpadTrackerGroup[idx];
      let pitch = InputConverterFunctions.getDirectionPitchFromDPad(idx);
      if (b.pressed && !trkr.held) {
        icc.midiOutPort.noteOn(0, pitch, 127);
        // if RECORDING
        if (icc.trackNotes) {
          icc.dpadPart = icc.dpadPart != null ? icc.dpadPart : sequencer.createPart();
          InputConverterEvents.startTracker(trkr,
            currTicks,
            pitch,
            icc.dpadPart
          );
        }
        // if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        icc.midiOutPort.noteOff(0, pitch, 127);
        // if RECORDING
        if (icc.trackNotes) {
          InputConverterEvents.endTracker(trkr,
            currTicks,
            pitch,
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        }

      }
      // EXPERIMENTALISISISMZ
      if (icc.trackNotes) {
        InputConverterEvents.updateTracker(trkr, currTicks, icc.liveUpdateHeldNotes);
      }
      let div = dpadIconDivs[idx] as HTMLDivElement;
      InputConverterEvents.updateInputVisual(div, b, InputConverterFunctions.nameDPadDirection(idx));
    });
  }

  static updateControllerButtonTrackers(padObj: GamepadObject, currTicks: number) {
    /**
     * Update Controller Buttons
     */
    const btnIconDivs = document.getElementsByClassName('editor-input-icon');
    const harmMinScaleArr: number[] = [0, 2, 3, 5, 7, 8, 11, 12]; //harmonic minor scale
    const majScaleArr: number[] = [0, 2, 4, 5, 7, 9, 11, 12]; //major scale
    const scale: number[] = harmMinScaleArr;
    const rootNote: number = 51;
    const icc = InputConverterComponent.inpConvComp;
    padObj.pad.buttons.forEach((b, idx) => {
      if (idx >= scale.length) {
        return;
      }
      let trkr = icc.btnTrackerGroup[idx];
      let pitch: string = InputConverterFunctions.getPitchStringFromNumber(scale[idx] + rootNote);
      // if PRESSED this frame
      if (b.pressed && !trkr.held) {
        icc.midiOutPort.noteOn(0, pitch, 127);
        // if RECORDING
        if (icc.trackNotes) {
          icc.btnPart = (icc.btnPart != null ? icc.btnPart : sequencer.createPart());
          InputConverterEvents.startTracker(trkr,
            currTicks,
            InputConverterFunctions.getButtonPitch(idx),
          icc.btnPart
        );
        }
        // if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        icc.midiOutPort.noteOff(0, pitch, 127);

        // if RECORDING
        if (icc.trackNotes) {
          InputConverterEvents.endTracker(trkr,
            currTicks,
            InputConverterFunctions.getButtonPitch(idx),
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        }
      }
      if (icc.trackNotes) {
        InputConverterEvents.updateTracker(trkr, currTicks, icc.liveUpdateHeldNotes);
      }
      const div = btnIconDivs[idx] as HTMLDivElement;
      InputConverterEvents.updateInputVisual(div, b, nameButton(idx));
    });
  }

  static updateInputVisual(div: HTMLDivElement, btn: GamepadButton, name: string) {
    if (div != undefined) {
      let pressed = btn.value > .8;
      if (typeof (btn) === 'object') {
        pressed = btn.pressed;
      }
      let imgStr = `assets/images/${pressed ? 'pressed_' : ''}${name}.png`;
      const img = (div.firstChild as HTMLImageElement);
      img.id = 'icon-img';
      img.src = imgStr;
    }
  }

  static startTrackingNotes(icc: InputConverterComponent) {
    icc.trackedNotes = new Array<[number, number, number]>();
    icc.trackNotes = true;
  }

  static stopTrackingNotes(icc: InputConverterComponent, iec: InputEditorComponent) {
    icc.trackedNotes = null;
    icc.stxPart = null;
    icc.dpadPart = null;
    icc.btnPart = null;
    icc.trackNotes = false;
    InputEditorFunctions.UpdateSong(iec);
  }

  static updateTracker(trkr: Tracker, ticks: number, liveUpdate: boolean) {
    if (trkr.held) {
      if (liveUpdate) {
        trkr.heldNote.part.moveEvent(trkr.heldNote.noteOff, (ticks - trkr.heldNote.noteOff.ticks));
        trkr.inpEnd = ticks;
      }
      // InputEditorFunctions.UpdateSong(InputEditorComponent.inpEdComp);
    }
  }

  static startTracker(trkr: Tracker, ticks: number, pitch: number, part?: Part) {
    trkr.held = true;
    trkr.inpStart = ticks;
    let evts = InputEditorFunctions.createNoteFromTicks(ticks, ticks + 128, pitch, undefined, part);
    InputEditorFunctions.UpdateSong(InputEditorComponent.inpEdComp);
    trkr.heldNote = evts[0].midiNote;
    // trkr.heldNote = evts;
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
    trkr.held = false;
    trkr.heldNote = null;
    InputEditorFunctions.UpdateTrack(InputEditorComponent.inpEdComp);
    InputEditorFunctions.UpdateSong(InputEditorComponent.inpEdComp);
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

}

