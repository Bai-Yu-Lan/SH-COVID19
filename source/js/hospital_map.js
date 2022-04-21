// 定义地图背景
let hospitalMap = new mapboxgl.Map({
    // container: "hosp-lightbox",
    container: "hospMain",
    style: carto.basemaps.darkmatter,
    center: [121.492849, 31.228211],
    zoom,
  });


// 地图缩放控制器
hospitalMap.addControl(new mapboxgl.NavigationControl(), "bottom-right");

hospitalMap.once('load', () => {
    hospitalMap.resize()
})