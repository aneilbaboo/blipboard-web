define(['lib/gmaps', 'lib/underscore', 'jquery', 'lib/text!templates/blipCallout.html'],
  function(gmaps, _, $, blipCalloutTemplate) {
    var viewModel = {};

    viewModel.detectPhone = function() {
      return navigator.userAgent.toLowerCase().indexOf('iphone') > -1;
    };

    viewModel.initializeMap = function(data) {
      var self = this;

      var mapOptions = {
        center: data.center,
        zoom: data.zoom || 18,
		disableDefaultUI: true,
        mapTypeId: data.mapTypeId || gmaps.MapTypeId.ROADMAP
      };

      self.map = new gmaps.Map(document.getElementById('mapCanvas'), mapOptions);
      if (self.detectPhone()) {
        var $map = $(self.map.getDiv());
        $map.click(function() {
          if (self.selectedBlip) {
            self.selectedBlip.blipPin.deselect();
          }
        });
      }

      if (data.bounds) {
        this.map.fitBounds(data.bounds);
      }

      this.blips = new BlipCollection();
    };

    viewModel.initializeMapWithBlip = function(blip) {
      var data = {};
      data.center = new gmaps.LatLng(blip.place.location.latitude, blip.place.location.longitude);

      this.initializeMap(data);
    };

    viewModel.initializeMapWithBlips = function(blips) {
      var data = {};
      data.bounds = viewModel.findBounds(blips);

      this.initializeMap(data);
    };

    viewModel.initializeMapWithChannel = function(channel) {
      console.log('viewModel.initializeMapWithChannel:', channel);
      var data = {};
      var location = channel.location;
      if (location) {
         data.center = new gmaps.LatLng(location.latitude, location.longitude);
      }
      this.initializeMap(data);
    };

    viewModel.assertInitialized = function(errorMessage) {
      if (this.map === undefined) {
        errorMessage = errorMessage || 'The ViewModel cannot be used because it has not been initialized.';
        throw new Error(errorMessage);
      }
    };

    viewModel.addBlip = function(blip, selected) {
      var self = this;

      self.assertInitialized();

      if (self.blips.contains(blip)) {
        return;
      }

      self.blips.add(blip, selected);

      blip.blipPin = new viewModel.BlipPin({
        blip: blip,
        map: self.map
      });

      // Track selected blip and ensure a single blip selected
      blip.blipPin.onSelectionChange(function(selected) {
        if (selected) {
          if (self.selectedBlip) {
            self.selectedBlip.blipPin.deselect();
          }

          self.selectedBlip = blip;

          // hide the address bar if scrolled into view by callout drag down
          if (viewModel.detectPhone()) {
            window.scrollTo(0, 1);
          }

          console.log('viewModel: selected blip change', self.selectedBlip);
        } else {
          if (self.selectedBlip === blip) {
            self.selectedBlip = null;
            console.log('viewModel: selected blip change', self.selectedBlip);
          }
        }

        // Styling of selected/unselected pins
        var cls = 'blipSelected';
        var $map = $(self.map.getDiv());
        if (self.selectedBlip) {
          $map.addClass(cls);
        } else {
          $map.removeClass(cls);
        }
      });

      blip.blipPin.show();

      if (selected) {
        self.selectBlip(blip.id);
      }
    };

    viewModel.addBlips = function(blips) {
      var self = this;

      self.assertInitialized();

      for (var i = 0; i < blips.length; i++) {
        self.addBlip(blips[i]);
      }
    };

    viewModel.selectBlip = function(blipId) {
      console.log('viewModel.selectBlip(', blipId, ')');

      this.assertInitialized();

      var newSelected = this.blips[blipId];

      if (!newSelected) {
        throw new Error('The specified blip does not exist.')
      }

      newSelected.blipPin.select();
    };

    viewModel.findBounds = function(blips) {
      // helps establish maximum zoom level (degrees)
      var padding = .001;

      var latMin = null;
      var latMax = null;
      var lonMin = null;
      var lonMax = null;

      for (var i = 0; i < blips.length; i++) {
        var loc = blips[i].place.location;

        // start with first blip location plus padding
        if (i === 0) {
          latMin = loc.latitude;
          latMax = loc.latitude;
          lonMin = loc.longitude;
          lonMax = loc.longitude;
        } else {
          latMin = Math.min(latMin, loc.latitude);
          latMax = Math.max(latMax, loc.latitude);
          lonMin = Math.min(lonMin, loc.longitude);
          lonMax = Math.max(lonMax, loc.longitude);
        }
      }

      // no blips or get-bounds-from-blips failed
      if (typeof latMin != 'number' ||
          typeof latMax != 'number' ||
          typeof lonMin != 'number' ||
          typeof lonMax != 'number') {

        var sf = {
          latMin:37.76,
          latMax:37.78,
          lonMin:-122.47,
          lonMax:-122.41
        };

        // TODO do better?
        // default to SF coords
        latMin = sf.latMin;
        latMax = sf.latMax;
        lonMin = sf.lonMin;
        lonMax = sf.lonMax;
      }

      return new gmaps.LatLngBounds(
        new gmaps.LatLng(latMin - padding, lonMin - padding),
        new gmaps.LatLng(latMax + padding, lonMax + padding)
      );
    };

    function BlipCollection(data) {
      // Init
      var self = this;
      self.constructor = viewModel.BlipCollection;
      data = data || {};

      // Private Members

      // Private Methods

      // Public Members

      // Privileged Public Methods
      self.add = function(blip) {
        if (self[blip.id]) {
          //throw new Error('The specified blip already exists in the collection.')
          return false; // whatever
        }
        self[blip.id] = blip;
        return true;
      };

      self.contains = function(blip) {
        return self.hasOwnProperty(blip['id']);
      };
    };

    viewModel.BlipCollection = BlipCollection;
    // Prototype Public Methods

    function BlipPin(data) {
      // Init
      var self = this;
      self.constructor = viewModel.BlipPin;
      data = data || {};

      // NOTE: Establish bi-directional linkage between blip and blipPin.  JKF
      data.blip.blipPin = self;

      // Private Members
      var _channelMarker = null;
      var _bubbleMarker = null;
      var _blipPinMapOverlay = null;

      // Private Methods

      // Public Members
      self.blip = data.blip;
      self.map = data.map;

      // Privileged Public Methods
      /*
      self.show = function(){
        var location = new gmaps.LatLng(self.blip.place.location.latitude, self.blip.place.location.longitude);
        _channelMarker = new gmaps.Marker({
          position: location,
          map: self.map,
          icon: '/content/images/assets/blipper_person.png',
          title: self.blip.author.name
        });

        // TODO: Yeah, this is broken.  Position of markers should be relative based on screen
        //  position, not lat/lon.  Breaks at other zoom levels.  JKF
        var bubbleLocation =
          new gmaps.LatLng(self.blip.place.location.latitude + .00005,
            self.blip.place.location.longitude + .00009);

        _bubbleMarker = new gmaps.Marker({
          position: bubbleLocation,
          map: self.map,
          icon: '/content/images/assets/icn_blip_left_orange.png',
          title: self.blip.message
        });
      };
      */

      var selectionChangeCallback = function() {};

      self.show = function() {
        console.log('BlipPin.show()');
        _blipPinMapOverlay = new BlipPinMapOverlay({
          blip: self.blip,
          map: self.map
        });
        _blipPinMapOverlay.onSelectionChange(function(selected) {
          selectionChangeCallback(selected);
        });
      };

      self.select = function() {
        console.log('BlipPin.select() for', self.blip.id);
        _blipPinMapOverlay.select();
      };

      self.deselect = function() {
        console.log('BlipPin.deselect() for', self.blip.id);
        _blipPinMapOverlay.deselect();
      };


      self.onSelectionChange = function(callback) {
        selectionChangeCallback = callback;
      };
    };

    viewModel.BlipPin = BlipPin;
    // Prototype Public Methods

    var BlipCallout = function(blip) {
      console.log('new BlipCallout(', blip, ')');

      var self = {};

      var template = _.template(blipCalloutTemplate);

      var el = null;

      self.dateToString = function(date) {
        if (!date) {
          return '';
        }

        var diff = (new Date()).getTime() - date.getTime();
        var week = 1000 * 60 * 60 * 24 * 7;
        if (diff > week) {
          return date.toLocaleDateString();
        } else {
          var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
            'Thursday', 'Friday', 'Saturday'];
          return weekdays[date.getDay()];
        }
      };

      var urlRx = new RegExp('http[s]?://[^\\s]+');

      self.render = function() {
        el = document.createElement('div');
        el.className = 'blipCalloutContainer';
        el.style['display'] = 'none';

        el.innerHTML = template({
          blip: blip,
          blipTime: self.dateToString(new Date(blip.createdTime))
        });

        // replace URLs with links
        var $blipText = $('.blipText', el);
        blipText = $blipText.html();
        blipText = blipText.replace(urlRx, function(match) {
          return '<a href="' + match + '" target="_blank">' + match + '</a>';
		});
		$blipText.get(0).innerHTML = blipText;

        var closeButton = $('.closeButton', el);
        closeButton.click(function() {
          self.hide();
          closeCallback();
        });

        return el;
      };

      var closeCallback = function() {};

      self.show = function() {
        console.log('BlipCallout.show()');
        el.style['display'] = '';
      };

      self.hide = function() {
        console.log('BlipCallout.hide()');
        el.style['display'] = 'none';
      };

      self.isHidden = function() {
        return el.style['display'] === 'none';
      };

      self.toggle = function() {
        if (self.isHidden()) {
          self.show();
        } else {
          self.hide();
        }
      };

      self.onClose = function(callback) {
        closeCallback = callback;
      };

      return self;
    };

    function BlipPinMapOverlay(data) {
      console.log('BlipPinMapOverlay(', data, ')');

      var self = this;

      self.constructor = viewModel.BlipPinMapOverlay;

      self.selected = false;
      self.selectionChangeCallback = function() {};

      self.blip = data['blip'];
      self.map = data['map'];
      self.setMap(self.map);

      var place = self.blip.place;
      var location = place.location;
      self.location = new gmaps.LatLng(location.latitude, location.longitude);

      self.bubbleImageUrl = '/content/images/assets/icn_blip_left_orange@2x.png';
      self.bubbleIconUrl = null;
      if (self.blip.topics && self.blip.topics.length > 0) {
        self.bubbleIconUrl = self.blip.topics[0]['picture2x'];
      }

      self.channelImageUrl = self.blip.author.picture;

      self.el = null;

      self.callout = null;
    };

    BlipPinMapOverlay.prototype = new google.maps.OverlayView();

    // Prototype Public Methods
    BlipPinMapOverlay.prototype.onAdd = function() {
      console.log('BlipPinMapOverlay.onAdd()');

      var self = this;

      // Note: an overlay's receipt of onAdd() indicates that
      // the map's panes are now available for attaching
      // the overlay to the map via the DOM.

      // Create the DIV and set some basic attributes.
      self.el = document.createElement('div');
      self.el.style.position = "absolute";
      self.el.style.width = '60px';
      self.el.style.height = '60px';
      // shift the logical center to grey icon base
      self.el.style['margin-left'] = '14px';
      self.el.style['margin-top'] = '-34px';

      // Prevent click event propagating to map elements underneath
      $(self.el).click(function(e) {
        console.log('MapOverlay.click');
        var ownChild = false;
        var parent = e.target;
        while (parent) {
          if (parent === self.el) {
            ownChild = true;
            break;
          }
          parent = parent.parentNode;
        }

        if (!ownChild || e.target === self.canvas) {
          if (e['stopPropagation']) {
            e.stopPropagation();
          }
          return false;
        }
      });

      // TODO: can we get away with good ole <img> tags?
      self.canvas = document.createElement('canvas');
      self.canvas.className = 'blipPin';

      // TODO needs precise non-rectangular hit area
      self.canvas.style['cursor'] = 'pointer';

      $(self.canvas).click(function() {
        self.toggleSelected();
      });

      // double the res for retina screens
      self.canvas.setAttribute('width', 120);
      self.canvas.setAttribute('height', 132);
      self.canvas.style.position = 'absolute';
      self.canvas.style.width = '60px';
      self.canvas.style.height = '66px';

      self.el.appendChild(self.canvas);

      self.renderImages();
      self.updateCallout();

      // We add an overlay to a map via one of the map's panes.
      // We'll add this overlay to the overlayImage pane.
      var panes = self.getPanes();
      panes.overlayLayer.appendChild(self.el);
    };

    BlipPinMapOverlay.prototype.draw = function() {

      // Size and position the overlay. We use a southwest and northeast
      // position of the overlay to peg it to the correct position and size.
      // We need to retrieve the projection from this overlay to do this.
      var overlayProjection = this.getProjection();

      /* Google example
      // Retrieve the southwest and northeast coordinates of this overlay
      // in latlngs and convert them to pixels coordinates.
      // We'll use these coordinates to resize the DIV.
      var sw = overlayProjection.fromLatLngToDivPixel(this.bounds.getSouthWest());
      var ne = overlayProjection.fromLatLngToDivPixel(this.bounds.getNorthEast());

      // Resize the image's DIV to fit the indicated dimensions.
      var div = this.div;
      div.style.left = sw.x + 'px';
      div.style.top = ne.y + 'px';
      div.style.width = (ne.x - sw.x) + 'px';
      div.style.height = (sw.y - ne.y) + 'px';
      */
      var center = overlayProjection.fromLatLngToDivPixel(this.location);

      this.el.style.left = (center.x - this.el.offsetWidth/2) + 'px';
      this.el.style.top = (center.y - this.el.offsetHeight/2) + 'px';
    };

    BlipPinMapOverlay.prototype.onRemove = function() {
      this.el.parentNode.removeChild(this.div);
      this.el = null;
    };

    // Note that the visibility property must be a string enclosed in quotes
    BlipPinMapOverlay.prototype.hide = function() {
      if (this.el) {
        this.el.style.visibility = 'hidden';
      }
    };

    BlipPinMapOverlay.prototype.show = function() {
      console.log('BlipPinMapOverlay.show()');
      if (this.el) {
        this.el.style.visibility = 'visible';
      }
    };

    BlipPinMapOverlay.prototype.toggle = function() {
      if (this.el) {
        if (this.el.style.visibility === 'hidden') {
          this.show();
        } else {
          this.hide();
        }
      }
    };

    BlipPinMapOverlay.prototype.toggleDOM = function() {
      if (this.getMap()) {
        this.setMap(null);
      } else {
        this.setMap(this.map);
      }
    };

    BlipPinMapOverlay.prototype.updateCallout = function() {
      var self = this;

      if (!self.el) {
        return;
      }

      if (!self.callout) {
        self.callout = new BlipCallout(self.blip);

        self.callout.onClose(function() {
          self.deselect();
        });

        var parentEl = self.el;
        if (viewModel.detectPhone()) {
          parentEl = document.body;
        }

        parentEl.appendChild(self.callout.render());
      }

      if (self.selected) {
        self.callout.show();
      } else {
        self.callout.hide();
      }
    };

    BlipPinMapOverlay.prototype.showCallout = function() {
      this.updateCallout();
    };

    BlipPinMapOverlay.prototype.hideCallout = function() {
      this.updateCallout();
    };

    BlipPinMapOverlay.prototype.renderImages = function() {
      var self = this;

      if (!self.canvas) {
        return;
      }

      var $canvas = $(self.canvas);
      var selectedCls = 'selected';
      if (self.selected) {
        $canvas.addClass(selectedCls);
      } else {
        $canvas.removeClass(selectedCls);
      }

      var ctx = self.canvas.getContext('2d');
      ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

      // Draw Channel Composite
      var channelCompositeDrawn = false;
      var drawChannelComposite = function() {
        if (!channelCompositeDrawn && channelImageLoaded && channelFrameLoaded) {
          ctx.drawImage(channelFrame, 0, 60);
          ctx.drawImage(channelImage, 5, 65, 45, 45);
          channelCompositeDrawn = true;
          drawBubble();
        }
      };

      var channelImageLoaded = false;
      var channelImage = new Image();
      channelImage.onload = function(e) {
        channelImageLoaded = true;
        drawChannelComposite();
      };
      if (self.channelImageUrl) {
        channelImage.src = self.channelImageUrl;
      } else {
        channelImageLoaded = true;
        drawChannelComposite();
      }

      var channelFrameLoaded = false;
      var channelFrame = new Image();
      channelFrame.onload = function(e) {
        channelFrameLoaded = true;
        drawChannelComposite();
      };
      channelFrame.src = '/content/images/assets/blipper_frame@2x.png';

      // Draw Bubble Composite
      var bubbleDrawn = false;
      var drawBubble = function() {
        if (self.selected && !viewModel.detectPhone()) {
          return;
        }

        if (channelCompositeDrawn &&
            bubbleIconLoaded &&
            bubbleLoaded &&
            !bubbleDrawn) {
          ctx.drawImage(bubbleImage, 24, 0);
          ctx.drawImage(bubbleIconImage, 46, 20);
          bubbleDrawn = true;
        }
      };
      var bubbleIconImage = new Image();
      var bubbleIconLoaded = false;
      bubbleIconImage.onload = function() {
        bubbleIconLoaded = true;
        drawBubble();
      };
      if (self.bubbleIconUrl) {
        bubbleIconImage.src = self.bubbleIconUrl;
      } else {
        // no icon? done!
        bubbleIconLoaded = true;
        drawBubble();
      }

      var bubbleImage = new Image();
      var bubbleLoaded = false;
      bubbleImage.onload = function() {
        bubbleLoaded = true;
        drawBubble();
      };
      bubbleImage.src = self.bubbleImageUrl;
    };

    BlipPinMapOverlay.prototype.select = function() {
      this.selected = true;
      this.selectionChangeCallback(this.selected);

      this.renderImages();
      this.showCallout();
    };

    BlipPinMapOverlay.prototype.deselect = function() {
      this.selected = false;
      this.selectionChangeCallback(this.selected);

      this.renderImages();
      this.hideCallout();
    };

    BlipPinMapOverlay.prototype.toggleSelected = function() {
      if (this.selected) {
        this.deselect();
      } else {
        this.select();
      }
    };

    BlipPinMapOverlay.prototype.onSelectionChange = function(callback) {
      this.selectionChangeCallback = callback;
    };

    // Attach to model
    viewModel.BlipPinMapOverlay = BlipPinMapOverlay;

    return viewModel;
  }
);

