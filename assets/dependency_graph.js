(function(window) {
  "use strict";

  window.DependencyGraph = function(options) {
    options = options || {};

    var d3 = window.d3,
        data = options.data || {},
        scale = options.scale || 1,
        width = options.width || 960,
        height = options.height || 500,
        layers = {};

    var svg = d3.select("body").append("svg");

    layers.nodes = function(force) {
      var nodes = svg.selectAll(".node")
        .data(force.nodes())
        .enter().append("g")
          .attr("class", "node")
          .call(force.drag);

      nodes.append("circle").attr("r", 5);

      nodes.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        .text(function(d) { return d.filename; });

      return nodes;
    };

    layers.links = function(force) {
      svg.append("svg:defs").selectAll("marker")
        .data(["end"])
        .enter().append("svg:marker")
          .attr("id", String)
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 20)
          .attr("refY", -1.5)
          .attr("markerWidth", 6)
          .attr("markerHeight", 6)
          .attr("orient", "auto")
          .attr("class", "arrow")
        .append("svg:path")
          .attr("d", "M0,-5L10,0L0,5");

      var links = svg.append("svg:g").selectAll("path")
        .data(force.links())
        .enter().append("svg:path")
          .attr("class", "link")
          .attr("marker-end", "url(#end)");

      return links;
    }

    function graph() {
      var force = d3.layout.force()
        .nodes(data.nodes)
        .links(data.links)
        .size([width, height])
        .linkDistance(80 * scale)
        .charge(-300 * scale)
        .on("tick", tick)
        .start();

      var links = layers.links(force);
      var nodes = layers.nodes(force);

      function tick() {
        links.attr("d", function(d) {
          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy);
          return "M" + 
              d.source.x + "," + 
              d.source.y + "A" + 
              dr + "," + dr + " 0 0,1 " + 
              d.target.x + "," + 
              d.target.y;
        });

        nodes.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });
      }
    }

    graph.scale = function(newScale) {
      if (!arguments.length) {
        return scale;
      }
      scale = newScale;
      return this;
    };

    graph.width = function(newWidth) {
      if (!arguments.length) {
        return width;
      }
      width = newWidth;
      svg.attr("width", width);
      return this;
    };

    graph.height = function(newHeight) {
      if (!arguments.length) {
        return height;
      }
      height = newHeight;
      svg.attr("height", height);
      return this;
    };

    graph.scale(scale);
    graph.width(width);
    graph.height(height);

    svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    return graph;
  };
}(this));
