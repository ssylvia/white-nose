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

$(window).resize(function(){
  $("#loader").css("left",($(window).width() - 30)/2).css("top",($(window).height() - 30)/2);
  if($(window).width() <= 1250){
    $("#time-legend-pane").css("padding-left","5px");
    if(navigator.userAgent.match(/iPad/i) === null){
      $("#batGallery").css("margin-top","5px");
    }
  }
  else{
    $("#time-legend-pane").css("padding-left","55px");
    $("#batGallery").css("margin-top","12px");
  }
  $("#timeControls").width($("#controlsPane").width() - 35);
});

$(document).ready(function(){
  //Initial layout configuration
  $("#title").html(appData.title);
  $("#subtitle").html(appData.subtitle);

  $("#loader").css("left",($(window).width() - 30)/2).css("top",($(window).height() - 30)/2);

  if($(window).width() <= 1250){
    $("#time-legend-pane").css("padding-left","5px");
    if(navigator.userAgent.match(/iPad/i) === null){
      $("#batGallery").css("margin-top","5px");
    }
  }

  $("#timeControls").width($(window).width() - 385);

  //Change application context
  $(".tabs").click(function(){
    if($(this).hasClass("tabs-default1")){
      switchToMainContent();
    }
    else if($(this).hasClass("tabs-default2")){
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

  window.initExtent = new esri.geometry.Extent({"xmin":-10909244.175728686,"ymin":3322571.907834641,"xmax":-6359712.252196205,"ymax":7006225.174952875, "spatialReference":{"wkid":102100}});

  var lods = [
    {"level" : 0, "resolution" : 19567.8792409999, "scale" : 7.3957190948944E7},
  	{"level" : 1, "resolution" : 9783.93962049996, "scale" : 3.6978595474472E7},
    {"level" : 2, "resolution" : 4891.96981024998, "scale" : 1.8489297737236E7},
    {"level" : 3, "resolution" : 2445.98490512499, "scale" : 9244648.868618},
    {"level" : 4, "resolution" : 1222.99245256249, "scale" : 4622324.434309}
  ];

  var mapDeferred = esri.arcgis.utils.createMap(appData.webmap, "map", {
    mapOptions: {
      extent : initExtent,
      slider : true,
      sliderStyle : "small",
      showAttribution : false,
      nav : false,
      wrapAround180 : true,
      lods : lods
    }
  });
  mapDeferred.then(function(response) {
    window.map = response.map;

    //resize the map when the browser resizes
    dojo.connect(dijit.byId('map'), 'resize', map,map.resize);

    dojo.connect(map,"onUpdateEnd",function(){
      playAnimation();
       $("#loader").fadeOut();
	});

    //add the legend
    var layers = response.itemInfo.itemData.operationalLayers;

    window.timeProperties = response.itemInfo.itemData.widgets.timeSlider.properties;


    if(map.loaded){
      initUI(layers);
      startFade(getLayerByName(map,"time"));
      switchToMainContent();
    }
    else{
      dojo.connect(map,"onLoad",function(){
        initUI(layers);
        startFade(getLayerByName(map,"time"));
        switchToMainContent();
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
  var startTime = timeProperties.startTime - 31536000000;
  var endTime = timeProperties.endTime;
  var fullTimeExtent = new esri.TimeExtent(new Date(startTime), new Date(endTime));

  map.setTimeExtent(fullTimeExtent);

  window.timeSlider = new esri.dijit.TimeSlider({
    style: "width: 100%;",
    loop:true
  }, dojo.byId("timeSliderPane"));

  map.setTimeSlider(timeSlider);
  timeSlider.setThumbCount(1);
  timeSlider.setThumbMovingRate(1000);
  if(timeProperties.numberOfStops){
    timeSlider.createTimeStopsByCount(fullTimeExtent,timeProperties.numberOfStops);
  }
  else{
    timeSlider.createTimeStopsByTimeInterval(fullTimeExtent,timeProperties.timeStopInterval.interval,timeProperties.timeStopInterval.units);
  }
  // Hack to remove extra time stop start
  timeSlider.timeStops.shift();
  timeSlider.setTimeStops(timeSlider.timeStops);
  // Hack to remove extra time stop end
  timeSlider.setThumbIndexes([timeSlider.timeStops.length - 1]);

  if($.browser.msie && parseInt($.browser.version, 10) == 7) {
    $("#map").append("<div id='timeDisplay'>2011</div>");
  }

  dojo.connect(timeSlider,'onTimeExtentChange',function(timeExtent){
    timeSlider.pause();

    if($.browser.msie && parseInt($.browser.version, 10) == 7) {
      $("#timeDisplay").html(formatDate(timeExtent.endTime,'yyyy'));
      $("#timeDisplay").css("left",($("#map").width() - $("#timeDisplay").width())/2);
    }

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
        $(this).attr("onclick","timeSlider.setThumbIndexes(["+i+"]);")
      });
    }
  });

  timeSlider.startup();

};

var formatDate = function(date,datePattern){
  return dojo.date.locale.format(date, {
    selector: 'date',
    datePattern: datePattern
  });
};

var switchToMainContent = function(){
  $("#tab1").addClass("tabs-active1").removeClass("currentTab").removeClass("tabs-default1").addClass("currentTab");
  $(".tabs-active2").addClass("tabs-default2");
  $(".tabs-default2").removeClass("tabs-active2").removeClass("currentTab");
  $("#timeControls").show();
  $("#legend").show();
  $("#pagcSource").show();
  $("#bciSource").hide();
  $("#batGallery").hide();
  $("#sidePaneContent").html("").append("<div id='mainContent' class='description'><h3 id='mainContentHeader' class='contentHeader'>"+appData.mainContent.heading+"</h3><img id='mainContentImage' class='contentImage' src='"+appData.mainContent.imageURL+"'><p class='creditText'>© Ryan Von Linden, <a href='http://www.dec.ny.gov/' target='_blank' class='imgCreditLink' title='New York State Department of Environmental Conservation'>New York DEC</a></p><p id='mainContentText' class='contentText'>"+appData.mainContent.text+"<br><br><span class='readMore' onclick='switchToBatGallery("+currentBat+")'>VIEW AFFECTED SPECIES &gt;&gt;</span></p></div>");
  startFade(getLayerByName(map,["time","backgroundcounties"]));
  //map.setExtent(initExtent,true);
};

var switchToBatGallery = function(bat){
  currentBat = bat;
  $("#tab2").addClass("tabs-active2").removeClass("tabs-default2").addClass("currentTab");
  $(".tabs-active1").addClass("tabs-default1");
  $(".tabs-default1").removeClass("tabs-active1").removeClass("currentTab");
  $("#timeControls").hide();
  $("#legend").hide();
  $("#pagcSource").hide();
  $("#bciSource").show();
  $("#batGallery").show();
  if($("#batGallery").length === 0){
    $("#controlsPane").append("<table id='batGallery'><tr></tr></table>");
    dojo.forEach(appData.batContent,function(data,i) {
      $("#batGallery").children("tbody").children("tr").append("<td class='batGalleryPane'><img id='batImg"+i+"' class='batImg' title='"+appData.batContent[i].commonName+"' src='"+appData.batContent[i].imageURL+"' onclick='switchToBatGallery("+i+")'></td>");
    });
    $(".batImg").mouseover(function() {
      $(this).css("border-color","#FC0000");
    });
    $(".batImg").mouseout(function() {
      if(!$(this).hasClass("currentImg")){
        $(this).css("border-color","#949494");
      }
    });
    if(navigator.userAgent.match(/iPad/i) === null){
      $(".batImg").tipTip({
        maxWidth : "auto",
        delay : 0
      });
    }
  }
  $("#sidePaneContent").html("").append("<div class='description'><h3 class='contentHeader'>A gallery of threatened bats</h3><h4 class='speciesHeader'>"+appData.batContent[bat].commonName+"</h4><img class='contentImage' src='"+appData.batContent[bat].imageURL+"'><p class='creditText'>© Merlin D. Tuttle, <a href='http://www.batcon.org/' target='_blank' class='imgCreditLink' title='Bat Conservation International'>Bat Conservation International</a></p><p class='contentText'>"+appData.batContent[bat].text+"<br><br><a class='readMore' href='"+appData.batContent[bat].linkURL+"' target='_blank'>READ MORE &gt;&gt;</a></p></div>");;
  startFade(getLayerByName(map,[appData.batContent[bat].species,"cache","backgroundcounties"]));
  //map.setExtent(new esri.geometry.Extent({"xmin":-18935309.017567962,"ymin":-363864.36916996073,"xmax":-6235755.390159027,"ymax":10359333.454897985, "spatialReference":{"wkid":102100}}),true);
  //map.setExtent(getLayerByName(map,appData.batContent[bat].species)[0].fullExtent,true);
  $(".batImg").css("border-color","#949494").removeClass("currentImg");
  $("#batImg"+bat).css("border-color","#FC0000").addClass("currentImg");
  if($(window).width() <= 1250){
    if(navigator.userAgent.match(/iPad/i) === null){
      $("#batGallery").css("margin-top","5px");
    }
  }
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
