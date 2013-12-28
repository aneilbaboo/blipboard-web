// NOTE: This controller services the iOS client's "about" content.  JKF

exports.about = function(req, res){
  res.render('iphone/about');
};

exports.licenses = function(req, res){
  res.render('iphone/licenses');
};

exports.privacy = function(req, res){
  res.render('iphone/privacy');
};

exports.terms = function(req, res){
  res.render('iphone/terms');
};