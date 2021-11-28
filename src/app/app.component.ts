import {AfterViewInit, Component, OnInit} from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import * as firebase from 'firebase';
import {FPSTracker} from '../helpers/Defs';

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

  constructor() { }

  ngAfterViewInit(): void {
    this.fps = new FPSTracker();
    requestAnimationFrame((cb) => this.globalFrame(cb));
  }
  globalFrame(callback)
  {
    // console.log(this.fps.dNow);
    const frameDelay = this.fps.update();
    setTimeout( () => {}, frameDelay);
    requestAnimationFrame((cb) => this.globalFrame(cb));
  }
}
