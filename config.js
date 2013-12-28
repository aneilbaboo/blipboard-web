var URI = require('URIjs');

/** Web Server Configuration */
exports.SETTINGS = {
  username: process.env.BLIPBOARD_API_USERNAME,
  password: process.env.BLIPBOARD_API_PASSWORD,
  
  api: process.env.BLIPBOARD_API_URL ? URI(process.env.BLIPBOARD_API_URL) : URI("http://localhost:3000"),

  facebook: { 
    id: process.env.FACEBOOK_BLIPBOARD_ID || "153522578006450"
  },

  port: process.env.PORT || "3000"
};
