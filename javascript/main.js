//Add additional Esri API scripts
dojo.require("esri.map");
dojo.require("esri.arcgis.utils");
dojo.require("dijit.dijit");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.dijit.TimeSlider");

window.currentBat = 0;
window.isPlaying = false;

$(document).ready(function(){
  //Initial layout configuration
  $("#title").html(appData.title);
  $("#subtitle").html(appData.subtitle);
  switchToMainContent();

  //Change application context
  $(".tabs").click(function(){
    if($(this).hasClass("tabs-default1")){
      $(this).addClass("tabs-active1").removeClass("currentTab").removeClass("tabs-default1").addClass("currentTab");
      $(".tabs-active2").addClass("tabs-default2");
      $(".tabs-default2").removeClass("tabs-active2").removeClass("currentTab");
      switchToMainContent();
    }
    else if($(this).hasClass("tabs-default2")){
      $(this).addClass("tabs-active2").removeClass("tabs-default2").addClass("currentTab");
      $(".tabs-active1").addClass("tabs-default1");
      $(".tabs-default1").removeClass("tabs-active1").removeClass("currentTab");
      switchToBatGallery(currentBat);
    }
  });

  $("#playPause").mouseover(function(){
    if($(this).attr("src") === "images/playControls/playDefault.png"){
      $(this).attr("src","images/playControls/playHover.png");
    }
    else{
      $(this).attr("src","images/playControls/pauseHover.png");
    }
  });

  $("#playPause").mouseout(function(){
    if($(this).attr("src") === "images/playControls/playHover.png"){
      $(this).attr("src","images/playControls/playDefault.png");
    }
    else{
      $(this).attr("src","images/playControls/pauseDefault.png");
    }
  });

  $("#playPause").click(function(){
    animate();
    if($(this).attr("src") === "images/playControls/playHover.png"){
      $(this).attr("src","images/playControls/pauseHover.png");
    }
    else{
      $(this).attr("src","images/playControls/playHover.png");
    }
  });

});

dojo.addOnLoad(function(){
  createMap();
});

var createMap = function(){
  var mapDeferred = esri.arcgis.utils.createMap(appData.webmap, "map", {
    mapOptions: {
      slider : true,
      sliderStyle : "small",
      nav : false
    }
  });
  mapDeferred.then(function(response) {
    window.map = response.map;

    //resize the map when the browser resizes
    dojo.connect(dijit.byId('map'), 'resize', map,map.resize);

    dojo.connect(map,"onUpdateEnd",function(){
      playAnimation();
	});

    //add the legend
    var layers = response.itemInfo.itemData.operationalLayers;

    window.timeProperties = response.itemInfo.itemData.widgets.timeSlider.properties;


    if(map.loaded){
      initUI(layers);
      startFade(getLayerByName(map,"time"));
      window.initExtent = map.extent;
    }
    else{
      dojo.connect(map,"onLoad",function(){
        initUI(layers);
        startFade(getLayerByName(map,"time"));
        window.initExtent = map.extent;
      });
    }
  },function(error){
    console.log("Map creation failed: ", dojo.toJson(error));
  });
};

var initUI = function(layers){

  //Add scalebar to map
  var scalebar = new esri.dijit.Scalebar({
    map: map
  });

  //Add timeslider
  var startTime = timeProperties.startTime + 31536000000;
  var endTime = timeProperties.endTime;
  var fullTimeExtent = new esri.TimeExtent(new Date(startTime), new Date(endTime));

  map.setTimeExtent(fullTimeExtent);

  window.timeSlider = new esri.dijit.TimeSlider({
    style: "width: 100%;",
    loop:true
  }, dojo.byId("timeSliderPane"));

  map.setTimeSlider(timeSlider);
  timeSlider.setThumbCount(1);
  timeSlider.setThumbMovingRate(500);
  console.log(timeProperties);
  if(timeProperties.numberOfStops){
    timeSlider.createTimeStopsByCount(fullTimeExtent,timeProperties.numberOfStops);
  }
  else{
    timeSlider.createTimeStopsByTimeInterval(fullTimeExtent,timeProperties.timeStopInterval.interval,timeProperties.timeStopInterval.units);
  }
  //timeSlider.timeStops.splice(0,1);
  //timeSlider.setThumbIndexes([6]);

  dojo.connect(timeSlider,'onTimeExtentChange',function(timeExtent){
    timeSlider.pause();
    if($("#timeSliderPane").children("table").children("tbody").children("tr").children("td").length > 1){
      $("#timeSliderPane").children("table").children("tbody").children("tr").children("td").each(function(){
        if($(this).attr("id") !== "tsTmp"){
          $(this).remove();
        }
      });
    }
    if($(".dijitRuleMark").first().html() === ""){
      $(".dijitRuleMark").each(function(i){
        $(this).html(2006+i);
      });
    }
  });

  timeSlider.startup();

};

