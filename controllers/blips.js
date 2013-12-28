var rest = require('restler');
var sprintf = require('sprintf').sprintf;
var URI = require('URIjs');

var settings = require('../config').SETTINGS;

var GOOGLE_MAPS_STATIC_URL = 'http://maps.google.com/maps/api/staticmap';

// Detect iPhone by examining 'User-Agent' header
//
// Returns:
//   boolean
var detectIPhone = function(request) {
  var ua = request.headers['user-agent'] || '';
  return ua.toLowerCase().indexOf('iphone') > -1;
};

// ?
//
// Returns:
//   URL string
var getRequestedUrl = function(request) {
  return request.protocol + '://' + request.get('Host') + request.originalUrl;
};

// Load blip from BB API
//
// Params:
//   blipId - blip ID
//   callback - function(blip)
var loadBlip = function(blipId, callback) {
  var url = settings.api.clone();
  url.path("/blips/" + blipId);
  rest.get(url.toString(), { username: settings.username, password: settings.password}).on('complete', function(response) {
    callback(response.blip);
  });
};

var loadChannel = function(channelId, callback) { 
  var url = settings.api.clone();
  url.path("/channels/" + channelId);
  rest.get(url.toString(), { username: settings.username, password: settings.password}).on('complete', function(response) {
    callback(response.channel);
  });
};

// Build URL for static Google Maps image with
// marker at specified location
//
// Params:
//   latitude
//   longitude
//
// Returns:
//   URL string
var getMapThumbnailUrl = function(latitude, longitude) {
  /*
  // An alternative to avoid encoded comma in 'markers' param
  // May need {|u} filter removed in .dust
  var params = [
    'zoom=16',
    'size=1500x1500',
    'sensor=false',
    'markers=' + latitude + ',' + longitude
  ];
  return GOOGLE_MAPS_STATIC_URL + '?' + params.join('&');
  */
  var url = URI(GOOGLE_MAPS_STATIC_URL);
  url.setSearch({
    zoom: '16',
    size: '200x200',
    sensor: 'false',
    markers: latitude + "," + longitude
  });

  return url.toString();
};

// Build URL for blip thumbnail image
//
// Params:
//   blip
//
// Returns:
//   URL string or null
var getBlipThumbnailUrl = function(blip) {
  var location = blip.place['location'];
  if (location) {
    var lat = location.latitude;
    var lon = location.longitude;
    return getMapThumbnailUrl(lat, lon);
  }

  return null;
};

// Populate model with necessary data
//
// Params:
//   blipId - blip ID
//   callback - function(model)
var prepareModel = function(request, channelId, blipId, callback) {
  var model = {
    title: null,
    description: null,
    thumbnail: null,
    link: getRequestedUrl(request),
    facebook_app_id: settings.facebook.id
  };

  if (blipId) { 
    loadBlip(blipId, function(blip) {
      if (!blip) {
        callback(model);
        return;
      }
      
      console.log("loaded blip: " + blip.id + " author: " + blip.author.name);
      model.title = sprintf("%s's blip at %s", blip.author.name, blip.place.name);
      model.description = sprintf("Blipboard alerts you when %s's blips are nearby. Get the free iPhone app.", blip.author.name);
      
      var thumbnail = URI(blip.place.picture);
      thumbnail.query({type: 'large'});
      //model.thumbnail = request.protocol + '://' + request.get('Host') + "/thumbnail/" + blipId;
      model.thumbnail = thumbnail.toString();
      
      callback(model);
    });
  }
  else if (channelId) { 
    loadChannel(channelId, function(channel) {
      if (!channel) {
        callback(model);
        return;
      }
      
      console.log("loaded channel: " + channel.id + " name: " + channel.name);
      model.title = sprintf("%s's Blipboard", channel.name);
      model.description = sprintf("Blipboard alerts you when %s's blips are nearby. Get the free iPhone app.", channel.name);

      var thumbnail = URI(channel.picture);
      thumbnail.query({type: 'large'});
      model.thumbnail = thumbnail.toString();
      
      callback(model);
    });
  }
  else {
    callback(model);
  }
};

// Get view for given request
//
// Params:
//   request
//
// Returns:
//   view name string
var getView = function(request) {
  return detectIPhone(request) ? 'blips/iphone' : 'blips/default';
};

var handleRequest = function(request, response) {
  var blipId = request.query.blip;
  var channelId = request.params.channelId;
  var view = getView(request);
  console.log('View:', view);
  console.log(sprintf("request: %s blipId=%s channelId=%s", request.originalUrl, blipId, channelId));

  prepareModel(request, channelId, blipId, function(model) {
    console.log('Model:', JSON.stringify(model, null, 1));
    response.render(view, model);
  });
};

var handleThumbnail = function(request, response) {
  var blipId = request.params.blipId;
  if (blipId) { 
    loadBlip(blipId, function(blip) { 
      if (blip) { 
        var url = getBlipThumbnailUrl(blip);
        console.log("retrieve: " + url);
        if (url) { 
          rest.get(url, {decoding: 'buffer'}).on('complete', function(data) {
            console.log("retrieved : " + data.length);
            response.type('png');
            response.header("Content-Length", data.length);
            response.end(data, 'binary');
          });
        }
      }
    });
  }
};

exports.default = handleRequest;
exports.thumbnail = handleThumbnail;

