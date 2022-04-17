//** CARTO VL functionality begins here **//

// Define user
carto.setDefaultAuth({
    username: 'cartovl',
    apiKey: 'default_public'
});

const zoom = 9;
var cityPopup

var districtName={
    "上海市":"Shanghai",
    "浦东新区": "PudongNew",
    "闵行区": "Minhang",
    "徐汇区": "Xuhui",
    "黄浦区": "Huangpu",
    "嘉定区": "Jiading",
    "静安区": "Jingan",
    "杨浦区": "Yangpu",
    "宝山区": "Baoshan",
    "普陀区": "Putuo",
    "虹口区": "Hongkou",
    "青浦区": "Qingpu",
    "长宁区": "Changning",
    "奉贤区": "Fengxian",
    "松江区": "Songjiang",
    "金山区": "Jinshan",
    "崇明区": "Chongming"
}

// 定义地图背景
let map = new mapboxgl.Map({
  container: "map",
  style: carto.basemaps.darkmatter,
  center: [121.492849, 31.228211],
  zoom,
});


// 地图缩放控制器
map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

mapboxgl.accessToken =
    "pk.eyJ1IjoiZXN0ZWJhbm1vcm8iLCJhIjoiY2pucnViMXh5MGM1ZTNrczE0aHhicnNoYyJ9.MGHVPEr-sIxp3EReRFmLeQ";
    carto.setDefaultAuth({
    username: "atlasinequality",
    apiKey: "208a154d0470764fdcb4bd3e0daf52e6d7243bb1",
    });
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    placeholder: "Search address",
});

function readTextFile(json_url, regionRecord_url, csv_url,  main_function) {
    console.log("Reading GeoJson File...")

    $.ajax({
        url: json_url,
        type: "GET",
        dataType: "json",
        success: 
        function (json_data) {
            readRegionCSVFile(regionRecord_url, csv_url, json_data, main_function)
        }
    });
}

function readRegionCSVFile(regionRecord_url, csv_url, json_data, main_function){
    console.log("Reading region data...")

    $.ajax({
        url: regionRecord_url,
        type: "GET",
        dataType: "text",
        success: 
        function (data) {
            region_data = processData(data);
            readCSVFile(csv_url, json_data, region_data, main_function)
        }
    });
}

function readCSVFile(csv_url, json_data, region_data, callback){
    console.log("Reading address report data...")
    $.ajax({
        url: csv_url,
        type: "GET",
        dataType: "text",
        success: function(data) {
            csv_data = processData(data);
            callback(json_data, region_data, csv_data)
        }
    });
}

function processData(allText) {
    console.log("Proecssing Data...")
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(',');
    var lines = [];

    for (var i=1; i<allTextLines.length; i++) {
        var data = allTextLines[i].split(',');
        if (data.length == headers.length) {

            var tarr = {};
            for (var j=0; j<headers.length; j++) {
                if (headers[j] == "address"){
                    tarr[headers[j]] = data[j];
                }else{
                    tarr[headers[j]] = parseFloat(data[j]);
                }
                
            }
            lines.push(tarr);
        }
    }
    return lines;
}

function main(){
    console.log("main function!")

    readTextFile(
        json_url = "source/data/CaseInfo_April/estate_info_GD.json", 
        regionRecord_url = "source/data/CaseInfo_April/Shanghai_region_data.csv",
        csv_url = "source/data/CaseInfo_April/time_series_shanghai.csv",
        loadMap
    )
}


