import React from 'react';
import * as d3scale from 'd3-scale';
import * as d3shape from 'd3-shape';
import './RelTrendline.css';

/**
 * Draws a simple line graph for relative data.
 * @param {list} data - The data to render.
 * @param {string} [caption] - The title of the trendline.
 * **/
export default function RelTrendline(props) {
  // Destructuring to set defaults for missing values
  const {
    stroke = '#000',
    stroke_width = 1,
    padding_h = 0,
    padding_w = 0,
    elements = 10, /* How much space to reserve for line segments.
    * If there are not enough elements, the line will start at the
    * left and end somewhere in the middle.
    * If there are at least 10 elements, the last 10 will be selected
    * and rendered, filling the entire graph from left to right.
    */
  } = props;

  const limitX = props.width - 2 * padding_w;
  const limitY = props.height - 2 * padding_h;
  const scaleX = d3scale.scaleLinear([0, elements], [0, limitX]);
  const scaleY = d3scale.scaleLinear([0, 1], [limitY, 0]);
  const line = d3shape.line()
    .x((d, i)=> scaleX(i))
    .y((d) => scaleY(d));

  return (
    <figure className='relTrendline'>
      <svg width={props.width} height={props.height}>
        <g transform={`translate(${padding_w}, ${padding_h})`}>
          <line class='boundary' x1='0' y1='0' x2={limitX} y2='0' />
          <line class='boundary' x1='0' y1={limitY} x2={limitX} y2={limitY} />
          <path d={ line(props.data.slice(-10)) } fill='transparent' stroke={stroke} strokeWidth={stroke_width}/>
        </g>
      </svg>
      <figcaption>{props.caption}</figcaption>
    </figure>
  )
}