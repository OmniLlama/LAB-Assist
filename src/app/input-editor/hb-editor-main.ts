// import { EditorHTMLShell } from "./input-editor.component";

// // import * as sequencer  from 'heartbeat-sequencer';
// declare var sequencer: any;
// // window.onload = (e) =>
// //   e_OnLoad(e, sequencer);
// function e_OnLoad(e, seq) {
//   'use strict';
//   edtrHTML = new EditorHTMLShell();

//   enableGUI(false);
//   // addAssetsToSequencer(sequencer);
//   // sequencer.addAssetPack({
//   //   url: '../audio/asset_pack_basic.json'
//   // },
//   //   init
//   // );
//   init();
// }

// const NOTE_OFF = 0x80;
// const NOTE_ON = 0x90;


// let allNotes = {}; // stores references to all midi notes;
// let allParts = {}; // stores references to all midi parts;
// let currNote = null;
// let currPart = null;
// let flattenTracksToSingleTrack = true;
// let editorHeight = 480;
// let pitchHeight = 32;
// let pitchStart = 0; //default: 21
// let pitchEnd = 40;  //default: 108
// let bppStart = 16;  //default: 16

// var testMethod = 1,
//   edtrHTML,
//   midiFile,
//   keyEditor,
//   song,
//   track,
//   instruments,
//   div_MidiFileList,
//   midiFileList,
//   audCntxt,
//   padShell;
// // var sequencer = window.sequencer;
// var
//   console = window.console;
// // alert = window.alert,
// // requestAnimationFrame = window.requestAnimationFrame;


// function init() {
//   var
//     // tmp_c = div_Controls.getBoundingClientRect().height,
//     tmp_icons_w = 128,
//     tmp_div_icons = document.getElementById('editor-input-icons'),
//     tmp_w = window.innerWidth - tmp_icons_w,
//     tmp_h = editorHeight,
//     tmp_event;

//   tmp_div_icons.style.width = tmp_icons_w + 'px';
//   tmp_div_icons.style.height = tmp_h + 'px';

//   edtrHTML.div_Editor.style.width = tmp_w + 'px';
//   edtrHTML.div_Editor.style.height = tmp_h + 'px';

//   initSong();
//   instruments = sequencer.getInstruments();
//   // song.tracks.forEach(function(track) {track.setMidiInput()})
//   //|------------------------------------------------------------------------------------------|


//   /**
//    * Compacts all song tracks onto single track, set to monitor, and set instrument to piano
//    */
//   if (flattenTracksToSingleTrack)
//     flattenTracks(song);
//   /**
//    *
//    * This is where KeyEditor is Made!!!
//    */
//   keyEditor = sequencer.createKeyEditor(song, {
//     keyListener: true,
//     viewportHeight: tmp_h,
//     viewportWidth: tmp_w,
//     lowestNote: pitchStart,
//     highestNote: pitchEnd,
//     barsPerPage: bppStart
//   });
//   //set editor element values to editor defaults
//   setElementValue(edtrHTML.txt_KeyRangeStart, keyEditor.lowestNote);
//   setElementValue(edtrHTML.txt_KeyRangeEnd, keyEditor.highestNote);
//   setSliderValues(edtrHTML.sldr_barsPerPage, keyEditor.barsPerPage, 1, 32, 1);

//   initContextEvents();
//   initInputEvents();
//   initWindowEvents();

//   enableGUI(true);

//   edtrHTML.slct_Snap.selectedIndex = 4;
//   tmp_event = document.createEvent('HTMLEvents');
//   tmp_event.initEvent('change', false, false);
//   edtrHTML.slct_Snap.dispatchEvent(tmp_event);

//   draw();
//   render();

// }
// function initSong() {
//   /**
// * Uncomment one to test different tracks, will add listing function soon
// */
//   var tmp_midiFileName =
//     'Blank Test';
//   // 'Fantasie Impromptu';
//   // 'Queen - Bohemian Rhapsody';
//   // 'minute_waltz';
//   // 'Thing';
//   // 'Fail';
//   var tmp_midiFile = sequencer.getMidiFile(tmp_midiFileName, false);
//   if (!tmp_midiFile) {
//     console.error("MIDI file name string invalid, defaulting to blank score...");
//     tmp_midiFile = sequencer.getMidiFiles()[3];
//   }
//   switch (testMethod) {
//     case 1:
//       // method 1: create a song directly from the midi file, this way the midi file is treated as a config object
//       // tmp_midiFile.useMetronome = true;
//       song = sequencer.createSong(tmp_midiFile);
//       track = song.tracks[0];
//       break;

//     case 2:
//       // method 2: copy over some parts of the midi to a config object
//       song = sequencer.createSong({
//         bpm: 80, // original tempo is 125 bpm
//         nominator: tmp_midiFile.nominator,
//         denominator: tmp_midiFile.denominator,
//         timeEvents: tmp_midiFile.timeEvents,
//         tracks: tmp_midiFile.tracks,
//         useMetronome: true,
//         pitchHeight: pitchHeight
//       });
//       track = song.tracks[0];
//       break;
//     case 3:
//       //method 3: just add base midiFile to a song, and continue
//       song = sequencer.createSong(tmp_midiFile);
//   }
// }
// function initWindowEvents() {
//   /**
//    * Check for working Audio Context, and if not, create one and resume it when user mouses over window
//    */
//   window.addEventListener('mouseover', function (e) {
//     // if (!window.AudioContext) {
//     //   console.log('hitting the context startup');
//     // }
//     // if (!audCntxt) {
//     //   audCntxt = new AudioContext();
//     //   audCntxt.resume();
//     // }
//   });
//   window.addEventListener('resize', resize, false);
// }

