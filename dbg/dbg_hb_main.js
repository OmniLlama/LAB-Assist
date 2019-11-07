// satisfy jslint
// window.onload = e_OnLoad();
// function e_OnLoad() {
window.onload = function () {

  'use strict';
  edtrHTML = EditorHTML();

  enableGUI(false);
  addAssetsToSequencer(sequencer);
  sequencer.addAssetPack({
    url: '../../../assets/examples/asset_pack_basic.json'
  },
    init
  );
  // e_OnLoad();
};

function e_OnLoad() {
  'use strict';
  edtrHTML = EditorHTML();

  enableGUI(false);
  addAssetsToSequencer(sequencer);
  sequencer.addAssetPack({
    url: '../../../assets/examples/asset_pack_basic.json'
  },
    init
  );
}


function EditorHTML() {
  btn_Play = document.getElementById('play'),
    btn_Stop = document.getElementById('stop'),
    btn_Prev = document.getElementById('prev'),
    btn_Next = document.getElementById('next'),
    btn_Last = document.getElementById('last'),
    btn_First = document.getElementById('first'),
    btn_AddPart = document.getElementById('add-part'),
    txt_KeyRangeStart = document.getElementById('key-range-start'),
    txt_KeyRangeEnd = document.getElementById('key-range-end'),

    sldr_barsPerPage = document.getElementById('scale-slider'),
    lbl_sldr_barsPerPage = document.getElementById('scale-label'),

    div_Controls = document.getElementById('controls'),
    div_BarsBeats = document.getElementById('time-bars-beats'),
    div_Seconds = document.getElementById('time-seconds'),
    div_MouseX = document.getElementById('mouse-x'),
    div_MouseY = document.getElementById('mouse-y'),
    div_PageNumbers = document.getElementById('page-numbers'),
    div_Editor = document.getElementById('editor'),
    div_Score = document.getElementById('score'),
    div_BarLines = document.getElementById('bar-lines'),
    div_BeatLines = document.getElementById('tick-lines'),
    div_SixteenthLines = document.getElementById('sub-tick-lines'),
    div_PitchLines = document.getElementById('pitch-lines'),
    div_Notes = document.getElementById('notes'),
    div_Parts = document.getElementById('parts'),
    div_Playhead = document.getElementById('playhead'),
    slct_Snap = document.getElementById('snap'),
    div_currNote = document.getElementById('dbg-curr-note'),
    div_currPart = document.getElementById('dbg-curr-part'),
    divs_AllNotes = {}, // stores references to all divs that represent a midi note
    divs_AllParts = {}, // stores references to all divs that represent a midi part
    allNotes = {}, // stores references to all midi notes
    allParts = {}, // stores references to all midi parts
    gridHoriMargin = 24,
    gridVertMargin = 24;
}
var
  btn_Stop,
  btn_Prev,
  btn_Next,
  btn_Last,
  btn_First,
  btn_AddPart,
  txt_KeyRangeStart,
  txt_KeyRangeEnd,

  sldr_barsPerPage,
  lbl_sldr_barsPerPage,

  div_Controls,
  div_BarsBeats,
  div_Seconds,

  div_MouseX,
  mouseX,
  mouseBarPos,

  div_MouseY,
  mouseY,
  mousePitchPos,

  div_PageNumbers,
  div_Editor,
  div_Score,
  div_BarLines,
  div_BeatLines,
  div_SixteenthLines,
  div_PitchLines,
  div_Notes,
  div_Parts,
  div_Playhead,
  divs_AllNotes,
  divs_AllParts,
  slct_Snap,
  allNotes,
  allParts,
  gridHoriMargin,
  gridVertMargin;

var div_currNote,
  currNote = null,
  div_currPart,
  currPart = null,
  flattenTracksToSingleTrack = true;

var testMethod = 1,
  edtrHTML,
  midiFile,
  keyEditor,
  song,
  track,
  instruments,
  div_MidiFileList,
  midiFileList,
  audCntxt,
  padShell;
var
  sequencer = window.sequencer,
  console = window.console,
  alert = window.alert,
  requestAnimationFrame = window.requestAnimationFrame;


