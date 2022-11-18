import {GamepadObject, HTMLNote} from '../Defs';
import {InputEditorFunctions} from '../../app/input-editor/input-editor-functions';
import {InputEditorComponent} from '../../app/input-editor/input-editor.component';
import {InputConverterFunctions} from '../../app/input-converter/input-converter-functions';
import {InputConverterComponent} from '../../app/input-converter/input-converter.component';
import {Channel} from '../Enums';

export class Tracker {
  held = false;
  liveStart: number;
  liveEnd: number;
  liveNote: HTMLNote;
  channel: Channel;

  get Channel(): number {
    return this.channel as number;
  }

  constructor(chan: number) {
    this.channel = chan as Channel;
  }

  start(ticks: number) {
    this.held = true;
    this.liveStart = ticks;
    const iec = InputEditorComponent.inpEdComp;
    this.liveNote = new HTMLNote(this.Channel, iec.edtrView.playhead.bbox.pageCenter,
      iec.edtrView.playhead.bbox.y + ((iec.edtrView.pitchCount - this.Channel - 1) * iec.edtrView.pitchHeight));
    InputEditorFunctions.testCreateNote(this);
  }

  end(ticks: number, trackedNotes: Array<[number, number, number]>) {
    this.liveEnd = ticks;
    trackedNotes.push([this.liveStart, this.liveEnd, this.Channel]);
    this.held = false;
    InputEditorFunctions.testFinishNote(this);
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
    this.liveNote.updateNoteEnd(iec.edtrView.playhead.bbox.pageCenter);
  }
}


class TwoWayTracker {
  neg: Tracker;
  pos: Tracker;

  constructor(channels: [number, number] = null) {
    if(channels) {
      this.neg = new Tracker(channels[0]);
      this.pos = new Tracker(channels[1]);
    }
  }
  idx(idx: number): Tracker {
    switch (idx) {
      case 0:
        return this.neg;
      case 1:
        return this.pos;
    }
  }
}

export class FourWayTracker {
  ud: TwoWayTracker;
  lr: TwoWayTracker;

  constructor(channelSets: [[number, number], [number, number]] = null) {
    if (channelSets) {
      this.ud = new TwoWayTracker(channelSets[0]);
      this.lr = new TwoWayTracker(channelSets[1]);
    }
  }

  idx(idx: number): TwoWayTracker {
    switch (idx) {
      case 0:
        return this.ud;
      case 1:
        return this.lr;
    }
  }
}

export class DigiTracker extends Tracker {

  constructor(props) {
    super(props);
  }

  update(ticks: number, liveUpdate: boolean) {
    if (this.held) {
      if (liveUpdate) {
        this.liveUpdate();
      }
    }
  }


}

export class TwoWayDigiTracker extends TwoWayTracker {
  neg: DigiTracker;
  pos: DigiTracker;

  update(val: number, ticks: number) {
    const icc = InputConverterComponent.inpConvComp;
    if (val === 1) {
      if (!this.pos.held) {
        this.pos.held = true;
        this.neg.held = false;
        if (icc.trackingNotes) {
          this.pos.start(ticks);
        }
      }
    } else if (val === -1) {
      if (!this.neg.held) {
        this.pos.held = false;
        this.neg.held = true;
        if (icc.trackingNotes) {
          this.neg.start(ticks);
        }
      }
    } else {
      this.neg.held = false;
      this.pos.held = false;
    }
  }
}

export class FourWayDigiTracker extends FourWayTracker {
  ud: TwoWayDigiTracker;
  lr: TwoWayDigiTracker;




  idx(idx: number): TwoWayDigiTracker {
    switch (idx) {
      case 0:
        return this.ud;
      case 1:
        return this.lr;
    }
  }

  update(vals: [number, number], pO: GamepadObject, ticks: number) {
    this.ud.update(vals[0], ticks);
    this.lr.update(vals[1], ticks);
  }
}

export class ButtonTrackerSet {
  btns: DigiTracker[];

  constructor(cnt: number) {
    this.btns = new Array<DigiTracker>();
    for (let i = 0; i < cnt; i++) {
      this.btns.push(new DigiTracker(InputConverterFunctions.getButtonChannel(i)));
    }
  }

}

export class TwoWayAnlgTracker extends TwoWayTracker {

  update(val: number, dz: number, ticks: number) {
    const icc = InputConverterComponent.inpConvComp;
    if (val.valueOf() > dz) {
      if (!this.pos.held) {
        this.pos.held = true;
        this.neg.held = false;
        if (icc.trackingNotes) {
          this.pos.start(ticks);
        }
      }
    } else if (val.valueOf() < -dz) {
      if (!this.neg.held) {
        this.pos.held = false;
        this.neg.held = true;
        if (icc.trackingNotes) {
          this.neg.start(ticks);
        }
      }
    } else {
      this.neg.held = false;
      this.pos.held = false;
    }
  }
}

export class FourWayAnlgTracker extends FourWayTracker {
  ud: TwoWayAnlgTracker;
  lr: TwoWayAnlgTracker;

  constructor(channelSets) {
    super();
    this.ud = new TwoWayAnlgTracker(channelSets[0]);
    this.lr = new TwoWayAnlgTracker(channelSets[1]);
  }

  update(vals: [number, number], pO: GamepadObject, ticks: number) {
    this.ud.update(vals[0], ticks, pO.vertDZ);
    this.lr.update(vals[1], ticks, pO.horiDZ);
  }
}


export class InputTrackerSet {
  lsGroup: FourWayAnlgTracker;
  rsGroup: FourWayAnlgTracker;
  dpadGroup: FourWayDigiTracker;
  btnSet: ButtonTrackerSet;

  constructor(pO: GamepadObject) {
    this.lsGroup = new FourWayAnlgTracker(InputConverterFunctions.twoChannelSetsBy4Way(0));
    this.rsGroup = new FourWayAnlgTracker(InputConverterFunctions.twoChannelSetsBy4Way(1));
    this.dpadGroup = new FourWayDigiTracker(InputConverterFunctions.twoChannelSetsBy4Way(2));
    this.btnSet = new ButtonTrackerSet(pO.Btns.length);
  }

  btn(idx: number) {
    return this.btnSet.btns[idx];
  }
}