// function initContextEvents() {
//   song.addEventListener('play', function () { setElementValue(edtrHTML.btn_Play, 'pause'); });
//   song.addEventListener('pause', function () { setElementValue(edtrHTML.btn_Play, 'play'); });
//   song.addEventListener('stop', function () { setElementValue(edtrHTML.btn_Play, 'play'); });

//   edtrHTML.div_Editor.addEventListener('mousedown', function () {
//     edtrHTML.div_currPart.innerHTML = 'Sel Part: ' + (currPart !== null ? currPart.id : 'none');
//     edtrHTML.div_currNote.innerHTML = 'Sel Note: ' + (currNote !== null ? currNote.id : 'none');
//   });
// }

// function initInputEvents() {
//   /**
//    * Text
//    */
//   edtrHTML.txt_KeyRangeStart.addEventListener('change', function (e) {
//     song.setPitchRange(edtrHTML.txt_KeyRangeStart.value, keyEditor.highestNote);
//     song.update();
//   });
//   edtrHTML.txt_KeyRangeEnd.addEventListener('change', function (e) {
//     song.setPitchRange(keyEditor.lowestNote, edtrHTML.txt_KeyRangeEnd.value);
//     song.update();
//   });
//   // listen for scale and draw events, a scale event is fired when you change the number of bars per page
//   // a draw event is fired when you change the size of the viewport by resizing the browser window
//   keyEditor.addEventListener('scale draw', function () { draw(); });

//   // listen for scroll events, the score automatically follows the song positon during playback: as soon as
//   // the playhead moves off the right side of the screen, a scroll event is fired
//   keyEditor.addEventListener('scroll', function (data) { edtrHTML.div_Editor.scrollLeft = data.x; });
//   /**
//    * EXPERIMENTAL - Add notes and parts when double clicked in certain contexts
//    */
//   edtrHTML.div_Score.addEventListener('dblclick', function (e) { evt_Grid_lMouDbl(e); });
//   // you can set the playhead at any position by clicking on the score
//   /**
//    * OR - if element clicked on is a part or note, it sets the current note / part to that element
//    */
//   edtrHTML.div_Score.addEventListener('mousedown', function (e) { evt_Generic_lMouDown(e); });
//   /**
//    * AUDIO CONTEXT CHECKER EVENT
//    */
//   edtrHTML.div_Editor.addEventListener('click', function (e) {
//     // if (!audCntxt) {
//     //   audCntxt = new AudioContext();
//     //   audCntxt.resume();
//     //   if (window.AudioContext && window.AudioContext != audCntxt) {
//     //     window.AudioContext = audCntxt;
//     //     console.log('hitting the context startup');
//     //   }
//     // }
//   });
//   // if you scroll the score by hand you must inform the key editor. necessary for calculating
//   // the song position by x coordinate and the pitch by y coordinate
//   edtrHTML.div_Editor.addEventListener('scroll', function () {
//     keyEditor.updateScroll(edtrHTML.div_Editor.scrollLeft, edtrHTML.div_Editor.scrollTop);
//   }, false);
//   /**
//    * Score Mouse Movement Tracker
//    */
//   edtrHTML.div_Score.addEventListener('mousemove', function (e) {
//     e.preventDefault();
//     var tmp_x = e.pageX,
//       tmp_y = e.pageY,
//       tmp_pos = keyEditor.getPositionAt(tmp_x),
//       tmp_part = keyEditor.selectedPart,
//       tmp_note = keyEditor.selectedNote;

//     // show the song position and pitch of the current mouse position; handy for debugging
//     edtrHTML.mouseX = tmp_x;
//     edtrHTML.mouseY = tmp_y;
//     edtrHTML.mouseBarPos = tmp_pos.barsAsString;
//     edtrHTML.div_MouseX.innerHTML = 'x Bar: ' + edtrHTML.mouseBarPos +
//       '\nx client: ' + e.clientX +
//       '\nx Score scrl: ' + edtrHTML.div_Score.scrollLeft +
//       '\nx edit scrl: ' + edtrHTML.div_Editor.scrollLeft +
//       '\nx head : ' + keyEditor.getPlayheadX();
//     ;
//     edtrHTML.mousePitchPos = keyEditor.getPitchAt(tmp_y - edtrHTML.div_Score.offsetTop).number;
//     edtrHTML.div_MouseY.innerHTML = 'y Pitch: ' + edtrHTML.mousePitchPos;

//     // move part or note if selected
//     if (tmp_part !== undefined) {
//       keyEditor.movePart(tmp_x, tmp_y);
//     }
//     if (tmp_note !== undefined) {
//       keyEditor.moveNote(tmp_x, tmp_y - edtrHTML.div_Score.offsetTop);
//     }
//   },
//     false
//   );
//   /**
//    * Grid
//    */
//   edtrHTML.slct_Snap.addEventListener('change', function () {
//     keyEditor.setSnapX(edtrHTML.slct_Snap.options[edtrHTML.slct_Snap.selectedIndex].value);
//   }, false);
//   /**
//    * Buttons
//    */
//   edtrHTML.btn_Play.addEventListener('click', function () { song.pause(); });
//   edtrHTML.btn_Record.addEventListener('click', function () { song.startRecording(); });
//   edtrHTML.btn_Loop.addEventListener('click', function () { song.loop = !song.loop; });

