(function(window) {
  "use strict";

  window.data = {
    nodes: [
      { label: 'main' },
      { label: 'app/repo-view' },
      { label: 'jquery' },
      { label: 'lodash' },
      { label: 'moment' },
      { label: 'templates' },
      { label: 'vendor/handlebars' }
    ],
    links: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 1, target: 3 },
      { source: 1, target: 4 },
      { source: 1, target: 5 },
      { source: 5, target: 6 }
    ]
  };

}(this));
