(function(window) {
  "use strict";

  var randomizeLinkWeight = function(links) {
    links.forEach(function(link) {
      link.weight = Math.random();
    });
  };

  var generateLabelAnchors = function(nodes) {
    var anchorNodes = [],
        anchorLinks = [];

    nodes.forEach(function(node, i) {
      anchorNodes.push({ node : node }, { node : node });
      anchorLinks.push({
        source : i * 2,
        target : i * 2 + 1,
        weight : 1
      });
    });

    return {
      nodes: anchorNodes,
      links: anchorLinks
    };
  };

  window.DependencyGraph = function(options) {
    options = options || {};

    var dependencyData = options.data || {};
    var labelAnchorData = generateLabelAnchors(dependencyData.nodes);

    randomizeLinkWeight(data.links);

    var d3 = window.d3,
        scale = options.scale || 1,
        width = options.width || 800,
        height = options.height || 500,
        layers = {};

    var svg = d3.select('body').append('svg');

    // Dependency nodes
    layers.nodes = function(force) {
      var nodes = svg.selectAll('g.node').data(force.nodes());

      nodes.enter()
        .append('g')
        .append('circle')
        .attr('r', function(d) {
          return (d.index === 0 ? 8 : 5) * scale;
        })
        .attr('class', function(d) {
          return (d.index === 0 ? 'mainNode' : 'node');
        })
        .call(force.drag);
      
      return nodes;
    };

    // Dependency links
    layers.links = function(force) {
      var links = svg.selectAll('line.link').data(force.links());

      links.enter().append('line').attr('class', 'link');

      return links;
    }

    // Label anchor nodes
    layers.labelAnchorNodes = function(force) {
      var anchorNodes = svg.selectAll('g.anchorNode').data(force.nodes());

      var enteringAnchorNodes = anchorNodes.enter()
        .append('g').attr('class', 'anchorNode');

      enteringAnchorNodes.append('circle').attr('r', 0);

      enteringAnchorNodes.append('text')
        .text(function(d, i) {
          return i % 2 === 0 ? '' : d.node.label;
        })
        .attr('class', 'label');

      return anchorNodes;
    }

    // Label anchor links
    layers.labelAnchorLinks = function(force) {
      return svg.selectAll('line.anchorLink').data(force.links());
    }

    function graph() {
      var dependencyForce = d3.layout.force()
        .size([width, height])
        .gravity(0.05)
        .charge(-300 * scale)
        .linkDistance(50 * scale)
        .nodes(data.nodes)
        .links(data.links)
        .start();

      var labelAnchorForce = d3.layout.force()
        .size([width, height])
        .gravity(0)
        .charge(-100 * scale)
        .linkDistance(15 * scale)
        .linkStrength(8)
        .nodes(labelAnchorData.nodes)
        .links(labelAnchorData.links)
        .start();

      var links = layers.links(dependencyForce);
      var nodes = layers.nodes(dependencyForce);
      var anchorLinks = layers.labelAnchorLinks(labelAnchorForce);
      var anchorNodes = layers.labelAnchorNodes(labelAnchorForce);

      dependencyForce.on('tick', function() {
        var updateLinks = function() {
          this.attr('x1', function(d) { return d.source.x; })
              .attr('y1', function(d) { return d.source.y; })
              .attr('x2', function(d) { return d.target.x; })
              .attr('y2', function(d) { return d.target.y; });
        }

        var updateNodes = function() {
          this.attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
          });
        }

        labelAnchorForce.start();

        nodes.call(updateNodes);

        anchorNodes.each(function(d, i) {
          if (i % 2 === 0) {
            d.x = d.node.x;
            d.y = d.node.y;
          } else {
            var b = this.childNodes[1].getBBox();

            var diffX = d.x - d.node.x;
            var diffY = d.y - d.node.y;

            var dist = Math.sqrt(diffX * diffX + diffY * diffY);

            var shiftX = b.width * (diffX - dist) / (dist * 2);
            shiftX = Math.max(-b.width, Math.min(0, shiftX));
            var shiftY = 5;
            this.childNodes[1].setAttribute('transform', 'translate(' + shiftX + ',' + shiftY + ')');
          }
        });

        anchorNodes.call(updateNodes);

        links.call(updateLinks);
        anchorLinks.call(updateLinks);
      });
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

    graph.width(width);
    graph.height(height);

    svg.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    return graph;
  };
}(this));
