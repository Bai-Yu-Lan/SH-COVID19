//** CARTO VL functionality begins here **//

// Define user
carto.setDefaultAuth({
    username: 'cartovl',
    apiKey: 'default_public'
});

var offices

const zoom = 8;
var cityPopup

// 定义地图背景
let map = new mapboxgl.Map({
  container: "map",
  style: carto.basemaps.darkmatter,
  center: [120.97, 31.23],
  zoom,
});


// 地图缩放控制器
map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

// mapboxgl.accessToken =
//   "pk.eyJ1IjoiZXN0ZWJhbm1vcm8iLCJhIjoiY2pucnViMXh5MGM1ZTNrczE0aHhicnNoYyJ9.MGHVPEr-sIxp3EReRFmLeQ";
// const geocoder = new MapboxGeocoder({
//   accessToken: mapboxgl.accessToken,
//   placeholder: "Search address",
// });

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


function main(){
  // 定义点击POI后的格式
  const popup = new Vue({
    el: "#popup",
    data: {
      address: "NaN",
      name: "NaN",
      lon:"NaN",
      lat:"NaN",
      color: "black",
    },
    computed: {
      display: function () {
        //console.log("[vue] popup info", this.name, this.cat, this.segregation);
        return this.address === null ? "none" : "block";
      },
      details: function () {
        return !!this.address && !!this.name;
      },
    },
  });

  // 点击poi的事件
  function featureClickHandler(event){
    if (event.features.length < 1) {
      return;
    }
    // console.log(event.features)
    const feature = event.features[0];
  
  
    feature.blendTo(
      {
        strokeWidth: 2,
        color: "grey",
      },
      0.05
    );
    
    // console.log(event)
    // console.log(coords)
    // console.log(feature.variables.address.value)
  
    popup.address = feature.variables.address.value
    popup.name = feature.variables.name.value
    
    const coords = event.coordinates;

    popup.lon = coords.lng.toFixed(4)
    popup.lat = coords.lat.toFixed(4)

    if (cityPopup) {
      cityPopup.remove();
    }
    cityPopup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    }).setLngLat([coords.lng, coords.lat])
      .setDOMContent(popup.$el)
      .addTo(map)
  
    var arc = d3.arc(); 
    //原始数据
    //存在一个对象之中，假设我们要接受后台的数据，接受了直接放在对象中也很方便。
    var myData = {
        innerRadius: 8,//内半径，如果要画圆，设为0
        outerRadius: 10,//外半径
        startAngle: 0,//起始角度，此处使用弧度表示
        endAngle: 2*Math.PI//结束角度
    };
    //数据转化
    var outData = arc(myData); 
    //如果想查看转换之后的数据，可以添加一个alert方法进行查看。
    //alert(outData); 
    
    //使用d3.js选择器选择一个节点，插入svg元素
    var svg = d3.select("#temp_pic")//选择body节点
        .append("svg")//添加svg节点
        .attr("width", 40)//设置svg节点的宽度
        .attr("height", 40);//设置高度
    //在svg中绘制
    svg.append("g")//添加g元素
        .attr("transform", "translate(" + (40 / 2) + "," + (40 / 2) + ")")//设置图像在svg中的位置
        .append("path")//添加路径元素
        .attr("fill", "#FFFFFF")//填充颜色
        .attr("d", outData);//加入转化后的数据

  }
  
  //点击其他区域的事件
  function featureClickOutHandler(event) {
    event.features.forEach((feature) => feature.reset());
    cityPopup.remove();
  }

  readTextFile("source/data/CaseInfo_April/estate_info_GD.json", function (){



    // Define Viz object and custom style
    const viz = new carto.Viz(`
        // color: ramp(zoomrange([8,11]),[white, red])
        color: red
        strokeColor: ramp(zoomrange([8,12]),[red, white])
        // width: 5
        // width: ramp(zoomrange([6,13]),[0.1,8])
        width: ramp(zoomrange([6,8,10,13]), [0.05,1,3,8])
        // width: ramp(zoomrange([11,12,13,16,18]), [1,2,4,15,35])
        @address : $address
        @name: $name
        @encode: $encode
        @city: $city
        @district: $district
        @town: $town
        @districtsHistogram: viewportHistogram($district, 10)
    `);
    const officesSource = new carto.source.GeoJSON(offices)
    // const officesLayer = new carto.Layer('offices', officesSource, new carto.Viz());
    const officesLayer = new carto.Layer('offices', officesSource, viz);
    officesLayer.addTo(map);

    const districtWidget = document.querySelector("as-category-widget");
    // district 数目统计信息
    const debounceDistricts = () => {
      let inDebounce;
      let s = carto.expressions;
      return (event) => {
        clearTimeout(inDebounce);
        const districts = event.detail;
        if (districts.length === 0) {
          return viz.filter.b.blendTo(1);
        }
        inDebounce = setTimeout(() => {
          return viz.filter.b.blendTo(s.in(s.prop("district"), s.list(districts)));
        }, 2000);
      };
    };
    districtWidget.addEventListener("categoriesSelected", debounceDistricts());

    function updateWidgets(){
      districtWidget.style.display = "block";
      const districtsHistogram = viz.variables.districtsHistogram.value;
      // console.log(districtsHistogram)
      districtWidget.categories = districtsHistogram.map((entry) => {
        return {
          name: entry.x.split('"').join(""),
          value: entry.y,
        };
      });
    }
    // 拖动界面时更新不同区数值
    officesLayer.on("updated", updateWidgets);



    
    const interactivity = new carto.Interactivity(officesLayer)
    // 鼠标点击的时候显示信息
    interactivity.on("featureClick", featureClickHandler)
    interactivity.on("featureClickOut", featureClickOutHandler)


    // function updateWidgets(){
    //   const histogram = viz.variables.dataHistogram.value;
    //   console.log(viz.variables.dataHistogram.value);
    // }
    // officesLayer.on("updated", updateWidgets );
    
    // // 鼠标滑动的时候显示信息
    // interactivity.on("featureHover", featureClickHandler)
    // interactivity.on("featureLeave", featureClickOutHandler)

    // search模块
    // document.getElementById("search-container").appendChild(geocoder.onAdd(map));

  })
}

// const responsiveContent = document.querySelector("as-responsive-content");
// responsiveContent.addEventListener("ready", main);
main();