function init() {
  var tmp_c = div_Controls.getBoundingClientRect().height,
    tmp_w = window.innerWidth - (gridHoriMargin * 2),
    tmp_h = window.innerHeight - (tmp_c * 2),
    tmp_event,
    /**
     * Uncomment one to test different tracks, will add listing function soon
     */
    tmp_midiFileName =
      // 'Blank Test';
      // 'Fantasie Impromptu';
      // 'Queen - Bohemian Rhapsody';
      // 'minute_waltz';
      'Thing';
  // 'Fail';

  div_Editor.style.width = tmp_w + 'px';
  div_Editor.style.height = tmp_h + 'px';

  // midiFile = sequencer.getMidiFile(midiFileName);
  // song = initSong(song, midiFile, track);
  var tmp_midiFile = sequencer.getMidiFile(tmp_midiFileName);
  if (!tmp_midiFile) {
    console.error("MIDI file name string invalid, defaulting to blank score...");
    tmp_midiFile = sequencer.getMidiFiles()[0];
  }
  switch (testMethod) {
    case 1:
      // method 1: create a song directly from the midi file, this way the midi file is treated as a config object
      tmp_midiFile.useMetronome = true;
      song = sequencer.createSong(tmp_midiFile);
      track = song.track;
      break;

    case 2:
      // method 2: copy over some parts of the midi to a config object
      song = sequencer.createSong({
        bpm: 80, // original tempo is 125 bpm
        nominator: tmp_midiFile.nominator,
        denominator: tmp_midiFile.denominator,
        timeEvents: tmp_midiFile.timeEvents,
        tracks: tmp_midiFile.tracks,
        useMetronome: true
      });
      track = song.track;
      break;
    case 3:
      //method 3: just add base midiFile to a song, and continue
      song = sequencer.createSong(tmp_midiFile, false);
  }
  instruments = sequencer.getInstruments();
  //|------------------------------------------------------------------------------------------|


  /**
   * Compacts all song tracks onto single track, set to monitor, and set instrument to piano
   */
  if (flattenTracksToSingleTrack)
    flattenTracks(song);
  /**
   *
   * This is where KeyEditor is Made!!!
   */
  keyEditor = sequencer.createKeyEditor(song, {
    keyListener: true,
    viewportHeight: tmp_h,
    viewportWidth: tmp_w,
    lowestNote: 40, //default: 21
    highestNote: 80, //default: 108
    barsPerPage: 16 //default: 16
  });
  //set editor element values to editor defaults
  setElementValue(txt_KeyRangeStart, keyEditor.lowestNote);
  setElementValue(txt_KeyRangeEnd, keyEditor.highestNote);
  setSliderValues(sldr_barsPerPage, keyEditor.barsPerPage, 1, 32, 1);

  initContextEvents();
  initInputEvents();
  initWindowEvents();

  enableGUI(true);

  slct_Snap.selectedIndex = 3;
  tmp_event = document.createEvent('HTMLEvents');
  tmp_event.initEvent('change', false, false);
  slct_Snap.dispatchEvent(tmp_event);

  draw();
  render();
}

function initWindowEvents() {
  /**
   * Check for working Audio Context, and if not, create one and resume it when user mouses over window
   */
  window.addEventListener('mouseover', function (e) {
    if (!window.AudioContext) {
      console.log('hitting the context startup');
    }
    if (!audCntxt) {
      audCntxt = new AudioContext();
      audCntxt.resume();
    }
  });
  window.addEventListener('resize', resize, false);
}

function initContextEvents() {
  song.addEventListener('play', function () { setElementValue(btn_Play, 'pause'); });
  song.addEventListener('pause', function () { setElementValue(btn_Play, 'play'); });
  song.addEventListener('stop', function () { setElementValue(btn_Play, 'play'); });
  div_Editor.addEventListener('mousedown', function () {
    div_currPart.innerHTML = 'Sel Part: ' + (currPart !== null ? currPart.id : 'none');
    div_currNote.innerHTML = 'Sel Note: ' + (currNote !== null ? currNote.id : 'none');
  });
}

