(function(window) {

  'use strict';

  var d3 = window.d3;

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

      // Zooming (with mouse wheel, ctrl + dblclick / shift + dblclick, or panning gestures)
      var zoom = d3.behavior.zoom()
        .scaleExtent([1, 8])
        .on('zoom', function() {
          chart.baseGroup.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
        });

      this.baseGroup = this.base
        .call(zoom)
        .append('g');

      // Force-directed layout
      this.force = d3.layout.force()
        .linkDistance(80)
        .charge(-300)
        .on('tick', function() {
          chart.base.selectAll('.link').attr('d', function(d) {
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
          chart.base.selectAll('.node').attr('transform', function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
          });
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
            return this.attr('marker-end', 'url(#end)');
          }
        }
      });

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
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .attr('class', 'arrow');

          marker.append('path')
            .attr('d', 'M0,-5L10,0L0,5');

          return marker;
        },
        events: {
          enter: function() {
            return this;
          }
        }
      });

      // Node layer -- each node represents a module in the dependency graph
      this.layer('nodes', this.baseGroup.append('g'), {
        dataBind: function(data) {
          return this.selectAll('.node').data(data.nodes);
        },
        insert: function() {
          var chart = this.chart();

          var node = this.append('g')
            .attr('class', 'node')
            .on('touchstart', function() {
              d3.event.stopPropagation();
            })
            .on('mousedown', function() {
              d3.event.stopPropagation();
            })
            .call(chart.force.drag);

          node.append('circle')
            .attr('r', 5);

          return node;
        },
        events: {
          enter: function() {
            return this.append('text')
              .attr('x', 12)
              .attr('dy', '.35em')
              .text(function(d) {
                return d.filename;
              });
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
      var sup = this.constructor.__super__;
      sup.draw.call(this, data);

      this.base
        .attr('width', this._width)
        .attr('height', this._height);

      this.force
        .nodes(data.nodes)
        .links(data.links)
        .size([this._width, this._height])
        .start();
    },

    /**
     * Transforms the data into a format that is expected by the layers.
     * @param {Object} data The data to transform.
     * @returns {Object} The transformed data.
     */
    transform: function(data) {
      // Simple pass-through for now
      return data;
    },

    /**
     * Resizes the graph and restarts the force layout simulation.
     * @param {int} width The new width.
     * @param {int} height The new height.
     * @returns {void}
     */
    resize: function(width, height) {
      this._width = width || this._width;
      this._height = height || this._height;

      this.base
        .attr('width', this._width)
        .attr('height', this._height);

      this.force
        .size([this._width, this._height])
        .resume();
    }
  });
}(this));
