import {InputEditorComponent, setElementValue} from './input-editor.component';
import {InputEditorFunctions} from './input-editor-functions';
import {Part} from 'heartbeat-sequencer';
import {InputEditorVisuals} from './input-editor-visuals';
import {InputConverterFunctions} from '../input-converter/input-converter-functions';

declare let sequencer: any;

export class InputEditorEvents {

  iec = InputEditorComponent.inpEdComp as InputEditorComponent;

  //#region [rgba(0,100,0,0.2)] Grid Element Event Functions
  /* Part */
  /**
   *Event: left mouse click down on part
   * @param e
   */
  static Part_lMouDown(e): void {
    let iec = InputEditorComponent.inpEdComp;
    let part = iec.allParts[e.target.id];
    if (e.ctrlKey) {
      iec.keyEditor.removePart(part);
      InputEditorFunctions.unselectPart(part);
      iec.currPart = null;
      if (iec.currNote !== null) {
        InputEditorFunctions.unselectNote(iec.currNote);
      }
      iec.currNote = null;
    } else {
      // iec.keyEditor.startMovePart(tmp_part, iec.edtrInfo.screenX, iec.edtrInfo.screenY);
      iec.keyEditor.startMovePart(part,
        iec.info.clientX + iec.info.editorScrollX,
        iec.info.pageY);
      part.notes.forEach((n) => {
        const noteDiv = iec.html.divs_AllNotes[n.id];
        noteDiv.setAttribute('pitch', '00');
      });
      document.addEventListener('mouseup', InputEditorEvents.Part_lMouUp, false);
    }
  }

  /**
   * Event: left mouse click up on part
   * @param e
   */
  static Part_lMouUp(e): void {
    let iec = InputEditorComponent.inpEdComp;
    iec.keyEditor.stopMovePart();
    let part = iec.allParts[iec.currPart.id] as Part;
    part.notes.forEach((n) => {
      const noteDiv = iec.html.divs_AllNotes[n.id];
      noteDiv.setAttribute('pitch', InputEditorFunctions.numToPitch(n.number));
    });
    document.removeEventListener('mouseup', InputEditorEvents.Part_lMouUp);
  }

  /* Note */
  /**
   * Event: mouse hover over note
   * @param e
   */
  static Note_MouOver(e): void {
    (e.target as HTMLDivElement).style.cursor = 'move';
  }

  /**
   * Event: left mouse click down on note
   * @param e
   */
  static Note_lMouDown(e): void {
    let iec = InputEditorComponent.inpEdComp;
    if (!iec.holdingEdge) {
      let tmp_note = InputEditorComponent.inpEdComp.allNotes[e.target.id];
      iec.changingNote = tmp_note;
      if (e.ctrlKey) {
        InputEditorComponent.inpEdComp.keyEditor.removeNote(tmp_note);
        InputEditorComponent.inpEdComp.currNote = null;
      } else {
        InputEditorComponent.inpEdComp.keyEditor.startMoveNote(tmp_note,
          e.clientX + iec.info.editorScrollX,
          0
        );
        e.target.setAttribute('pitch', '00');
        document.addEventListener('mouseup', InputEditorEvents.Note_lMouUp, false);
      }
    }
  }

  /**
   * Event: left mouse click up on note
   * @param e
   */
  static Note_lMouUp(e: MouseEvent): void {
    let iec = InputEditorComponent.inpEdComp;
    iec.keyEditor.stopMoveNote();
    let elmt = iec.html.divs_AllNotes[iec.currNote.id];
    let tmp_note = iec.allNotes[elmt.id];
    // let pitch = InputEditorFunctions.createNewMIDINote(0, 0, iec.info.mousePitchPos);
    let pitch = InputEditorFunctions.numToPitch(iec.info.mousePitchPos);
    iec.changingNote = null;
    elmt.setAttribute('pitch', pitch);
    document.removeEventListener('mouseup', InputEditorEvents.Note_lMouUp);
  }