//   edtrHTML.btn_Stop.addEventListener('click', function () { song.stop(); });
//   edtrHTML.btn_Next.addEventListener('click', function () { keyEditor.scroll('>'); });
//   edtrHTML.btn_Prev.addEventListener('click', function () { keyEditor.scroll('<'); });
//   edtrHTML.btn_First.addEventListener('click', function () { keyEditor.scroll('<<'); });
//   edtrHTML.btn_Last.addEventListener('click', function () { keyEditor.scroll('>>'); });
//   edtrHTML.btn_AddPart.addEventListener('click', function () { addRandomPartAtPlayhead(); });
//   /**
//    * Sliders
//    */
//   edtrHTML.sldr_barsPerPage.addEventListener(
//     'change',
//     function (e) {
//       var tmp_bpp = parseFloat(e.target.value);
//       edtrHTML.lbl_sldr_barsPerPage.innerHTML = '#bars ' + tmp_bpp;
//       keyEditor.setBarsPerPage(tmp_bpp);
//     },
//     false
//   );
//   /**
//    * Keyboard Shortcuts
//    */
//   window.addEventListener("keydown", function (e) {
//     if (e.key == "Backspace") { song.stop(); }
//     if (e.key == " ") { song.pause(); }
//     if (e.key == "Delete") { }
//     //dumb hack: brings playhead to first displayed location from left if offscreen to the left
//     if (e.key == "ArrowRight") { keyEditor.setPlayheadToX(Math.max(keyEditor.getPlayheadX(true) + 16, 0)); }
//     if (e.key == "ArrowLeft") { keyEditor.setPlayheadToX((keyEditor.getPlayheadX(true)) - 16, 0); }
//   });
// }
// //#region [rgba(200, 0, 0, 0.05)] Selection Visuals Methods
// function setNoteActiveState(ref_note, ref_div_Note) {
//   ref_div_Note = document.getElementById(ref_note.id);
//   if (ref_div_Note !== null) {
//     if (ref_note.part.mute === false) {
//       if (ref_note.mute !== true) {
//         if (ref_note.active) {
//           ref_div_Note.className = 'note note-active';
//         } else if (ref_note.active === false) {
//           ref_div_Note.className = 'note';
//         }
//       }
//     }
//   }
// }

// function selectNote(ref_note) {
//   var tmp_div_Note = document.getElementById(ref_note.id);
//   if (tmp_div_Note !== null) {
//     if (ref_note.part.mute === false) {
//       if (ref_note.mute !== true) {
//         tmp_div_Note.className = 'note note-selected';
//       }
//     }
//   }
// }
// function unselectNote(ref_note) {
//   var tmp_div_Note = document.getElementById(ref_note.id);
//   if (ref_note.part.mute === false) {
//     if (ref_note.mute !== true) {
//       if (tmp_div_Note !== null) {
//         tmp_div_Note.className = 'note';
//       }
//     }
//   }
// }
// function setPartActiveState(ref_part, ref_div_Part) {
//   ref_div_Part = document.getElementById(ref_part.id);
//   if (ref_div_Part !== null) {
//     if (ref_part.mute !== true) {
//       if (ref_part.active) {
//         ref_div_Part.className = 'part part-active';
//       } else if (ref_part.active === false) {
//         ref_div_Part.className = 'part';
//       }
//     }
//   }
// }
// function selectPart(ref_part) {
//   var tmp_div_Part = document.getElementById(ref_part.id);
//   if (ref_part.mute === false) {
//     if (ref_part.mute !== true) {
//       tmp_div_Part.className = 'part part-selected';
//     }
//   }
// }
// function unselectPart(ref_part) {
//   var tmp_div_Part = document.getElementById(ref_part.id);
//   if (ref_part.mute === false) {
//     if (ref_part.mute !== true) {
//       if (tmp_div_Part !== null) {
//         tmp_div_Part.className = 'part';
//       }
//     }
//   }
// }
// //#endregion
// function setElementValue(ref_elmt, val) { ref_elmt.value = val; }

// function setSliderValues(ref_elmt, val, min, max, step) {
//   ref_elmt.min = min;
//   ref_elmt.max = max;
//   ref_elmt.step = step;
//   ref_elmt.value = val;
// }
// //#region [rgba(120, 120, 0 ,0.15)] Draw Functions
// function draw() {
//   //Initialize all Grid HTML elements to blank
//   edtrHTML.allNotes = {};
//   edtrHTML.allParts = {};
//   edtrHTML.divs_AllNotes = {};
//   edtrHTML.divs_AllParts = {};
//   edtrHTML.div_Parts.innerHTML = '';
//   edtrHTML.div_Notes.innerHTML = '';
//   edtrHTML.div_PitchLines.innerHTML = '';
//   edtrHTML.div_BarLines.innerHTML = '';
//   edtrHTML.div_BeatLines.innerHTML = '';
//   edtrHTML.div_SixteenthLines.innerHTML = '';

//   keyEditor.horizontalLine.reset();
//   keyEditor.verticalLine.reset();
//   keyEditor.noteIterator.reset();
//   keyEditor.partIterator.reset();

//   edtrHTML.div_Score.style.width = keyEditor.width + 'px';
//   var i = 0;
//   while (keyEditor.horizontalLine.hasNext('chromatic')) { drawHorizontalLine(keyEditor.horizontalLine.next('chromatic')); }
//   while (keyEditor.verticalLine.hasNext('sixteenth')) { drawVerticalLine(keyEditor.verticalLine.next('sixteenth')); }
//   while (keyEditor.noteIterator.hasNext()) { drawNote(keyEditor.noteIterator.next()); }
//   while (keyEditor.partIterator.hasNext()) { drawPart(keyEditor.partIterator.next()); }
// }

// function drawHorizontalLine(ref_data) {
//   var tmp_div_HLine = document.createElement('div'),
//     pitchHeight = keyEditor.pitchHeight;

//   if (ref_data.note.blackKey === true) {
//     tmp_div_HLine.className = 'pitch-line black-key';
//   } else {
//     tmp_div_HLine.className = 'pitch-line';
//   }
//   tmp_div_HLine.id = ref_data.note.fullName;
//   tmp_div_HLine.innerHTML = ref_data.note.fullName;
//   tmp_div_HLine.style.height = pitchHeight + 'px';
//   tmp_div_HLine.style.top = ref_data.y + 'px';
//   // tmp_div_HLine.y = ref_data.y;
//   edtrHTML.div_PitchLines.appendChild(tmp_div_HLine);
// }

