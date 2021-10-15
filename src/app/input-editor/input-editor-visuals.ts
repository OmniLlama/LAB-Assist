import {Note, Part} from '../../heartbeat/build';
import {InputEditorComponent} from './input-editor.component';
import {InputEditorEvents} from './input-editor-events';
import {InputEditorFunctions} from './input-editor-functions';
import {BBox} from '../../helpers/Defs';

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

    iec.keyEditor.horizontalLine.reset();
    iec.keyEditor.verticalLine.reset();
    iec.keyEditor.noteIterator.reset();
    iec.keyEditor.partIterator.reset();

    iec.html.div_Score.style.width = iec.keyEditor.width + 'px';
    let i = 0;
    while (iec.keyEditor.horizontalLine.hasNext('chromatic')) {
      this.drawHorizontalLine(iec.keyEditor.horizontalLine.next('chromatic'));
    }
    while (iec.keyEditor.verticalLine.hasNext('sixteenth')) {
      this.drawVerticalLine(iec.keyEditor.verticalLine.next('sixteenth'));
    }
    while (iec.keyEditor.noteIterator.hasNext()) {
      this.drawNote(iec.keyEditor.noteIterator.next(), iec);
    }
    while (iec.keyEditor.partIterator.hasNext()) {
      this.drawPart(iec.keyEditor.partIterator.next(), iec);
    }
  }

  /**
   * horizontal line iterator
   * @param ref_data
   */
  static drawHorizontalLine(ref_data) {
    let div_HLine = document.createElement('div'),
      pitchHeight = InputEditorComponent.inpEdComp.keyEditor.pitchHeight;

    if (ref_data.note.blackKey === true) {
      div_HLine.className = 'pitch-line black-key';
    } else {
      div_HLine.className = 'pitch-line';
    }
    div_HLine.id = ref_data.note.fullName;
    div_HLine.innerHTML = ref_data.note.fullName;
    div_HLine.style.height = pitchHeight + 'px';
    div_HLine.style.top = ref_data.y + 'px';
    InputEditorComponent.inpEdComp.html.div_PitchLines.appendChild(div_HLine);

  }

  /**
   * vertical line iterator
   * @param ref_data
   */
  static drawVerticalLine(ref_data) {
    let tmp_type = ref_data.type,
      div_VLine = document.createElement('div'),
      html = InputEditorComponent.inpEdComp.html;

    div_VLine.id = ref_data.position.barsAsString;
    div_VLine.className = ref_data.type + '-line';
    div_VLine.style.left = ref_data.x + 'px';
    div_VLine.style.width = '5px'; // if you make the width too small, the background image of sometimes disappears

    switch (tmp_type) {
      case 'bar':
        div_VLine.innerHTML = ref_data.position.bar;
        div_VLine.style.height = html.div_Score.scrollHeight.toString() + 'px';
        html.div_BarLines.appendChild(div_VLine);
        break;
      case 'beat':
        html.div_BeatLines.appendChild(div_VLine);
        break;
      case 'sixteenth':
        html.div_SixteenthLines.appendChild(div_VLine);
        break;
    }
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

    // store note and div
    InputEditorComponent.inpEdComp.allNotes[ref_note.id] = ref_note;
    iec.html.divs_AllNotes[ref_note.id] = div_Note;
    div_Note.addEventListener('mouseover', (e) => InputEditorEvents.Note_MouOver(e), false);
    div_Note.addEventListener('mousedown', (e) => InputEditorEvents.Note_lMouDown(e), false);

    div_Note.append(edges[0], edges[1]);
    div_Note.append(div_Note_info);
    // iec.html.div_Notes.appendChild(div_Note);
    iec.edtrView.score.appendChild(div_Note);
  }

  static createEdges(bbox, div): [HTMLImageElement, HTMLImageElement] {
    const edgeBBoxes = this.createNoteEdgeBBoxes(bbox, 8);
    const img_Note_leftEdge = document.createElement('img');
    const img_Note_rightEdge = document.createElement('img');
    img_Note_leftEdge.id = div.id;
    img_Note_rightEdge.id = div.id;
    img_Note_leftEdge.className = 'note-edge';
    img_Note_rightEdge.className = 'note-edge';
    img_Note_leftEdge.src = 'assets/images/Editor-Arrow-Left-Transparent.png';
    img_Note_rightEdge.src = 'assets/images/Editor-Arrow-Right-Transparent.png';
    InputEditorVisuals.updateElementBBox(img_Note_leftEdge, edgeBBoxes[0]);
    InputEditorVisuals.updateElementBBox(img_Note_rightEdge, edgeBBoxes[1]);
    img_Note_leftEdge.addEventListener('mouseover', (e) => {
      InputEditorEvents.NoteEdge_Left_MouOver(e);
    });
    img_Note_leftEdge.addEventListener('mousedown', (e) => {
      InputEditorEvents.NoteEdge_Left_lMouDown(e);
    });
    img_Note_rightEdge.addEventListener('mouseover', (e) => {
      InputEditorEvents.NoteEdge_Right_MouOver(e);
    });
    img_Note_rightEdge.addEventListener('mousedown', (e) => {
      InputEditorEvents.NoteEdge_Right_lMouDown(e);
    });
    return [img_Note_leftEdge, img_Note_rightEdge];
  }

  /**
   * draw a given part in the sequencer
   * @param ref_part
   * @param iec
   */
  static drawPart(ref_part: Part, iec) {
    let tmp_bbox = ref_part.bbox,
      tmp_div_Part = document.createElement('div');

    tmp_div_Part.id = ref_part.id;
    tmp_div_Part.className = 'part';
    tmp_div_Part.style.left = tmp_bbox.x + 'px';
    tmp_div_Part.style.top = tmp_bbox.y + 'px';
    tmp_div_Part.style.width = tmp_bbox.width - 1 + 'px';
    tmp_div_Part.style.height = tmp_bbox.height - 1 + 'px';

    // store part and div
    InputEditorComponent.inpEdComp.allParts[ref_part.id] = ref_part;
    iec.html.divs_AllParts[ref_part.id] = tmp_div_Part;
    tmp_div_Part.addEventListener('mousedown', InputEditorEvents.Part_lMouDown, false);
    iec.html.div_Parts.appendChild(tmp_div_Part);
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
   * resizes editor whenever the window's size or shape is changed
   */
  static resize() {
    let iec = InputEditorComponent.inpEdComp;
    let tmp_icons_w = 64;
    let tmp_c = iec.html.div_Controls.getBoundingClientRect().height;
    let tmp_w = window.innerWidth - tmp_icons_w;
    let tmp_h = iec.info.editorHeight;

    // tell the key editor that the viewport has canged, necessary for auto scroll during playback
    iec.keyEditor.setViewport(tmp_w, tmp_h);
    iec.html.div_Editor.style.width = tmp_w + 'px';
    iec.html.div_Editor.style.left = tmp_icons_w + 'px';
    iec.html.div_Editor.style.height = tmp_h + 'px';
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
      iec.edtrView.playhead.shiftUpdate(1, 0);
    }
    requestAnimationFrame(iev.render);
  }

  /**
   * Creates bounding boxes for note
   * @param bbox Bounding box of note
   * @param xPx Width of bounding box in pixels
   */
  static createNoteEdgeBBoxes(bbox, xPx: number): [BBox, BBox] {
    const tmp_bbox_l = new BBox(null, 0 - xPx, 0, xPx, bbox.height);
    const tmp_bbox_r = new BBox(null, bbox.width, 0, xPx, bbox.height);
    return [tmp_bbox_l, tmp_bbox_r];
  }

  static HrtBtRender(iec: InputEditorComponent) {
    let tmp_div_Note: HTMLDivElement;
    let tmp_div_Part: HTMLDivElement;
    const iev = InputEditorVisuals;
    const position = iec.keyEditor.getPositionAt(iec.keyEditor.getPlayheadX());

    iec.html.div_Playhead.style.left = iec.keyEditor.getPlayheadX() - 10 + 'px';
    iec.html.div_PageNumbers.innerHTML =
      'page ' + iec.keyEditor.currentPage + ' of ' + iec.keyEditor.numPages;

    iec.html.div_BarsBeats.innerHTML = iec.song.barsAsString;
    if (position) {
      const tmp_hrMinSecMillisec = new Date(position.ticks * iec.song.millisPerTick);
      iec.html.div_Seconds.innerHTML =
        tmp_hrMinSecMillisec.getUTCHours() + ':'
        + tmp_hrMinSecMillisec.getUTCMinutes() + ':'
        + tmp_hrMinSecMillisec.getUTCSeconds() + '.'
        + tmp_hrMinSecMillisec.getUTCMilliseconds();
    }
    const snapshot = iec.keyEditor.getSnapshot('key-editor');
    snapshot.notes.removed.forEach((note) => {
      iec.html.divs_AllNotes[note.id].removeEventListener('mousedown', InputEditorEvents.Note_lMouDown);
      iec.html.div_Notes.removeChild(document.getElementById(note.id));
    });

    snapshot.notes.new.forEach((note) => {
      iev.drawNote(note, iec);
    });
    snapshot.notes.recorded.forEach((note) => {
      iev.drawNote(note, iec);
    });
    snapshot.notes.recording.forEach((note) => {
      iev.updateElementBBox(iec.html.divs_AllNotes[note.id], note.bbox);
    });
    // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
    snapshot.notes.changed.forEach((note) => {
      let elmt = iec.html.divs_AllNotes[note.id] as HTMLElement;
      // elmt.setAttribute('pitch', note.name);
      iev.updateElementBBox(elmt, note.bbox);
    });

    // stateChanged arrays contain elements that have become active or inactive
    snapshot.notes.stateChanged.forEach((note) => {
      InputEditorFunctions.setNoteActiveStateOld(note, tmp_div_Note);
    });

    snapshot.parts.removed.forEach((part) => {
      iec.html.divs_AllParts[part.id].removeEventListener('mousedown', InputEditorEvents.Part_lMouDown);
      iec.html.div_Parts.removeChild(document.getElementById(part.id));
    });

    snapshot.parts.new.forEach((part) => {
      iev.drawPart(part, iec);
    });

    // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
    snapshot.parts.changed.forEach((part) => {
      iev.updateElementBBoxOld(iec.html.divs_AllParts[part.id], part.bbox);
    });

    // stateChanged arrays contain elements that have become active or inactive
    snapshot.parts.stateChanged.forEach((part) => {
      InputEditorFunctions.setPartActiveState(part, tmp_div_Part);
    });

    if (snapshot.hasNewBars) {
      // set the new width of the score
      iec.html.div_Score.style.width = snapshot.newWidth + 'px';

      // clear the horizontal lines because the lines have to be drawn longer
      iec.html.div_PitchLines.innerHTML = '';

      // reset the index of the iterator because we're starting from 0 again
      iec.keyEditor.horizontalLine.reset();
      while (iec.keyEditor.horizontalLine.hasNext('chromatic')) {
        iev.drawHorizontalLine(iec.keyEditor.horizontalLine.next('chromatic'));
      }

      // the index of the vertical line iterator has already been set to the right index by the key editor
      // so only the extra barlines will be drawn
      while (iec.keyEditor.verticalLine.hasNext('sixteenth')) {
        iev.drawVerticalLine(iec.keyEditor.verticalLine.next('sixteenth'));
      }
    }
  }


  //#endregion
}
