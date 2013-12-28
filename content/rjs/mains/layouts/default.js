require(['require', '../../config'], function (require, config) {
  require(['jquery'], function($) {
    $(function() {
      console.log( 'Executing => rjs/mains/layouts/default' );

      if (navigator.userAgent.toLowerCase().indexOf('iphone') > -1) {
        var updateIPhoneLayout = function() {
          console.log('Updating iPhone layout');

          var windowHeight = window.innerHeight;
          if ('standalone' in window.navigator &&
              !window.navigator.standalone) {
            var addressBarHeight = 60;
            windowHeight += addressBarHeight;
          }

          // gmap needs a height here
		  $('#mapContainer').css('height', windowHeight + 'px');

          // top:50% did not work for this
		  $('#spinner').css('top', (windowHeight / 2) + 'px' );

          // hides address bar
          setTimeout(function() {
            window.scrollTo(0, 1);
          }, 50);
        };

        $(window).on('orientationchange', updateIPhoneLayout);
        updateIPhoneLayout();
      }

      var _gaq = _gaq || [];
      _gaq.push(['_setAccount', 'UA-27249537-1']);
      _gaq.push(['_trackPageview']);

      (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
      })();

    });
  });
});
