import {InputEditorFunctions} from '../input-editor/input-editor-functions';
import {InputConverterComponent} from './input-converter.component';
import {InputDisplayComponent, nameButton} from '../input-display/input-display.component';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {InputConverterFunctions} from './input-converter-functions';
import * as JZZ from 'jzz';
import {InputConverterVisuals} from './input-converter-visuals';
import {GamepadObject, Tracker} from '../../helpers/Defs';
import {numberToPitchString} from '../../helpers/Func';
import {IMG_DIR_BASE, IMG_EXT} from '../../helpers/Vals';
import {Div, Span} from '../../helpers/Gen';
import {AxisToAnalogName} from '../../helpers/Enums';

declare let sequencer: any;

export class InputConverterEvents {
  /**
   * Updates all controller values, First, the Axes, then, the D-Pad buttons. finally, the Eight main buttons
   */
  static updateController(): void {
    const icc = InputConverterComponent.inpConvComp;
    const iec = InputEditorComponent.inpEdComp;
    const padObj = icc.testPadObj;
    if (icc.recordingPrimed) {
      if (iec.playing && !icc.trackingNotes) {
        InputConverterEvents.startTrackingNotes(icc);
      } else if (!iec.playing && icc.trackingNotes) {
        InputConverterEvents.stopTrackingNotes(icc, iec);
      }
    }
    icc.stateChanged = padObj.dpadDirState !== icc.lastDPadState ||
      padObj.btnsState !== icc.lastBtnsState;
    if (icc.stateChanged) {
      icc.div_currInputHistory = Div(null, 'input-history-node');
      icc.span_currInputFrameCnt = Span(null, 'input-history-frame-count');
      icc.div_currInputHistory.append(icc.span_currInputFrameCnt);
    }
    InputConverterEvents.updateControllerStxTrackers(padObj, iec.edtrView.playhead.xPos);
    InputConverterEvents.updateControllerDPadTrackers(padObj, iec.edtrView.playhead.xPos);
    InputConverterEvents.updateControllerButtonTrackers(padObj, iec.edtrView.playhead.xPos);

    icc.lastDPadState = padObj.dpadDirState;
    icc.lastBtnsState = padObj.btnsState;
    if (icc.stateChanged) {
      icc.div_inputHistory.insertBefore(icc.div_currInputHistory, icc.div_inputHistory.firstChild);
      const removed = icc.inputHistoryQueue.qThru(icc.div_currInputHistory);
      if (removed) {
        icc.div_inputHistory.removeChild(removed);
      }
      icc.stateFrameCnt = 0;
    }
    if (icc.stateFrameCnt < 999) {
      icc.span_currInputFrameCnt.innerHTML = `${++icc.stateFrameCnt}`;
    }
    InputConverterVisuals.rAF(InputConverterEvents.updateController);
  }