  /* Note Edge */
  /** Event: mouse over left note edge
   * @param e
   */
  static NoteEdge_Left_MouOver(e: MouseEvent): void {
    (e.target as HTMLDivElement).style.cursor = 'w-resize';
  }

  /** Event: mouse over right note edge
   * @param e
   */
  static NoteEdge_Right_MouOver(e: MouseEvent): void {
    (e.target as HTMLDivElement).style.cursor = 'e-resize';
  }

  /** Event: mouse left click on left note edge
   * @param e
   */
  static NoteEdge_Left_lMouDown(e: MouseEvent): void {
    let iec = InputEditorComponent.inpEdComp;
    iec.holdingEdge = true;
    (e.target as HTMLDivElement).style.cursor = 'w-resize';
    let tmp_note = InputEditorComponent.inpEdComp.allNotes[(e.target as HTMLDivElement).id];
    // InputEditorComponent.inpEdComp.keyEditor.gripX = e.clientX;
    if (tmp_note == undefined) {
      tmp_note = iec.changingNote;
    } else if (iec.changingNote == null) {
      iec.changingNote = tmp_note;
    }
    if (iec.heldEdge == null) {
      iec.heldEdge = e.target;
    }
    document.addEventListener('mousemove', InputEditorEvents.NoteEdge_Left_MouMove, false);
    document.addEventListener('mouseup', InputEditorEvents.NoteEdge_Left_lMouUp);
  }

  /** Event: mouse left click on right note edge
   * @param e
   */
  static NoteEdge_Right_lMouDown(e: MouseEvent) {
    const iec = InputEditorComponent.inpEdComp;
    let tmp_note = InputEditorComponent.inpEdComp.allNotes[(e.target as HTMLDivElement).id];
    iec.holdingEdge = true;
    (e.target as HTMLDivElement).style.cursor = 'e-resize';
    // InputEditorComponent.inpEdComp.keyEditor.gripX = e.clientX;
    if (tmp_note == undefined) {
      tmp_note = iec.changingNote;
    } else if (iec.changingNote == null) {
      iec.changingNote = tmp_note;
    }
    if (iec.heldEdge == null) {
      iec.heldEdge = e.target;
    }
    document.addEventListener('mousemove', InputEditorEvents.NoteEdge_Right_MouMove, false);
    document.addEventListener('mouseup', InputEditorEvents.NoteEdge_Right_lMouUp);
  }

  /** Event: mouse move over left note edge
   * @param e
   */
  static NoteEdge_Left_MouMove(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp,
      tmp_ticks = iec.info.snapTicksAtX,
      tmp_rightEdge = iec.heldEdge.parentElement.childNodes[1];
    (e.target as HTMLDivElement).style.cursor = 'w-resize';

    if (iec.changingNote !== null && tmp_ticks <= iec.changingNote.noteOff.ticks) {
      iec.changingNote.part.moveEvent(iec.changingNote.noteOn, tmp_ticks - iec.changingNote.noteOn.ticks);
      InputEditorFunctions.UpdateSong(iec);
      let edgeBBoxes = InputEditorVisuals.createEdgeBBoxes(iec.changingNote.bbox, 8);
      InputEditorVisuals.updateElementBBox(iec.heldEdge, edgeBBoxes[0]);
      InputEditorVisuals.updateElementBBox(tmp_rightEdge, edgeBBoxes[1]);
    } else {
    }
  }

  /** Event: mouse move over right note edge
   * @param e
   */
  static NoteEdge_Right_MouMove(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp,
      tmp_ticks = iec.info.snapTicksAtX,
      tmp_leftEdge = iec.heldEdge.parentElement.childNodes[0];
    (e.target as HTMLDivElement).style.cursor = 'e-resize';
    if (iec.changingNote !== null && tmp_ticks >= iec.changingNote.noteOn.ticks) {
      iec.changingNote.part.moveEvent(iec.changingNote.noteOff, tmp_ticks - iec.changingNote.noteOff.ticks);
      InputEditorFunctions.UpdateSong(iec);
      let edgeBBoxes = InputEditorVisuals.createEdgeBBoxes(iec.changingNote.bbox, 8);
      InputEditorVisuals.updateElementBBox(tmp_leftEdge, edgeBBoxes[0]);
      InputEditorVisuals.updateElementBBox(iec.heldEdge, edgeBBoxes[1]);
    } else {

    }
  }

