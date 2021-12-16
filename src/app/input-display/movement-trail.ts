import {Div, SubDiv} from '../../helpers/Gen';
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
    this.node.style.left = 21 + this.x + 'px';
    this.node.style.top = 21 + this.y + 'px';
  }
}

export class MovementTrail {
  parent: HTMLDivElement;
  trailShell: HTMLDivElement;
  svgShell: HTMLDivElement;
  maxDots = 20;
  dots: Queue<TrailDot> = new Queue<TrailDot>(this.maxDots);
  line: SVGPolylineElement;
  svg: SVGSVGElement;
  lastPos = [0, 0];

  constructor(parent) {
    this.parent = parent;
    this.svgShell = SubDiv(this.parent, '', 'svg-shell');
    this.trailShell = SubDiv(this.parent, '', 'trail-shell');
    this.line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline') as SVGPolylineElement;
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    this.svg.appendChild(this.line);
    this.svgShell.appendChild(this.svg);
  }

  relPos(dot: TrailDot) {
    const rect = this.parent.getBoundingClientRect();
    return [dot.x - rect.left + 24 - window.scrollX,
      dot.y - rect.top + 24 - window.scrollY];
  }

  draw(pos) {
    const dot = new TrailDot(pos, this.trailShell);
    dot.draw();
    const removed = this.dots.qThru(dot);
    if (removed) {
      this.trailShell.removeChild(removed.node);
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


