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
    // 读取各个区的统计信息
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
    
    // 读取存储通报信息的csv
    console.log("Reading address report data...")
    $.ajax({
        url: csv_url,
        type: "GET",
        dataType: "text",
        success: function(data) {
            // [csv_data,  poi_info_dict, min_w, max_w]= process_POIData(data);
            ret_data = process_POIData(data);
            console.log("ret data type: "+ typeof ret_data)
            // console.log(ret_data)
            csv_data = ret_data.csv_data;
            poi_info_dict = ret_data.poi_info_dict;
            min_w = ret_data.min_w;
            max_w = ret_data.max_w;
            console.log( Object.keys(poi_info_dict).length );
            console.log("min weight is "+min_w+" max weight is "+max_w);
            callback(json_data, region_data, csv_data, poi_info_dict, min_w, max_w);
        }
    });
    // 处理每个小区通报的csv数据，存储POI更新信息
    function process_POIData(allText){
        var csv_data=[];
        var poi_info_dict={};
        var min_w=14;
        var max_w=0;
        var report_num = 0; //小区14天内被通报的次数
        console.log("Proecssing POI Data...")
        var allTextLines = allText.split(/\r\n|\n/);
        var headers = allTextLines[0].split(',');
        for (var i=1; i<allTextLines.length; i++) {
            var data = allTextLines[i].split(',');
            if (data.length == headers.length) {
                var tarr = {}; //存储csv文件中的一行信息
                var temp_poi_data = {}; //存储单个POI对应的部分信息
                let freq = 0;
                for (var j=0; j<headers.length; j++) {
                    if (headers[j] == "address"){
                        var poi_address = data[j]
                        temp_poi_data["last_update_weight"] = 0
                        tarr[headers[j]] = data[j];
                    }else{
                        freq+=1;
                        tarr[headers[j]] = parseFloat(data[j]);
                        if (parseFloat(data[j])>0){
                            temp_poi_data["last_update_date"] = headers[j];
                            temp_poi_data["last_update_weight"] = freq;
                            min_w = Math.min(freq, min_w);
                            max_w = Math.max(freq, max_w);
                        }
                    }
                }
                csv_data.push(tarr);
                poi_info_dict[poi_address] = temp_poi_data
            }
        }
        console.log("IN FUNCTION")
        console.log(poi_info_dict)
        return{
            "csv_data":csv_data,
            "poi_info_dict":poi_info_dict,
            "min_w":min_w,
            "max_w":max_w
        }
    }
}

// 处理region csv数据
function processData(allText) {
    console.log("Proecssing Region CSV Data...")
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
        json_url = "source/data/CaseInfo_April/estate_info_POI_category.json", 
        // json_url = "source/data/CaseInfo_April/estate_info_GD_startTime.json", 
        regionRecord_url = "source/data/CaseInfo_April/Shanghai_region_data_T.csv",
        csv_url = "source/data/CaseInfo_April/time_series_shanghai.csv",
        // csv_url = "source/data/CaseInfo_April/time_series.csv",
        loadMap
    )
}

function updateGeojson(json_data, poi_info_dict, min_w, max_w){
    console.log("Updating GeoJson file...")
    for(var i=0;i<json_data.features.length;i++){
    // for(var i=0;i<2;i++){
        temp_address = json_data.features[i].properties.address
        if ( poi_info_dict.hasOwnProperty(temp_address) ) {
            temp_last_update_weight = poi_info_dict[temp_address].last_update_weight
            // temp_last_update_weight = (temp_last_update_weight-min_w)/(max_w-min_w)
            temp_last_update_weight = (max_w - temp_last_update_weight)
            temp_last_update_date = poi_info_dict[temp_address].last_update_date
            json_data.features[i].properties.last_update_weight = temp_last_update_weight
            json_data.features[i].properties.last_update_date = temp_last_update_date
            
        }else{
            // console.log(temp_address)
            json_data.features[i].properties.last_update_weight = 0
            json_data.features[i].properties.last_update_date = "Nan"
        }
    }
}

