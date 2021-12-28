import {InputEditorComponent} from './input-editor.component';
import {InputEditorEvents} from './input-editor-events';
import {InputEditorFunctions} from './input-editor-functions';
import {BBox, HTMLNote} from '../../helpers/Defs';
import {Img} from '../../helpers/Gen';

export class InputEditorVisuals {

  static createEdges(note: HTMLNote, bbox: BBox, div: HTMLDivElement): [HTMLImageElement, HTMLImageElement] {
    const edgeWidth = 5;
    const tmp_bbox_l = new BBox(0 - edgeWidth, 0, edgeWidth, bbox.height);
    const tmp_bbox_r = new BBox(bbox.width, 0, edgeWidth, bbox.height);
    const img_Note_leftEdge = Img('note-edge-left', div.id, 'note-edge-left');
    const img_Note_rightEdge = Img('note-edge-right', div.id, 'note-edge-right');

    tmp_bbox_l.updateElementToBBox(img_Note_leftEdge);
    tmp_bbox_r.updateElementToBBox(img_Note_rightEdge);
    return [img_Note_leftEdge, img_Note_rightEdge];
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

  static createNoteEdgeBBoxes(bbox, xPx: number): [BBox, BBox] {
    const tmp_bbox_l = new BBox(0 - xPx, 0, xPx, bbox.height);
    const tmp_bbox_r = new BBox(bbox.width, 0, xPx, bbox.height);
    return [tmp_bbox_l, tmp_bbox_r];
  }


  //#endregion
}
