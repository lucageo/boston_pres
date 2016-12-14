 
 
 (function($) {
 
  $(document).bind('leaflet.map', function(e, map, lMap) 
    {

//---------------------------------------------------------------
// BASIC SETUP
//---------------------------------------------------------------
		// create fullscreen control
		var fsControl = new L.Control.FullScreen();
		// add fullscreen control to the lMap
		lMap.addControl(fsControl);

		// detect fullscreen toggling
		lMap.on('enterFullscreen', function(){
			if(window.console) window.console.log('enterFullscreen');
		});
		lMap.on('exitFullscreen', function(){
			if(window.console) window.console.log('exitFullscreen');
		});
    
    	L.control.navbar().addTo(lMap);
        var zoomBox = L.control.zoomBox({
            modal: false,  			// If false (default), it deactivates after each use. 
        });
        lMap.addControl(zoomBox);
//---------------------------------------------------------------
// BASE LAYERS
//---------------------------------------------------------------

	    var mbAttr = '',
			mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw';

	    var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: mbAttr});
		
		  var streets  = L.tileLayer(mbUrl, {id: 'mapbox.streets',   attribution: mbAttr});//.addTo(lMap);
		
		  var grayscale2  = L.tileLayer('https://api.mapbox.com/styles/v1/lucageo/civark4b600502img5xm0ou4p/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoibHVjYWdlbyIsImEiOiJjaXIwY2FmNHAwMDZ1aTVubmhuMDYyMmtjIn0.1jWhLwVzKS6k1Ldn-bVQPg').addTo(lMap);


	lMap.setView([20, 30], 2);


//---------------------------------------------------------------
// CARTO COUNTRY LAYER SETUP
//---------------------------------------------------------------

	function getColor(d) {
    return d > 500000000 ? '#126597' :
           d > 100000000  ? '#2E7AA7' :
           d > 50000000 ? '#4A8FB8' :
           d > 25000000  ? '#67A4C9' :
           d > 10000000  ? '#83B9D9' :
           d > 1000000  ? '#9FCEEA' :
           d > 500000   ? '#BCE3FB' :
                      '#fff';
	}
	// style function for styling the GeoJSON layer, uses getColor function above
    var style = function(feature) {
      return {
	    fillColor: getColor(feature.properties.sum_budget),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
		zIndex: 1
      }
    }
    // function we can use to filter what data is added to the GeoJSON layer
    var filter = function(feature) {
      return feature.properties.sum_budget > 0;
    }
	// function highlight
	function highlightFeature(e) {
		var layer = e.target;
		layer.setStyle({
			weight: 2,
			color: '#ffffff',
			dashArray: '',
			fillOpacity: 0.8
		});
		info.update(layer.feature.properties);
	}
	// function reset highlight
	function resetHighlight(e) {
		Country_layer.resetStyle(e.target);
	}
	// function zoom to feature
	function zoomToFeature(e) {
		lMap.fitBounds(e.target.getBounds());
	}
	// loop on the features
    var onEachFeature = function(feature, layer) {
      if (feature.properties) {
			layer.bindPopup('<center><i class="fa fa-globe fa-4x" aria-hidden="true"></i><p>COUNTRY </p><hr><a href="/country/'+feature.properties.iso2_mod+'">'+feature.properties.adm0_name+'</a></center><br><i class="fa fa-usd" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp; FUNDING (USD) <b>&nbsp;&nbsp;&nbsp;'+((feature.properties.sum_budget)/1000000)+' M</b><hr><i class="fa fa-cog" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;PROJECTS <b>&nbsp;&nbsp;&nbsp;'+feature.properties.project_numb);
		layer.on({
			mouseover: highlightFeature,
			mouseout: resetHighlight,
			click: zoomToFeature
		});
      }
    }
	
//---------------------------------------------------------------
// CARTO COUNTRY LAYER 
//---------------------------------------------------------------

    // Set up our GeoJSON layer with options: filter, onEachFeature, & style
    var Country_layer = L.geoJson(null, {
      filter: filter,
      onEachFeature: onEachFeature,
      style: style
    }).addTo(lMap);
    // sample query for our Tornado table
    var query = "SELECT * FROM projects";
    // load our data asynchronously from Carto
    var sql = new cartodb.SQL({ user: 'climateadapttst' });
    sql.execute(query, null, { format: 'geojson' })
    .done(function(data) {
      console.log(data);
      // add the tornado data to our Country_layer
      Country_layer.addData(data);
				
   });
   
//---------------------------------------------------------------
// CARTO COUNTRY LEGEND
//---------------------------------------------------------------	

	var legend = L.control({position: 'bottomleft'});

	legend.onAdd = function (lMap) {

    var div = L.DomUtil.create('div', 'info legend'),
	    labels = ['<p>Project Funding (USD) by Country</p>'],
        grades = [500000, 1000000, 10000000, 25000000, 50000000, 100000000, 500000000],

        key_labels = [' 0.5 M ',' 1.0 M ',' 10.0 M ',' 25.0 M ',' 50.0 M ',' 100.0 M ',' 500.0 M '];
    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
		 labels.push(
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            
			key_labels[i] + (key_labels[i + 1] ? '&ndash;' + key_labels[i + 1] + '<br>' : '+'));
    }
    div.innerHTML = labels.join('');
    return div;
};

legend.addTo(lMap);

//---------------------------------------------------------------
// CARTO SITE LAYER
//---------------------------------------------------------------

    var onEachFeature2 = function(feature, layer_site) {
      if (feature.properties) {
			layer_site.bindPopup('<center><i class="fa fa-map-marker fa-4x" aria-hidden="true"></i><p>PROJECT SITE</p><hr><a href="/site/'+feature.properties.site_id+'">'+feature.properties.site_name+'</a><hr><a href="/country/'+feature.properties.site_country_iso2_mod+'">Explore the Country Statistics</a></center>');
		layer_site.on({
			mouseover: highlightFeature,
			mouseout: resetHighlight,
			click: zoomToFeature
		});
      }
    }
	

    // function we can use to filter what data is added to the GeoJSON layer
    var filter_site = function(feature) {
      return feature.properties.site_id > 0;
    }
    // Set up our GeoJSON layer with options: filter, onEachFeature, & style
    // add it to the map, but don't add data just yet
	var sites_group = new L.MarkerClusterGroup().addTo(lMap);
    // sample query for our Tornado table
    var query2 = "SELECT * FROM sites";
    // load our data asynchronously from Carto
    var sql2 = new cartodb.SQL({ user: 'climateadapttst' });
    sql2.execute(query2, null, { format: 'geojson' })
    .done(function(data2) {
      console.log(data2);
	var Site_layer = L.geoJson(data2, {
      filter: filter_site,
      onEachFeature: onEachFeature2,
      //style: style
	  pointToLayer: function (feature, latlng) {
            
			return L.marker(latlng
			);
        }
    })//.addTo(lMap);
	
	sites_group.addLayer(Site_layer);
				
   });
   
     var onEachFeature4 = function(feature, layer_wdpas) {
      if (feature.properties) {
			layer_wdpas.bindPopup('<center><i class="fa fa-map-marker fa-4x" aria-hidden="true"></i><p>WDPA</p><hr><a href="/conservation/?title_selective%5B%5D='+feature.properties.name+'">'+feature.properties.name+'</a></center>');
		layer_wdpas.on({
			//mouseover: highlightFeature,
			//mouseout: resetHighlight,
			//click: zoomToFeature
		});
      }
    }


//---------------------------------------------------------------
// CARTO WDPA POINTS LAYER
//---------------------------------------------------------------

    // function we can use to filter what data is added to the GeoJSON layer
    var filter_wdpa = function(feature) {
      return feature.properties.sum_budget > 1;
    }
    // Set up our GeoJSON layer with options: filter, onEachFeature, & style
    // add it to the map, but don't add data just yet
	var wdpa_group = new L.LayerGroup();//.addTo(lMap);
    // sample query for our Tornado table
    var query4 = "SELECT * FROM wdpa_point";
    // load our data asynchronously from Carto
    var sql4 = new cartodb.SQL({ user: 'climateadapttst' });
    sql4.execute(query4, null, { format: 'geojson' })
    .done(function(data4) {
      console.log(data4);
	var wdpa_layer = L.geoJson(data4, {
      filter: filter_wdpa,
     onEachFeature: function (feature, wdpa_layer) {
		wdpa_layer.bindPopup('<a href="/conservation/?title_selective%5B%5D='+feature.properties.name+'">'+feature.properties.name+'</a>');
		},
      //style: style
        pointToLayer: function (feature, latlng) {
            var geojsonMarkerOptions = {
    radius: 10,
    fillColor: "#99cc99",
    color: "#ffffff",
    weight: 1,
    opacity: 0,
    fillOpacity: 0
};
			return L.circleMarker(latlng, geojsonMarkerOptions );
        }
    })//.addTo(lMap);
	
	wdpa_group.addLayer(wdpa_layer);
		if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
			wdpa_layer.bringToFront();
		}		
   });
  

