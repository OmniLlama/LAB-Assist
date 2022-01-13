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
import {FourWayAnlgTracker, InputTrackerSet, DigiTracker, FourWayDigiTracker} from '../../helpers/Defs/Trackers';

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
  static updateControllerStickTrackers(pO: GamepadObject, trkr: FourWayAnlgTracker, axes: [number, number], btnShells: ButtonHTMLShell[],
                                       dirState: DirectionState, indexOffset: number, currTicks: number) {
    trkr.update(axes, pO, currTicks);

    const icc = InputConverterComponent.inpConvComp;
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
  static updateControllerDPadTrackers(pO: GamepadObject, trkr: FourWayDigiTracker, currTicks: number) {

    trkr.update(pO.DPadToValues(), pO, currTicks);
    const icc = InputConverterComponent.inpConvComp;
    pO.dpadBtns.forEach((b, idx) => {
      InputConverterEvents.updateConverterButton(icc.dpadBtnShells[idx], b.pressed, icc.stateChanged);
    });
  }

  /**
   * Update Controller Buttons
   */
  static updateControllerButtonTrackers(pO: GamepadObject, currTicks: number) {


    const icc = InputConverterComponent.inpConvComp;
    pO.Btns.forEach((b, idx) => {
      // let trkr = icc.trackerSet.btn(idx);
      // // if PRESSED this frame
      // if (b.pressed && !trkr.held) {
      //   icc.audioCtx.oscs[trkr.Channel].start();
      //   // if RECORDING
      //   if (icc.trackingNotes) {
      //     trkr.start(currTicks);
      //   } else {
      //     trkr.held = true;
      //   }
      //   // if RELEASED this frame
      // } else if (!b.pressed && trkr.held) {
      //   icc.audioCtx.oscs[trkr.Channel].stop();
      //   // if RECORDING
      //   if (icc.trackingNotes) {
      //     trkr.end(currTicks,
      //       icc.trackedNotes);
      //   } else {
      //     trkr.held = false;
      //   }
      // }
      // if (icc.trackingNotes) {
      //   trkr.update(currTicks, icc.liveUpdateHeldNotes);
      // }
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

