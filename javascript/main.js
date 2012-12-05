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

    dojo.connect(map,"onUpdateEnd",function(){
      playAnimation();
	});

    //add the legend
    var layers = response.itemInfo.itemData.operationalLayers;

    window.timeProperties = response.itemInfo.itemData.widgets.timeSlider.properties;


    if(map.loaded){
      initUI(layers);
    }
    else{
      dojo.connect(map,"onLoad",function(){
        initUI(layers);
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
  var startTime = timeProperties.startTime;
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
  if(timeProperties.numberOfStops){
    timeSlider.createTimeStopsByCount(fullTimeExtent,timeProperties.numberOfStops);
  }
  else{
    timeSlider.createTimeStopsByTimeInterval(fullTimeExtent,timeProperties.timeStopInterval.interval,timeProperties.timeStopInterval.units);
  }
  timeSlider.setThumbIndexes([6]);

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
        $(this).html(2005+i);
      });
    }
  });

  timeSlider.startup();

};

var switchToMainContent = function(){
  $("#sidePaneContent").html("").append("<div id='mainContent' class='description'><h3 id='mainContentHeader' class='contentHeader'>"+appData.mainContent.heading+"</h3><img id='mainContentImage' class='contentImage' src='"+appData.mainContent.imageURL+"'><p id='mainContentText' class='contentText'>"+appData.mainContent.text+"</p></div>");
};

var switchToBatGallery = function(bat){
  $("#sidePaneContent").html("");
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