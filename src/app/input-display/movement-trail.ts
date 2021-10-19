import {Div} from '../../helpers/Gen';
import {Queue} from '../../helpers/Defs';

class TrailDot {
  x;
  y;
  node;

  constructor(pos: [number, number], parent: HTMLDivElement) {
    this.x = pos[0];
    this.y = pos[1];
    this.node = Div('', 'trail');
    parent.appendChild(this.node);
  }

  draw() {
    this.node.style.left = 24 + this.x + 'px';
    this.node.style.top = 24 + this.y + 'px';
  }
}

export class MovementTrail {
  parent: HTMLDivElement;
  divFrame: HTMLDivElement;
  maxDots = 20;
  dots: Queue<TrailDot> = new Queue<TrailDot>(this.maxDots);
  line: SVGPolylineElement;
  svg: SVGSVGElement;
  lastPos = [0, 0];

  constructor(parent) {
    this.parent = parent;
    this.divFrame = Div('', 'svg-shell');
    parent.appendChild(this.divFrame);
    this.line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.appendChild(this.line);
    this.divFrame.appendChild(this.svg);
  }

  relPos(dot: TrailDot) {
    const rect = this.parent.getBoundingClientRect();
    // const rect = this.divFrame.getBoundingClientRect();
    return [dot.x - rect.left, dot.y - rect.top];
  }

  draw(pos) {
    const dot = new TrailDot(pos, this.parent);
    dot.draw();
    const removed = this.dots.qThru(dot);
    if (removed) {
      this.parent.removeChild(removed.node);
    }
    this.drawSVGLine();
  }

  drawSVGLine() {
    let pts = '';

    this.dots.q.forEach((dot, i) => {
      const dotPos = this.relPos(dot);
      pts += `${dotPos[0]},${dotPos[1]} `;
    });
    this.line.setAttribute('points', pts);
  }
}