//---------------------------------------------------------------
// WDPA WMS GEOSERVER LAYER
//--------------------------------------------------------------- 

 	  var url = 'http://h05-prod-vm11.jrc.it/geoserver/conservationmapping/wms';
      
      var wdpa=L.tileLayer.wms(url, {
        layers: 'conservationmapping:v_wdpa_atts_dev',
        transparent: true,
        format: 'image/png',
		opacity:'0.5',
		zIndex: 33 // Use zIndex to order the tileLayers within the tilePane. The higher number, the upper vertically.
      }).addTo(lMap);
 

//---------------------------------------------------------------
// WDPA WMS LEGEND 
//--------------------------------------------------------------- 

function getColor4(d4) {
    return d4 > 25000000  ? '#0D7248' :
           d4 > 10000000  ? '#44A176' :
           d4 > 1000000  ? '#7BD0A5' :
           d4 > 500000   ? '#B3FFD4' :
                      '#fff';
} 
 
 var legend4 = L.control({position: 'bottomleft'});

legend4.onAdd = function (lMap) {

    var div = L.DomUtil.create('div', 'info legend'),
	    labels = ['<p>Project Funding (USD) by Protected Area</p>'],
        grades4 = [500000, 1000000, 10000000, 25000000],
		key_labels4 = [' 0.5 M ',' 1.0 M ',' 10.0 M ',' 25.0 M '];


    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i4 = 0; i4 < grades4.length; i4++) {
        div.innerHTML +=
		 labels.push(
            '<i style="background:' + getColor4(grades4[i4] + 1) + '"></i> ' +
            key_labels4[i4] + (key_labels4[i4 + 1] ? '&ndash;' + key_labels4[i4 + 1] + '<br>' : '+'));
    }
    div.innerHTML = labels.join('');
    return div;
};
 legend4.addTo(lMap);

 /* 
//---------------------------------------------------------------
// WDPA JSON FROM CARTO (not active)
//---------------------------------------------------------------

	// create legend wdpa
	function getColor1(d1) {
    return d1 > 500000000 ? '#126597' :
           d1 > 100000000  ? '#2E7AA7' :
           d1 > 50000000 ? '#4A8FB8' :
           d1 > 25000000  ? '#67A4C9' :
           d1 > 10000000  ? '#83B9D9' :
           d1 > 1000000  ? '#9FCEEA' :
           d1 > 500000   ? '#BCE3FB' :
                      '#fff';
	}
	// style function for styling the GeoJSON layer, uses getColor function above
    var style = function(feature) {
      return {
	    fillColor: getColor1(feature.properties.sum_budget),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7,
		zIndex: 1
      }
    }
    // function we can use to filter what data is added to the GeoJSON layer
    var filter1 = function(feature) {
      return feature.properties.sum_budget > 10000000;
    }
	// function highlight
	function highlightFeature1(e) {
		var layer1 = e.target;
		layer1.setStyle({
			weight: 2,
			color: '#ffffff',
			dashArray: '',
			fillOpacity: 0.8
		});
		info.update(layer1.feature.properties);
	}
	// function reset highlight
	function resetHighlight1(e) {
		wdpa_layer.resetStyle(e.target);
	}
	// function zoom to feature
	function zoomToFeature1(e) {
		lMap.fitBounds(e.target.getBounds());
	}
	// loop on the features
    var onEachFeature1 = function(feature, layer1) {
      if (feature.properties) {
			layer1.bindPopup('<center><i class="fa fa-globe fa-4x" aria-hidden="true"></i><p>COUNTRY </p><hr><a href="/country/'+feature.properties.iso2_mod+'">'+feature.properties.adm0_name+'</a></center><br><i class="fa fa-usd" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp; FUNDING (USD) <b>&nbsp;&nbsp;&nbsp;'+((feature.properties.sum_budget)/1000000)+' M</b><hr><i class="fa fa-cog" aria-hidden="true"></i>&nbsp;&nbsp;&nbsp;PROJECTS <b>&nbsp;&nbsp;&nbsp;'+feature.properties.project_numb);
		layer1.on({
			mouseover: highlightFeature1,
			mouseout: resetHighlight1,
			click: zoomToFeature1
		});
      }
    }
		
//---------------------------------------------------------------
// CARTO COUNTRY LAYER
//---------------------------------------------------------------

    // Set up our GeoJSON layer with options: filter, onEachFeature, & style
    // add it to the map, but don't add data just yet
    var wdpa_layer = L.geoJson(null, {
      filter: filter1,
      onEachFeature: onEachFeature1,
      style: style
    }).addTo(lMap);
    // sample query for our Tornado table
    var query = "SELECT * FROM wdpa";
    // load our data asynchronously from Carto
    var sql = new cartodb.SQL({ user: 'climateadapttst' });
    sql.execute(query, null, { format: 'geojson' })
    .done(function(data1) {
      console.log(data1);
      // add the tornado data to our wdpa_layer
      wdpa_layer.addData(data1);
				
   });
   
//---------------------------------------------------------------
// LEGEND LAYER
//---------------------------------------------------------------

	var legend1 = L.control({position: 'bottomleft'});

	legend1.onAdd = function (lMap) {

    var div = L.DomUtil.create('div', 'info legend'),
	    labels = ['<p>Project Funding (USD) by Country</p>'],
        grades = [500000, 1000000, 10000000, 25000000, 50000000, 100000000, 500000000],

        key_labels = [' 0.5 M ',' 1.0 M ',' 10.0 M ',' 25.0 M ',' 50.0 M ',' 100.0 M ',' 500.0 M '];
    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
		 labels.push(
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            
			key_labels[i] + (key_labels[i + 1] ? '&ndash;' + key_labels[i + 1] + '<br>' : '+'));
    }
    div.innerHTML = labels.join('');
    return div;
};

legend1.addTo(lMap); 

 */
 