function initInputEvents() {
  /**
   * Text
   */
  txt_KeyRangeStart.addEventListener('change', function (e) {
    song.setPitchRange(txt_KeyRangeStart.value, keyEditor.highestNote);
    // keyEditor.lowestNote = txt_KeyRangeStart.value;
    song.update();
  });
  txt_KeyRangeEnd.addEventListener('change', function (e) {
    song.setPitchRange(keyEditor.lowestNote, txt_KeyRangeEnd.value);
    // keyEditor.highestNote = txt_KeyRangeEnd.value;
    song.update();
  });
  // listen for scale and draw events, a scale event is fired when you change the number of bars per page
  // a draw event is fired when you change the size of the viewport by resizing the browser window
  keyEditor.addEventListener('scale draw', function () {
    draw();
  });

  // listen for scroll events, the score automatically follows the song positon during playback: as soon as
  // the playhead moves off the right side of the screen, a scroll event is fired
  keyEditor.addEventListener('scroll', function (data) {
    div_Editor.scrollLeft = data.x;
  });
  /**
   * EXPERIMENTAL - Add notes and parts when double clicked in certain contexts
   */
  div_Score.addEventListener('dblclick', function (e) {
    e_Grid_lMouDbl(e);
  });
  // you can set the playhead at any position by clicking on the score
  /**
   * OR - if element clicked on is a part or note, it sets the current note / part to that element
   */
  div_Score.addEventListener('mousedown', function (e) {
    var tmp_className = e.target.className;
    if (tmp_className.indexOf('note') !== -1) {
      currNote = allNotes[e.target.id];
      currPart = currNote.part;
      return;
    } else if (tmp_className.indexOf('part') !== -1) {
      currPart = allParts[e.target.id];
      currNote = null;
      return;
    } else {
      currNote = null;
      currPart = null;
      keyEditor.setPlayheadToX(e.pageX);
    }
    // you could also use:
    //song.setPlayhead('ticks', keyEditor.xToTicks(e.pageX));
  });
  /**
   * AUDIO CONTEXT CHECKER EVENT
   */
  div_Editor.addEventListener('click', function (e) {
    if (!audCntxt) {
      audCntxt = new AudioContext();
      audCntxt.resume();
      if (window.AudioContext && window.AudioContext != audCntxt) { window.AudioContext = audCntxt; }
    }
  });
  // if you scroll the score by hand you must inform the key editor. necessary for calculating
  // the song position by x coordinate and the pitch by y coordinate
  div_Editor.addEventListener('scroll', function () { keyEditor.updateScroll(div_Editor.scrollLeft, div_Editor.scrollTop); }, false);
  /**
   * Score Mouse Movement Tracker
   */
  div_Score.addEventListener(
    'mousemove',
    function (e) {
      e.preventDefault();
      var tmp_x = e.pageX,
        tmp_y = e.pageY,
        tmp_pos = keyEditor.getPositionAt(tmp_x),
        tmp_part = keyEditor.selectedPart,
        tmp_note = keyEditor.selectedNote;

      // show the song position and pitch of the current mouse position; handy for debugging
      mouseX = tmp_x;
      mouseY = tmp_y;
      mouseBarPos = tmp_pos.barsAsString;
      div_MouseX.innerHTML = 'x ' + mouseBarPos;
      mousePitchPos = keyEditor.getPitchAt(tmp_y).number;
      div_MouseY.innerHTML = 'y ' + mousePitchPos;

      // move part or note if selected
      if (tmp_part !== undefined) {
        keyEditor.movePart(tmp_x, tmp_y);
      }
      if (tmp_note !== undefined) {
        keyEditor.moveNote(tmp_x, tmp_y);
      }
    },
    false
  );
  /**
   * Grid
   */
  slct_Snap.addEventListener('change', function () {
    keyEditor.setSnapX(slct_Snap.options[slct_Snap.selectedIndex].value);
  }, false);
  /**
   * Buttons
   */
  btn_Play.addEventListener('click', function () {
    song.pause();
  });
  btn_Stop.addEventListener('click', function () {
    song.stop();
  });
  btn_Next.addEventListener('click', function () {
    keyEditor.scroll('>');
  });
  btn_Prev.addEventListener('click', function () {
    keyEditor.scroll('<');
  });
  btn_First.addEventListener('click', function () {
    keyEditor.scroll('<<');
  });
  btn_Last.addEventListener('click', function () {
    keyEditor.scroll('>>');
  });

  btn_AddPart.addEventListener('click', function () {
    addRandomPartAtPlayhead();
  });
  /**
   * Sliders
   */
  sldr_barsPerPage.addEventListener(
    'change',
    function (e) {
      var tmp_bpp = parseFloat(e.target.value);
      lbl_sldr_barsPerPage.innerHTML = '#bars ' + tmp_bpp;
      keyEditor.setBarsPerPage(tmp_bpp);
    },
    false
  );
  /**
   * Keyboard Shortcuts
   */
  window.addEventListener("keydown", function (e) {
    if (e.keyCode == 32) {
      song.pause();
    }
  });
}

