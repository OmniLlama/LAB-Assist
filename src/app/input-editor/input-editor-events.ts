import {InputEditorComponent, setElementValue} from './input-editor.component';
import {InputEditorFunctions} from './input-editor-functions';
import {InputEditorVisuals} from './input-editor-visuals';
import {InputConverterFunctions} from '../input-converter/input-converter-functions';
import {numberToPitchString} from '../../helpers/Func';

export class InputEditorEvents {

  iec = InputEditorComponent.inpEdComp as InputEditorComponent;
  static initKeyboard(iec: InputEditorComponent){
    /**
     * Keyboard Shortcuts
     */
    window.addEventListener('keydown', (e) => {
      switch (e.key)
      {
        case 'Backspace':
          iec.playing = false;
          iec.edtrView.playhead.reset(false);
          iec.edtrView.updateDraw();
          break;
        case ' ':
          iec.playing = !iec.playing;
          break;
        case 'Delete':
        case 'ArrowRight':
        case 'ArrowLeft':
          break;
      }
    });
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
  // /**
  //  * Event: left mouse click up on note
  //  * @param e
  //  */
  static Note_lMouUp(e: MouseEvent): void {
    let iec = InputEditorComponent.inpEdComp;
    let tmp_note = iec.noteList[iec.currNote.id];
    // let pitch = numberToPitchString(iec.info.mousePitchPos);
    // elmt.setAttribute('pitch', pitch);
    document.removeEventListener('mousemove', (me) => iec.moveNote(me));
    document.removeEventListener('mouseup', InputEditorEvents.Note_lMouUp);
    iec.currNote = null;
  }
  //
  // /* Note Edge */
  // /** Event: mouse over left note edge
  //  * @param e
  //  */
  // static NoteEdge_Left_MouOver(e: MouseEvent): void {
  //   (e.target as HTMLDivElement).style.cursor = 'w-resize';
  // }
  //
  // /** Event: mouse over right note edge
  //  * @param e
  //  */
  // static NoteEdge_Right_MouOver(e: MouseEvent): void {
  //   (e.target as HTMLDivElement).style.cursor = 'e-resize';
  // }
  //
  // /** Event: mouse left click on left note edge
  //  * @param e
  //  */
  // static NoteEdge_Left_lMouDown(e: MouseEvent): void {
  //   let iec = InputEditorComponent.inpEdComp;
  //   iec.holdingEdge = true;
  //   (e.target as HTMLDivElement).style.cursor = 'w-resize';
  //   // let tmp_note = InputEditorComponent.inpEdComp.allNotes[(e.target as HTMLDivElement).id];
  //   let tmp_note = InputEditorComponent.inpEdComp.noteList[(e.target as HTMLDivElement).id];
  //   if (tmp_note == undefined) {
  //     tmp_note = iec.changingNote;
  //   } else if (iec.changingNote == null) {
  //     iec.changingNote = tmp_note;
  //   }
  //   if (iec.heldEdge == null) {
  //     iec.heldEdge = e.target;
  //   }
  //   document.addEventListener('mousemove', InputEditorEvents.NoteEdge_Left_MouMove, false);
  //   document.addEventListener('mouseup', InputEditorEvents.NoteEdge_Left_lMouUp);
  // }
  //
  // /** Event: mouse left click on right note edge
  //  * @param e
  //  */
  // static NoteEdge_Right_lMouDown(e: MouseEvent) {
  //   const iec = InputEditorComponent.inpEdComp;
  //   let tmp_note = InputEditorComponent.inpEdComp.allNotes[(e.target as HTMLDivElement).id];
  //   iec.holdingEdge = true;
  //   (e.target as HTMLDivElement).style.cursor = 'e-resize';
  //   // InputEditorComponent.inpEdComp.keyEditor.gripX = e.clientX;
  //   if (tmp_note == undefined) {
  //     tmp_note = iec.changingNote;
  //   } else if (iec.changingNote == null) {
  //     iec.changingNote = tmp_note;
  //   }
  //   if (iec.heldEdge == null) {
  //     iec.heldEdge = e.target;
  //   }
  //   document.addEventListener('mousemove', InputEditorEvents.NoteEdge_Right_MouMove, false);
  //   document.addEventListener('mouseup', InputEditorEvents.NoteEdge_Right_lMouUp);
  // }
  //
  // /** Event: mouse move over left note edge
  //  * @param e
  //  */
  // static NoteEdge_Left_MouMove(e: MouseEvent) {
  //   let iec = InputEditorComponent.inpEdComp,
  //     tmp_ticks = iec.info.snapTicksAtX,
  //     tmp_rightEdge = iec.heldEdge.parentElement.childNodes[1];
  //   (e.target as HTMLDivElement).style.cursor = 'w-resize';
  //
  //   if (iec.changingNote !== null && tmp_ticks <= iec.changingNote.noteOff.ticks) {
  //     iec.changingNote.part.moveEvent(iec.changingNote.noteOn, tmp_ticks - iec.changingNote.noteOn.ticks);
  //     InputEditorFunctions.UpdateSong(iec);
  //     let edgeBBoxes = InputEditorVisuals.createNoteEdgeBBoxes(iec.changingNote.bbox, 8);
  //     InputEditorVisuals.updateElementBBox(iec.heldEdge, edgeBBoxes[0]);
  //     InputEditorVisuals.updateElementBBox(tmp_rightEdge, edgeBBoxes[1]);
  //   } else {
  //   }
  // }
  //
  // /** Event: mouse move over right note edge
  //  * @param e
  //  */
  // static NoteEdge_Right_MouMove(e: MouseEvent) {
  //   let iec = InputEditorComponent.inpEdComp,
  //     tmp_ticks = iec.info.snapTicksAtX,
  //     tmp_leftEdge = iec.heldEdge.parentElement.childNodes[0];
  //   (e.target as HTMLDivElement).style.cursor = 'e-resize';
  //   if (iec.changingNote !== null && tmp_ticks >= iec.changingNote.noteOn.ticks) {
  //     iec.changingNote.part.moveEvent(iec.changingNote.noteOff, tmp_ticks - iec.changingNote.noteOff.ticks);
  //     InputEditorFunctions.UpdateSong(iec);
  //     let edgeBBoxes = InputEditorVisuals.createNoteEdgeBBoxes(iec.changingNote.bbox, 8);
  //     InputEditorVisuals.updateElementBBox(tmp_leftEdge, edgeBBoxes[0]);
  //     InputEditorVisuals.updateElementBBox(iec.heldEdge, edgeBBoxes[1]);
  //   } else {
  //
  //   }
  // }
  //
  // /** Event: left mouse click up on left note edge
  //  * @param e
  //  */
  // static NoteEdge_Left_lMouUp(e: MouseEvent) {
  //   let iec = InputEditorComponent.inpEdComp;
  //   iec.holdingEdge = false;
  //   iec.changingNote = null;
  //   iec.heldEdge = null;
  //   document.removeEventListener('mousemove', InputEditorEvents.NoteEdge_Left_MouMove, false);
  //   document.removeEventListener('mouseup', InputEditorEvents.NoteEdge_Left_lMouUp);
  //   (e.target as HTMLDivElement).style.cursor = 'default';
  // }
  //
  // /** Event: left mouse click up on right note edge
  //  * @param e
  //  */
  // static NoteEdge_Right_lMouUp(e: MouseEvent) {
  //   let iec = InputEditorComponent.inpEdComp;
  //   iec.holdingEdge = false;
  //   iec.changingNote = null;
  //   iec.heldEdge = null;
  //   document.removeEventListener('mousemove', InputEditorEvents.NoteEdge_Right_MouMove, false);
  //   document.removeEventListener('mouseup', InputEditorEvents.NoteEdge_Right_lMouUp);
  // }
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