// function drawVerticalLine(ref_data) {
//   var tmp_type = ref_data.type,
//     tmp_div_VLine = document.createElement('div');

//   tmp_div_VLine.id = ref_data.position.barsAsString;
//   tmp_div_VLine.className = ref_data.type + '-line';
//   tmp_div_VLine.style.left = ref_data.x + 'px';
//   tmp_div_VLine.style.width = '5px'; // if you make the width too small, the background image of sometimes disappears
//   // tmp_div_VLine.x = ref_data.x;

//   switch (tmp_type) {
//     case 'bar':
//       tmp_div_VLine.innerHTML = ref_data.position.barsAsString;
//       edtrHTML.div_BarLines.appendChild(tmp_div_VLine);
//       break;
//     case 'beat':
//       edtrHTML.div_BeatLines.appendChild(tmp_div_VLine);
//       break;
//     case 'sixteenth':
//       edtrHTML.div_SixteenthLines.appendChild(tmp_div_VLine);
//       break;
//   }
// }

// function drawNote(ref_note) {
//   var tmp_bbox = ref_note.bbox,
//     tmp_bbox_left = subdivBBox(ref_note.bbox, 0.1, 0, 1, 0),
//     tmp_bbox_right = subdivBBox(ref_note.bbox, 0.1, 0.9, 1, 0),
//     tmp_div_Note = document.createElement('div'),
//     tmp_div_Note_leftEdge = document.createElement('div'),
//     tmp_div_Note_rightEdge = document.createElement('div');

//   tmp_div_Note.id = ref_note.id;
//   tmp_div_Note.className = 'note';

//   tmp_div_Note_leftEdge.id = tmp_div_Note.id;
//   tmp_div_Note_leftEdge.className = 'note-edge';

//   tmp_div_Note_rightEdge.id = tmp_div_Note.id;
//   tmp_div_Note_rightEdge.className = 'note-edge';

//   updateElementBBox(tmp_div_Note, tmp_bbox);
//   updateElementBBox(tmp_div_Note_leftEdge, tmp_bbox_left);
//   updateElementBBox(tmp_div_Note_rightEdge, tmp_bbox_right);

//   // store note and div
//   edtrHTML.allNotes[ref_note.id] = ref_note;
//   edtrHTML.divs_AllNotes[ref_note.id] = tmp_div_Note;
//   tmp_div_Note.addEventListener('mousedown', evt_Note_lMouDown, false);
//   tmp_div_Note_leftEdge.addEventListener('mouseover', function (e) { evt_NoteEdge_Left_MouOver(e); });
//   tmp_div_Note_leftEdge.addEventListener('mousedown', function (e) { evt_NoteEdge_Left_lMouDown(e); });
//   tmp_div_Note_rightEdge.addEventListener('mouseover', function (e) { evt_NoteEdge_Right_MouOver(e); });
//   tmp_div_Note_rightEdge.addEventListener('mousedown', function (e) { evt_NoteEdge_Right_lMouDown(e); });

//   tmp_div_Note.append(tmp_div_Note_leftEdge);
//   tmp_div_Note.append(tmp_div_Note_rightEdge);
//   edtrHTML.div_Notes.appendChild(tmp_div_Note);
// }

// function drawPart(ref_part) {
//   var tmp_bbox = ref_part.bbox,
//     tmp_div_Part = document.createElement('div');

//   tmp_div_Part.id = ref_part.id;
//   tmp_div_Part.className = 'part';
//   tmp_div_Part.style.left = tmp_bbox.left + 'px';
//   tmp_div_Part.style.top = tmp_bbox.top + 'px';
//   tmp_div_Part.style.width = tmp_bbox.width - 1 + 'px';
//   tmp_div_Part.style.height = tmp_bbox.height - 1 + 'px';

//   // store part and div
//   allParts[ref_part.id] = ref_part;
//   edtrHTML.divs_AllParts[ref_part.id] = tmp_div_Part;
//   tmp_div_Part.addEventListener('mousedown', evt_Part_lMouDown, false);
//   edtrHTML.div_Parts.appendChild(tmp_div_Part);
// }
// //Fits element within its bounding box
// function updateElementBBox(element, bbox) {
//   element.style.left = bbox.x + 'px';
//   element.style.top = bbox.y + 'px';
//   element.style.width = bbox.width + 'px';
//   element.style.height = bbox.height + 'px';
// }

// function resize() {
//   var
//     tmp_icons_w = 128,
//     tmp_div_icons = document.getElementById('editor-input-icons'),
//     tmp_c = edtrHTML.div_Controls.getBoundingClientRect().height,
//     tmp_w = window.innerWidth - tmp_icons_w,
//     tmp_h = editorHeight;

//   // tell the key editor that the viewport has canged, necessary for auto scroll during playback
//   keyEditor.setViewport(tmp_w, tmp_h);
//   tmp_div_icons.style.width = tmp_icons_w + 'px';
//   tmp_div_icons.style.height = tmp_h + 'px';
//   edtrHTML.div_Editor.style.width = tmp_w + 'px';
//   edtrHTML.div_Editor.style.height = tmp_h + 'px';
// }

// function render() {
//   var tmp_snapshot = keyEditor.getSnapshot('key-editor'),
//     tmp_div_Note,
//     tmp_div_Part;

//   edtrHTML.div_Playhead.style.left = keyEditor.getPlayheadX() - 10 + 'px';
//   edtrHTML.div_PageNumbers.innerHTML =
//     'page ' + keyEditor.currentPage + ' of ' + keyEditor.numPages;