  /** Event: left mouse click up on left note edge
   * @param e
   */
  static NoteEdge_Left_lMouUp(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp;
    iec.holdingEdge = false;
    iec.changingNote = null;
    iec.heldEdge = null;
    document.removeEventListener('mousemove', InputEditorEvents.NoteEdge_Left_MouMove, false);
    document.removeEventListener('mouseup', InputEditorEvents.NoteEdge_Left_lMouUp);
    InputEditorFunctions.UpdateSong(iec);
    (e.target as HTMLDivElement).style.cursor = 'default';
  }

  /** Event: left mouse click up on right note edge
   * @param e
   */
  static NoteEdge_Right_lMouUp(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp;
    iec.holdingEdge = false;
    iec.changingNote = null;
    iec.heldEdge = null;
    document.removeEventListener('mousemove', InputEditorEvents.NoteEdge_Right_MouMove, false);
    document.removeEventListener('mouseup', InputEditorEvents.NoteEdge_Right_lMouUp);
    InputEditorFunctions.UpdateSong(iec);
  }

  /* Grid */
  Grid_lMouDown(e: MouseEvent) {
  }

  Grid_lMouUp(e: MouseEvent) {
  }

  /** Event: left mouse double click on editor grid
   */
  static Grid_lMouDbl(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp,
      elmt = (e.target as HTMLElement),
      tmp_className = elmt.className;
    /**
     * if double clicking a note */
    if (tmp_className.indexOf('note') !== -1) {
      iec.currNote = iec.allNotes[elmt.id];
      iec.currPart = iec.currNote.part;
      return;
    }
    /**
     * if double clicking a blank section of a part */
    else if (tmp_className.indexOf('part') !== -1) {
      iec.currPart = iec.allParts[elmt.id];
      iec.currPart.addEvents(InputEditorFunctions.createNewNoteAtMouse(iec.currPart, iec));
      InputEditorFunctions.UpdateSong(iec);
      return;
    }
    /**
     * if double clicking grid but current part is selected */
    else if (iec.currPart) {
      // currPart.addEvents(addNewNoteAtMouse());
      // InputEditorFunctions.UpdateSong(iec);
      return;
    }
    /**
     * if double clicking empty grid space */
    else {
      iec.currNote = null;
      iec.currPart = null;
      InputEditorFunctions.addPartAtMouse(iec);
      InputEditorFunctions.UpdateSong(iec);
      return;
    }
  }

  /** Event: left mouse click down on general editor space
   * @param e
   */
  static Generic_lMouDown(e: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp,
      elmt = (e.target as HTMLElement),
      tmp_className = elmt.className;
    if (tmp_className.indexOf('note') !== -1) {
      if (iec.currNote !== null) {
        InputEditorFunctions.unselectNote(iec.currNote);
      }
      iec.currNote = iec.allNotes[elmt.id];
      if (iec.currNote !== null) {
        InputEditorFunctions.selectNote(iec.currNote);
      }
      iec.currPart = iec.currNote.part;
      if (iec.currPart !== null) {
        InputEditorFunctions.selectPart(iec.currPart);
      }
      return;
    } else if (tmp_className.indexOf('part') !== -1) {
      // keyEditor.setPlayheadToX(e.pageX);
      if (iec.currPart !== null) {
        InputEditorFunctions.unselectPart(iec.currPart);
      }
      iec.currPart = iec.allParts[elmt.id];
      if (iec.currPart !== null) {
        InputEditorFunctions.selectPart(iec.currPart);
      }
      if (iec.currNote !== null) {
        InputEditorFunctions.unselectNote(iec.currNote);
      }
      iec.currNote = null;
      return;
    } else {
      if (iec.currNote !== null) {
        InputEditorFunctions.unselectNote(iec.currNote);
      }
      iec.currNote = null;
      if (iec.currPart !== null) {
        InputEditorFunctions.unselectPart(iec.currPart);
      }
      iec.currPart = null;
      iec.keyEditor.setPlayheadToX(e.pageX - iec.info.editorFrameOffsetX);
      return;
    }
    // you could also use:
  }

