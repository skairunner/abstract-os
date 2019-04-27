import * as Random from 'rng';
import * as palettes from 'd3-scale-chromatic';

export function get_rel_coords(event) {
  let rect = event.currentTarget.getBoundingClientRect();
  return {x: event.pageX - rect.left, y: event.pageY - rect.top}
}

const THUMB_PIXEL = 5;
let pattern_memo = new Map();
export function generate_mempattern(w, h, seed, pixelsize=5) {
  const hash = seed;
  const key = `${w}_${h}_${hash}`;
  if (pattern_memo.has(key)) {
    return pattern_memo.get(key);
  }
  const rng = new Random.MT(hash);
  const color = seed === 0 ? '#777' : palettes.schemeSet3[rng.range(0, 11) % 12];

  // Mirror a smaller pixel pattern, then blow it up pixelsize amount times
  const small_w = Math.floor(w / pixelsize);
  const small_h = Math.floor(h / pixelsize);
  // Calc offsets
  const paddingX = Math.floor((w % pixelsize) / 2);
  const paddingY = Math.floor((h % pixelsize) / 2);
  let smallpixels = Array.from(small_w * small_h);
  for (let y = 0; y < small_h; y++) {
    for (let x = 0; x < small_w; x++) {
      if (x < Math.ceil(small_w / 2.0)) {
        // Up to halfway point, place pixels
        smallpixels[x + y * small_w] = rng.uniform() < 0.5;
      } else {
        // otherwise, mirror pixels
        smallpixels[x + y * small_w] = smallpixels[small_w - x - 1 + y * small_w];
      }
    }
  }

  // Special case seed == 0, just fill it with true
  if (seed === 0)
    smallpixels.fill(true);

  // for debug purposes
  // let matrix = [];
  // for (let y = 0; y < small_y; y++) {
  //   matrix.push(smallpixels.slice(y * small_x, small_x + y * small_x).map(d => d ? '1' : '0').join(''));
  // }
  // console.log(seed);
  // console.log(matrix.join('\n'));

  let canvas = document.createElement('canvas');
  let mini = document.createElement('canvas'); // For the 'thumbnail' version
  canvas.width = w;
  canvas.height = h;
  mini.width = small_w * THUMB_PIXEL;
  mini.height = small_h * THUMB_PIXEL;
  let ctx = canvas.getContext('2d');
  let mini_ctx = mini.getContext('2d');
  // Fill thumbnail
  mini_ctx.fillStyle = color;
  mini_ctx.fillRect(0, 0, THUMB_PIXEL * small_w, THUMB_PIXEL * small_h);
  mini_ctx.fillStyle = 'white';
  // Fill the entire canvas bc. there may be non-pixel spaces that still need color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'white';
  for (let y = 0; y < small_h; y++) {
    for (let x = 0; x < small_w; x++) {
      if (!smallpixels[x + y * small_w]) {
        // Spots that should be empty are painted white
        ctx.fillRect(paddingX + x * pixelsize, paddingY + y * pixelsize, pixelsize, pixelsize);
        mini_ctx.fillRect(x * THUMB_PIXEL, y * THUMB_PIXEL, THUMB_PIXEL, THUMB_PIXEL);
      }
    }
  }

  // Memoize and return
  let imgurl = canvas.toDataURL();
  let thumburl = mini.toDataURL();
  let pattern = {
    imgurl, color, thumburl,
    imgdim: {w, h},
    thumbdim: {w: small_w * THUMB_PIXEL, h: small_h * THUMB_PIXEL},
    key
  };
  pattern_memo.set(key, pattern);
  return pattern;
}

// Just apply colors from schemeCategory10 by remainder pid
export function color_from_pid(pid) {
  return palettes.schemeCategory10[pid % 4];
}

// Find the max element in a, applying the transform to every element
export function arrmax(a, transform= d => d) {
  return a.reduce((prev, curr) => transform(curr) > transform(prev) ? curr : prev);
}

export function arrsum(a) {
  return a.reduce((accum, v) => accum + v);
}