function setElementValue(ref_elmt, val) {
  ref_elmt.value = val;
}

function setSliderValues(ref_elmt, val, min, max, step) {
  ref_elmt.min = min;
  ref_elmt.max = max;
  ref_elmt.step = step;
  ref_elmt.value = val;
}

//#region [rgba(60, 60, 120 ,0.15)] Draw Functions
function draw() {
  //Initialize all Grid HTML elements to blank
  allNotes = {};
  allParts = {};
  divs_AllNotes = {};
  divs_AllParts = {};
  div_Parts.innerHTML = '';
  div_Notes.innerHTML = '';
  div_PitchLines.innerHTML = '';
  div_BarLines.innerHTML = '';
  div_BeatLines.innerHTML = '';
  div_SixteenthLines.innerHTML = '';

  keyEditor.horizontalLine.reset();
  keyEditor.verticalLine.reset();
  keyEditor.noteIterator.reset();
  keyEditor.partIterator.reset();

  div_Score.style.width = keyEditor.width + 'px';

  while (keyEditor.horizontalLine.hasNext('chromatic')) { drawHorizontalLine(keyEditor.horizontalLine.next('chromatic')); }
  while (keyEditor.verticalLine.hasNext('sixteenth')) { drawVerticalLine(keyEditor.verticalLine.next('sixteenth')); }
  while (keyEditor.noteIterator.hasNext()) { drawNote(keyEditor.noteIterator.next()); }
  while (keyEditor.partIterator.hasNext()) { drawPart(keyEditor.partIterator.next()); }
}

function drawHorizontalLine(ref_data) {
  var tmp_div_HLine = document.createElement('div'),
    pitchHeight = keyEditor.pitchHeight;

  if (ref_data.note.blackKey === true) {
    tmp_div_HLine.className = 'pitch-line black-key';
  } else {
    tmp_div_HLine.className = 'pitch-line';
  }
  tmp_div_HLine.id = ref_data.note.fullName;
  tmp_div_HLine.style.height = pitchHeight + 'px';
  tmp_div_HLine.style.top = ref_data.y + 'px';
  tmp_div_HLine.y = ref_data.y;
  div_PitchLines.appendChild(tmp_div_HLine);
}

function drawVerticalLine(ref_data) {
  var tmp_type = ref_data.type,
    tmp_div_VLine = document.createElement('div');

  tmp_div_VLine.id = ref_data.position.barsAsString;
  tmp_div_VLine.className = ref_data.type + '-line';
  tmp_div_VLine.style.left = ref_data.x + 'px';
  tmp_div_VLine.style.width = '5px'; // if you make the width too small, the background image of sometimes disappears
  tmp_div_VLine.x = ref_data.x;

  switch (tmp_type) {
    case 'bar':
      div_BarLines.appendChild(tmp_div_VLine);
      break;
    case 'beat':
      div_BeatLines.appendChild(tmp_div_VLine);
      break;
    case 'sixteenth':
      div_SixteenthLines.appendChild(tmp_div_VLine);
      break;
  }
}

