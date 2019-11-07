import { Component, OnInit } from '@angular/core';


export enum MovementNotationType {
  Numeric = 'n',
  Directional = 'd',
  TruncatedDirectional = 'td',
  Motional = 'm',
  TruncatedMotional = 'tm'
}
export enum ButtonNotationType {
  Numeric = 'num',
  StreetFighter = 'sf',
  SNK = 'snk',
  Netherrealm = 'nrs',
  Tekken = 'tek',
  SoulCalibur = 'sc',
  GuiltyGear = 'gg'
}
@Component({
  selector: 'app-input-display',
  templateUrl: './input-display.component.html',
  styleUrls: ['./input-display.component.sass'],
  template: `
  <div id="controllers"></div>
  <h2 id="start">Press a button on your controller to start</h2>
  <div id="noteTypesCont">
    <label for="disp-slct-move-notation" id="disp-lbl-slct-move-notation">Move Notation</label>
    <select id= 'disp-slct-move-notation'>
      <option *ngFor="let sym of mntKeys">{{sym}}</option>
    </select>
    <label for="disp-slct-button-notation" id="disp-lbl-slct-button-notation">Button Notation</label>
    <select id= 'disp-slct-button-notation'>
      <option *ngFor="let sym of bntKeys">{{sym}}</option>
    </select>
  </div>
  `
})
export class InputDisplayComponent implements OnInit {
  mvNotTy: MovementNotationType;
  mvNotTypes = MovementNotationType;
  butNotTy: ButtonNotationType;
  butNotTypes = ButtonNotationType;
  mntKeys = Object.keys(MovementNotationType);
  bntKeys = Object.keys(ButtonNotationType);
  constructor() { }

  ngOnInit() {
  }

}
