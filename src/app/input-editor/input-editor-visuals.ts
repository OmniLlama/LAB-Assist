import {InputEditorComponent} from './input-editor.component';
import {InputEditorEvents} from './input-editor-events';
import {InputEditorFunctions} from './input-editor-functions';
import {BBox} from '../../helpers/Defs';
import {Img} from '../../helpers/Gen';

export class InputEditorVisuals {
  /**
   * Editor Main Draw Function
   * @param iec
   */
  static draw(iec: InputEditorComponent) {
    iec.html.div_Parts.innerHTML = '';
    iec.html.div_Notes.innerHTML = '';
    iec.html.div_PitchLines.innerHTML = '';
    iec.html.div_BarLines.innerHTML = '';
    iec.html.div_BeatLines.innerHTML = '';
    iec.html.div_SixteenthLines.innerHTML = '';

  }



  /**
   * draw a given note in sequencer
   * @param ref_note
   * @param iec
   */
  static drawNote(ref_note, iec: InputEditorComponent) {
    const bbox = ref_note.bbox,
      div_Note = document.createElement('div'),
      edges = InputEditorVisuals.createEdges(bbox, div_Note),
      div_Note_info = document.createElement('div');

    div_Note.id = ref_note.id;
    div_Note.setAttribute('pitch', ref_note.name);
    div_Note.className = 'note';
    InputEditorVisuals.updateElementBBox(div_Note, bbox);

    // div_Note.addEventListener('mouseover', (e) => InputEditorEvents.Note_MouOver(e), false);
    // div_Note.addEventListener('mousedown', (e) => InputEditorEvents.Note_lMouDown(e), false);

    div_Note.append(edges[0], edges[1]);
    div_Note.append(div_Note_info);
    iec.edtrView.score.appendChild(div_Note);
  }

  static createEdges(bbox, div): [HTMLImageElement, HTMLImageElement] {
    const edgeBBoxes = this.createNoteEdgeBBoxes(bbox, 8);
    const img_Note_leftEdge = Img('Editor-Arrow-Left-Transparent', div.id, 'note-edge');
    const img_Note_rightEdge = Img('Editor-Arrow-Right-Transparent', div.id, 'note-edge');

    InputEditorVisuals.updateElementBBox(img_Note_leftEdge, edgeBBoxes[0]);
    InputEditorVisuals.updateElementBBox(img_Note_rightEdge, edgeBBoxes[1]);
    // img_Note_leftEdge.addEventListener('mouseover', (e) => {
    //   InputEditorEvents.NoteEdge_Left_MouOver(e);
    // });
    // img_Note_leftEdge.addEventListener('mousedown', (e) => {
    //   InputEditorEvents.NoteEdge_Left_lMouDown(e);
    // });
    // img_Note_rightEdge.addEventListener('mouseover', (e) => {
    //   InputEditorEvents.NoteEdge_Right_MouOver(e);
    // });
    // img_Note_rightEdge.addEventListener('mousedown', (e) => {
    //   InputEditorEvents.NoteEdge_Right_lMouDown(e);
    // });
    return [img_Note_leftEdge, img_Note_rightEdge];
  }



  /**
   * Fits element within its bounding box
   * @param element
   * @param bbox
   */
  static updateElementBBoxOld(element, bbox: any) {
    element.style.left = bbox.x + 'px';
    element.style.top = bbox.y + 'px';
    element.style.width = bbox.width + 'px';
    element.style.height = bbox.height + 'px';
  }

  /**
   * Fits element within its bounding box
   * @param element
   * @param bbox
   */
  static updateElementBBox(element, bbox: BBox) {
    element.style.left = bbox.x + 'px';
    element.style.top = bbox.y + 'px';
    element.style.width = bbox.width + 'px';
    element.style.height = bbox.height + 'px';
  }


  /**
   * General Editor Render Loop
   */
  static render() {
    let iec = InputEditorComponent.inpEdComp,
      iev = InputEditorVisuals;

    // InputEditorVisuals.HrtBtRender(iec);

    //update head values if playing
    // if (iec.song.playing) {
    if (iec.playing) {
      // iec.info.UpdateInfo(null, iec.keyEditor);
      iec.edtrView.playhead.shiftUpdate(2, 0);
    }
    iec.fps.update();
    requestAnimationFrame(iev.render);
  }

  /**
   * Creates bounding boxes for note edges
   * @param bbox Bounding box of note
   * @param xPx Width of bounding box in pixels
   */
  static createNoteEdgeBBoxes(bbox, xPx: number): [BBox, BBox] {
    const tmp_bbox_l = new BBox(0 - xPx, 0, xPx, bbox.height);
    const tmp_bbox_r = new BBox(bbox.width, 0, xPx, bbox.height);
    return [tmp_bbox_l, tmp_bbox_r];
  }


  //#endregion
}