function render() {
  var tmp_snapshot = keyEditor.getSnapshot('key-editor'),
    tmp_div_Note,
    tmp_div_Part;

  div_Playhead.style.left = keyEditor.getPlayheadX() - 10 + 'px';
  div_PageNumbers.innerHTML =
    'page ' + keyEditor.currentPage + ' of ' + keyEditor.numPages;

  div_BarsBeats.innerHTML = song.barsAsString;
  div_Seconds.innerHTML = song.timeAsString;

  tmp_snapshot.notes.removed.forEach(function (note) {
    divs_AllNotes[note.id].removeEventListener('mousedown', e_Note_lMouDown);
    div_Notes.removeChild(document.getElementById(note.id));
  });

  tmp_snapshot.notes.new.forEach(function (note) {
    drawNote(note);
  });
  tmp_snapshot.notes.recorded.forEach(function (note) {
    drawNote(note);
  });
  tmp_snapshot.notes.recording.forEach(function (note) {
    updateElement(divs_AllNotes[note.id], note.bbox);
  });
  // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
  tmp_snapshot.notes.changed.forEach(function (note) {
    updateElement(divs_AllNotes[note.id], note.bbox, 0);
  });

  // stateChanged arrays contain elements that have become active or inactive
  tmp_snapshot.notes.stateChanged.forEach(function (note) {
    tmp_div_Note = document.getElementById(note.id);
    if (note.part.mute === false) {
      if (note.mute !== true) {
        if (note.active) {
          tmp_div_Note.className = 'note note-active';
        } else if (note.active === false) {
          tmp_div_Note.className = 'note';
        }
      }
    }
  });

  tmp_snapshot.parts.removed.forEach(function (part) {
    divs_AllParts[part.id].removeEventListener('mousedown', e_Part_lMouDown);
    div_Parts.removeChild(document.getElementById(part.id));
  });

  tmp_snapshot.parts.new.forEach(function (part) {
    drawPart(part);
  });

  // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
  tmp_snapshot.parts.changed.forEach(function (part) {
    updateElement(divs_AllParts[part.id], part.bbox, 0);
  });

  // stateChanged arrays contain elements that have become active or inactive
  tmp_snapshot.parts.stateChanged.forEach(function (part) {
    tmp_div_Part = document.getElementById(part.id);
    if (part.mute !== true) {
      if (part.active) {
        tmp_div_Part.className = 'part part-active';
      } else if (part.active === false) {
        tmp_div_Part.className = 'part';
      }
    }
  });

  if (tmp_snapshot.hasNewBars) {
    // set the new width of the score
    div_Score.style.width = tmp_snapshot.newWidth + 'px';

    // clear the horizontal lines because the lines have to be drawn longer
    div_PitchLines.innerHTML = '';

    // reset the index of the iterator because we're starting from 0 again
    keyEditor.horizontalLine.reset();
    while (keyEditor.horizontalLine.hasNext('chromatic')) {
      drawHorizontalLine(keyEditor.horizontalLine.next('chromatic'));
    }

    // the index of the vertical line iterator has already been set to the right index by the key editor
    // so only the extra barlines will be drawn
    while (keyEditor.verticalLine.hasNext('sixteenth')) {
      drawVerticalLine(keyEditor.verticalLine.next('sixteenth'));
    }
  }
  requestAnimationFrame(render);
}

function drawNote(ref_note) {
  var tmp_bbox = ref_note.bbox,
    tmp_div_Note = document.createElement('div');

  tmp_div_Note.id = ref_note.id;
  tmp_div_Note.className = 'note';
  updateElement(tmp_div_Note, tmp_bbox, 0);

  // store note and div
  allNotes[ref_note.id] = ref_note;
  divs_AllNotes[ref_note.id] = tmp_div_Note;
  tmp_div_Note.addEventListener('mousedown', e_Note_lMouDown, false);
  div_Notes.appendChild(tmp_div_Note);
}

function drawPart(ref_part) {
  var tmp_bbox = ref_part.bbox,
    tmp_div_Part = document.createElement('div');

  tmp_div_Part.id = ref_part.id;
  tmp_div_Part.className = 'part';
  tmp_div_Part.style.left = tmp_bbox.left + 'px';
  tmp_div_Part.style.top = tmp_bbox.top + 'px';
  tmp_div_Part.style.width = tmp_bbox.width - 1 + 'px';
  tmp_div_Part.style.height = tmp_bbox.height - 1 + 'px';

  // store part and div
  allParts[ref_part.id] = ref_part;
  divs_AllParts[ref_part.id] = tmp_div_Part;
  tmp_div_Part.addEventListener('mousedown', e_Part_lMouDown, false);
  div_Parts.appendChild(tmp_div_Part);
}
//Fits element within its bounding box
function updateElement(element, bbox) {
  element.style.left = bbox.x + 'px';
  element.style.top = bbox.y + 'px';
  element.style.width = bbox.width + 'px';
  element.style.height = bbox.height + 'px';
}

