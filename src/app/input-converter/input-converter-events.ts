import {InputEditorFunctions} from '../input-editor/input-editor-functions';
import {InputConverterComponent} from './input-converter.component';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {InputConverterFunctions} from './input-converter-functions';
import {InputConverterVisuals} from './input-converter-visuals';
import {GamepadObject, Tracker} from '../../helpers/Defs';
import {numberToPitchString, pitchNumToFrequency} from '../../helpers/Func';
import {Div, Span} from '../../helpers/Gen';
import {DirectionState} from '../../helpers/Enums';
import {ButtonHTMLShell} from '../../helpers/Shells';
import {Dir} from 'fs';
import {InputDisplayComponent} from '../input-display/input-display.component';

export class InputConverterEvents {
  static updateController(): void {
    const icc = InputConverterComponent.inpConvComp;
    const iec = InputEditorComponent.inpEdComp;
    const idc = InputDisplayComponent.inpDispCmp;
    const padObj = icc.testPadObj;
    if (icc.recordingPrimed) {
      if (iec.playing && !icc.trackingNotes) {
        InputConverterEvents.startTrackingNotes(icc);
      } else if (!iec.playing && icc.trackingNotes) {
        InputConverterEvents.stopTrackingNotes(icc, iec);
      }
    }

    icc.stateChanged = padObj.lsDirState !== (idc.useLeftStick ? icc.lastLSState : padObj.lsDirState) ||
      padObj.rsDirState !== (idc.useRightStick ? icc.lastRSState : padObj.rsDirState) ||
      padObj.dpadDirState !== (idc.useDPad ? icc.lastDPadState : padObj.dpadDirState) ||
      padObj.btnsState !== icc.lastBtnsState;
    if (icc.stateChanged) {
      icc.div_currInputHistory = Div(null, 'input-history-node');
      icc.span_currInputFrameCnt = Span(null, 'input-history-frame-count');
      icc.div_currInputHistory.append(icc.span_currInputFrameCnt);
    }
    if (idc.useLeftStick) {
      InputConverterEvents.updateControllerStxTrackers(padObj.axisPair(0), icc.lsTrackerGroup, icc.lsBtnShells,
        padObj.lsDirState, 0, iec.edtrView.playhead.xPos);
    }

    if (idc.useRightStick) {
      InputConverterEvents.updateControllerStxTrackers(padObj.axisPair(1), icc.rsTrackerGroup, icc.rsBtnShells,
        padObj.rsDirState, 2, iec.edtrView.playhead.xPos);
    }
    if (idc.useDPad) {
      InputConverterEvents.updateControllerDPadTrackers(padObj, iec.edtrView.playhead.xPos);
    }
    InputConverterEvents.updateControllerButtonTrackers(padObj, iec.edtrView.playhead.xPos);

    icc.lastLSState = padObj.lsDirState;
    icc.lastRSState = padObj.rsDirState;
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
  static updateControllerStxTrackers(axes: [number, number], trackerGroup: Tracker[], btnShells: ButtonHTMLShell[],
                                     dirState: DirectionState, indexOffset: number, currTicks: number) {
    let icc = InputConverterComponent.inpConvComp;
    axes.forEach((a, idx) => {
      const icc = InputConverterComponent.inpConvComp;
      const neg = trackerGroup[(idx * 2)];
      const pos = trackerGroup[(idx * 2) + 1];
      let pitchNum;
      if (a.valueOf() > icc.deadZone) {
        pitchNum = InputConverterFunctions.getDirectionPitchFromAxis(idx + indexOffset, a.valueOf());
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
        pitchNum = InputConverterFunctions.getDirectionPitchFromAxis(idx + indexOffset, a.valueOf());
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
    });
    InputConverterEvents.updateConverterButton(btnShells[0],
      DirectionState.Up === (DirectionState.Up & dirState), icc.stateChanged);
    InputConverterEvents.updateConverterButton(btnShells[1],
      DirectionState.Right === (DirectionState.Right & dirState), icc.stateChanged);
    InputConverterEvents.updateConverterButton(btnShells[2],
      DirectionState.Left === (DirectionState.Left & dirState), icc.stateChanged);
    InputConverterEvents.updateConverterButton(btnShells[3],
      DirectionState.Down === (DirectionState.Down & dirState), icc.stateChanged);
  }

  /**
   * Update Controller Digital Pad
   */
  static updateControllerDPadTrackers(padObj: GamepadObject, currTicks: number) {

    const icc = InputConverterComponent.inpConvComp;
    padObj.DPadURLD.forEach((b, idx) => {
      let trkr = icc.dpadTrackerGroup[idx];
      let pitch = InputConverterFunctions.getDirectionPitchFromDPad(idx);
      if (b.pressed && !trkr.held) {
        icc.audioCtx.oscs[pitch].start();
        // if RECORDING
        if (icc.trackingNotes) {
          InputConverterEvents.startTracker(trkr,
            currTicks,
            pitch
          );
        } else {
          trkr.held = true;
        }
        // if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        icc.audioCtx.oscs[pitch].stop();
        // if RECORDING
        if (icc.trackingNotes) {
          InputConverterEvents.endTracker(trkr,
            currTicks,
            pitch,
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        } else {
          trkr.held = false;
        }
      }
      // EXPERIMENTALISISISMZ
      if (icc.trackingNotes) {
        InputConverterEvents.updateTracker(trkr, currTicks, icc.liveUpdateHeldNotes);
      }
      InputConverterEvents.updateConverterButton(icc.dpadBtnShells[idx], b.pressed, icc.stateChanged);
    });
  }

  /**
   * Update Controller Buttons
   */
  static updateControllerButtonTrackers(padObj: GamepadObject, currTicks: number) {

    const harmMinScaleArr: number[] = [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19]; //harmonic minor scale
    const majScaleArr: number[] = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19]; //major scale
    const scale: number[] = harmMinScaleArr;
    const icc = InputConverterComponent.inpConvComp;
    padObj.pad.buttons.forEach((b, idx) => {
      if (idx >= scale.length) {
        return;
      }
      let trkr = icc.btnTrackerGroup[idx];
      let pitchNum = InputConverterFunctions.getButtonPitch(idx);
      // if PRESSED this frame
      if (b.pressed && !trkr.held) {
        icc.audioCtx.oscs[pitchNum].start();
        // if RECORDING
        if (icc.trackingNotes) {
          InputConverterEvents.startTracker(trkr,
            currTicks,
            InputConverterFunctions.getButtonPitch(idx)
          );
        } else {
          trkr.held = true;
        }
        // if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        icc.audioCtx.oscs[pitchNum].stop();
        // if RECORDING
        if (icc.trackingNotes) {
          InputConverterEvents.endTracker(trkr,
            currTicks,
            InputConverterFunctions.getButtonPitch(idx),
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        } else {
          trkr.held = false;
        }
      }
      if (icc.trackingNotes) {
        InputConverterEvents.updateTracker(trkr, currTicks, icc.liveUpdateHeldNotes);
      }
      InputConverterEvents.updateConverterButton(icc.btnShells[idx], b.pressed, icc.stateChanged);
    });
  }

  static updateConverterButton(btnShell: ButtonHTMLShell, pressed: boolean, inputStateChanged: boolean) {
    let icc = InputConverterComponent.inpConvComp;
    btnShell.updateImg(pressed);

    if (pressed && inputStateChanged) {
      const clone = btnShell.pressedImg.cloneNode(false);
      icc.div_currInputHistory.append(clone);
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