//   edtrHTML.div_BarsBeats.innerHTML = song.barsAsString;
//   edtrHTML.div_Seconds.innerHTML = song.timeAsString;

//   tmp_snapshot.notes.removed.forEach(function (note) {
//     edtrHTML.divs_AllNotes[note.id].removeEventListener('mousedown', evt_Note_lMouDown);
//     edtrHTML.div_Notes.removeChild(document.getElementById(note.id));
//   });

//   tmp_snapshot.notes.new.forEach(function (note) { drawNote(note); });
//   tmp_snapshot.notes.recorded.forEach(function (note) { drawNote(note); });
//   tmp_snapshot.notes.recording.forEach(function (note) { updateElementBBox(edtrHTML.divs_AllNotes[note.id], note.bbox); });
//   // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
//   tmp_snapshot.notes.changed.forEach(function (note) { updateElementBBox(edtrHTML.divs_AllNotes[note.id], note.bbox); });

//   // stateChanged arrays contain elements that have become active or inactive
//   tmp_snapshot.notes.stateChanged.forEach(function (note) { setNoteActiveState(note, tmp_div_Note); });

//   tmp_snapshot.parts.removed.forEach(function (part) {
//     edtrHTML.divs_AllParts[part.id].removeEventListener('mousedown', evt_Part_lMouDown);
//     edtrHTML.div_Parts.removeChild(document.getElementById(part.id));
//   });

//   tmp_snapshot.parts.new.forEach(function (part) { drawPart(part); });

//   // events.changed, notes.changed, parts.changed contain elements that have been moved or transposed
//   tmp_snapshot.parts.changed.forEach(function (part) { updateElementBBox(edtrHTML.divs_AllParts[part.id], part.bbox); });

//   // stateChanged arrays contain elements that have become active or inactive
//   tmp_snapshot.parts.stateChanged.forEach(function (part) { setPartActiveState(part, tmp_div_Part); });

//   if (tmp_snapshot.hasNewBars) {
//     // set the new width of the score
//     edtrHTML.div_Score.style.width = tmp_snapshot.newWidth + 'px';

//     // clear the horizontal lines because the lines have to be drawn longer
//     edtrHTML.div_PitchLines.innerHTML = '';

//     // reset the index of the iterator because we're starting from 0 again
//     keyEditor.horizontalLine.reset();
//     while (keyEditor.horizontalLine.hasNext('chromatic')) { drawHorizontalLine(keyEditor.horizontalLine.next('chromatic')); }

//     // the index of the vertical line iterator has already been set to the right index by the key editor
//     // so only the extra barlines will be drawn
//     while (keyEditor.verticalLine.hasNext('sixteenth')) { drawVerticalLine(keyEditor.verticalLine.next('sixteenth')); }
//   }
//   requestAnimationFrame(render);
// }

// //#endregion
// function enableGUI(flag) {
//   var tmp_elements = document.querySelectorAll('input, select'),
//     tmp_element,
//     i,
//     tmp_maxi = tmp_elements.length;

//   for (i = 0; i < tmp_maxi; i++) {
//     tmp_element = tmp_elements[i];
//     tmp_element.disabled = !flag;
//   }
// }



// function addAssetsToSequencer(ref_seq) {
//   ref_seq.addMidiFile({ url: '../../assets/midi/test.mid' });
//   ref_seq.addMidiFile({ url: '../../assets/midi/minute_waltz.mid' });
//   ref_seq.addMidiFile({ url: '../../assets/midi/chpn_op66.mid' });
//   ref_seq.addMidiFile({ url: '../../assets/midi/Queen - Bohemian Rhapsody.mid' });
// }

// var heldEdge,
//   changingNote,
//   holdingEdge = false;
// //#region [rgba(0,100,0,0.2)] Grid Element Event Functions
// /*
//   Part
//   */
// function evt_Part_lMouDown(e) {
//   var tmp_part = allParts[e.target.id];
//   if (e.ctrlKey) {
//     keyEditor.removePart(tmp_part);
//     unselectPart(tmp_part);
//     currPart = null;
//     if (currNote !== null)
//       unselectNote(currNote);
//     currNote = null;
//   } else {
//     keyEditor.startMovePart(tmp_part, e.clientX + edtrHTML.div_Editor.scrollLeft, e.clientY); //default values
//     // keyEditor.startMovePart(tmp_part, e.clientY, e.clientY);
//     document.addEventListener('mouseup', evt_Part_lMouUp, false);
//   }
// }

// function evt_Part_lMouUp(e) {
//   keyEditor.stopMovePart();
//   document.removeEventListener('mouseup', evt_Part_lMouUp);
// }
// /*
//   Note Stuff
//   */
// function evt_Note_lMouDown(e) {
//   if (!holdingEdge) {
//     var tmp_note = allNotes[e.target.id];
//     if (e.ctrlKey) {
//       keyEditor.removeNote(tmp_note);
//       currNote = null;
//     } else {
//       keyEditor.startMoveNote(tmp_note, e.clientX + edtrHTML.div_Editor.scrollLeft, e.clientY); //default values
//       document.addEventListener('mouseup', evt_Note_lMouUp, false);
//     }
//   }
// }

// function evt_Note_lMouUp(e) {
//   keyEditor.stopMoveNote();
//   document.removeEventListener('mouseup', evt_Note_lMouUp);
// }
// /*
//   Note Edge Stuff
//  */
// function evt_NoteEdge_Left_MouOver(e) { e.target.style.cursor = 'w-resize'; }
// function evt_NoteEdge_Right_MouOver(e) { e.target.style.cursor = 'e-resize'; }

