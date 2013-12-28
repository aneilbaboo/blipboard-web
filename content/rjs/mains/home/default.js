require(['require', '../../config'], function (require, config) {
  require(['mains/layouts/default'], function() {
    require(['jquery'], function($) {
      $(function() {
        console.log( 'Executing => rjs/mains/home/default' );
      });
    });
  });
});