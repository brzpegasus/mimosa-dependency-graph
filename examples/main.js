(function(window) {
  "use strict";

  var data = window.data;
  var DependencyGraph = window.DependencyGraph;

  var graph = DependencyGraph({ data: data });
  graph();

}(this));
