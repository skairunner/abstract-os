import React from 'react';
import * as d3scale from 'd3-scale';
import * as d3color from 'd3-color';
import * as d3shape from 'd3-shape';
import './Trendlines.css';

/**
 * Draws a simple line graph for data.
 * @param {Array} data - The data to render, in tuples of (time, value)
 * @param {string} [caption] - The title of the trendline.
 * @param {Array} domain - The X axis's domain, as a tuple.
 * **/
export default function Trendline(props) {
  // Destructuring to set defaults for missing values
  const {
    stroke = '#000',
    stroke_width = 1,
    padding_h = 0,
    padding_w = 0,
    unit = ''
  } = props;

  const areacolor = d3color.color(stroke);
  areacolor.opacity = 0.1;

  const limitX = props.width - 2 * padding_w;
  const limitY = props.height - 2 * padding_h;
  const scaleX = d3scale.scaleLinear(props.domain, [1, limitX]);
  const scaleY = d3scale.scaleLinear(props.absolute ? props.valdomain : [0, 1], [limitY, 1]);
  const line = d3shape.line()
    .x(d => scaleX(d[0]))
    .y(d => scaleY(d[1]));
  const area = d3shape.area()
    .x(d => scaleX(d[0]))
    .y0(d => scaleY(d[1]))
    .y1(limitY);


  let datum;
  if (props.absolute) datum = (<figcaption>{props.data.length !== 0 ? props.data[props.data.length - 1][1] : 0}{unit}</figcaption>)
  else datum = (<figcaption>{props.data.length !== 0 ? Math.floor(props.data[props.data.length - 1][1] * 100) : 0}{unit}</figcaption>)


  return (
    <figure className='Trendline'>
      <svg width={props.width} height={props.height}>
        <g transform={`translate(${padding_w}, ${padding_h})`}>
        <rect className='boundary' stroke={stroke} width={limitX} height={limitY} />
          <path d={ area(props.data) } fill={areacolor.toString()} />
          <path className='trendline_line' d={ line(props.data) } fill='transparent' stroke={stroke} strokeWidth={stroke_width}/>
        </g>
      </svg>
      <figcaption>{props.caption}</figcaption>
      {datum}
    </figure>
  )
}