function loadMap(json_data, region_data, csv_data){

    console.log("Loading Map...")

    // 定义点击POI后的格式
    const popup = new Vue({
        el: "#popup",
        data: {
        address: "NaN",
        name: "NaN",
        district: "上海市",
        lon:"NaN",
        lat:"NaN",
        color: "black",
        reportNum: 0,
        daycount: 0,
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
            width: 15,
        },
        0.05
        );
    
        popup.address = feature.variables.address.value
        popup.name = feature.variables.name.value
        popup.district = feature.variables.district.value

        console.log(popup.district)
        console.log(districtName[popup.district])
        
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

        var aimData = csv_data.filter(function(d){
            return d.address === feature.variables.address.value
        })

        // console.log(aimData)
        // console.log(!(aimData===undefined) && (aimData.length>0))

        var time_log = []
        var sum_count = 0 //小区这几天被通报的总次数
        var day_count = 0
        popup.reportNum = 0
        popup.daycount = 0
        if (!(aimData===undefined) && (aimData.length>0) ){
            for (var key in aimData[0]){
                if(key=="address"){
                    continue
                }else{
                    day_count+=1
                    var temp_d = {}
                    temp_d["date"] = key
                    temp_d["num"] = aimData[0][key]
                    sum_count += aimData[0][key]
                    time_log.push(temp_d)
                }
            }
            popup.reportNum = sum_count
            popup.daycount = day_count
            // 绘制折线图
            console.log("Ready to plot bar")
            // console.log(time_log)
            plotPOIBar(time_log)
            console.log("Plot Bar finished!")
        }


    }
    
    //点击其他区域的事件
    function featureClickOutHandler(event) {
        event.features.forEach((feature) => feature.reset());
        document.getElementById('poi_barplot').innerHTML = "";
        cityPopup.remove();
    }

    // Define Viz object and custom style
    const viz = new carto.Viz(`
        // color: ramp(zoomrange([8,11]),[white, red])
        color: rgba(255, 0, 0, 0.5)
        // strokeColor: ramp(zoomrange([8,12]),[red, white])
        strokeColor: rgba(255, 0, 0, 0.1)
        strokeWidth: 1
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

        filter: @district in ["上海市","浦东新区","闵行区","徐汇区","黄浦区","嘉定区","静安区","杨浦区","宝山区","普陀区","虹口区","青浦区","长宁区","奉贤区","松江区","金山区","崇明区"]
    `);
    const source = new carto.source.GeoJSON(json_data)
    const layer = new carto.Layer('map_layer', source, viz);
    layer.addTo(map);

    const districtWidget = document.querySelector("as-category-widget");
    // district 数目统计信息
    const debounceDistricts = () => {
        let inDebounce;
        let s = carto.expressions;
        return (event) => {
        clearTimeout(inDebounce);
        const districts = event.detail;
        // console.log("districts:")
        // console.log(districts)
        // console.log("filter:")
        // console.log(viz.filter)
        if (districts.length === 0) {
            console.log(s.prop("district"))
            return viz.filter.blendTo(1);
        }
        inDebounce = setTimeout(() => {
            return viz.filter.blendTo( s.in(s.prop('district'), s.list(districts)) );
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
    layer.on("updated", updateWidgets);

    const interactivity = new carto.Interactivity(layer)
    // 鼠标点击的时候显示信息
    interactivity.on("featureClick", featureClickHandler)
    interactivity.on("featureClickOut", featureClickOutHandler)

    function closeSelectCity() {
        // move selection to 'map' instead of 'cities'
        const changeLightbox = document.querySelectorAll(".js-lightbox-selector");
        const activeLightbox = document.querySelector(
          ".js-lightbox-selector.selected"
        );
        activeLightbox.classList.remove("selected");
        // TODO: assumes first nav item is 'map' tab
        changeLightbox[0].classList.add("selected");
    
        polyLayer.hide();
        document.querySelector(".selectCity").classList.remove("selectCity");
        cityPopup.remove();
    }

    //search 模块
    document.getElementById("search-container").appendChild(geocoder.onAdd(map));

    // function updateWidgets(){
    //   const histogram = viz.variables.dataHistogram.value;
    //   console.log(viz.variables.dataHistogram.value);
    // }
    // layer.on("updated", updateWidgets );

    // // 鼠标滑动的时候显示信息
    // interactivity.on("featureHover", featureClickHandler)
    // interactivity.on("featureLeave", featureClickOutHandler)


}

// const responsiveContent = document.querySelector("as-responsive-content");
// responsiveContent.addEventListener("ready", main);

main();

// document.getElementById("search-container").appendChild(geocoder.onAdd(map));

function plotPOIBar(tempData){
    // var margin = {top: 40, right: 20, bottom: 30, left: 40},
    var margin = {top: 5, right: 3, bottom: 5, left: 3},

    // width = 660 - margin.left - margin.right,
    // height = 400 - margin.top - margin.bottom;

    width = 240 - margin.left - margin.right,
    height = 80 - margin.top - margin.bottom;

    var formatPercent = d3.format(".0%");

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(formatPercent);

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
        return "<strong>" + d.date + "</strong> : <span style='color:red'><strong>" + d.num + "</strong></span>";
    })

    var svg = d3.select("#poi_barplot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

    xrange = tempData.map(function(d){return d.date;})
    x.domain(xrange);
    // y.domain([0, d3.max(tempData, function(d) { return d.num; })])
    y.domain([0, 1.2])

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // svg.append("g")
    //     .attr("class", "y axis")
    //     .call(yAxis)
    //     .append("text")
    //     .attr("transform", "rotate(-90)")
    //     .attr("y", 6)
    //     .attr("dy", ".71em")
    //     .style("text-anchor", "end");
        // .text("Value");

    svg.selectAll(".bar")
        .data(tempData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.date); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.num); })
        .attr("height", function(d) { return height - y(d.num); })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)


    function type(d) {
        d.num = +d.num;
        return d;
    }
}

// 添加顶部lightbox跳转事件
const changeLightbox = document.querySelectorAll(".js-lightbox-selector");
for (var i = 0; i < changeLightbox.length; i++) {
    changeLightbox[i].addEventListener("click", goToLightbox);
}

function goToLightbox () {
    const activeLightbox = document.querySelector(".js-lightbox.is-active");
    const body = document.querySelector("body");
    var nextLightbox = null;
    if (this.dataset.lightbox) {
        nextLightbox = document.querySelector(this.dataset.lightbox);
        body.classList.add("hide-help-button");
        body.classList.remove("on-map");
    } else if (this.dataset.goto) {
        // basically if we are selectingt the 'city select' tab
        body.classList.add("on-map");
    } else {
        body.classList.remove("hide-help-button");
        /* This might be a problem if we have more tabs without a dataset.lightbox */
        body.classList.add("on-map");
    }
    if (activeLightbox) {
        activeLightbox.classList.remove("is-active");
    }
    if (nextLightbox) {
        nextLightbox.classList.add("is-active");
    }
    document.querySelector(".js-lightbox-selector.selected").classList.remove("selected");
    this.classList.add("selected");

    actions.classList.remove("as-toolbar__actions--visible");
}

document.querySelector('.js-burger').addEventListener('click', toggleMenu);
const actions = document.querySelector('header.as-toolbar .as-toolbar__actions');

function toggleMenu() {
    actions.classList.toggle('as-toolbar__actions--visible');
};