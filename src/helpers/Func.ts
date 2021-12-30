export class Collision {
  static collide(el1, el2) {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    return !(
      rect1.top > rect2.bottom ||
      rect1.right < rect2.left ||
      rect1.bottom < rect2.top ||
      rect1.left > rect2.right
    );
  }

  static inside(el1, el2) {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    return (
      rect1.top <= rect2.bottom && rect1.bottom >= rect2.top && rect1.left <= rect2.right && rect1.right >= rect2.left
    );
  }
}

export function normalizeVector(v1, v2, zeroCheck: boolean = false): [number, number] {
  const v = vectorMagnitude(v1, v2);
  if (zeroCheck) {
    return [v1 === 0 ? 0 : v1 / v, v2 === 0 ? 0 : v2 / v];
  } else {
    return [v1 / v, v2 / v];
  }
}

export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

export function decToBin(dec) {
  return (dec >>> 0).toString(2);
}

export function vectorMagnitude(v1, v2): number {
  return Math.sqrt(v1 ** 2 + v2 ** 2);
}

export function numberToPitchString(n: number): string {
  const noteLetter = n % 12;
  const noteOctave = Math.floor(n / 12) - 1;
  let str = '';
  switch (noteLetter) {
    case 0:
      str = 'C';
      break;
    case 1:
      str = 'C#';
      break;
    case 2:
      str = 'D';
      break;
    case 3:
      str = 'D#';
      break;
    case 4:
      str = 'E';
      break;
    case 5:
      str = 'F';
      break;
    case 6:
      str = 'F#';
      break;
    case 7:
      str = 'G';
      break;
    case 8:
      str = 'G#';
      break;
    case 9:
      str = 'A';
      break;
    case 10:
      str = 'A#';
      break;
    case 11:
      str = 'B';
      break;
    default:
      break;
  }
  str += noteOctave;
  return str;
}

export function pitchNumToFrequency(pitchNum: number): number {
  const baseFreq = 440;
  const nice = 69;
  const temperament = 2 ** (1 / 12);
  return baseFreq * temperament ** -(nice - pitchNum);
}

