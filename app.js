var express = require('express');
var app = express();

var dust = require('dustjs-linkedin');
var cons = require('consolidate');
var path = require('path');

var controllers = require('./controllers');
var settings = require('./config').SETTINGS;

var app = express();

app.engine('dust', cons.dust);
// NOTE: Prevent dust from compressing all whitespace out of
//  the rendered template (screws up <pre> tags).  JKF
dust.optimizers.format = function(ctx, node) { return node };   

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'dust');
  app.use(express.favicon(__dirname + '/content/images/favicon.png', { maxAge: 2592000000 }));
  app.use(app.router);
  app.use('/content', express.static(path.join(__dirname, 'content')));
});

// TODO: Real error handling?!  JKF
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.send(500, 'Something broke!');
});



app.get('/', controllers.home.default);
app.get('/press', controllers.press.default);
app.get('/privacy', controllers.privacy.default);
app.get('/team', controllers.team.default);
app.get('/terms', controllers.terms.default);


// NOTE: The following routes service the iOS client's "about" content.  JKF
// TODO: These should really be changed to something like /client/ios/ so that
//  it's more obvious that these are special URLs only used by the client and
//  not a specialized version of the whole site specifically targeting the 
//  iPhone browser.  JKF
app.get('/iphone/about', controllers.iphone.about);
app.get('/iphone/licenses', controllers.iphone.licenses);
app.get('/iphone/privacy', controllers.iphone.privacy);
app.get('/iphone/terms', controllers.iphone.terms);

// NOTE: The following routes are used to wrap the BB REST API to enable
//  support for anonymous access.  JKF
app.get('/api/blips/popular', controllers.api.getPopularBlips);
app.get('/api/blips/:blipId', controllers.api.getBlip);
app.get('/api/channels/:channelId/blips', controllers.api.getChannelBlips);
app.get('/api/channels/:channelId', controllers.api.getChannel);

app.get('/thumbnail/:blipId', controllers.blips.thumbnail);

// NOTE: The following routes are for UI to display content from the core
//  Blipboard app.  JKF
// NOTE: I think this is just a convenience route in case you know the author id
// of the blip.
app.get('/blips', controllers.blips.default);
// NOTE: This is the route that we want to use and publish (optimized for good
//  SEO).  JKF
app.get('/:channelId', controllers.blips.default);

app.set('port', settings.port);
app.listen(app.get('port'), function() {
  console.log('Listening on port '+app.get('port'));
});
