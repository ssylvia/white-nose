//Add Additional Esri API Scripts
dojo.require("esri.map");
dojo.require("esri.arcgis.utils");
dojo.require("dijit.dijit");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");

$(document).ready(function(){
    $("#title").html(appData.title);
    $("#subtitle").html(appData.subtitle);
});

dojo.addOnLoad(function(){
  createMap();
});

var createMap = function(){
  var mapDeferred = esri.arcgis.utils.createMap(appData.webmap, "map", {
    mapOptions: {
      extent : new esri.geometry.Extent({"xmin":-15291242.010989934,"ymin":540184.1574534695,"xmax":-6192178.163924971,"ymax":8602150.404745435,"spatialReference":{"wkid":102100}}),
      slider : true,
      sliderStyle : "small",
      nav : false
    }
  });
  mapDeferred.then(function(response) {
    window.map = response.map;

    //resize the map when the browser resizes
    dojo.connect(dijit.byId('map'), 'resize', map,map.resize);

    //add the legend
    var layers = response.itemInfo.itemData.operationalLayers;
    if(map.loaded){
      //initMap(layers);
    }
    else{
      dojo.connect(map,"onLoad",function(){
        //initMap(layers);
      });
    }
  },function(error){
    console.log("Map creation failed: ", dojo.toJson(error));
  });
};