//---------------------------------------------------------------
// SEARCH WDPA
//--------------------------------------------------------------- 

		L.control.search({
		position:'topright',
		layer: wdpa_group,
		zoom:true,
		//autoCollapse: false,
		//initial: false,
		textErr: 'Site not found',
		propertyName: 'name',
		textPlaceholder: 'Protected Area...          ',
		buildTip: function(text, val) {
				
			var type = val.layer.feature.properties.wdpa_pid;
			return '<a href="#" class="'+type+'"><b>'+text+'</b></a>';
		}
	})
	.addTo(lMap);
  
//---------------------------------------------------------------
// PROJECT SITES SEARCH 
//---------------------------------------------------------------	 
	
		L.control.search({
		position:'topright',
		layer: sites_group,
		zoom:true,
		//autoCollapse: false,
		//initial: false,
		textErr: 'Site not found',
		propertyName: 'site_name',
		textPlaceholder: 'Project Site...            ',
		buildTip: function(text, val) {
				
			var type = val.layer.feature.properties.site_country_iso2_mod;
			return '<a href="#" class="'+type+'">'+text+'<br><i class="fa fa-map-marker fa-fx" aria-hidden="true"></i><b>&nbsp;'+type+'</b></a>';
		}
	})
	.addTo(lMap);   
  
