import React from 'react';
import * as d3scale from 'd3-scale';
import * as d3shape from 'd3-shape';

/*
props should include 'data' as an array of values from 0 to 1.
Must also specify height/width. Other parameters are optional
*/
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

  const scaleX = d3scale.scaleLinear([0, elements], [0, props.width - 2 * padding_w]);
  const scaleY = d3scale.scaleLinear([0, 1], [props.height - 2 * padding_h, 0]);
  const line = d3shape.line()
    .x((d, i)=> scaleX(i))
    .y((d) => scaleY(d));

  return (
  <svg width={props.width} height={props.height}>
    <g transform={`translate(${padding_w}, ${padding_h})`}>
      <path d={ line(props.data.slice(-10)) } fill='transparent' stroke={stroke} strokeWidth={stroke_width}/>
    </g>
  </svg>
  )
}