var switchToMainContent = function(){
  map.set
  $("#timeControls").show();
  $("#sidePaneContent").html("").append("<div id='mainContent' class='description'><h3 id='mainContentHeader' class='contentHeader'>"+appData.mainContent.heading+"</h3><img id='mainContentImage' class='contentImage' src='"+appData.mainContent.imageURL+"'><p id='mainContentText' class='contentText'>"+appData.mainContent.text+"</p></div>");
  startFade(getLayerByName(map,"time"));
};

var switchToBatGallery = function(bat){
  $("#timeControls").hide();
  $("#sidePaneContent").html("").append("<div class='description'><h3 class='contentHeader'>A gallery of threatened bats</h3><h4 class='speciesHeader'>"+appData.batContent[bat].commonName+"</h4><img class='contentImage' src='"+appData.batContent[bat].imageURL+"'><p class='contentText'>"+appData.batContent[bat].text+"<br><br><a class='readMore' href='"+appData.batContent[bat].linkURL+"' target='_blank'>READ MORE &gt;&gt;</a></p></div>");;
  startFade(getLayerByName(map,["14147","cache"]));
};

//Start animation functions
var animate = function(){
  if (isPlaying === false){
    isPlaying = true;
	playAnimation();
  }
  else{
	isPlaying = false;
	timeSlider.pause();
  }
};

var playAnimation = function() {
  if (isPlaying === true){
    timeSlider.play();
  }
};
//End animation functions

//Layer Fade Functions
var getLayerByName = function(mapVariable,layerName,searchMainLayers,searchGraphicsLayers){
  var layers = [];

  if($.isArray(layerName)){
    dojo.forEach(layerName,function(lyrName){
      if(searchMainLayers !== false){
        dojo.forEach(mapVariable.layerIds,function(lyr){
          if(lyr.toLowerCase().search(lyrName.toLowerCase()) !== -1){
            layers.push(mapVariable.getLayer(lyr));
          }
        });
      }
      if(searchGraphicsLayers !== false){
        dojo.forEach(mapVariable.graphicsLayerIds,function(lyr){
          if(lyr.toLowerCase().search(lyrName.toLowerCase()) !== -1){
            layers.push(mapVariable.getLayer(lyr));
          }
        });
      }
    });
  }
  else{
    if(searchMainLayers !== false){
      dojo.forEach(mapVariable.layerIds,function(lyr){
        if(lyr.toLowerCase().search(layerName.toLowerCase()) !== -1){
          layers.push(mapVariable.getLayer(lyr));
        }
      });
    }
    if(searchGraphicsLayers !== false){
      dojo.forEach(mapVariable.graphicsLayerIds,function(lyr){
        if(lyr.toLowerCase().search(layerName.toLowerCase()) !== -1){
          layers.push(mapVariable.getLayer(lyr));
        }
      });
    }
  }

  return layers;
};

var startFade = function(layers){
  dojo.forEach(getLayerByName(map,"wns",true,false),function(lyr){
    lyr.fading = false;
    if ($.inArray(lyr,layers) !== -1) {
      setTimeout(function() {
        lyr.fading = true;
        fadeLayerIn(map,lyr);
      }, 11);
    }
    else{
      setTimeout(function() {
        lyr.fading = true;
        fadeLayerOut(map,lyr);
      }, 11);
    }
  });
};

var fadeLayerIn = function(mapVariable,layer){
  if(!layer.visible){
    layer.show();
  }
  if(layer.opacity < 1 && layer.fading === true){
    layer.setOpacity(layer.opacity + 0.1);
    setTimeout(function() {
      fadeLayerIn(mapVariable,layer);
    }, 20);
  }
  else{
    layer.setOpacity(1);
    layer.fading = false;
  }
};

var fadeLayerOut = function(mapVariable,layer){
  if(layer.opacity > 0 && layer.fading === true){
    layer.setOpacity(layer.opacity - 0.1);
    setTimeout(function() {
      fadeLayerOut(mapVariable,layer);
    }, 20);
  }
  else{
    layer.setOpacity(0);
    layer.hide();
    layer.fading = false;
  }
};
//Layer fade functions end