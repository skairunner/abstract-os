// A d3-like scale that acts somewhat like band but with variable band size
// Inputs is array of tuples(key, share of output range). Adapted from d3-scale/band.js
export default function proportionalScale(inputs, range) {

  // Set state variables
  let paddingInner = 0,
    order = {},
    output = {},
    inputs_dict = {},
    sum = 0,
    step = 0,
    r0 = range[0],
    r1 = range[1];

  let scale = d => output[d] * step + step * order[d] * paddingInner;

  scale.paddingInner = padding => {
    if (typeof padding === 'undefined')
      return paddingInner;
    paddingInner = padding;
    return scale;
  };

  function rescale() {
    let reverse = r1 < r0,
      start = reverse ? r1 : r0,
      stop = reverse ? r0 : r1;
    step = (stop - start) / Math.max(1, sum - paddingInner);
  }

  scale.bandwidth = d => inputs_dict[d] * step;

  for (let i = 0; i < inputs.length; i++) {
    const key = inputs[i][0] + "";
    const num = inputs[i][1];
    order[key] = i;
    output[key] = sum;
    inputs_dict[key] = num;
    sum += num;
  }

  rescale();
  return scale;
}