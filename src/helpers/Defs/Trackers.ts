import {GamepadObject, HTMLNote} from '../Defs';
import {InputEditorFunctions} from '../../app/input-editor/input-editor-functions';
import {InputEditorComponent} from '../../app/input-editor/input-editor.component';
import {InputConverterFunctions} from '../../app/input-converter/input-converter-functions';
import {InputConverterComponent} from '../../app/input-converter/input-converter.component';
import {Channel} from '../Enums';

export class Tracker {
  held = false;
  channel: Channel;
  get Channel(): number{
    return this.channel as number;
  }
  inpStart: number;
  inpEnd: number;
  htmlNote: HTMLNote;

  constructor(chan: number) {
    this.channel = chan as Channel;
  }

  start(ticks: number) {
    this.held = true;
    this.inpStart = ticks;

    InputEditorFunctions.testCreateNote(this, this.Channel);
  }

  update(ticks: number, liveUpdate: boolean) {
    if (this.held) {
      if (liveUpdate) {
        this.liveUpdate();
      }
    }
  }

  liveUpdate() {
    const iec = InputEditorComponent.inpEdComp;
    this.htmlNote.updateNoteEnd(iec.edtrView.playhead.bbox.pageCenter);
  }

  end(ticks: number, trackedNotes: Array<[number, number, number]>,
      liveUpdate = false) {
    this.inpEnd = ticks;
    trackedNotes.push([this.inpStart, this.inpEnd, this.Channel]);
    this.held = false;
    InputEditorFunctions.testFinishNote(this);
  }
}

export class TwoWayTracker {
  neg: Tracker;
  pos: Tracker;

  constructor(channels: [number, number]) {
    this.neg = new Tracker(channels[0]);
    this.pos = new Tracker(channels[1]);
  }

  idx(idx: number) {
    switch (idx) {
      case 0:
        return this.neg;
      case 1:
        return this.pos;
    }
  }

  update(val: number, dz: number, ticks: number) {
    const icc = InputConverterComponent.inpConvComp;
    if (val.valueOf() > dz) {
      if (!this.pos.held) {
        this.pos.held = true;
        this.neg.held = false;
        if (icc.trackingNotes) {
          this.pos.start(ticks,
          );
        }
      }
    } else if (val.valueOf() < -dz) {
      if (!this.neg.held) {
        this.pos.held = false;
        this.neg.held = true;
        if (icc.trackingNotes) {
          this.neg.start(ticks,
          );
        }
      }
    } else {
      this.neg.held = false;
      this.pos.held = false;
    }
  }
}

export class FourWayTracker {
  ud: TwoWayTracker;
  lr: TwoWayTracker;

  constructor(channelSets: [[number, number], [number, number]]) {
    this.ud = new TwoWayTracker(channelSets[0]);
    this.lr = new TwoWayTracker(channelSets[1]);
  }

  idx(idx: number): TwoWayTracker {
    switch (idx) {
      case 0:
        return this.ud;
      case 1:
        return this.lr;
    }
  }

  update(vals: [number, number], pO: GamepadObject, ticks: number) {
    this.ud.update(vals[0], pO.vertDZ, ticks);
    this.lr.update(vals[1], pO.horiDZ, ticks);
  }
}

export class ButtonTrackerSet {
  btns: Tracker[];

  constructor(cnt: number) {
    this.btns = new Array<Tracker>();
    for (let i = 0; i < cnt; i++) {
      this.btns.push(new Tracker(InputConverterFunctions.getButtonChannel(i)));
    }
  }

}


export class InputTrackerSet {
  lsGroup: FourWayTracker;
  rsGroup: FourWayTracker;
  dpadGroup: FourWayTracker;
  btnSet: ButtonTrackerSet;

  constructor(pO: GamepadObject) {
    this.lsGroup = new FourWayTracker(InputConverterFunctions.twoChannelSetsBy4Way(0));
    this.rsGroup = new FourWayTracker(InputConverterFunctions.twoChannelSetsBy4Way(1));
    this.dpadGroup = new FourWayTracker(InputConverterFunctions.twoChannelSetsBy4Way(2));
    this.btnSet = new ButtonTrackerSet(pO.Btns.length);
  }

  btn(idx: number) {
    return this.btnSet.btns[idx];
  }
}


