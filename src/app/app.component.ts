import {AfterContentInit, AfterViewInit, Component, OnInit} from '@angular/core';
// import {AngularFirestore} from '@angular/fire/firestore';
// import * as firebase from 'firebase';
import {Observable} from 'rxjs';
import {FPSTracker} from '../helpers/Defs';
import {InputEditorComponent} from './input-editor/input-editor.component';
import {FPS_60_MS} from '../helpers/Vals';
import {InputDisplayComponent} from './input-display/input-display.component';
import {InputConverterComponent} from './input-converter/input-converter.component';

export let frameDelayMS = 0;
export let frameJitter = (frameDelayMS - FPS_60_MS) / 1000;
export let dNowMS = 0;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements AfterViewInit, AfterContentInit {

  title = 'LAB-Assist';
  fps: FPSTracker = new FPSTracker();
  icc: InputConverterComponent;
  idc: InputDisplayComponent;
  iec: InputEditorComponent;

  getFPS(): number {
    return this.fps ? this.fps.average : -1;
  }

  constructor() {
  }
  ngAfterContentInit(): void {
    this.fps = new FPSTracker();
  }
  ngAfterViewInit(): void {
    this.icc = InputConverterComponent.inpConvComp;
    this.idc =  InputDisplayComponent.inpDispCmp;
    this.iec  = InputEditorComponent.inpEdComp;
    requestAnimationFrame((cb) => this.globalFrame(cb));
  }

  globalFrame(callback) {
    frameDelayMS = this.fps.update();
    dNowMS = this.fps.dNow;
    if (frameDelayMS > 0) {
      setTimeout(() => {
      }, frameDelayMS);
    }
    this.iec.edtrView.playUpdate();
    requestAnimationFrame((cb) => this.globalFrame(cb));
  }
}