function loadMap(json_data, region_data, csv_data, poi_info_dict, min_w, max_w){

    //更新Geojson中POI信息
    updateGeojson(json_data, poi_info_dict, min_w, max_w)

    console.log(json_data.features[0])

    console.log("Loading Map...")

    // 定义点击POI后的格式
    const popup = new Vue({
        el: "#popup",
        data: {
            address: null,
            name: null,
            district: null,
            lon:null,
            lat:null,
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

    const aside_info = new Vue({
        el: "#regionPlot",
        data:{
            district: "上海市",
        },
        computed:{
            details: function () {
                return !!this.district;
            },
        }
    })

    // 点击poi的事件
    function featureClickHandler(event){
        let temp_item = document.getElementById('poi_barplot');
        if (temp_item!=null){
            temp_item.innerHTML = "";
        }
        temp_item = document.getElementById('poi_lineplot');
        if (temp_item!=null){
            temp_item.innerHTML = "";
        }
        
        const feature = event.features[0];
        // console.log(event.features)
        if (event.features.length < 1) {
            return;
        }

        feature.blendTo(
            {
                strokeWidth: 2,
                color: "grey",
                width: 15,
            }, 0.05 
        );

        // console.log("Update weight is: "+ feature.variables.last_update_weight.value)
        popup.address = feature.variables.address.value
        popup.name = feature.variables.name.value
        popup.district = feature.variables.district.value
        aside_info.district = feature.variables.district.value

        console.log(popup.district)
        console.log(districtName[popup.district])
        
        const coords = event.coordinates;

        popup.lon = coords.lng.toFixed(4)
        popup.lat = coords.lat.toFixed(4)

        if (cityPopup) {
            cityPopup.remove();
            // event.features.forEach((feature) => feature.reset());
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
        console.log("aimData is: ")
        console.log(aimData)
        // console.log(!(aimData===undefined) && (aimData.length>0))

        var time_log_bar = []
        var time_log_line = []
        let line_sum_num = 0
        var sum_count = 0 //小区这几天被通报的总次数
        var day_count = 0
        popup.reportNum = 0
        popup.daycount = 0
        let flag=false
        if (!(aimData===undefined) && (aimData.length>0) ){
            for (var key in aimData[0]){
                if(key=="address"){
                    continue
                }else{
                    day_count+=1
                    var temp_d = {}
                    temp_d["date"] = key
                    // time_log_bar.push(temp_d)
                    // TODO 从第一次通报开始显示
                    if (temp_d["date"]>="0318"){
                        temp_d["num"] = aimData[0][key]
                        // sum_count += (aimData[0][key]>0)
                        // 添加barplot信息
                        time_log_bar.push(temp_d)
                    }else{
                        line_sum_num += aimData[0][key]
                        temp_d["num"] = line_sum_num
                        // 添加lineplot信息
                        time_log_line.push(temp_d)
                    }
                    
                }
            }
            popup.reportNum = sum_count
            popup.daycount = day_count
            // 绘制折线图
            // console.log("Ready to plot bar")
            // console.log(time_log_bar)
            plotPOIBar(time_log_bar)

            if (line_sum_num > 0){
                plotPOILine(tempData=time_log_line)
            }
        }
        console.log("Plot "+ popup.district)
        plotRegionLine(
            allRegionData=region_data,
            regionName=popup.district
        )

    }
    
    //点击其他区域的事件
    function featureClickOutHandler(event) {
        event.features.forEach((feature) => feature.reset());
        let temp_item = document.getElementById('poi_barplot');
        if (temp_item!=null){
            temp_item.innerHTML = "";
        }
        temp_item = document.getElementById('poi_lineplot');
        if (temp_item!=null){
            temp_item.innerHTML = "";
        }
        cityPopup.remove();
        aside_info.district = "上海市"
        plotRegionLine(region_data, "上海市") //TODO 绘制上海市折线图
    }

    // Define Viz object and custom style
    const viz = new carto.Viz(`
        // color: rgba(255, 0, 0, ramp(zoomrange([8,10,13]), [0.2,0.4,0.6]) )
        // @colorRamp: ramp(buckets($last_update_weight, [0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9]), [#3a3fac ,#6DCEE1 ,#F7E432 ,#FD8C30 ,#E93627])
        // rgb(109, 206, 225), rgb(247, 228, 50), rgb(255, 165, 0), rgb(220,20,60)
        @colorRamp: ramp(buckets($last_update_weight, [2,8,14]), [rgba(220,20,60,ramp(zoomrange([8,12]), [0.2,0.6])), rgba(255,165,0,ramp(zoomrange([8,12]), [0.2,0.6])), rgba(247,228,50,ramp(zoomrange([8,12]), [0.2,0.6])), rgb(109,206,225,ramp(zoomrange([8,12]), [0.2,0.6]))])
        color:@colorRamp
        strokeColor: rgba(255, 0, 0, 0.1)
        strokeWidth: 1
        width: ramp(zoomrange([8,10,13,15]), [0.05,3,9,15])
        @address : $address
        @name: $name
        @encode: $encode
        @city: $city
        @district: $district
        @town: $town
        @districtsHistogram: viewportHistogram($district, 10)
        @categoryRamp: ramp($poiType, Bold)

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
    // 拖动界面时更新不同区数值
    layer.on("updated", updateWidgets);

    const interactivity = new carto.Interactivity(layer)
    // 鼠标点击的时候显示信息
    interactivity.on("featureClick", featureClickHandler)
    interactivity.on("featureClickOut", featureClickOutHandler)

    plotRegionLine(region_data, "上海市") //TODO 初始化绘制

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

    function showLegend() {
        const legend = document.querySelector(".js-legend");
        legend.classList.remove("is-hidden");
      }
    
    function hideLegend() {
        const legend = document.querySelector(".js-legend");
        legend.classList.add("is-hidden");
    }
    const styleSwitch = document.querySelector("as-switch");
    styleSwitch.addEventListener("change", (event) => {
      const enabled = event.detail;
      if (enabled) {
        hideLegend();
        return viz.color.blendTo("@categoryRamp");
      }
      showLegend();
      return viz.color.blendTo( "@colorRamp" );
    });


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

    // TODO search 模块
    // document.getElementById("search-container").appendChild(geocoder.onAdd(map));

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

    // svg.selectAll(".bar")
    svg.selectAll(".bar")
        .data(tempData)
        .enter().append("rect")
        // .attr("class", "bar")
        .attr("class", "popup_bar")
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

function plotPOILine(tempData){
    var margin = {top: 4, right: 3, bottom: 5, left: 3},
    width = 240 - margin.left - margin.right,
    height = 80 - margin.top - margin.bottom;
    
    xrange = tempData.map(function(d){return d.date;})
    // set axis 
    var xScale = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1)
        .domain(xrange);
    var yScale = d3.scale.linear()
        .range([height, 0])
        .domain([0, 1.1 * d3.max(tempData, function(d) { return d.num; })]);
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    // tip set
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
        return "<strong>" + d.date + "</strong> : <span style='color:red'>" + d.num + "</span>";
    })
    
    var svg = d3.select("#poi_lineplot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    svg.call(tip);
    
    var linePath=d3.svg.line()//创建一个直线生成器
                .x(function(d){
                    return xScale(d.date);
                })
                .y(function(d){
                    return yScale(d.num);
                });

    //添加一个g用于放x轴
    svg.append("g")
        .attr("class", "axis")
        .attr("transform","translate("+margin.left+","+(height+margin.top)+")")
        .call(xAxis);
     
    svg.append("g")
        .attr("class", "axis")
        .attr("transform","translate("+margin.left+","+(margin.top)+")")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

    // 添加line
    svg.selectAll("path")
            .data(tempData)
            .enter()
            .append("path")
                .attr("class", "popup_line")
                .attr("transform", "translate("+margin.left+","+(margin.top-2)+")")
                .attr("d", linePath(tempData))

    // 添加点
    var scatters = svg.selectAll("circle")
        .data(tempData)                   //绑定数据
        .enter()                        //获取enter部分
        .append("circle")
            .attr("class", "popup_point")
            .attr("cx",function(d){         //设置圆心的x坐标
                return margin.left + xScale(d.date)
            })
            .attr("cy",function(d){         //设置圆心的y坐标
                return margin.bottom-2+yScale(d.num)
            })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)

}

function plotRegionLine(allRegionData, regionName){
    let temp_item = document.getElementById("region_num_plot");
    if (temp_item!=null){
        temp_item.innerHTML = "";
    }
    console.log("regionName: "+regionName)
    var aimData = allRegionData.filter(function(d){
        return d.address === districtName[regionName]
    })
    // getData 
    if ((aimData!=undefined)&&(aimData.length>0)){
        var tempData = []
        for(let key in aimData[0]){
            if(key=="address"){
                continue
            }else{
                var temp_d = {}
                temp_d["date"] = key
                temp_d["num"] = aimData[0][key]
                tempData.push(temp_d)
            }
        }
        // plot region num linePlot
        var margin = {top: 4, right: 3, bottom: 5, left: 3},
        width = 260 - margin.left - margin.right,
        height = 100 - margin.top - margin.bottom;
        
        xrange = tempData.map(function(d){return d.date;})
        // set axis 
        var xScale = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1)
            .domain(xrange);
        var yScale = d3.scale.linear()
            .range([height, 0])
            .domain([0, 1.1 * d3.max(tempData, function(d) { return d.num; })]);
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom");
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");
    
        // tip set
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
            return "<strong>" + d.date + "</strong> : <span style='color:red'>" + d.num + "</span>";
        })
        
        var svg = d3.select("#region_num_plot").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        svg.call(tip);
        
        var linePath=d3.svg.line()//创建一个直线生成器
                    .x(function(d){
                        return xScale(d.date);
                    })
                    .y(function(d){
                        return yScale(d.num);
                    });
    
        //添加一个g用于放x轴
        svg.append("g")
            .attr("class", "aside_axis")
            .attr("transform","translate("+margin.left+","+(height+margin.top)+")")
            .call(xAxis);
         
        // svg.append("g")
        //     .attr("class", "aside_axis")
        //     .attr("transform","translate("+margin.left+","+(margin.top)+")")
        //     .call(yAxis)
        //     .append("text")
        //     .attr("transform", "rotate(-90)")
        //     .attr("y", 6)
        //     .attr("dy", ".71em")
        //     .style("text-anchor", "end");
    
        // 添加line
        svg.selectAll("path")
                .data(tempData)
                .enter()
                .append("path")
                    .attr("class", "aside_line")
                    .attr("transform", "translate("+margin.left+","+(margin.top - 4)+")")
                    .attr("d", linePath(tempData))
    
        // 添加点
        var scatters = svg.selectAll("circle")
            .data(tempData)                   //绑定数据
            .enter()                        //获取enter部分
            .append("circle")
                .attr("class", "aside_point")
                .attr("cx",function(d){         //设置圆心的x坐标
                    return margin.left + xScale(d.date)
                })
                .attr("cy",function(d){         //设置圆心的y坐标
                    return margin.bottom - 4 + yScale(d.num)
                })
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)
    }else{
        alert("No Corresponding Data For "+ allRegionData)
        return
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