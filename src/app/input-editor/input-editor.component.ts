import { Component, OnInit, Inject } from '@angular/core';
import { Note, Part } from "heartbeat-sequencer";
@Component({
  selector: 'app-input-editor',
  templateUrl: './input-editor.component.html',
  styleUrls: ['./input-editor.component.sass'],
  template: `
  <div id='editor-input-icons'>
  <div id='editor-input-icon' height="128">
    <img src="assets/editor/img/x360/360_Dpad.png" width="64">
  </div>
  <div id='editor-input-icon' height="128">
    <img src="assets/editor/img/x360/360_X.png" width="64">
  </div>
  <div id='editor-input-icon' height="128">
    <img src="assets/editor/img/x360/360_Y.png" width="64">
  </div>
  <div id='editor-input-icon' height="128">
    <img src="assets/editor/img/x360/360_RB.png" width="64">
  </div>
  <div id='editor-input-icon' height="128">
    <img src="assets/editor/img/x360/360_A.png" width="64">
  </div>
  <div id='editor-input-icon' height="128">
    <img src="assets/editor/img/x360/360_B.png" width="64">
  </div>
  <div id='editor-input-icon' height="128">
    <img src="assets/editor/img/x360/360_RT.png" width="64">
  </div>
</div>
  <div #edit id='editor'>

  <div id='score'>
    <div id='pitch-lines'></div>
    <div id='bar-lines'></div>
    <div id='tick-lines'></div>
    <div id='sub-tick-lines'></div>
    <div id='notes'></div>
    <div id='parts'></div>
    <div id='playhead'>
      <div id='playhead-line'></div>
    </div>
  </div>
</div>
<div id='editor-controls'>
  <span class="editor-control">
    <input type='button' id='play' value='play' />
    <input type='button' id='stop' value='stop' />
  </span>
  <span class="editor-control">
    <div id='time-bars-beats'></div>
    <!-- <div class='pipe'>|</div> -->
    <div id='time-seconds'></div>
  </span>
  <span class="editor-control" id="pitch-range">Pitch Range:
    <input type="text" id='key-range-start' (ngModel)="pitchStart" value="{{pitchStart}}" />start
    <input type="text" id='key-range-end' (ngModel)="pitchEnd" value="{{pitchEnd}}" />end
    <button id="update-range" (click)="UpdatePitchRange()">Update</button>
  </span>
  <span class="editor-control">
    <!-- <div class='pipe'>|</div> -->
    <div id='mouse-x'>0</div>

    <!-- <div class='pipe'>|</div> -->
    <div id='mouse-y'>0</div>
  </span>
  <div class='pipe'>|</div>

  <span class="editor-control">
    <input type='button' id='first' value='<<' />
    <input type='button' id='prev' value='<' />
    <div id='page-numbers'>page 0 of 0</div>
    <input type='button' id='next' value='>' />
    <input type='button' id='last' value='>>' />
  </span>

  <div class='pipe'>|</div>
  <span class="editor-control">
    <input type='range' id='scale-slider' />
    <label for='scale-slider' id='scale-label'>#bars 16</label>
  </span>
  <span class="editor-control">
    <span>snap:
      <select id="snap">

        <!-- <option value='bar'>bar</option> <option value='beat' >beat</option> -->

        <option value='1'>whole</option>
        <option value='2'>half</option>
        <option value='4'>quarter</option>
        <option value='8'>8th</option>
        <option value='16'>16th</option>
        <option value='32'>32th</option>
        <option value='64'>64th</option>
        <option value='tick'>tick</option>
        <option value='off'>off</option>
      </select>
    </span>
  </span>
  <input type='button' id='add-part' value='add part' />
  <span class="editor-control">
  <div id='dbg-curr-note'>Sel Note: </div>
  <div id='dbg-curr-part'>Sel Part: </div>
    </span>
    </div>
  `
})
export class InputEditorComponent implements OnInit {
  editShell: EditorHTMLShell;
  constructor() {
  }
  ngOnInit() {
    // console.log(this.editShell);
  }
  ngAfterViewInit(): void {
    this.editShell = new EditorHTMLShell();
    console.log("Finished creating editor shell");

  }

}
export class EditorHTMLShell {
  btn_Play: HTMLButtonElement;
  btn_Stop: HTMLButtonElement;
  btn_Prev: HTMLButtonElement;
  btn_Next: HTMLButtonElement;
  btn_Last: HTMLButtonElement;
  btn_First: HTMLButtonElement;
  btn_AddPart: HTMLButtonElement;
  txt_KeyRangeStart: HTMLTextAreaElement;
  txt_KeyRangeEnd: HTMLTextAreaElement;

