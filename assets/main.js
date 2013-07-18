(function(window) {
  "use strict";

  var data = window.MIMOSA_DEPENDENCY_DATA;
  var DependencyGraph = window.DependencyGraph;

  var graph = DependencyGraph({ data: data });
  graph();

}(this));