// function evt_NoteEdge_Left_lMouDown(e) {
//   holdingEdge = true;
//   e.target.style.cursor = 'w-resize';
//   var tmp_note = allNotes[e.target.id];
//   keyEditor.gripX = tmp_note.bbox.x;
//   if (tmp_note == undefined) {
//     tmp_note = changingNote;
//   }
//   if (changingNote == null)
//     changingNote = tmp_note;
//   if (heldEdge == null)
//     heldEdge = e.target;
//   document.addEventListener('mousemove', evt_NoteEdge_Left_MouMove, false);
//   document.addEventListener('mouseup', evt_NoteEdge_Left_lMouUp);
// }
// function evt_NoteEdge_Right_lMouDown(e) {
//   holdingEdge = true;
//   e.target.style.cursor = 'e-resize';
//   var tmp_note = allNotes[e.target.id];
//   keyEditor.gripX = tmp_note.bbox.x;
//   if (tmp_note == undefined) {
//     tmp_note = changingNote;
//   }
//   if (changingNote == null)
//     changingNote = tmp_note;
//   if (heldEdge == null)
//     heldEdge = e.target;
//   document.addEventListener('mousemove', evt_NoteEdge_Right_MouMove, false);
//   document.addEventListener('mouseup', evt_NoteEdge_Right_lMouUp);
// }
// function evt_NoteEdge_Left_MouMove(e) {
//   var tmp_ticks = keyEditor.getTicksAt(edtrHTML.mouseX),
//     tmp_rightEdge = heldEdge.parentElement.childNodes[1];

//   if (changingNote !== null) {
//     changingNote.part.moveEvent(changingNote.noteOn, tmp_ticks - changingNote.noteOn.ticks);
//     // changingNote.part.moveEvent(changingNote.noteOn, );
//     changingNote.part.moveEvent(changingNote.noteOff, -(tmp_ticks - changingNote.noteOn.ticks));
//     updateElementBBox(heldEdge, subdivBBox(changingNote.bbox, 0.1, 0, 1, 0));
//     updateElementBBox(tmp_rightEdge, subdivBBox(changingNote.bbox, 0.1, 0.9, 1, 0));
//     song.update();
//   }
//   else {

//   }
// }
// function evt_NoteEdge_Right_MouMove(e) {
//   var tmp_ticks = keyEditor.getTicksAt(edtrHTML.mouseX),
//     tmp_leftEdge = heldEdge.parentElement.childNodes[0];
//   if (changingNote !== null) {
//     changingNote.part.moveEvent(changingNote.noteOff, tmp_ticks - changingNote.noteOff.ticks);
//     updateElementBBox(heldEdge, subdivBBox(changingNote.bbox, 0.1, 0.9, 1, 0));
//     updateElementBBox(tmp_leftEdge, subdivBBox(changingNote.bbox, 0.1, 0, 1, 0));
//     song.update();
//   }
//   else {

//   }
// }
// function evt_NoteEdge_Left_lMouUp(e) {
//   holdingEdge = false;
//   changingNote = null;
//   heldEdge = null;
//   document.removeEventListener('mousemove', evt_NoteEdge_Left_MouMove, false);
//   document.removeEventListener('mouseup', evt_NoteEdge_Left_lMouUp);
//   song.update();
// }
// function evt_NoteEdge_Right_lMouUp(e) {
//   holdingEdge = false;
//   changingNote = null;
//   heldEdge = null;
//   document.removeEventListener('mousemove', evt_NoteEdge_Right_MouMove, false);
//   document.removeEventListener('mouseup', evt_NoteEdge_Right_lMouUp);
//   song.update();
// }
// /*
//   Grid Stuff
// */
// function evt_Grid_lMouDown(e) { }

// function evt_Grid_lMouUp(e) { }

// function evt_Grid_lMouDbl(e) {
//   var tmp_className = e.target.className;
//   /**
//    * if double clicking a note
//    * */
//   if (tmp_className.indexOf('note') !== -1) {
//     currNote = allNotes[e.target.id];
//     currPart = currNote.part;
//     return;
//   }
//   /**
//    * if double clicking a blank section of a part
//    * */
//   else if (tmp_className.indexOf('part') !== -1) {
//     currPart = allParts[e.target.id];
//     currPart.addEvents(createNewNoteInPartAtMouse(currPart));
//     song.update();
//     return;
//   }
//   /**
//    * if double clicking grid but current part is selected
//    * */
//   else if (currPart) {
//     // currPart.addEvents(addNewNoteAtMouse());
//     song.update();
//     return;
//   }
//   /**
//    *if double clicking empty grid space
//    * */
//   else {
//     currNote = null;
//     currPart = null;
//     addPartAtMouse();
//     return;
//   }

// }
// function evt_Generic_lMouDown(e) {
//   var tmp_className = e.target.className;
//   if (tmp_className.indexOf('note') !== -1) {
//     if (currNote !== null)
//       unselectNote(currNote);
//     currNote = allNotes[e.target.id];
//     if (currNote !== null)
//       selectNote(currNote);
//     currPart = currNote.part;
//     if (currPart !== null)
//       selectPart(currPart);
//     return;
//   } else if (tmp_className.indexOf('part') !== -1) {
//     // keyEditor.setPlayheadToX(e.pageX);
//     if (currPart !== null)
//       unselectPart(currPart);
//     currPart = allParts[e.target.id];
//     if (currPart !== null)
//       selectPart(currPart);
//     if (currNote !== null)
//       unselectNote(currNote);
//     currNote = null;
//     return;
//   } else {
//     if (currNote !== null)
//       unselectNote(currNote);
//     currNote = null;
//     if (currPart !== null)
//       unselectPart(currPart);
//     currPart = null;
//     // keyEditor.setPlayheadToX(e.pageX);
//     keyEditor.setPlayheadToX(e.clientX);
//   }
//   // you could also use:
//   //song.setPlayhead('ticks', keyEditor.xToTicks(e.pageX));
// }
// //#endregion