  //#endregion


  //#region Init Functions
  /**
   * init of basic input events
   */
  static initInputEvents() {
    let iec = InputEditorComponent.inpEdComp;
    /**
     * Text
     */
    iec.html.txt_KeyRangeStart.addEventListener('change', (e) => {
      iec.keyEditor.lowestNote = parseInt(iec.html.txt_KeyRangeStart.value);
      // iec.song.setPitchRange(iec.html.txt_KeyRangeStart.value, iec.keyEditor.highestNote);
      // iec.keyEditor.updateSong(iec.song);
    });
    iec.html.txt_KeyRangeEnd.addEventListener('change', (e) => {
      iec.keyEditor.highestNote = parseInt(iec.html.txt_KeyRangeEnd.value);
      // iec.song.setPitchRange(iec.keyEditor.lowestNote, iec.html.txt_KeyRangeEnd.value);
    });
    // listen for scale and draw events, a scale event is fired when you change the number of bars per page
    // a draw event is fired when you change the size of the viewport by resizing the browser window
    iec.keyEditor.addEventListener('scale draw', () => {
      InputEditorVisuals.draw(iec);
    });

    window.addEventListener('scroll', (sc) => {
      iec.info.UpdateInfo(null, iec.keyEditor);
    });
    // listen for scroll events, the score automatically follows the song positon during playback: as soon as
    // the playhead moves off the right side of the screen, a scroll event is fired
    iec.keyEditor.addEventListener('scroll', (data) => {
      iec.html.div_Editor.scrollLeft = data.x;
    });
    /**
     * EXPERIMENTAL - Add notes and parts when double clicked in certain contexts
     */
    iec.html.div_Score.addEventListener('dblclick', (me) => {
      InputEditorEvents.Grid_lMouDbl(me);
    });
    // you can set the playhead at any position by clicking on the score
    /** OR - if element clicked on is a part or note, it sets the current note / part to that element */
    iec.html.div_Score.addEventListener('mousedown', (me) => {
      InputEditorEvents.Generic_lMouDown(me);
    });
    /** AUDIO CONTEXT CHECKER EVENT */
    iec.html.div_Editor.addEventListener('click', (me) => {
      iec.info.UpdateInfo(me, iec.keyEditor);
    });
    // if you scroll the score by hand you must inform the key editor. necessary for calculating
    // the song position by x coordinate and the pitch by y coordinate
    iec.html.div_Editor.addEventListener('scroll', () => {
      iec.info.UpdateInfo(null, iec.keyEditor);
      iec.keyEditor.updateScroll(iec.html.div_Editor.scrollLeft, iec.html.div_Editor.scrollTop);
    }, false);
    /**
     * Score Mouse Movement Tracker
     */
    window.addEventListener('mousemove', (me) => {
        me.preventDefault();
        let tmp_part = iec.keyEditor.selectedPart,
          tmp_note = iec.keyEditor.selectedNote;

        // show the song position and pitch of the current mouse position; handy for debugging
        iec.info.UpdateInfo(me, iec.keyEditor);
        // move part or note if selected
        if (tmp_part !== undefined) {
          iec.keyEditor.movePart(iec.info.pageX, iec.info.pageY);
        }
        if (tmp_note !== undefined) {
          iec.keyEditor.moveNote(iec.info.pageX, iec.info.pageY - iec.info.editorFrameOffsetY - (iec.info.pitchHeight / 2));
        }
      },
      false
    );
    /**
     * Grid
     */
    iec.html.slct_Snap.addEventListener('change', () => {
      iec.snapAmt = iec.html.slct_Snap.options[iec.html.slct_Snap.selectedIndex].value;
      iec.keyEditor.setSnapX(Number.parseInt(iec.html.slct_Snap.options[iec.html.slct_Snap.selectedIndex].value));
    }, false);
    /**
     * Buttons
     */
    iec.html.btn_Play.addEventListener('click', () => {
      iec.song.pause();
    });
    iec.html.btn_Record.addEventListener('click', () => {
      iec.song.startRecording();
    });
    iec.html.btn_Loop.addEventListener('click', () => {
      iec.song.loop = !iec.song.loop;
    });

    iec.html.btn_Stop.addEventListener('click', () => {
      iec.song.stop();
    });
    iec.html.btn_Next.addEventListener('click', () => {
      iec.keyEditor.scroll('>');
    });
    iec.html.btn_Prev.addEventListener('click', () => {
      iec.keyEditor.scroll('<');
    });
    iec.html.btn_First.addEventListener('click', () => {
      iec.keyEditor.scroll('<<');
    });
    iec.html.btn_Last.addEventListener('click', () => {
      iec.keyEditor.scroll('>>');
    });
    iec.html.btn_AddPart.addEventListener('click', () => {
      InputEditorFunctions.addRandomPartAtPlayhead(iec);
    });
    /**
     * Sliders
     */
    iec.html.sldr_barsPerPage.addEventListener(
      'change',
      (e) => {
        var tmp_bpp = parseFloat((e.target as HTMLInputElement).value);
        iec.html.lbl_sldr_barsPerPage.innerHTML = '#bars ' + tmp_bpp;
        iec.keyEditor.setBarsPerPage(tmp_bpp);
      },
      false
    );
    /**
     * Keyboard Shortcuts
     */
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        iec.song.stop();
      }
      if (e.key === ' ') {
        iec.song.pause();
      }
      if (e.key === 'Delete') {
      }
      //dumb hack: brings playhead to first displayed location from left if offscreen to the left
      if (e.key === 'ArrowRight') {
        iec.keyEditor.setPlayheadToX(Math.max(iec.keyEditor.getPlayheadX(true) + 16, 0));
      }
      if (e.key === 'ArrowLeft') {
        iec.keyEditor.setPlayheadToX(Math.max(iec.keyEditor.getPlayheadX(true) - 16, 0));
      }
    });
  }

  /**
   * Initialization of basic window events
   * @param iec
   */
  static initWindowEvents(iec: InputEditorComponent) {
    // window.addEventListener('mouseover', (e) => { });
    window.addEventListener('resize', (e) => {
      InputEditorVisuals.resize();
    }, false);
  }

  /**
   * Initializes the context sensitive editor controls
   */
  static initContextEvents() {
    InputEditorComponent.inpEdComp.song.addEventListener('play', () => {
      setElementValue(InputEditorComponent.inpEdComp.html.btn_Play, 'pause');
    });
    InputEditorComponent.inpEdComp.song.addEventListener('pause', () => {
      setElementValue(InputEditorComponent.inpEdComp.html.btn_Play, 'play');
    });
    InputEditorComponent.inpEdComp.song.addEventListener('stop', () => {
      setElementValue(InputEditorComponent.inpEdComp.html.btn_Play, 'play');
    });

    InputEditorComponent.inpEdComp.html.div_Editor.addEventListener('mousedown', () => {
      InputEditorComponent.inpEdComp.html.div_currPart.innerHTML = 'Sel Part: ' + (InputEditorComponent.inpEdComp.currPart !== null ? InputEditorComponent.inpEdComp.currPart.id : 'none');
      InputEditorComponent.inpEdComp.html.div_currNote.innerHTML = 'Sel Note: ' + (InputEditorComponent.inpEdComp.currNote !== null ? InputEditorComponent.inpEdComp.currNote.id : 'none');
    });
  }

  //#endregion
}