function resize() {
  var c = div_Controls.getBoundingClientRect().height,
    w = window.innerWidth,
    h = window.innerHeight - c;

  // tell the key editor that the viewport has canged, necessary for auto scroll during playback
  keyEditor.setViewport(w, h);
  div_Editor.style.width = w + 'px';
  div_Editor.style.height = h + 'px';
}
//#endregion
function enableGUI(flag) {
  var tmp_elements = document.querySelectorAll('input, select'),
    tmp_element,
    i,
    tmp_maxi = tmp_elements.length;

  for (i = 0; i < tmp_maxi; i++) {
    tmp_element = tmp_elements[i];
    tmp_element.disabled = !flag;
  }
}

function addAssetsToSequencer(ref_seq) {
  ref_seq.addMidiFile({
    url: '../../../assets/midi/minute_waltz.mid'
  });
  ref_seq.addMidiFile({
    url: '../../../assets/midi/chpn_op66.mid'
  });
  ref_seq.addMidiFile({
    url: '../../../assets/midi/Queen - Bohemian Rhapsody.mid'
  });
  ref_seq.addMidiFile({
    url: '../../../assets/midi/test.mid'
  });
}


//#region [rgba(0,100,0,0.2)] Grid Element Event Functions
function e_Part_lMouDown(e) {
  var tmp_part = allParts[e.target.id];
  if (e.ctrlKey) {
    keyEditor.removePart(tmp_part);
    currPart = null;
    currNote = null;
  } else {
    keyEditor.startMovePart(tmp_part, e.pageX, e.pageY); //default values
    // keyEditor.startMovePart(part, e.clientY, e.clientY);
    document.addEventListener('mouseup', e_Part_lMouUp, false);
  }
}

function e_Part_lMouUp(e) {
  keyEditor.stopMovePart();
  document.removeEventListener('mouseup', e_Part_lMouUp);
}

function e_Note_lMouDown(e) {
  var tmp_note = allNotes[e.target.id];
  if (e.ctrlKey) {
    keyEditor.removeNote(tmp_note);
    currNote = null;
  } else {
    keyEditor.startMoveNote(tmp_note, e.pageX, e.pageY); //default values
    // keyEditor.startMoveNote(note, e.clientX, e.clientY);
    document.addEventListener('mouseup', e_Note_lMouUp, false);
  }
}

function e_Note_lMouUp(e) {
  keyEditor.stopMoveNote();
  document.removeEventListener('mouseup', e_Note_lMouUp);
}

function e_Grid_lMouDown(e) { }

function e_Grid_lMouUp(e) {

}

function e_Grid_lMouDbl(e) {
  var tmp_className = e.target.className;
  /**
   * if double clicking a note
   * */
  if (tmp_className.indexOf('note') !== -1) {
    currNote = allNotes[e.target.id];
    currPart = currNote.part;
    return;
  }
  /**
   * if double clicking a blank section of a part
   * */
  else if (tmp_className.indexOf('part') !== -1) {
    currPart = allParts[e.target.id];
    currPart.addEvents(createNewNoteInPartAtMouse());
    song.update();
    return;
  }
  /**
   * if double clicking grid but current part is selected
   * */
  else if (currPart) {
    currPart.addEvents(addNewNoteAtMouse());
    song.update();
    return;
  }
  /**
   *if double clicking empty grid space
   * */
  else {
    currNote = null;
    currPart = null;
    addRandomPartAtMouse();
    return;
  }

}
//#endregion

//#region [ rgba(200, 200, 200, 0.1) ] Random Generation Functions
function getRandom(num_min, num_max, bool_round) {
  var tmp_r = Math.random() * (num_max - num_min) + num_min;
  if (bool_round === true) {
    return Math.round(tmp_r);
  } else {
    return tmp_r;
  }
}

