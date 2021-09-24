class TrailDot {
  x;
  y;
  node;

  constructor(pos: [number, number], parent: HTMLDivElement) {
    this.x = pos[0];
    this.y = pos[1];
    this.node = document.createElement('div');
    this.node.className = 'trail';
    parent.appendChild(this.node);
  }

  draw() {
    this.node.style.left = 28 + this.x + 'px';
    this.node.style.top = 28 + this.y + 'px';
  }
}

export class MovementTrail {
  parent: HTMLDivElement;
  divFrame: HTMLDivElement;
  dots: TrailDot[] = [];
  line: SVGPolylineElement;
  svg: SVGSVGElement;
  maxDots = 12;
  lastPos = [0, 0];

  constructor(parent) {
    this.parent = parent;
    this.divFrame = document.createElement('div');
    this.divFrame.className = 'svg-shell';
    parent.appendChild(this.divFrame);
    this.line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.appendChild(this.line);
    this.divFrame.appendChild(this.svg);
  }

  draw(pos) {
    const dot = new TrailDot(pos, this.parent);
    dot.draw();
    this.dots.push(dot);
    if (this.dots.length >= this.maxDots) {
      this.parent.removeChild(this.dots.shift().node);
    }
    this.drawSVGLine();
  }

  drawSVGLine() {
    let pts = '';
    this.dots.forEach((dot, i) => {
      pts += `${dot.x + ',' + dot.y + ' '}`;
    });
    this.line.setAttribute('points', pts);
  }
}


