import {InputEditorComponent} from './input-editor.component';

export class InputEditorEvents {

  iec = InputEditorComponent.inpEdComp as InputEditorComponent;

  static initKeyboard(iec: InputEditorComponent) {
    window.addEventListener('keydown', (ke) => InputEditorEvents.KeyBrd(ke, iec));
  }

  static KeyBrd(ke: KeyboardEvent, iec: InputEditorComponent) {
    switch (ke.key) {
      case 'Backspace':
        ke.preventDefault();
        iec.edtrView.stopPlayState();
        break;
      case ' ':
        ke.preventDefault();
        iec.edtrView.togglePlayState();
        break;
      case 'Delete':
        break;
      case 'ArrowRight':
        ke.preventDefault();
        iec.edtrView.playhead.xShiftUpdate(iec.edtrView.pxPrFrm);
        break;
      case 'ArrowLeft':
        ke.preventDefault();
        iec.edtrView.playhead.xShiftUpdate(-iec.edtrView.pxPrFrm);
        break;
    }
  }

  //#region [rgba(0,100,0,0.2)] Grid Element Event Functions
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
      let tmp_note = iec.noteList[e.target.id];
      iec.currNote = tmp_note;
      if (e.ctrlKey) {
        delete iec.noteList[e.target.id];
        iec.currNote = null;
      } else {
        // e.target.setAttribute('pitch', '00');
        document.addEventListener('mousemove', (me) => iec.moveNote(me));
        document.addEventListener('mouseup', InputEditorEvents.Note_lMouUp);
      }
    }
  }

  /**
   * Event: left mouse click up on note
   */
  static Note_lMouUp(e: MouseEvent): void {
    let iec = InputEditorComponent.inpEdComp;
    let tmp_note = iec.noteList[iec.currNote.id];
    document.removeEventListener('mousemove', (me) => iec.moveNote(me));
    document.removeEventListener('mouseup', InputEditorEvents.Note_lMouUp);
    iec.currNote = null;
  }

  /* Note Edge */
  /** Event: mouse left click on left note edge
   * @param e
   */
  static NoteEdge_Left_lMouDown(e: MouseEvent): void {
    let iec = InputEditorComponent.inpEdComp;
    iec.holdingEdge = true;
    let tmp_note = iec.noteList[(e.target as HTMLDivElement).id];
    iec.currNote = tmp_note;
    iec.heldEdge = iec.currNote.edgeL;
    document.addEventListener('mousemove', InputEditorEvents.NoteEdge_Left_MouMove, false);
    document.addEventListener('mouseup', InputEditorEvents.NoteEdge_Left_lMouUp);
  }


  /** Event: mouse left click on right note edge
   * @param e
   */
  static NoteEdge_Right_lMouDown(e: MouseEvent) {
    const iec = InputEditorComponent.inpEdComp;
    let tmp_note = iec.noteList[(e.target as HTMLDivElement).id];
    iec.holdingEdge = true;
    iec.currNote = tmp_note;
    iec.heldEdge = e.target;
    document.addEventListener('mousemove', InputEditorEvents.NoteEdge_Right_MouMove, false);
    document.addEventListener('mouseup', InputEditorEvents.NoteEdge_Right_lMouUp);
  }

  /** Event: mouse move over left note edge
   */
  static NoteEdge_Left_MouMove(me: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp,
      tmp_pos = iec.edtrView.snapX(me.x);
    if (iec.currNote !== null && tmp_pos <= iec.currNote.end) {
      iec.currNote.modifyNoteStart(tmp_pos);
    }
  }


  /** Event: mouse move over right note edge
   */
  static NoteEdge_Right_MouMove(me: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp,
      tmp_pos = iec.edtrView.snapX(me.x);
    if (iec.currNote !== null) {
      iec.currNote.modifyNoteEnd(tmp_pos);
    }
  }

  /** Event: left mouse click up on left note edge
   */
  static NoteEdge_Left_lMouUp(me: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp;
    iec.holdingEdge = false;
    iec.currNote = null;
    iec.heldEdge = null;
    document.removeEventListener('mousemove', InputEditorEvents.NoteEdge_Left_MouMove, false);
    document.removeEventListener('mouseup', InputEditorEvents.NoteEdge_Left_lMouUp);
    (me.target as HTMLDivElement).style.cursor = 'default';
  }

  /** Event: left mouse click up on right note edge
   * @param me
   */
  static NoteEdge_Right_lMouUp(me: MouseEvent) {
    let iec = InputEditorComponent.inpEdComp;
    iec.holdingEdge = false;
    iec.currNote = null;
    iec.heldEdge = null;
    document.removeEventListener('mousemove', InputEditorEvents.NoteEdge_Right_MouMove, false);
    document.removeEventListener('mouseup', InputEditorEvents.NoteEdge_Right_lMouUp);
  }

  //
  // /* Grid */
  // Grid_lMouDown(e: MouseEvent) {
  // }
  //
  // Grid_lMouUp(e: MouseEvent) {
  // }
  //
  // /** Event: left mouse double click on editor grid
  //  */
  // static Grid_lMouDbl(e: MouseEvent) {
  //   let iec = InputEditorComponent.inpEdComp,
  //     elmt = (e.target as HTMLElement),
  //     tmp_className = elmt.className;
  //   /**
  //    * if double clicking a note */
  //   if (tmp_className.indexOf('note') !== -1) {
  //     iec.currNote = iec.allNotes[elmt.id];
  //     // iec.currPart = iec.currNote.part;
  //     return;
  //   }
  //   /**
  //    * if double clicking a blank section of a part */
  //   else if (tmp_className.indexOf('part') !== -1) {
  //     iec.currPart = iec.allParts[elmt.id];
  //     iec.currPart.addEvents(InputEditorFunctions.createNewNoteAtMouse(iec.currPart, iec));
  //     InputEditorFunctions.UpdateSong(iec);
  //     return;
  //   }
  //   /**
  //    * if double clicking grid but current part is selected */
  //   else if (iec.currPart) {
  //     // currPart.addEvents(addNewNoteAtMouse());
  //     // InputEditorFunctions.UpdateSong(iec);
  //     return;
  //   }
  //   /**
  //    * if double clicking empty grid space */
  //   else {
  //     iec.currNote = null;
  //     iec.currPart = null;
  //     InputEditorFunctions.addPartAtMouse(iec);
  //     InputEditorFunctions.UpdateSong(iec);
  //     return;
  //   }
  // }
  //
  // /** Event: left mouse click down on general editor space
  //  * @param e
  //  */
  // static Generic_lMouDown(e: MouseEvent) {
  //   let iec = InputEditorComponent.inpEdComp,
  //     elmt = (e.target as HTMLElement),
  //     tmp_className = elmt.className;
  //   if (tmp_className.indexOf('note') !== -1) {
  //     if (iec.currNote !== null) {
  //       InputEditorFunctions.unselectNote(iec.currNote);
  //     }
  //     iec.currNote = iec.allNotes[elmt.id];
  //     if (iec.currNote !== null) {
  //       InputEditorFunctions.selectNote(iec.currNote);
  //     }
  //     if (iec.currPart !== null) {
  //       InputEditorFunctions.selectPart(iec.currPart);
  //     }
  //     return;
  //   } else if (tmp_className.indexOf('part') !== -1) {
  //     if (iec.currPart !== null) {
  //       InputEditorFunctions.unselectPart(iec.currPart);
  //     }
  //     iec.currPart = iec.allParts[elmt.id];
  //     if (iec.currPart !== null) {
  //       InputEditorFunctions.selectPart(iec.currPart);
  //     }
  //     if (iec.currNote !== null) {
  //       InputEditorFunctions.unselectNote(iec.currNote);
  //     }
  //     iec.currNote = null;
  //     return;
  //   } else {
  //     if (iec.currNote !== null) {
  //       InputEditorFunctions.unselectNote(iec.currNote);
  //     }
  //     iec.currNote = null;
  //     if (iec.currPart !== null) {
  //       InputEditorFunctions.unselectPart(iec.currPart);
  //     }
  //     iec.currPart = null;
  //     iec.keyEditor.setPlayheadToX(e.pageX - iec.info.editorFrameOffsetX);
  //     return;
  //   }
  //   // you could also use:
  // }
  //
  // //#endregion

}
