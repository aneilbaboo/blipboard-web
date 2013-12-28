var rest = require('restler');

var settings = require('../config').SETTINGS;

var API_USERNAME = process.env.BLIPBOARD_API_USERNAME; // set in ENV
var API_PASSWORD = process.env.BLIPBOARD_API_PASSWORD; // 

exports.getBlip = function(req, res){
  var url = settings.api.clone();
  url.path("/blips/" + req.params.blipId);
  rest.get(url.toString, {
    username: settings.username,
    password: settings.password
  }).on('complete', function(data) {
      res.status(200)
        .set({ 'Content-Type': 'application/json' })
        .send(JSON.stringify(data));
    });
};

exports.getPopularBlips = function(req, res){
  var region = req.param('region'), bounds = req.param('bounds');
  var url = settings.api.clone();
  url.path("/blips/popular");
  
  if( region !== undefined ){
    url.buildQuery({region: region});
  }
  else if( bounds !== undefined ){
    url.buildQuery({bounds: bounds});
  }
  else {
    throw new Error('No region or bounds specified for the request.');
  }

  rest.get(url.toString(), {
    username: settings.username,
    password: settings.password
  }).on('complete', function(data) {
      res.status(200)
        .set({ 'Content-Type': 'application/json' })
        .send(JSON.stringify(data));
    });
};

exports.getChannel = function(req, res){
  var url = settings.api.clone();
  url.path("/channels/" + req.params.channelId);

  rest.get(url.toString(), {
    username: settings.username,
    password: settings.password
  }).on('complete', function(data) {
      res.status(200)
        .set({ 'Content-Type': 'application/json' })
        .send(JSON.stringify(data));
    });
};

exports.getChannelBlips = function(req, res){
  var region = req.param('region'), bounds = req.param('bounds');
  var url = settings.api.clone();
  url.path("/channels/" + req.params.channelId + "/stream");
  

  if( region !== undefined ){
    url.buildQuery({region: region, limit: req.param('limit')});
  }
  else if( bounds !== undefined ){
    url.buildQuery({bounds: bounds, limit: req.param('limit')});
  }
  /*
  // TODO: This is not yet an exceptional condition.  In fact, I believe the API actually doesn't
  //  do anything with bounds or region on the channel blip stream yet.  JKF
  else{
    throw new Error('No region or bounds specified for the request.');
  }
  */

  rest.get(url.toString(), {
    username: settings.username,
    password: settings.password
  }).on('complete', function(data) {
      res.status(200)
        .set({ 'Content-Type': 'application/json' })
        .send(JSON.stringify(data));
    });
};
