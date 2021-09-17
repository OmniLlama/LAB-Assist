class TrailDot {
  x;
  y;
  node;

  constructor(pos: [number, number]) {
    this.x = pos[0];
    this.y = pos[1];
    this.node = document.createElement('div');
    this.node.className = 'trail';
    document.body.appendChild(this.node);
  }

  draw() {
    this.node.style.left = 28 + this.x + 'px';
    this.node.style.top = 28 + this.y + 'px';
  }
}

export class MovementTrail {
  // dots is an array of TrailDot objects,
  dots: TrailDot[] = [];
  line: SVGPolylineElement;
  svg: SVGSVGElement;
  maxDots = 12;
  lastPos = [0, 0];

  constructor(parent) {
    this.line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    parent.appendChild(this.svg);
    this.svg.appendChild(this.line);
  }

  draw(pos) {
    const dot = new TrailDot(pos);
    dot.draw();
    this.dots.push(dot);
    if (this.dots.length >= this.maxDots) {
      document.body.removeChild(this.dots.shift().node);
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


