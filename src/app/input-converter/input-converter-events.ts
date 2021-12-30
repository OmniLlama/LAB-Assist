import {InputEditorFunctions} from '../input-editor/input-editor-functions';
import {InputConverterComponent} from './input-converter.component';
import {InputEditorComponent} from '../input-editor/input-editor.component';
import {InputConverterFunctions} from './input-converter-functions';
import {InputConverterVisuals} from './input-converter-visuals';
import {GamepadObject} from '../../helpers/Defs';
import {numberToPitchString, pitchNumToFrequency} from '../../helpers/Func';
import {Div, Span, SubDiv} from '../../helpers/Gen';
import {DirectionState, flagIdxs, GamepadType, hasFlag, xbBtns} from '../../helpers/Enums';
import {ButtonHTMLShell} from '../../helpers/Shells';
import {dirSetStr, InputDisplayComponent, padObjs, URLDStrings} from '../input-display/input-display.component';
import {FourWayTracker, InputTrackerSet, Tracker} from '../../helpers/Defs/Trackers';

export class InputConverterEvents {
  /**
   * Waits for, then receives the first controller that is added to the display component,
   * Initializes arrays that hold the various inputs and their respective notes
   */
  static getController() {
    const icc = InputConverterComponent.inpConvComp;
    const iec = InputEditorComponent.inpEdComp;
    if (padObjs.length > 0 && !icc.activePadObj) {
      // this.activePadObj = padObjs[0];
      icc.activePadObj = padObjs.find((pO) => pO !== undefined);
      let padType = GamepadType[icc.activePadObj.type];
      console.log(padType);
      icc.div_ls = SubDiv(icc.div, 'editor-input-icons-left');
      icc.div_rs = SubDiv(icc.div, 'editor-input-icons-right');
      icc.div_dpad = SubDiv(icc.div, 'editor-input-icons-dpad');
      icc.div_btns = SubDiv(icc.div, 'editor-input-icons-btn');

      URLDStrings.forEach((dir) => {
        const shell = new ButtonHTMLShell(dir, 'editor-input-icon-direction', icc.div_ls, dirSetStr[0]);
        icc.lsBtnShells.push(shell);
      });
      URLDStrings.forEach((name) => {
        const shell = new ButtonHTMLShell(name, 'editor-input-icon-direction', icc.div_rs, dirSetStr[1]);
        icc.rsBtnShells.push(shell);
      });
      URLDStrings.forEach((name) => {
        const shell = new ButtonHTMLShell(name, 'editor-input-icon-direction', icc.div_dpad, dirSetStr[2]);
        icc.dpadBtnShells.push(shell);
      });
      xbBtns.forEach((name) => {
        const shell = new ButtonHTMLShell(name, 'editor-input-icon-button', icc.div_btns, 'acts');
        icc.btnShells.push(shell);
      });
      icc.trackerSet = new InputTrackerSet(icc.activePadObj);

      iec.edtrView.updateDraw();
      if (icc.activePadObj) {
        icc.audioCtx.playAtFor(7, 0, .4)
          .playAtFor(5, .15, .3)
          .playAtFor(0, .3, .5);
        InputConverterVisuals.rAF((cb) => InputConverterEvents.updateController());
      }
    } else {
      InputConverterVisuals.rAF((cb) => InputConverterEvents.getController());
    }
  }

  static updateController(): void {
    const icc = InputConverterComponent.inpConvComp;
    const iec = InputEditorComponent.inpEdComp;
    const padObj = icc.activePadObj;
    if (padObj) {
      if (icc.recordingPrimed) {
        if (iec.edtrView.playing && !icc.trackingNotes) {
          InputConverterEvents.startTrackingNotes(icc);
        } else if (!iec.edtrView.playing && icc.trackingNotes) {
          InputConverterEvents.stopTrackingNotes(icc, iec);
        }
      }

      icc.stateChanged = padObj.lsDirState !== (padObj.useLS ? icc.lastLSState : padObj.lsDirState) ||
        padObj.rsDirState !== (padObj.useRS ? icc.lastRSState : padObj.rsDirState) ||
        padObj.dpadDirState !== (padObj.useDPad ? icc.lastDPadState : padObj.dpadDirState) ||
        padObj.btnsState !== icc.lastBtnsState;
      if (icc.stateChanged || icc.stateFrameCnt === 999) {
        icc.div_currInputHistory = Div(null, 'input-history-node');
        icc.span_currInputFrameCnt = Span(null, 'input-history-frame-count');
        icc.div_currInputHistory.append(icc.span_currInputFrameCnt);
      }

      if (icc.stateChanged || icc.stateFrameCnt >= 999) {
        icc.div_inputHistory.insertBefore(icc.div_currInputHistory, icc.div_inputHistory.firstChild);
        const removed = icc.inputHistoryQueue.qThru(icc.div_currInputHistory);
        if (removed) {
          icc.div_inputHistory.removeChild(removed);
        }
        icc.stateFrameCnt = 0;
      }

      if (padObj.useLS) {
        InputConverterEvents.updateControllerStickTrackers(padObj, icc.trackerSet.lsGroup, padObj.axisPair(0), icc.lsBtnShells,
          padObj.lsDirState, 0, iec.edtrView.playhead.xPos);
      }

      if (padObj.useRS) {
        InputConverterEvents.updateControllerStickTrackers(padObj, icc.trackerSet.rsGroup, padObj.axisPair(1), icc.rsBtnShells,
          padObj.rsDirState, 2, iec.edtrView.playhead.xPos);
      }
      if (padObj.useDPad) {
        InputConverterEvents.updateControllerDPadTrackers(padObj, icc.trackerSet.dpadGroup, iec.edtrView.playhead.xPos);
      }
      InputConverterEvents.updateControllerButtonTrackers(padObj, iec.edtrView.playhead.xPos);


      if (icc.stateFrameCnt < 999) {
        icc.span_currInputFrameCnt.innerHTML = `${++icc.stateFrameCnt}`;
      }
      icc.lastLSState = padObj.lsDirState;
      icc.lastRSState = padObj.rsDirState;
      icc.lastDPadState = padObj.dpadDirState;
      icc.lastBtnsState = padObj.btnsState;
      InputConverterVisuals.rAF(InputConverterEvents.updateController);
    } else {
      InputConverterVisuals.rAF(InputConverterEvents.getController);
    }
  }

