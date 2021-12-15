import {AfterViewInit, Component, OnInit} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import * as firebase from 'firebase';
import {FPSTracker} from '../helpers/Defs';
import {InputEditorComponent} from './input-editor/input-editor.component';
import {FPS_60_MS} from '../helpers/Vals';

export let frameDelayMS = 0;
export let frameJitter = (frameDelayMS - FPS_60_MS) / 1000;
export let dNowMS = 0;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements AfterViewInit {
  title = 'LAB-Assist';
  fps: FPSTracker = new FPSTracker();

  getFPS(): number {
    return this.fps ? this.fps.average : -1;
  }

  constructor() {
  }

  ngAfterViewInit(): void {
    this.fps = new FPSTracker();
    requestAnimationFrame((cb) => this.globalFrame(cb));
  }

  globalFrame(callback) {
    frameDelayMS = this.fps.update();
    dNowMS = this.fps.dNow;
    if (frameDelayMS > 0) {
      setTimeout(() => {
      }, frameDelayMS);
    }
    requestAnimationFrame((cb) => this.globalFrame(cb));
  }
}
