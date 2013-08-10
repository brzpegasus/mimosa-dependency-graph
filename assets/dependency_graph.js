(function(window) {

  'use strict';

  var d3 = window.d3;

  /**
   * Moves an element to the front by making it the last child.
   */
  d3.selection.prototype.moveToFront = function() {
    return this.each(function() {
      this.parentNode.appendChild(this);
    });
  };

  /**
   * Returns a number whose value is limited to the given range.
   */
  function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
  }

  /**
   * DependencyGraph object.
   *
   * Uses a force-directed layout to help visualize the code dependencies
   * that make up a Mimosa application.
   */
  d3.chart('DependencyGraph', {

    initialize: function() {
      var chart = this;

      this._width = this.base.attr('width') || window.innerWidth;
      this._height = this.base.attr('height') || window.innerHeight;
      this._showLabels = false;
      this._sizeCirclesByDependents = false;

      this.baseNodeRadius = 6;
      this.maxNodeRadius = 25;

      // Zooming (with mouse wheel, dblclick / shift + dblclick, or panning gestures)
      var zoom = d3.behavior.zoom()
        .scaleExtent([1, 8])
        .on('zoom', function() {
          chart.baseGroup.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
        });

      this.baseGroup = this.base.call(zoom).append('g');

      this.force = d3.layout.force();

      // Arrow layer -- shows the directionality of the dependencies
      this.layer('arrows', this.baseGroup.append('defs'), {
        dataBind: function(data) {
          return this.selectAll('marker').data(['end']);
        },
        insert: function() {
          var marker = this.append('marker')
            .attr('id', String)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', -1.5)
            .attr('markerWidth', 5)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .attr('class', 'arrow');

          marker.append('path')
            .attr('d', 'M0,-5L10,0L0,5');

          return marker;
        }
      });

      // Link layer -- defines the path elements that join the different nodes
      this.layer('links', this.baseGroup.append('g'), {
        dataBind: function(data) {
          return this.selectAll('path').data(data.links);
        },
        insert: function() {
          return this.append('path').attr('class', 'link');
        },
        events: {
          enter: function() {
            return this
              .attr('data-source', function(d) { return d.source; })
              .attr('data-target', function(d) { return d.target; })
              .attr('marker-end', 'url(#end)');
          },
          merge: function() {
            return this.style('opacity', 0);
          },
          'merge:transition': function() {
            return this.duration(500).style('opacity', 1);
          },
          'exit:transition': function() {
            return this.duration(500).style('opacity', 0).remove();
          }
        }
      });

      // Node layer -- each node represents a module in the dependency graph
      this.layer('nodes', this.baseGroup.append('g'), {
        dataBind: function(data) {
          return this.selectAll('.node')
            .data(data.nodes, function(d) {
              return d.filename;
            });
        },
        insert: function() {
          var node = this.append('g')
            .attr('class', 'node')
            .on('touchstart', function() {
              d3.event.stopPropagation();
            })
            .on('mousedown', function() {
              d3.event.stopPropagation();
            })
            .call(chart.force.drag);

          return node;
        },
        events: {
          enter: function() {
            this.attr('id', function(d) { return d.id; });

            this.append('circle')
              .attr('class', function(d) {
                return d.main ? 'main' : !d.children.length ? 'leaf' : '';
              })
              .on('mouseover', function(d) {
                chart.highlightNode(d);
              })
              .on('mouseout', function(d) {
                chart.unhighlightNode(d);
              });

            this.append('text')
              .attr('dy', '.35em')
              .attr('class', function(d) {
                return d.main ? 'main' : '';
              })
              .classed('hidden', !chart._showLabels)
              .text(function(d) {
                return d.basename || d.filename;
              });

            return this;
          },
          merge: function() {
            // Size the circles according to the number of child or parent nodes
            this.select('circle')
              .attr('r', function(d) {
                return chart.getNodeRadius(d);
              });

            // Set the x coordinate of the label based on the size of the circle
            this.select('text')
              .attr('x', function(d) {
                return 5 + chart.getNodeRadius(d);
              });

            return this.style('opacity', 0);
          },
          'merge:transition': function() {
            return this.duration(500).style('opacity', 1);
          },
          'exit:transition': function() {
            return this.duration(500).style('opacity', 0).remove();
          }
        }
      });
    },

    /**
     * Renders the graph with the given data set. This will redraw
     * all the layers that make up the graph.
     * @param {Object} data The data to render.
     * @returns {void}
     */
    draw: function(data) {
      this.data = data;

      var sup = this.constructor.__super__;
      sup.draw.call(this, data);

      this.base
        .attr('width', this._width)
        .attr('height', this._height);

      this.force
        .size([this._width, this._height])
        .nodes(data.nodes)
        .links(data.links)
        .linkDistance(40)
        .friction(0.5)
        .gravity(clamp(data.nodes.length * 0.01, 0.1, 0.7))
        .charge($.proxy(function(d) {
          return -(this.getNodeRadius(d) * 130);
        }, this))
        .on('tick', $.proxy(this.onTick, this))
        .start();
    },

    /**
     * Transforms the data into a format that is expected by the layers.
     * @param {Object} data The data to transform.
     * @returns {Object} The transformed data.
     */
    transform: function(data) {
      if (data.processed) {
        return data;
      }

      data.nodes.forEach(function(node) {
        if (node.main) {
          node.x = this._width / 2;
          node.y = this._height / 4;
          node.fixed = true;
        }
        node.id = node.filename.replace(/\//g, '-');
        node.basename = node.filename.replace(/.*\//, '')
        node.parents = [];
        node.children = [];
      }, this);

      data.links.forEach(function(link) {
        var sourceNode = data.nodes[link.source];
        var targetNode = data.nodes[link.target];

        sourceNode.children.push(link.target);
        targetNode.parents.push(link.source);
      });

      data.processed = true;

      return data;
    },

    /**
     * Updates the position of nodes and links at each step of the
     * force layout simulation.
     * @returns {void}
     */
    onTick: function() {
      this.base.selectAll('.link')
        .attr('d', function(d) {
          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy);
          return 'M' +
              d.source.x + ',' +
              d.source.y + 'A' +
              dr + ',' + dr + ' 0 0,1 ' +
              d.target.x + ',' +
              d.target.y;
        });

      this.base.selectAll('.node')
        .attr('transform', function(d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        });
    },

    /**
     * Returns the radius of a node from the given data point.
     * @param {Object} d The node data point
     * @returns {int}
     */
    getNodeRadius: function(d) {
      var r = this._sizeCirclesByDependents ? d.parents.length : d.children.length;
      return this.baseNodeRadius + clamp(r, 0, this.maxNodeRadius);
    },

    /**
     * Sizes the circles based on the number of dependents a file has
     * instead of the number of dependencies.
     * @param {boolean} value Whether to switch to this view
     * @returns {void}
     */
    sizeCirclesByDependents: function(value) {
      this._sizeCirclesByDependents = value;
      this.draw(this.data);
    },

    /**
     * Resizes the graph and restarts the force layout simulation.
     * @param {int} width The new width.
     * @param {int} height The new height.
     * @returns {void}
     */
    resize: function(width, height) {
      var oldWidth = this._width,
          oldHeight = this._height;

      this._width = width || oldWidth;
      this._height = height || oldHeight;

      this.base
        .attr('width', this._width)
        .attr('height', this._height);

      this.force
        .size([this._width, this._height])
        .start();
    },

    /**
     * Toggles the display of node labels.
     * @returns {void}
     */
    toggleLabels: function() {
      this._showLabels = !this._showLabels;
      this.base.selectAll('text').classed('hidden', !this._showLabels);
    },

    /**
     * Highlight the node specified by the given data element
     * as well as any related parents and children.
     * @param {Object} d The node data element
     * @return {void}
     */
    highlightNode: function(d) {
      var sel = d3.select('#' + d.id);
      sel.moveToFront();
      sel.classed('focused', true);

      var selText = d3.select('#' + d.id + ' text');
      selText.text(d.filename);
      if (!this._showLabels) {
        selText.classed('hidden', false);
      }

      this.force.links().forEach(function(link) {
        if (link.source.id === d.id) {
          d3.select('#' + link.target.id).classed('focused-child', true);
          d3.selectAll('.link[data-source="' + link.source.index + '"]').classed('focused-child', true);
        } else if (link.target.id === d.id) {
          d3.select('#' + link.source.id).classed('focused-parent', true);
          d3.selectAll('.link[data-target="' + link.target.index + '"]').classed('focused-parent', true);
        }
      });
    },

    /**
     * Unhighlight the node specified by the given data element
     * as well as any related parents and children.
     * @param {Object} d The node data element
     * @return {void}
     */
    unhighlightNode: function(d) {
      d3.select('#' + d.id).classed('focused', false);

      var selText = d3.select('#' + d.id + ' text');
      selText.text(d.basename);
      if (!this._showLabels) {
        selText.classed('hidden', true);
      }

      d3.selectAll('.focused-child').classed('focused-child', false);
      d3.selectAll('.focused-parent').classed('focused-parent', false);
    }
  });
}(this));