  sldr_barsPerPage: HTMLInputElement;
  lbl_sldr_barsPerPage: HTMLLabelElement;

  div_Controls: HTMLDivElement;
  div_BarsBeats: HTMLDivElement;
  div_Seconds: HTMLDivElement;

  div_MouseX: HTMLDivElement;
  mouseX: number;
  mouseBarPos;

  div_MouseY: HTMLDivElement;
  mouseY: number;
  mousePitchPos;

  div_currNote: HTMLDivElement;
  div_currPart: HTMLDivElement;

  div_PageNumbers: HTMLDivElement;
  div_Editor: HTMLDivElement;
  div_Score: HTMLDivElement;
  div_BarLines: HTMLDivElement;
  div_BeatLines: HTMLDivElement;
  div_SixteenthLines: HTMLDivElement;
  div_PitchLines: HTMLDivElement;
  div_Notes: HTMLDivElement;
  div_Parts: HTMLDivElement;
  div_Playhead: HTMLDivElement;
  divs_AllNotes: HTMLDivElement[];
  divs_AllParts: HTMLDivElement[];
  slct_Snap: HTMLSelectElement;
  allNotes: Note[];
  allParts: Part[];
  gridHoriMargin: number;
  gridVertMargin: number;
  constructor() {
    this.btn_Play = document.getElementById('play') as HTMLButtonElement,
      this.btn_Stop = document.getElementById('stop') as HTMLButtonElement,
      this.btn_Prev = document.getElementById('prev') as HTMLButtonElement,
      this.btn_Next = document.getElementById('next') as HTMLButtonElement,
      this.btn_Last = document.getElementById('last') as HTMLButtonElement,
      this.btn_First = document.getElementById('first') as HTMLButtonElement,
      this.btn_AddPart = document.getElementById('add-part') as HTMLButtonElement,
      this.txt_KeyRangeStart = document.getElementById('key-range-start') as HTMLTextAreaElement,
      this.txt_KeyRangeEnd = document.getElementById('key-range-end') as HTMLTextAreaElement,
      this.sldr_barsPerPage = document.getElementById('scale-slider') as HTMLInputElement,
      this.lbl_sldr_barsPerPage = document.getElementById('scale-label') as HTMLLabelElement,
      this.div_Controls = document.getElementById('editor-controls') as HTMLDivElement,
      this.div_BarsBeats = document.getElementById('time-bars-beats') as HTMLDivElement,
      this.div_Seconds = document.getElementById('time-seconds') as HTMLDivElement,
      this.div_MouseX = document.getElementById('mouse-x') as HTMLDivElement,
      this.div_MouseY = document.getElementById('mouse-y') as HTMLDivElement,
      this.div_PageNumbers = document.getElementById('page-numbers') as HTMLDivElement,
      this.div_Editor = document.getElementById('editor') as HTMLDivElement,
      this.div_Score = document.getElementById('score') as HTMLDivElement,
      this.div_BarLines = document.getElementById('bar-lines') as HTMLDivElement,
      this.div_BeatLines = document.getElementById('tick-lines') as HTMLDivElement,
      this.div_SixteenthLines = document.getElementById('sub-tick-lines') as HTMLDivElement,
      this.div_PitchLines = document.getElementById('pitch-lines') as HTMLDivElement,
      this.div_Notes = document.getElementById('notes') as HTMLDivElement,
      this.div_Parts = document.getElementById('parts') as HTMLDivElement,
      this.div_Playhead = document.getElementById('playhead') as HTMLDivElement,
      this.slct_Snap = document.getElementById('snap') as HTMLSelectElement,
      this.div_currNote = document.getElementById('dbg-curr-note') as HTMLDivElement,
      this.div_currPart = document.getElementById('dbg-curr-part') as HTMLDivElement,
      this.gridHoriMargin = 24,
      this.gridVertMargin = 24;
    return this;
  }
}
