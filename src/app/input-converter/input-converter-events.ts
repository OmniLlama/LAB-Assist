import {InputEditorFunctions} from '../input-editor/input-editor-functions';
import {InputConverterComponent} from './input-converter.component';
import {GamepadObject, InputDisplayComponent, nameButton} from '../input-display/input-display.component';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {InputConverterFunctions} from './input-converter-functions';
import * as JZZ from 'jzz';
import {InputConverterVisuals} from './input-converter-visuals';
import {MIDINote, Part, Track} from '../../heartbeat/build';
import {Tracker} from '../../helpers/Defs';
import {numberToPitchString} from '../../helpers/Func';

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
    if (iec.playing && icc.recordingPrimed && !icc.trackingNotes) {
      InputConverterEvents.startTrackingNotes(icc);
      icc.backupPart = sequencer.createPart();
    } else if (!iec.playing && icc.recordingPrimed && icc.trackingNotes) {
      InputConverterEvents.stopTrackingNotes(icc, iec);
    }
    InputConverterEvents.updateControllerStxTrackers(padObj, iec.info.scrollTicksAtHead);
    InputConverterEvents.updateControllerDPadTrackers(padObj, iec.info.scrollTicksAtHead);
    InputConverterEvents.updateControllerButtonTrackers(padObj, iec.info.scrollTicksAtHead);

    // InputEditorFunctions.UpdateSong(iec); //DO NOT USE
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
        pitchNum = InputConverterFunctions.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!pos.held) {
          pos.held = true;
          neg.held = false;
          if (icc.trackingNotes) {
            icc.stxPart = icc.stxPart != null ? icc.stxPart : sequencer.createPart();
            InputConverterEvents.startTracker(pos,
              currTicks,
              pitchNum,
              icc.stxPart
              // icc.backupPart
            );
          }
        }
      } else if (a.valueOf() < -icc.deadZone) {
        pitchNum = InputConverterFunctions.getDirectionPitchFromAxis(ind, a.valueOf());
        if (!neg.held) {
          pos.held = false;
          neg.held = true;
          if (icc.trackingNotes) {
            icc.stxPart = icc.stxPart != null ? icc.stxPart : sequencer.createPart();
            InputConverterEvents.startTracker(neg,
              currTicks,
              pitchNum,
              icc.stxPart
              // icc.backupPart
            );
          }
        }
      } else {
        neg.held = false;
        pos.held = false;
      }
      if (icc.trackingNotes) {
        if (pos.held) {
          InputConverterEvents.updateTracker(pos,
            currTicks,
            icc.liveUpdateHeldNotes);
        } else if (neg.held) {
          InputConverterEvents.updateTracker(neg,
            currTicks,
            icc.liveUpdateHeldNotes);
        }
        // // if (!pos.held && pos.heldNote != null) {
        // if (!pos.held && pos.htmlNote != null) {
        //   InputConverterEvents.endTracker(pos,
        //     currTicks,
        //     pitchNum,
        //     icc.trackedNotes,
        //     icc.liveUpdateHeldNotes);
        // }
        // // if (!neg.held && neg.heldNote != null) {
        // if (!neg.held && pos.htmlNote != null) {
        //   InputConverterEvents.endTracker(neg,
        //     currTicks,
        //     pitchNum,
        //     icc.trackedNotes,
        //     icc.liveUpdateHeldNotes);
        // }
      }
    });
  }

  static updateControllerDPadTrackers(padObj: GamepadObject, currTicks: number) {
    /**
     * Update Controller Digital Pad
     */
    let dpadIconDivs = Array.from(document.getElementById('editor-input-icons-dir').querySelectorAll('div'));
    const icc = InputConverterComponent.inpConvComp;
    padObj.DPadURLD.forEach((b, idx) => {
      let trkr = icc.dpadTrackerGroup[idx];
      let pitch = InputConverterFunctions.getDirectionPitchFromDPad(idx);
      if (b.pressed && (!trkr.held)) {
        icc.midiOutPort.noteOn(0, pitch, 127);
        // if RECORDING
        if (icc.trackingNotes) {
          icc.dpadPart = icc.dpadPart != null ? icc.dpadPart : sequencer.createPart();
          InputConverterEvents.startTracker(trkr,
            currTicks,
            pitch,
            icc.backupPart
            // icc.dpadPart
          );
        }
        // if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        icc.midiOutPort.noteOff(0, pitch, 127);
        // if RECORDING
        if (icc.trackingNotes) {
          InputConverterEvents.endTracker(trkr,
            currTicks,
            pitch,
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        }

      }
      // EXPERIMENTALISISISMZ
      if (icc.trackingNotes) {
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
      let pitch: string = numberToPitchString(scale[idx] + rootNote);
      // if PRESSED this frame
      if (b.pressed && !trkr.held) {
        icc.midiOutPort.noteOn(0, pitch, 127);
        // if RECORDING
        if (icc.trackingNotes) {
          icc.btnPart = (icc.btnPart != null ? icc.btnPart : sequencer.createPart());
          InputConverterEvents.startTracker(trkr,
            currTicks,
            InputConverterFunctions.getButtonPitch(idx),
            icc.backupPart
            // icc.btnPart
          );
        }
        // if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        icc.midiOutPort.noteOff(0, pitch, 127);

        // if RECORDING
        if (icc.trackingNotes) {
          InputConverterEvents.endTracker(trkr,
            currTicks,
            InputConverterFunctions.getButtonPitch(idx),
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        }
      }
      if (icc.trackingNotes) {
        InputConverterEvents.updateTracker(trkr, currTicks, icc.liveUpdateHeldNotes);
      }
      const div = btnIconDivs[idx] as HTMLDivElement;
      InputConverterEvents.updateInputVisual(div, b, nameButton(idx));
    });
  }

  static updateInputVisual(div: HTMLDivElement, btn: GamepadButton, name: string) {
    if (div !== undefined) {
      let pressed = btn.value > .8;
      if (typeof (btn) === 'object') {
        pressed = btn.pressed;
      }
      const imgStr = `assets/images/${pressed ? 'pressed_' : ''}${name}.png`;
      const img = (div.firstChild as HTMLImageElement);
      img.id = 'icon-img';
      img.src = imgStr;
    }
  }

  static startTrackingNotes(icc: InputConverterComponent) {
    icc.trackedNotes = new Array<[number, number, number]>();
    icc.trackingNotes = true;
  }

  static stopTrackingNotes(icc: InputConverterComponent, iec: InputEditorComponent) {
    icc.trackedNotes = null;
    icc.stxPart = null;
    icc.dpadPart = null;
    icc.btnPart = null;
    icc.trackingNotes = false;
  }

  static updateTracker(trkr: Tracker, ticks: number, liveUpdate: boolean) {
    if (trkr.held) {
      if (liveUpdate) {
        InputEditorFunctions.testUpdateNote(trkr);
      }
    }
  }

  static startTracker(trkr: Tracker, ticks: number, pitch: number, part?: Part) {
    trkr.held = true;
    trkr.inpStart = ticks;
    InputEditorFunctions.testCreateNote(trkr, pitch);
  }

  static endTracker(trkr: Tracker, ticks: number, pitch: number, trackedNotes: Array<[number, number, number]>,
                    liveUpdate = false) {
    trkr.inpEnd = ticks;
    trackedNotes.push([trkr.inpStart, trkr.inpEnd, pitch]);

    trkr.held = false;
    trkr.heldNote = null;
    InputEditorFunctions.testFinishNote(trkr);

  }


}

