(function(window) {

  'use strict';

  var data = window.MIMOSA_DEPENDENCY_DATA;

  // Create a new DependencyGraph instance
  var chart = d3.select('#chart')
    .append('svg')
    .attr('width', window.innerWidth)
    .attr('height', window.innerHeight)
    .chart('DependencyGraph');

  // Handle window resizing
  d3.select(window).on('resize', function() {
    chart.resize(window.innerWidth, window.innerHeight);
  });

  // Render the chart
  chart.draw(data);

}(this));