  /**
   * Update Controller Axes
   */
  static updateControllerStickTrackers(pO: GamepadObject, trkr: FourWayTracker, axes: [number, number], btnShells: ButtonHTMLShell[],
                                       dirState: DirectionState, indexOffset: number, currTicks: number) {
    trkr.update(axes, pO, currTicks);

    const icc = InputConverterComponent.inpConvComp;
    // axes.forEach((ax, idx) => {
    //   const neg = trkr.idx(idx).neg;
    //   const pos = trkr.idx(idx).pos;
    //   let channel;
    //   if (ax.valueOf() > icc.deadZone) {
    //     channel = InputConverterFunctions.getDirectionChannelFromAxis(idx + indexOffset, ax.valueOf());
    //     if (!pos.held) {
    //       pos.held = true;
    //       neg.held = false;
    //       if (icc.trackingNotes) {
    //         pos.start(currTicks,
    //         );
    //       }
    //     }
    //   } else if (ax.valueOf() < -icc.deadZone) {
    //     channel = InputConverterFunctions.getDirectionChannelFromAxis(idx + indexOffset, ax.valueOf());
    //     if (!neg.held) {
    //       pos.held = false;
    //       neg.held = true;
    //       if (icc.trackingNotes) {
    //         neg.start(currTicks,
    //         );
    //       }
    //     }
    //   } else {
    //     neg.held = false;
    //     pos.held = false;
    //   }
    //   if (icc.trackingNotes) {
    //     if (pos.held) {
    //       pos.update(
    //         currTicks,
    //         icc.liveUpdateHeldNotes);
    //     } else if (neg.held) {
    //       neg.update(
    //         currTicks,
    //         icc.liveUpdateHeldNotes);
    //     }
    //     if (!pos.held && pos.htmlNote != null) {
    //       pos.end(currTicks,
    //         channel,
    //         icc.trackedNotes,
    //         icc.liveUpdateHeldNotes);
    //     }
    //     if (!neg.held && neg.htmlNote != null) {
    //       neg.end(currTicks,
    //         channel,
    //         icc.trackedNotes,
    //         icc.liveUpdateHeldNotes);
    //     }
    //   }
    // });
    InputConverterEvents.updateConverterButton(btnShells[0],
      hasFlag(dirState, DirectionState.Up), icc.stateChanged);
    InputConverterEvents.updateConverterButton(btnShells[1],
      hasFlag(dirState, DirectionState.Right), icc.stateChanged);
    InputConverterEvents.updateConverterButton(btnShells[2],
      hasFlag(dirState, DirectionState.Left), icc.stateChanged);
    InputConverterEvents.updateConverterButton(btnShells[3],
      hasFlag(dirState, DirectionState.Down), icc.stateChanged);
  }

  /**
   * Update Controller Digital Pad
   */
  static updateControllerDPadTrackers(padObj: GamepadObject, trkr: FourWayTracker, currTicks: number) {

    const icc = InputConverterComponent.inpConvComp;
    padObj.DPadURLD.forEach((b, idx) => {
      let trkr = icc.trackerSet.dpadGroup.idx(idx % 2).idx(idx % 2);
      if (b.pressed && !trkr.held) {
        icc.audioCtx.oscs[trkr.Channel].start();
        // if RECORDING
        if (icc.trackingNotes) {
          trkr.start(currTicks);
        } else {
          trkr.held = true;
        }
        // if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        icc.audioCtx.oscs[trkr.Channel].stop();
        // if RECORDING
        if (icc.trackingNotes) {
          trkr.end(currTicks,
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        } else {
          trkr.held = false;
        }
      }
      // EXPERIMENTALISISISMZ
      if (icc.trackingNotes) {
        trkr.update(currTicks, icc.liveUpdateHeldNotes);
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
    padObj.Btns.forEach((b, idx) => {
      if (idx >= scale.length) {
        return;
      }
      let trkr = icc.trackerSet.btn(idx);
      let pitch = InputConverterFunctions.getButtonChannel(idx);
      // if PRESSED this frame
      if (b.pressed && !trkr.held) {
        icc.audioCtx.oscs[trkr.Channel].start();
        // if RECORDING
        if (icc.trackingNotes) {
          trkr.start(currTicks);
        } else {
          trkr.held = true;
        }
        // if RELEASED this frame
      } else if (!b.pressed && trkr.held) {
        icc.audioCtx.oscs[trkr.Channel].stop();
        // if RECORDING
        if (icc.trackingNotes) {
          trkr.end(currTicks,
            icc.trackedNotes,
            icc.liveUpdateHeldNotes);
        } else {
          trkr.held = false;
        }
      }
      if (icc.trackingNotes) {
        trkr.update(currTicks, icc.liveUpdateHeldNotes);
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


}