  /**
   * Update Controller Axes
   */
  static updateControllerStxTrackers(padObj: GamepadObject, currTicks: number) {
    let leftIconDivs = Array.from(document.getElementById('editor-input-icons-left').querySelectorAll('div'));
    let rightIconDivs = Array.from(document.getElementById('editor-input-icons-right').querySelectorAll('div'));
    let icc = InputConverterComponent.inpConvComp;
    padObj.pad.axes.forEach((a, idx) => {
      const i = (idx * 2);
      const j = (idx * 2) + 1;
      const icc = InputConverterComponent.inpConvComp;
      const neg = icc.stxTrackerGroup[i];
      const pos = icc.stxTrackerGroup[j];
      let pitchNum;
      if (a.valueOf() > icc.deadZone) {
        pitchNum = InputConverterFunctions.getDirectionPitchFromAxis(idx, a.valueOf());
        if (!pos.held) {
          pos.held = true;
          neg.held = false;
          if (icc.trackingNotes) {
            InputConverterEvents.startTracker(pos,
              currTicks,
              pitchNum
            );
          }
        }
      } else if (a.valueOf() < -icc.deadZone) {
        pitchNum = InputConverterFunctions.getDirectionPitchFromAxis(idx, a.valueOf());
        if (!neg.held) {
          pos.held = false;
          neg.held = true;
          if (icc.trackingNotes) {
            InputConverterEvents.startTracker(neg,
              currTicks,
              pitchNum
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
        if (!pos.held && pos.htmlNote != null) {
          InputConverterEvents.endTracker(pos,
            currTicks,
            pitchNum,
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        }
        if (!neg.held && neg.htmlNote != null) {
          InputConverterEvents.endTracker(neg,
            currTicks,
            pitchNum,
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        }
      }
      // const left = leftIconDivs[]
      // InputConverterEvents.updateConverterButton(div, , AxisToAnalogName[idx], icc.stateChanged);
    });
  }

  /**
   * Update Controller Digital Pad
   */
  static updateControllerDPadTrackers(padObj: GamepadObject, currTicks: number) {

    let dpadIconDivs = Array.from(document.getElementById('editor-input-icons-dpad').querySelectorAll('div'));
    const icc = InputConverterComponent.inpConvComp;
    padObj.DPadURLD.forEach((b, idx) => {
      let trkr = icc.dpadTrackerGroup[idx];
      let pitch = InputConverterFunctions.getDirectionPitchFromDPad(idx);
      if (b.pressed && !trkr.held) {
        icc.midiOutPort.noteOn(0, pitch, 127);
        // if RECORDING
        if (icc.trackingNotes) {
          InputConverterEvents.startTracker(trkr,
            currTicks,
            pitch
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
      InputConverterEvents.updateConverterButton(div, b.pressed, InputConverterFunctions.nameDPadDirection(idx), icc.stateChanged);
    });
  }

  /**
   * Update Controller Buttons
   */
  static updateControllerButtonTrackers(padObj: GamepadObject, currTicks: number) {

    const btnIconDivs = document.getElementsByClassName('editor-input-icon');
    const harmMinScaleArr: number[] = [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19]; //harmonic minor scale
    const majScaleArr: number[] = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19]; //major scale
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
          InputConverterEvents.startTracker(trkr,
            currTicks,
            InputConverterFunctions.getButtonPitch(idx)
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
      InputConverterEvents.updateConverterButton(div, b.pressed, nameButton(idx), icc.stateChanged);
    });
  }

  static updateConverterButton(div: HTMLDivElement, pressed: boolean, name: string, inputChanged: boolean) {
    let icc = InputConverterComponent.inpConvComp;
    if (div !== undefined) {
      const imgStr = `${IMG_DIR_BASE}${name}${pressed ? '_pressed' : ''}${IMG_EXT}`;
      const img = (div.firstChild as HTMLImageElement);
      img.id = 'icon-img';
      img.src = imgStr;

      if (pressed && inputChanged) {
        const clone = img.cloneNode(false);
        icc.div_currInputHistory.append(clone);
      }
    }
  }

  static startTrackingNotes(icc: InputConverterComponent) {
    icc.trackedNotes = new Array<[number, number, number]>();
    icc.trackingNotes = true;
  }

  static stopTrackingNotes(icc: InputConverterComponent, iec: InputEditorComponent) {
    icc.trackedNotes = null;
    icc.trackingNotes = false;
  }

  static updateTracker(trkr: Tracker, ticks: number, liveUpdate: boolean) {
    if (trkr.held) {
      if (liveUpdate) {
        InputEditorFunctions.testUpdateNote(trkr);
      }
    }
  }

  static startTracker(trkr: Tracker, ticks: number, pitch: number) {
    trkr.held = true;
    trkr.inpStart = ticks;
    InputEditorFunctions.testCreateNote(trkr, pitch);
  }

  static endTracker(trkr: Tracker, ticks: number, pitch: number, trackedNotes: Array<[number, number, number]>,
                    liveUpdate = false) {
    trkr.inpEnd = ticks;
    trackedNotes.push([trkr.inpStart, trkr.inpEnd, pitch]);
    trkr.held = false;
    InputEditorFunctions.testFinishNote(trkr);
  }


}