// //#region [ rgba(200, 200, 200, 0.1) ] Random Generation Functions
// function getRandom(num_min, num_max, bool_round) {
//   var tmp_r = Math.random() * (num_max - num_min) + num_min;
//   if (bool_round === true) {
//     return Math.round(tmp_r);
//   } else {
//     return tmp_r;
//   }
// }

// function addRandomPartAtPlayhead() {
//   var i,
//     tmp_ticks = 0, //startPositions[getRandom(0, 4, true)],
//     tmp_numNotes = getRandom(4, 8, true),
//     tmp_spread = 5,
//     tmp_basePitch = getRandom(
//       keyEditor.lowestNote + tmp_spread,
//       keyEditor.highestNote - tmp_spread,
//       true
//     ),
//     tmp_part = sequencer.createPart(),
//     tmp_events = [],
//     tmp_noteLength = song.ppq / 2,
//     tmp_pitch,
//     tmp_velocity;

//   for (i = 0; i < tmp_numNotes; i++) {
//     tmp_pitch = tmp_basePitch + getRandom(-tmp_spread, tmp_spread, true);
//     tmp_velocity = getRandom(50, 127, true);

//     tmp_events.push(sequencer.createMidiEvent(tmp_ticks, NOTE_ON, tmp_pitch, tmp_velocity));
//     tmp_ticks += tmp_noteLength;
//     tmp_events.push(sequencer.createMidiEvent(tmp_ticks, NOTE_OFF, tmp_pitch, 0));
//     tmp_ticks += tmp_noteLength;
//   }
//   tmp_ticks = keyEditor.getTicksAt(keyEditor.getPlayheadX());

//   tmp_part.addEvents(tmp_events);
//   if (!track) track = song.tracks[0];
//   if (!track) track = sequencer.createTrack("forcedTrack");
//   track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
//   song.update();
// }

// function addPartAtMouse() {
//   keyEditor.setPlayheadToX(edtrHTML.mouseX);
//   var i,
//     tmp_ticks = 0, //startPositions[getRandom(0, 4, true)],
//     tmp_numNotes = 2,
//     tmp_spread = 1,
//     tmp_basePitch = keyEditor.getPitchAt(edtrHTML.mouseY - edtrHTML.div_Score.offsetTop).number,
//     tmp_part = sequencer.createPart(),
//     tmp_events = [],
//     tmp_noteLength = song.ppq / 2,
//     tmp_pitch,
//     tmp_velocity;

//   for (i = 0; i < tmp_numNotes; i++) {
//     // pitch = basePitch + getRandom(-spread, spread, true);
//     tmp_pitch = tmp_basePitch;
//     tmp_velocity = getRandom(50, 127, true);

//     tmp_events.push(sequencer.createMidiEvent(tmp_ticks, NOTE_ON, tmp_pitch, tmp_velocity));
//     tmp_ticks += tmp_noteLength;
//     tmp_events.push(sequencer.createMidiEvent(tmp_ticks, NOTE_OFF, tmp_pitch, 0));
//     tmp_ticks += tmp_noteLength;
//   }
//   tmp_ticks = keyEditor.getTicksAt(keyEditor.getPlayheadX(true));

//   tmp_part.addEvents(tmp_events);
//   if (!track) track = song.tracks[0];
//   track.addPartAt(tmp_part, ['ticks', tmp_ticks]);
//   song.update();
// }
// //#endregion



// /**
//  * EXPERIMENTAL
//  */
// function createNewNoteInPartAtMouse(tmp_part) {
//   var tmp_pitch = keyEditor.getPitchAt(edtrHTML.mouseY - edtrHTML.div_Score.offsetTop).number,
//     tmp_velocity = 127,
//     tmp_events = [],
//     tmp_noteLength = song.ppq/*  / 2 */;
//   var tmp_ticks = keyEditor.getTicksAt(edtrHTML.mouseX),
//     tmp_noteOn,
//     tmp_noteOff,
//     tmp_note;
//   // tmp_note = sequencer.createNote(pitch.number);
//   tmp_noteOn = sequencer.createMidiEvent(tmp_ticks, NOTE_ON, tmp_pitch, tmp_velocity);
//   tmp_ticks += tmp_noteLength;
//   tmp_noteOff = sequencer.createMidiEvent(tmp_ticks, NOTE_OFF, tmp_pitch, 0);
//   tmp_events.push(tmp_noteOn, tmp_noteOff);
//   tmp_ticks = keyEditor.getTicksAt(edtrHTML.mouseX);
//   console.log('added new note: \n ' +
//     'pitch: ' + tmp_pitch.number + '\n' +
//     'at ticks: ' + tmp_ticks + '\n' +
//     'velocity: ' + tmp_velocity + '\n' +
//     'length: ' + tmp_noteLength + '\n'
//   );

//   return tmp_events;
// }

