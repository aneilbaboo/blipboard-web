if (!window['console']) {
  // hello IE
  window['console'] = {
    dir: function() {},
    log: function() {}
  };
}

require(['require', '../../config'], function (require, config) {
  require(['mains/layouts/default'], function() {
    require([
      'jquery',
      'lib/gmaps',
      'lib/purl',
      'lib/underscore',
      'mains/blips/default.viewModel',
      'lib/text!templates/blipDetail.html',
      'lib/text!templates/channelDetail.html'
    ], function($, gmaps, purl, _, viewModel, blipDetailTemplate, channelDetailTemplate) {
      $(function() {
        // TODO: Need to consider better UX for various errors thrown.
        // Doesn't give the user any feedback at this point.  JKF

        var loadBlip = function(blipId, callback) {
          $.ajax({
            cache: false,
            url: '/api/blips/' + blipId
          }).done(function(response) {
            if (response.error) {
              // TODO: Ummm.  Need something here for positive UX when bad things
              //  are happening on the server.  JKF
              console.log('failed to retrieve blip');
            } else {
              console.log('retrieved blip');
              callback(response);
            }
          });
        };

        var loadChannel = function(channelId, callback) {
          $.ajax({
            cache: false,
            url: '/api/channels/' + channelId
          }).done(function(response) {
            if (response.error) {
              // TODO: Ummm.  Need something here for positive UX when bad things
              //  are happening on the server.  JKF
              console.log('failed to retrieve channel detail');
            } else {
              console.log('retrieved channel detail');
              callback(response);
            }
          });
        };

        var loadChannelBlips = function(channelId, callback) {
          $.ajax({
            cache: false,
            url: '/api/channels/' + channelId + '/blips'
          }).done(function(response) {
            if (response.error) {
              // TODO: Ummm.  Need something here for positive UX when bad things
              //  are happening on the server.  JKF
              console.log('failed to retrieve channel blips');
            } else {
              console.log('retrieved channel blips');
              callback(response);
            }
          });
        };

        var renderChannelDetail = function(channel) {
          var template = _.template(channelDetailTemplate, channel, {variable: 'channel'});
          $("#channelCallout").html(template);
        };


        var url = $.url();
        var blipId = url.param('blip');
        var channelId = url.segment(-1);

        loadChannel(channelId, function(response) {
          var channel = response.channel;

          if (!channel) {
            var msg = 'Failed to retrieve channel. ' +
                      'Server response was 2xx but content was unexpected.';
            throw new Error(msg);
          }

          console.log("Channel loaded:", channel);

          viewModel.channel = channel;

          renderChannelDetail(channel);

          loadChannelBlips(channelId, function(response) {
            var blips = response.blips;

            if (!blips) {
              var msg = 'Failed to retrieve channel blips. ' +
                        'Server response was 2xx but content was unexpected.';
              throw new Error(msg);
            }

            console.log("Channel blips loaded:", blips);
            viewModel.initializeMapWithBlips(blips);
            viewModel.addBlips(blips);

            if (blipId) {
              viewModel.selectBlip(blipId);
            }
          });
        });


      });

    });
  });
});

