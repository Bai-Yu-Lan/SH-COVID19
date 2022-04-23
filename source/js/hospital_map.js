// 定义地图背景
let hospitalMap = new mapboxgl.Map({
    // container: "hosp-lightbox",
    container: "hospMap",
    style: carto.basemaps.darkmatter,
    center: [121.492849, 31.228211],
    zoom: 9,
  });


// 地图缩放控制器
hospitalMap.addControl(new mapboxgl.NavigationControl(), "bottom-right");

// TODO 中文插件
// mapboxgl.setRTLTextPlugin('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.1.0/mapbox-gl-rtl-text.js');
// var languageControl = new MapboxLanguage({
//     defaultLanguage: 'zh'//设置语言为中文
// });
// hospitalMap.addControl(languageControl);

// hospitalMap.once('load', () => {
//     hospitalMap.resize()
// })

hospitalMap.on('load', () => {
    hospitalMap.resize();
});




function load_hospitalMap(json_url, main_function) {
    // 读取POI基本信息
    console.log("Reading GeoJson File...")
    $.ajax({
        url: json_url,
        type: "GET",
        dataType: "json",
        success: 
        function (json_data) {
            main_function(json_data)
        }
    });
}

function draw_hospitalMap(json_data){
    console.log("Loading hospital Map...")
    console.log(json_data.features[0])
    const viz = new carto.Viz(`
        color: rgba(255, 0, 0, ramp(zoomrange([8,10,12]), [0.6,0.7,0.9]) )
        strokeColor: rgba(255, 0, 0, 0.1)
        strokeWidth: 1
        width: ramp(zoomrange([8,10,13,15]), [5,10,15,20])
        @district: $district
        @name: $name
        @address: $address
        @closed: $closed
        @opening: $opening
    `);
    const source = new carto.source.GeoJSON(json_data)
    const layer = new carto.Layer("hospital_layer", source, viz)
    layer.addTo(hospitalMap)
    hospitalMap.resize()
}

load_hospitalMap("source/data/CaseInfo_April/hospital_info.json", draw_hospitalMap)

var cityButton = document.querySelector("#load_hospital_map")
cityButton.addEventListener("Click", hospitalMap.resize() )
