// convert Google Maps into an AMD module
define(['lib/async!https://maps.googleapis.com/maps/api/js?key=AIzaSyDwMD2amzphR5WnOrqK8VKzuEoDk4tG5G4&sensor=false'],
    function(){
        // return the gmaps namespace for brevity
        return window.google.maps;
    });