//---------------------------------------------------------------
// OPENSTREETMAP SEARCH 
//---------------------------------------------------------------

	lMap.addControl( new L.Control.Search({
		url: 'http://nominatim.openstreetmap.org/search?format=json&q={s}',
		jsonpParam: 'json_callback',
		propertyName: 'display_name',
		propertyLoc: ['lat','lon'],
		markerLocation: false,
		//autoCollapse: true,
		autoType: true,
		textPlaceholder: 'Location...                ',
		zoom:true,
		minLength: 2,
		position:'topright'
	}) );	
  
//----------------------------------------------------------------	
// Layers
//----------------------------------------------------------------

		var baseMaps = {
			"Light": grayscale2,
	        "Landscape": streets
			};
		var overlayMaps = {
        
		
		'<i class="fa fa-map-marker" aria-hidden="true"></i> &nbsp;FUNDED SITES':sites_group,
		
		'<i class="fa fa-leaf" aria-hidden="true"></i> &nbsp;PROTECTED AREAS':wdpa,
		
		'<i class="fa fa-globe" aria-hidden="true"></i> &nbsp;COUNTRIES':Country_layer
};	

//------------------------------------------------------------------
// Simple switcher
//-------------------------------------------------------------------

		var controls = L.control.layers(
		baseMaps, overlayMaps,
			{
		collapsed: false,
	}
		
		).addTo(lMap);	
										 
//----------------------------------------------------------------------
// Add legend
//----------------------------------------------------------------------

lMap.on('overlayadd', function (eventLayer) {

    if (eventLayer.name === '<i class="fa fa-leaf" aria-hidden="true"></i> &nbsp;PROTECTED AREAS') {
	
	    legend4.addTo(lMap);
    } 
    else if (eventLayer.name === '<i class="fa fa-globe" aria-hidden="true"></i> &nbsp;COUNTRIES') {

		legend.addTo(lMap);	
    }	
});

//---------------------------------------------------------------------
// Remove legend
//---------------------------------------------------------------------

lMap.on('overlayremove', function (eventLayer) {

    if (eventLayer.name === '<i class="fa fa-leaf" aria-hidden="true"></i> &nbsp;PROTECTED AREAS') {
	
	    lMap.removeControl(legend4);        	
    } 
    else if (eventLayer.name === '<i class="fa fa-globe" aria-hidden="true"></i> &nbsp;COUNTRIES') {
	
	    lMap.removeControl(legend);
    }	
});
//---------------------------------------------------------------------
// Remove LAYER COUNTRY when wdpa search is activated
//----------------------------------------------------------------------

$(".search-button").click(function(event) {
  event.preventDefault();
  if (lMap.hasLayer(Country_layer)) {
    
    lMap.removeLayer(Country_layer);
	lMap.removeControl(legend);  

 
  } else {

  }
});


//-------------------------------------------------------------------------	

})
	
})(jQuery);
