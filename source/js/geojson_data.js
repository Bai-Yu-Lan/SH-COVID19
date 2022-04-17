const zoom = 2

// 定义地图背景
let map = new mapboxgl.Map({
  container: "map",
  style: carto.basemaps.darkmatter,
//   center: [120.47, 31.23], //Shang Hai Location
  center:[0,30],
  zoom,
});

var offices

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

//usage:
readTextFile("source/data/temp.json", function (){
    console.log(offices)

    // Define Viz object and custom style
    const viz = new carto.Viz(`
        color: red
        width: 5
        @address : $address
        @appendix: $appendix

    `);
    
    const officesSource = new carto.source.GeoJSON(offices);
    
    // const officesLayer = new carto.Layer('offices', officesSource, new carto.Viz());
    const officesLayer = new carto.Layer('offices', officesSource, viz);
    
    officesLayer.addTo(map);

    const tempData = viz.variables.appendix;

    officesLayer.on('loaded', function (){
        console.log("Start! ")
        // console.log(officesSource._features[0])
        console.log(viz.variables)
    })

})


