import React from 'react';
import * as d3scale from 'd3-scale';
import * as d3shape from 'd3-shape';
import './RelTrendline.css';

/**
 * Draws a simple line graph for relative data.
 * @param {Array} data - The data to render, in tuples of (time, value)
 * @param {string} [caption] - The title of the trendline.
 * @param {Array} domain - The X axis's domain, as a tuple.
 * **/
export default function RelTrendline(props) {
  // Destructuring to set defaults for missing values
  const {
    stroke = '#000',
    stroke_width = 1,
    padding_h = 0,
    padding_w = 0
  } = props;

  const limitX = props.width - 2 * padding_w;
  const limitY = props.height - 2 * padding_h;
  const scaleX = d3scale.scaleLinear(props.domain, [0, limitX]);
  const scaleY = d3scale.scaleLinear([0, 1], [limitY, 0]);
  const line = d3shape.line()
    .x(d=> scaleX(d[0]))
    .y(d => scaleY(d[1]));

  return (
    <figure className='relTrendline'>
      <svg width={props.width} height={props.height}>
        <g transform={`translate(${padding_w}, ${padding_h})`}>
          <line className='boundary' x1='0' y1='0' x2={limitX} y2='0' />
          <line className='boundary' x1='0' y1={limitY} x2={limitX} y2={limitY} />
          <path d={ line(props.data) } fill='transparent' stroke={stroke} strokeWidth={stroke_width}/>
        </g>
      </svg>
      <figcaption>{props.caption}</figcaption>
    </figure>
  )
}