// function flattenTracks(ref_song) {
//   ref_song.tracks.forEach(
//     function (track) {
//       track.setInstrument('piano');
//       track.monitor = true;
//       track.setMidiInput('all');
//     }
//   );
// }
// function subdivBBox(ref_bbox, ref_xRatio, ref_xOffsetRatio, ref_yRatio, ref_yOffsetRatio/* , ref_minWidth, ref_maxWidth */) {
//   var tmp_bbox = {
//     left: (ref_bbox.width * ref_xOffsetRatio),
//     top: (ref_bbox.height * ref_yOffsetRatio),
//     width: ref_bbox.width * ref_xRatio,
//     height: ref_bbox.height * ref_yRatio
//   }
//   // tmp_bbox.x = tmp_bbox.left;
//   // tmp_bbox.y = tmp_bbox.top;
//   if (tmp_bbox.width < 1) tmp_bbox.width = 1;
//   return tmp_bbox;
// }
// function subdivBBoxByPixels(ref_bbox, ref_xRatio, ref_xOffsetRatio, ref_yRatio, ref_yOffsetRatio, ref_minWidth, ref_maxWidth) {
//   var tmp_bbox = {
//     left: (ref_bbox.width * ref_xOffsetRatio),
//     top: (ref_bbox.height * ref_yOffsetRatio),
//     width: ref_bbox.width * ref_xRatio,
//     height: ref_bbox.height * ref_yRatio
//   }
//   // tmp_bbox.x = tmp_bbox.left;
//   // tmp_bbox.y = tmp_bbox.top;
//   if (tmp_bbox.width < ref_minWidth) { tmp_bbox.width = ref_minWidth; }
//   else if (tmp_bbox.width > ref_maxWidth) { tmp_bbox.width = ref_maxWidth; }
//   return tmp_bbox;
// }
// // class EditorHTML {

// //   btn_Play: HTMLButtonElement;
// //   btn_Record: HTMLButtonElement;
// //   btn_Loop: HTMLButtonElement;
// //   btn_Stop: HTMLButtonElement;
// //   btn_Prev: HTMLButtonElement;
// //   btn_Next: HTMLButtonElement;
// //   btn_Last: HTMLButtonElement;
// //   btn_First: HTMLButtonElement;
// //   btn_AddPart: HTMLButtonElement;
// //   div_currNote: HTMLDivElement;
// //   div_Controls: HTMLDivElement;
// //   div_BarsBeats: HTMLDivElement;
// //   div_Seconds: HTMLDivElement;
// //   div_MouseX: HTMLDivElement;
// //   mouseX;
// //   mouseBarPos;
// //   div_MouseY: HTMLDivElement;
// //   mouseY;
// //   mousePitchPos;
// //   div_PageNumbers: HTMLDivElement;
// //   div_Editor: HTMLDivElement;
// //   div_Score: HTMLDivElement;
// //   div_BarLines: HTMLDivElement;
// //   div_BeatLines: HTMLDivElement;
// //   div_SixteenthLines: HTMLDivElement;
// //   div_PitchLines: HTMLDivElement;
// //   div_Notes: HTMLDivElement;
// //   div_Parts: HTMLDivElement;
// //   div_Playhead: HTMLDivElement;
// //   txt_KeyRangeStart: HTMLTextAreaElement;
// //   txt_KeyRangeEnd: HTMLTextAreaElement;
// //   div_currPart;

// //   divs_AllNotes;
// //   divs_AllParts;
// //   slct_Snap;

// //   gridHoriMargin;
// //   gridVertMargin;
// //   sldr_barsPerPage;
// //   lbl_sldr_barsPerPage;
// //   constructor() {
// //     this.btn_Play = document.getElementById('play') as HTMLButtonElement;
// //     this.btn_Record = document.getElementById('record') as HTMLButtonElement;
// //     this.btn_Loop = document.getElementById('loop') as HTMLButtonElement;
// //     this.btn_Stop = document.getElementById('stop') as HTMLButtonElement;
// //     this.btn_Prev = document.getElementById('prev') as HTMLButtonElement;
// //     this.btn_Next = document.getElementById('next') as HTMLButtonElement;
// //     this.btn_Last = document.getElementById('last') as HTMLButtonElement;
// //     this.btn_First = document.getElementById('first') as HTMLButtonElement;
// //     this.btn_AddPart = document.getElementById('add-part') as HTMLButtonElement;
// //     this.txt_KeyRangeStart = document.getElementById('key-range-start') as HTMLTextAreaElement;
// //     this.txt_KeyRangeEnd = document.getElementById('key-range-end') as HTMLTextAreaElement;
// //     this.sldr_barsPerPage = document.getElementById('scale-slider');
// //     this.lbl_sldr_barsPerPage = document.getElementById('scale-label');
// //     this.div_Controls = document.getElementById('editor-controls') as HTMLDivElement;
// //     this.div_BarsBeats = document.getElementById('time-bars-beats') as HTMLDivElement;
// //     this.div_Seconds = document.getElementById('time-seconds') as HTMLDivElement;
// //     this.div_MouseX = document.getElementById('mouse-x') as HTMLDivElement;
// //     this.div_MouseY = document.getElementById('mouse-y') as HTMLDivElement;
// //     this.div_PageNumbers = document.getElementById('page-numbers') as HTMLDivElement;
// //     this.div_Editor = document.getElementById('editor') as HTMLDivElement;
// //     this.div_Score = document.getElementById('score') as HTMLDivElement;
// //     this.div_BarLines = document.getElementById('bar-lines') as HTMLDivElement;
// //     this.div_BeatLines = document.getElementById('tick-lines') as HTMLDivElement;
// //     this.div_SixteenthLines = document.getElementById('sub-tick-lines') as HTMLDivElement;
// //     this.div_PitchLines = document.getElementById('pitch-lines') as HTMLDivElement;
// //     this.div_Notes = document.getElementById('notes') as HTMLDivElement;
// //     this.div_Parts = document.getElementById('parts') as HTMLDivElement;
// //     this.div_Playhead = document.getElementById('playhead') as HTMLDivElement;
// //     this.slct_Snap = document.getElementById('snap') as HTMLDivElement;
// //     this.div_currNote = document.getElementById('dbg-curr-note') as HTMLDivElement;
// //     this.div_currPart = document.getElementById('dbg-curr-part') as HTMLDivElement;
// //     this.divs_AllNotes = {}; // stores references to all divs that represent a midi note
// //     this.divs_AllParts = {}; // stores references to all divs that represent a midi part

// //     this.gridHoriMargin = 24;
// //     this.gridVertMargin = 24;
// //     return this;
// //   }
