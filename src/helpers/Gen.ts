import {IMG_END, IMG_SRC} from './Vals';

export function Img(name, sourceOverride = null, endOverride = null) {
  const img = document.createElement('img');
  img.src = `${(sourceOverride ?? IMG_SRC) + name + (endOverride ?? IMG_END)}`;
  img.id = `${name}-img`;
  return img;
}
export function Div(id, className= '') {
  const div = document.createElement('div');
  div.id = id;
  div.className = className;
  return div;
}
