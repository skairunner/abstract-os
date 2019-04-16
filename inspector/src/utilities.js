import * as Random from 'rng';
import * as palettes from 'd3-scale-chromatic';

export function get_rel_coords(event) {
  let rect = event.currentTarget.getBoundingClientRect();
  return {x: event.pageX - rect.left, y: event.pageY - rect.top}
}

let pattern_memo = new Map();
export function generate_mempattern(w, h, seed, pixelsize=5) {
  const hash = seed;
  const key = `${w}_${h}_${hash}`;
  if (pattern_memo.has(key)) {
    return pattern_memo.get(key);
  }
  const rng = new Random.MT(hash);
  const color = palettes.schemeSet3[rng.range(0, 11) % 12];
  // Mirror a smaller pixel pattern, then blow it up pixelsize amount times
  const small_x = Math.floor(w / pixelsize);
  const small_y = Math.floor(h / pixelsize);
  let smallpixels = Array.from(small_x * small_y);
  for (let y = 0; y < small_y; y++) {
    for (let x = 0; x < small_x; x++) {
      if (x < Math.ceil(small_x / 2.0)) {
        // Up to halfway point, place pixels
        smallpixels[x + y * small_x] = rng.uniform() < 0.5;
      } else {
        // otherwise, mirror pixels
        smallpixels[x + y * small_x] = smallpixels[small_x - x - 1 + y * small_x];
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
  canvas.width = w;
  canvas.height = h;
  let ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = color;
  for (let y = 0; y < small_y; y++) {
    for (let x = 0; x < small_x; x++) {
      if (smallpixels[x + y * small_x]) {
        // True, put a pixel
        ctx.fillRect(x * pixelsize, y * pixelsize, pixelsize, pixelsize);
      }
    }
  }
  // Memoize and return
  let imgurl = canvas.toDataURL();
  pattern_memo.set(key, imgurl);
  return imgurl;
}