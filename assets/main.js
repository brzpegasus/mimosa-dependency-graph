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

  // Toggle label display
  $('#show-labels-checkbox').attr('checked', true).on('change', function() {
    chart.toggleLabels();
  });

  // Switch main view
  Object.keys(data).forEach(function(main, index) {
    $('<li>')
      .append('<span>' + main + '</span>')
      .appendTo('#main-files')
      .click(function() {
        selectMain(main);
      });

    if (index === 0) {
      selectMain(main);
    }
  });

  function selectMain(main) {
    updateStats(main);
    renderGraph(main);
  }

  function updateStats(main) {
    var $mainInfo = $('<span>').attr('class', 'data').text(main);
    var $nodeInfo = $('<span>').attr('class', 'data').text(data[main].nodes.length);
    $('#stats').empty().append('Root Node: ', $mainInfo, ' Total Nodes: ', $nodeInfo);
  }

  function renderGraph(main) {
    chart.draw(data[main]);
  }

}(this));
