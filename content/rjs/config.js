define(['require'], function () {
  require.config({
    config: {
      // App config values go here.
    },
    baseUrl: '/content/rjs',
    paths : {
      mains: './mains',
      lib: './lib',
      model: './model',
      templates: './templates'
    },
    shim: {
      'lib/underscore': {
        exports: '_'
      }
    },
    waitSeconds: 15
  });
});
