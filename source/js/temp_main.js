// Add basemap and set properties
// const map = new mapboxgl.Map({
//     container: 'map',
//     style: carto.basemaps.voyager,
//     center: [0, 30],
//     zoom: 2
// });


const zoom = 2;

// 定义地图背景
let map = new mapboxgl.Map({
  container: "map",
  style: carto.basemaps.darkmatter,
  center: [0,10], //Shang Hai Location
  zoom,
});

//** CARTO VL functionality begins here **//

// Define user
carto.setDefaultAuth({
    username: 'cartovl',
    apiKey: 'default_public'
});

var offices

var cityPopup


function readTextFile(url, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", url);
    request.send(null);
    request.onload = function () {
        if (request.status==200){
            offices = JSON.parse(request.responseText);
            callback(offices);
        }
    }
}

function showInfo(event){
  if (event.features.length < 1) {
    return;
  }
  // console.log(event.features)
  const feature = event.features[0];
  const html=`
<h2>
${feature.variables.address.value}
</h2>
<p>${feature.variables.num.value}</p>
<p>${feature.variables.data_list.value}</p>
`;

  const coords = event.coordinates;
  console.log(coords)
  console.log(feature.variables.address.value)
  
  if (cityPopup) {
    cityPopup.remove();
  }
  cityPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
  }).setLngLat([coords.lng, coords.lat])
    .setHTML(html)
    .addTo(map)

  // var 
}

function featureClickOutHandler(event) {
  event.features.forEach((feature) => feature.reset());
  cityPopup.remove();
}



function main(){
  readTextFile("source/data/temp.json", function (){
    console.log(offices)

    // Define Viz object and custom style
    const viz = new carto.Viz(`
        // color: red
        // width: 5
        color: ramp(zoomrange([3,5]),sunset)
        width: ramp(zoomrange([3,5]),[10,40])
        @address : $address
        @num: $num
        @data_list: $data_list
        @dataHistogram: viewportHistogram($num, 3)

    `);
    
    const officesSource = new carto.source.GeoJSON(offices)
    
    // const officesLayer = new carto.Layer('offices', officesSource, new carto.Viz());
    const officesLayer = new carto.Layer('offices', officesSource, viz);
    
    officesLayer.addTo(map);

    // checkData
    // officesLayer.on('loaded', function (){
    //     console.log("Start! ")
    //     // console.log(officesSource._features[0])
    //     console.log(viz.variables)
    // })

    const interactivity = new carto.Interactivity(officesLayer)

    // 鼠标点击的时候显示信息
    interactivity.on("featureClick", showInfo)
    interactivity.on("featureClickOut", featureClickOutHandler)

    function updateWidgets(){
      console.log("temp");
      
      const histogram = viz.variables.dataHistogram.value;
      console.log(viz.variables.dataHistogram.value);
      // histogram.map((entry) => {
      //   console.log(entry)
      // });
    }
    
    officesLayer.on("updated", updateWidgets );
    
    // // 鼠标滑动的时候显示信息
    // interactivity.on("featureHover", showInfo)
    // interactivity.on("featureLeave", featureClickOutHandler)
  })
}

main()