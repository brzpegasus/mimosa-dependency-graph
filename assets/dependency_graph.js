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
        .on('zoom', function() {
          chart.baseGroup.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
        });
      this.baseGroup = this.base.call(zoom).append('g');

      // Force-directed layout
      this.force = d3.layout.force();

      // Arrow layer -- shows the directionality of the dependencies
      this.layer('arrows', this.baseGroup.append('defs'), {
        dataBind: function(data) {
          return this.selectAll('marker').data(['end']);
        },
        insert: function() {
          var marker = this.append('marker')
            .attr('id', String)
            .attr('viewBox', '0 -3 6 6')
            .attr('refX', 5)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .attr('class', 'arrow');

          marker.append('path')
            .attr('d', 'M0,-2L5,0L0,2');

          return marker;
        }
      });

      // Link layer -- defines the paths that join the different nodes
      this.layer('links', this.baseGroup.append('g'), {
        dataBind: function(data) {
          return this.selectAll('path').data(data.links);
        },
        insert: function() {
          return this.append('path').attr('class', 'link');
        },
        events: {
          enter: function() {
            return this.attr('marker-end', 'url(#end)');
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
            .on('touchstart', function() { d3.event.stopPropagation(); })
            .on('mousedown', function() { d3.event.stopPropagation(); })
            .call(chart.force.drag);

          return node;
        },
        events: {
          enter: function() {
            this.append('circle')
              .classed('main', function(d) {
                return d.main;
              })
              .on('mouseover', function(d) {
                chart.showFullLabel(d);
              })
              .on('mouseout', function(d) {
                if (chart._focusedNode !== d) {
                  chart.hideFullLabel(d);
                }
              })
              .on('click', function(d) {
                chart.toggleNodeFocus(d);
              });

            this.append('text')
              .attr('dy', '.35em')
              .classed('main', function(d) {
                return d.main;
              })
              .classed('hidden', !chart._showLabels)
              .text(function(d) {
                return d.basename;
              });

            return this;
          },
          merge: function() {
            this.select('circle')
              .attr('r', function(d) {
                return chart.getNodeRadius(d);
              });

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
      this.resetFocus();

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

      data.nodes.forEach(function(node, idx) {
        if (idx === 0) {
          node.x = this._width / 2;
          node.y = this._height / 4;
          node.fixed = true;
          node.main = true;
        }
        node.basename = node.filename.replace(/.*\//, '')
        node.parents = [];
        node.children = [];
      }, this);

      data.links.forEach(function(link) {
        var sourceNode = data.nodes[link.source];
        var targetNode = data.nodes[link.target];

        sourceNode.children.push(targetNode.filename);
        targetNode.parents.push(sourceNode.filename);
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
        .attr('d', $.proxy(function(d) {
          var tightness = -4.0;

          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = Math.sqrt(dx * dx + dy * dy),
              qx = d.source.x + dx / 2.0 - dy / tightness,
              qy = d.source.y + dy / 2.0 + dx / tightness;

          var dqx = d.target.x - qx,
              dqy = d.target.y - qy,
              qr = Math.sqrt(dqx * dqx + dqy * dqy);

          var offset = this.getNodeRadius(d.target),
              tx = d.target.x - dqx / qr * offset,
              ty = d.target.y - dqy / qr * offset;

          return 'M' + d.source.x + ',' + d.source.y +
            'Q' + qx + ',' + qy + ' ' + tx + ',' + ty;

        }, this));

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
     * @param {int} width The new width
     * @param {int} height The new height
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
      this.base.selectAll('text')
        .filter(function(d) {
          return !d3.select(this).classed('focused');
        })
        .classed('hidden', !this._showLabels);
    },

    /**
     * Shows the full filename for a given node.
     * @param {Object} d The data point for the node
     * @return {void}
     */
    showFullLabel: function(d) {
      var node = this.base.selectAll('.node')
        .filter(function(n) { return n === d; })
        .moveToFront();

      var text = node.select('text')
        .text(d.filename)
        .classed('full-text', true)
        .style('opacity', 1);

      if (!this._showLabels) {
        text.classed('hidden', false);
      }
    },

    /**
     * Hides the full filename for a given node.
     * @param {Object} d The data point for the node
     * @return {void}
     */
    hideFullLabel: function(d) {
      var node = this.base.selectAll('.node')
        .filter(function(n) { return n === d; });

      var text = node.select('text')
        .text(d.basename)
        .classed('full-text', false);

      if (this._focusedNode && !text.classed('focused') &&
          !text.classed('focused-parent') && !text.classed('focused-child')) {
        text.style('opacity', 0);
      }

      if (!this._showLabels) {
        text.classed('hidden', true);
      }
    },

    /**
     * Toggles the focus for the given node.
     * @param {Object} d The data point for the node
     * @returns {void}
     */
    toggleNodeFocus: function(d) {
      var oldFocusedNode = this._focusedNode;

      this.resetFocus();

      if (d === oldFocusedNode) {
        return;
      }

      this._focusedNode = d;
      this.showFullLabel(d);

      // Highlight the selected node and all direct parents/children,
      // and fade all other nodes.
      this.base.selectAll('.node').each(function(n) {
        var sel = d3.select(this);
        if (n === d) {
          sel.selectAll('circle, text').classed('focused', true);
        } else if (d.parents.indexOf(n.filename) > -1) {
          sel.selectAll('circle, text').classed('focused-parent', true);
        } else if (d.children.indexOf(n.filename) > -1) {
          sel.selectAll('circle, text').classed('focused-child', true);
        } else {
          sel.selectAll('circle').style('opacity', 0.2);
          sel.selectAll('text').style('opacity', 0);
        }
      });

      // Hide all unrelated links
      this.base.selectAll('.link')
        .filter(function(l) {
          return l.source !== d && l.target !== d;
        })
        .style('opacity', 0);
    },

    /**
     * Resets the graph, removing focus from all nodes.
     * @returns {void}
     */
    resetFocus: function() {
      if (!this._focusedNode) {
        return;
      }

      this.hideFullLabel(this._focusedNode);
      this.base.selectAll('circle, text').classed('focused focused-parent focused-child', false);
      this.base.selectAll('circle, text, .link').style('opacity', 1);

      this._focusedNode = null;
    }
  });
}(this));