function addRandomPartAtPlayhead() {
  var i,
    tmp_ticks = 0, //startPositions[getRandom(0, 4, true)],
    tmp_numNotes = getRandom(4, 8, true),
    tmp_spread = 5,
    tmp_basePitch = getRandom(
      keyEditor.lowestNote + tmp_spread,
      keyEditor.highestNote - tmp_spread,
      true
    ),
    tmp_part = sequencer.createPart(),
    tmp_events = [],
    tmp_noteLength = song.ppq / 2,
    tmp_pitch,
    tmp_velocity;

  for (i = 0; i < tmp_numNotes; i++) {
    tmp_pitch = tmp_basePitch + getRandom(-tmp_spread, tmp_spread, true);
    tmp_velocity = getRandom(50, 127, true);

    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, sequencer.NOTE_ON, tmp_pitch, tmp_velocity));
    tmp_ticks += tmp_noteLength;
    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, sequencer.NOTE_OFF, tmp_pitch, 0));
    tmp_ticks += tmp_noteLength;
  }
  tmp_ticks = keyEditor.getTicksAt(keyEditor.getPlayheadX());

  tmp_part.addEvents(tmp_events);
  if (!track) track = song.tracks[0];
  track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
  song.update();
}

function addRandomPartAtMouse() {
  keyEditor.setPlayheadToX(mouseX);
  var i,
    tmp_ticks = 0, //startPositions[getRandom(0, 4, true)],
    tmp_numNotes = 2,
    tmp_spread = 1,
    tmp_basePitch = keyEditor.getPitchAt(mouseY).number,
    tmp_part = sequencer.createPart(),
    tmp_events = [],
    tmp_noteLength = song.ppq / 2,
    tmp_pitch,
    tmp_velocity;

  for (i = 0; i < tmp_numNotes; i++) {
    // pitch = basePitch + getRandom(-spread, spread, true);
    tmp_pitch = tmp_basePitch;
    tmp_velocity = getRandom(50, 127, true);

    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, sequencer.NOTE_ON, tmp_pitch, tmp_velocity));
    tmp_ticks += tmp_noteLength;
    tmp_events.push(sequencer.createMidiEvent(tmp_ticks, sequencer.NOTE_OFF, tmp_pitch, 0));
    tmp_ticks += tmp_noteLength;
  }
  tmp_ticks = keyEditor.getTicksAt(keyEditor.getPlayheadX());

  tmp_part.addEvents(tmp_events);
  if (!track) track = song.tracks[0];
  track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
  song.update();
}
//#endregion



/**
 * EXPERIMENTAL
 */
function createNewNoteInPartAtMouse(tmp_part) {
  // keyEditor.setPlayheadToX(mouseX);
  var tmp_pitch = keyEditor.getPitchAt(mouseY).number,
    tmp_velocity = 127,
    tmp_events = [],
    tmp_noteLength = song.ppq / 2;
  // ticks = keyEditor.getTicksAt(mouseX);
  var tmp_ticks = keyEditor.getTicksAt(mouseX),
    tmp_noteOn,
    tmp_noteOff,
    tmp_note;
  // tmp_note = sequencer.createNote(pitch.number);
  tmp_noteOn = sequencer.createMidiEvent(tmp_ticks, sequencer.NOTE_ON, tmp_pitch, tmp_velocity);
  tmp_ticks += tmp_noteLength;
  tmp_noteOff = sequencer.createMidiEvent(tmp_ticks, sequencer.NOTE_OFF, tmp_pitch, 0);
  tmp_events.push(tmp_noteOn, tmp_noteOff);
  tmp_ticks = keyEditor.getTicksAt(mouseX);
  console.log('added new note: \n ' +
    'pitch: ' + tmp_pitch.number + '\n' +
    'at ticks: ' + tmp_ticks + '\n' +
    'velocity: ' + tmp_velocity + '\n' +
    'length: ' + tmp_noteLength + '\n'
  );

  return tmp_events;
}

function flattenTracks(ref_song) {
  ref_song.tracks.forEach(
    function (track) {
      track.setInstrument('piano');
      track.monitor = true;
      track.setMidiInput('all');
    }
  );
}
