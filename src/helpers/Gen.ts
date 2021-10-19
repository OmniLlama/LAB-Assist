import {IMG_EXT, IMG_DIR} from './Vals';

export function Img(fileName: string, id: string = null, className: string = null, dirOverride: string = null, extOverride: string = null) {
  const img = document.createElement('img');
  img.src = `${(dirOverride ?? IMG_DIR) + fileName + (extOverride ?? IMG_EXT)}`;
  img.id = id ?? `${fileName}-img`;
  if (className) {
    img.className = className;
  }
  return img;
}

export function Div(id = null, className = null) {
  const div = document.createElement('div');
  if (id) {
    div.id = id;
  }
  if (className) {
    div.className = className;
  }
  return div;
}

export function SubImg(parent, src: string, className: string = null) {
  const img = Img(src, `${parent.id}-img`, className);
  parent.appendChild(img);
  return img;
}
