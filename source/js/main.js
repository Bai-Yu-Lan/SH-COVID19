//** CARTO VL functionality begins here **//

// Define user
carto.setDefaultAuth({
    username: 'cartovl',
    apiKey: 'default_public'
});

const zoom = 9;

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

// 记录POI位置信息的json 
var json_url = "source/data/CaseInfo_April/estate_info_POI_category.json";
// 各个区域新增病例信息 
var regionRecord_url = "source/data/CaseInfo_April/Shanghai_region_data_T.csv";
// 医疗资源占用情况
var hospital_occupy_url = "source/data/CaseInfo_April/yiliao.csv"
//社会面筛查信息
var society_newCase_url = "source/data/CaseInfo_April/shehuimian.csv"
// 各个POI新增病例信息 
var csv_url = "source/data/CaseInfo_April/time_series.csv";


// 定义地图背景
let map = new mapboxgl.Map({
  container: "map",
  style: carto.basemaps.darkmatter,
  center: [121.492849, 31.228211],
  zoom,
});

// TODO 中文插件
// mapboxgl.setRTLTextPlugin('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.1.0/mapbox-gl-rtl-text.js');
// var languageControl = new MapboxLanguage({
//     defaultLanguage: 'zh'//设置语言为中文
// });
// map.addControl(languageControl);

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


function readTextFile(main_function) {
    // 读取POI基本信息
    console.log("Reading GeoJson File...")
    $.ajax({
        url: json_url,
        type: "GET",
        dataType: "json",
        success: 
        function (json_data) {
            // readRegionCSVFile(json_data, main_function)
            readGroupedRegionCSVFile(json_data, main_function)
        }
    });
}

function readRegionCSVFile(json_data, main_function){
    // 读取各个区的统计信息 regionRecord_url=Shanghai_region_data_T.csv
    console.log("Reading region data...")

    $.ajax({
        url: regionRecord_url,
        type: "GET",
        dataType: "text",
        success: 
        function (data) {
            region_data = processData(data);
            readCSVFile(json_data, region_data, main_function)
        }
    });
    // 处理region csv数据
    function processData(allText) {
        console.log("Proecssing Region CSV Data...")
        var allTextLines = allText.split(/\r\n|\n/);
        var headers = allTextLines[0].split(',');
        var lines = [];
        for (let i=1; i<allTextLines.length; i++) {
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
}

function readGroupedRegionCSVFile(json_data, main_function){
    var grouped_data = {}
    d3.csv( regionRecord_url, function(new_case_data) {
        d3.csv( hospital_occupy_url, function(hospital_occupy_data){
            d3.csv( society_newCase_url, function(society_new_case_data){
                grouped_data["new_case_data"] = new_case_data
                grouped_data["hospital_occupy_data"] = hospital_occupy_data
                grouped_data["society_new_case_data"] = society_new_case_data
                readCSVFile(json_data, grouped_data, main_function)

            })
        })
    });
    
    
}

function readCSVFile(json_data, grouped_data, callback){
    // 读取存储通报信息的csv csv_url=time_series.csv
    console.log("Reading encode address report data...")
    $.ajax({
        url: csv_url,
        type: "GET",
        dataType: "text",
        success: function(data) {
            // [csv_data,  poi_info_dict, min_w, max_w]= process_POIData(data);
            ret_data = process_POIData(data);
            // console.log("ret data type: "+ typeof ret_data)
            csv_data = ret_data.csv_data;
            poi_info_dict = ret_data.poi_info_dict;
            min_w = ret_data.min_w;
            max_w = ret_data.max_w;
            console.log( "Number of POI is : " +  Object.keys(poi_info_dict).length );
            console.log("min weight is "+min_w+" max weight is "+max_w);
            // 调用主函数
            callback(json_data, grouped_data, csv_data, poi_info_dict, min_w, max_w);
        }
    });
    // 处理每个小区通报的csv数据，存储POI更新信息
    function process_POIData(allText){
        var csv_data=[];
        var poi_info_dict={};
        var min_w=14;
        var max_w=0;
        
        console.log("Proecssing POI Data...")
        var allTextLines = allText.split(/\r\n|\n/);
        var headers = allTextLines[0].split(',');
        for (var i=1; i<allTextLines.length; i++) {
            var data = allTextLines[i].split(',');
            if (data.length == headers.length) {
                var tarr = {}; //存储csv文件中的一行信息
                var temp_poi_data = {}; //存储单个POI对应的部分信息
                var report_num = 0; //小区被通报的次数
                var freq = 0;
                for (var j=0; j<headers.length; j++) {
                    if (headers[j] == "encode"){
                        var poi_encode = data[j]+"" // TODO 确保encode是string
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
                            if(j>=headers.length-14){
                                // 统计14天内通报次数
                                report_num += 1;
                            }
                            
                        }
                    }
                }
                csv_data.push(tarr);
                temp_poi_data["report_num"] = report_num
                poi_info_dict[poi_encode] = temp_poi_data
            }
        }
        // console.log("IN FUNCTION")
        // console.log(poi_info_dict)
        return{
            "csv_data":csv_data,
            "poi_info_dict":poi_info_dict,
            "min_w":min_w,
            "max_w":max_w
        }
    }
}


function main(){
    console.log("main function!")

    readTextFile( loadMap ) // 读取数据后绘制地图
    // readTextFile( justDebug )
}

function justDebug(json_data, grouped_data, csv_data, poi_info_dict, min_w, max_w){
    console.log("Check grouped data")
    console.log(Object.keys(grouped_data))
    console.log(grouped_data)
}

function updateGeojson(json_data, poi_info_dict, min_w, max_w){
    console.log("Updating GeoJson file...")
    for(var i=0;i<json_data.features.length;i++){
    // for(var i=0;i<2;i++){
        temp_encode = json_data.features[i].properties.encode
        if ( poi_info_dict.hasOwnProperty(temp_encode) ) {
            temp_last_update_weight = poi_info_dict[temp_encode].last_update_weight
            // temp_last_update_weight = (temp_last_update_weight-min_w)/(max_w-min_w)
            temp_last_update_weight = (max_w - temp_last_update_weight)
            temp_last_update_date = poi_info_dict[temp_encode].last_update_date
            json_data.features[i].properties.last_update_weight = temp_last_update_weight
            json_data.features[i].properties.last_update_date = temp_last_update_date
            // report num
            json_data.features[i].properties.width_weight = 1+ Math.sqrt(poi_info_dict[temp_encode].report_num)
            
        }else{
            // console.log(temp_encode)
            json_data.features[i].properties.last_update_weight = 0
            json_data.features[i].properties.last_update_date = "Nan"
            json_data.features[i].properties.width_weight = 1
        }
    }
}

function loadMap(json_data, grouped_data, csv_data, poi_info_dict, min_w, max_w){

    //更新Geojson中POI信息
    updateGeojson(json_data, poi_info_dict, min_w, max_w)

    // console.log(json_data.features[0])

    console.log("Loading Map...")

    var cityPopup
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

        console.log(popup.district + " " + districtName[popup.district])
        
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
            // return d.address === feature.variables.address.value
            return d.encode === feature.variables.encode.value // TODO 查找对应数据
        })
        console.log("aimData is: ")
        console.log(aimData)
        // console.log(!(aimData===undefined) && (aimData.length>0))

        var time_log_bar = []
        const ticks_index = [1,7,14,21] // 显示的日期
        var tick_values = []
        var time_log_line = []
        let line_sum_num = 0
        var sum_count = 0 //小区这几天被通报的总次数
        // console.log(feature.variables)
        var day_count = 0
        popup.reportNum = 0
        popup.daycount = 0
        if (!(aimData===undefined) && (aimData.length>0) ){
            let day_num = Object.keys(aimData[0]).length
            // console.log("Keys:")
            // console.log(Object.keys(aimData[0]))
            let start_i = day_num-21 // TODO 仅保留21天的数据
            let count = 0
            let i=0
            for (var key in aimData[0]){
                i+=1
                if(key=="encode"){ 
                    continue
                }else if (i>start_i){ 
                    day_count+=1
                    var temp_d = {}
                    temp_d["date"] = key
                    // time_log_bar.push(temp_d)
                    // TODO 从第一次通报开始显示
                    if (temp_d["date"]>="0318"){
                        count+=1 
                        temp_d["num"] = (aimData[0][key]>0) ? 1: 0
                        sum_count += (aimData[0][key]>0)
                        // 添加barplot信息
                        time_log_bar.push(temp_d)
                        if (ticks_index.includes(count)){
                            // console.log("count is: "+ count + "; Key is: "+key)
                            tick_values.push(key) //TODO 添加需要保存显示的日期
                        }
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
            // console.log("tickValues are : ")
            // console.log(tick_values)
            // 绘制折线图
            plotPOIBar(time_log_bar, tick_values)
            // TODO 取消绘制折线图
            // if (line_sum_num > 0){
            //     plotPOILine(tempData=time_log_line)
            // }else{
            //     console.log("line plot num is: "+ line_sum_num)
            // }
        }

        // console.log("Plot "+ popup.district)
        // plotRegionLine(
        //     allRegionData=grouped_data,
        //     regionName=popup.district
        // )

        plotSideStackedBars(popup.district, grouped_data, 320, 80)

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
        if (aside_info.district!="上海市"){
            aside_info.district = "上海市"
            // plotRegionLine(grouped_data, "上海市") //TODO 绘制上海市折线图
            plotSideStackedBars("上海市", grouped_data, 320, 80)
        }

    }

    // Define Viz object and custom style
    const viz = new carto.Viz(`
        // color: rgba(255, 0, 0, ramp(zoomrange([8,10,13]), [0.2,0.4,0.6]) )
        // @colorRamp: ramp(buckets($last_update_weight, [0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9]), [#3a3fac ,#6DCEE1 ,#F7E432 ,#FD8C30 ,#E93627])
        // rgb(109, 206, 225), rgb(247, 228, 50), rgb(255, 165, 0), rgb(220,20,60)
        @colorRamp: ramp(buckets($last_update_weight, [2,8,14]), [rgba(220,20,60,ramp(zoomrange([8,12]), [0.3,0.8])), rgba(255,165,0,ramp(zoomrange([8,12]), [0.3,0.7])), rgba(247,228,50,ramp(zoomrange([8,12]), [0.3,0.7])), rgb(109,206,225,ramp(zoomrange([8,12]), [0.3,0.7]))] )
        color:@colorRamp
        strokeColor: @colorRamp
        strokeWidth: 1
        @width_weight: $width_weight
        // width: ramp(zoomrange([8,10,13,15]), [0.05,3,9,15])
        @widthRamp: ramp( zoomrange([8,10,13]), [0.1*@width_weight, 2*@width_weight, 3*@width_weight] )
        width: @widthRamp
        @address : $address
        @name: $name
        @encode: $encode
        @city: $city
        @district: $district
        @town: $town
        // @report_num: $report_num
        @districtsHistogram: viewportHistogram($district, 10)
        // color: ramp(buckets($winner, ["Conservative Party", "Labour Party"]), [royalblue, crimson])
        // 房地产|行政地标|公司企业|教育培训|医疗|政府机构
        // @categoryRamp: ramp($poiType, Bold)
        @categoryRamp: ramp( buckets($poiType, ["房地产", "行政地标", "公司企业", "教育培训", "医疗", "政府机构"]), 
            [rgba(250,123,5,ramp(zoomrange([8,12]), [0.3,0.8]) ), rgba(237,222,58,ramp(zoomrange([8,12]), [0.3,0.8]) ),
            rgba(68,233,238,ramp(zoomrange([8,12]), [0.3,0.8]) ), rgba(235,34,216,ramp(zoomrange([8,12]), [0.3,0.8]) )
            rgba(26,231,21,ramp(zoomrange([8,12]), [0.3,0.8]) ), rgba(245,3,3,ramp(zoomrange([8,12]), [0.3,0.8]) )],
            rgba(242,254,248,ramp(zoomrange([8,12]), [0.3,0.8]) ))

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
    //TODO debug
    districtWidget.addEventListener("categoriesSelected", debounceDistricts());
    // 拖动界面时更新不同区数值
    layer.on("updated", updateWidgets);

    const interactivity = new carto.Interactivity(layer)
    // 鼠标点击的时候显示信息
    interactivity.on("featureClick", featureClickHandler)
    interactivity.on("featureClickOut", featureClickOutHandler)

    // plotRegionLine(grouped_data, "上海市") //TODO 初始化绘制
    plotSideStackedBars("上海市", grouped_data, 320, 80)

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
        // const legend = document.querySelector(".js-legend");
        const raw_legend = document.getElementById("raw_legend");
        const cat_legend = document.getElementById("category_legend");
        raw_legend.classList.remove("is-hidden");
        cat_legend.classList.add("is-hidden");
      }
    
    function hideLegend() {
        // const legend = document.querySelector(".js-legend");
        const raw_legend = document.getElementById("raw_legend");
        const cat_legend = document.getElementById("category_legend");
        raw_legend.classList.add("is-hidden");
        cat_legend.classList.remove("is-hidden");
    }
    const styleSwitch = document.querySelector("as-switch");
    styleSwitch.addEventListener("change", (event) => {
      const enabled = event.detail;
      if (enabled) {
        hideLegend();
        return viz.color.blendTo("@categoryRamp") && viz.width.blendTo("ramp(zoomrange([8,10,13,15]), [0.05,3,9,15])");
      }
      showLegend();
      return viz.color.blendTo( "@colorRamp" ) && viz.width.blendTo("@widthRamp");
    });


}


main();


function plotPOIBar(tempData, tick_values){
    var margin = {top: 5, right: 6, bottom: 15, left: 6},

    width = 240 - margin.left - margin.right,
    height = 90 - margin.top - margin.bottom;

    var formatPercent = d3.format(".0%");

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .outerTickSize(0)
        .tickValues(tick_values)
        .orient("bottom");

    // var yAxis = d3.svg.axis()
    //     .scale(y)
    //     .orient("left")
    //     .tickFormat(formatPercent);

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
        // return "<strong>" + d.date + "</strong> : <span style='color:red'><strong>" + d.num + "</strong></span>";
        return "<strong>" + d.date + "</strong>";
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
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height-8) + ")")
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
        .enter()
        .append("rect")
        // .attr("class", "bar")
            .attr("class", "popup_bar")
            .attr("x", function(d) { return x(d.date); })
            .attr("width", x.rangeBand())
            .attr("y", function(d) { return y(d.num); })
            .attr("height", function(d) { return height - y(d.num)-8; })
            .attr('rx',3)
            .attr('ry',3)
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide)

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
        .outerTickSize(0)
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
    // svg.selectAll("path")
    //         .data(tempData)
    //         .enter()
    //         .append("path")
    //             .attr("class", "popup_line")
    //             .attr("transform", "translate("+margin.left+","+(margin.top-2)+")")
    //             .attr("d", linePath(tempData))

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
            .outerTickSize(0)
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

function plotSideStackedBars(region_CN_Name, groupedData, width, height){
    regionName = districtName[region_CN_Name]
    // 每次点击事件对应处理前首先将所有plot清空，然后再重新绘制
    let temp_item = document.getElementById("region_num_plot");
    if (temp_item!=null){
        temp_item.innerHTML = "";
    }
    temp_item = document.getElementById("hospital_num_plot");
    if (temp_item!=null){
        temp_item.innerHTML = "";
    }
    temp_item = document.getElementById("society_add_num_plot");
    if (temp_item!=null){
        temp_item.innerHTML = "";
    }
    console.log("grouped data keys : ")
    console.log( Object.keys(groupedData) )
    // 绘制各个区域新增数
    plotSide_regionAddingPlot(regionName, groupedData["new_case_data"], "#region_num_plot", width, height)
    plotSide_hospitalOccupyPlot(regionName, groupedData["hospital_occupy_data"], "#hospital_num_plot", width, height)
    plotSide_societyAddingPlot(regionName, groupedData["society_new_case_data"], "#society_add_num_plot", width, height)
}

function chooseData(data, district){
    // console.log(data)
    let retData = []
    let aimData = data.filter(function(d){
        return d.address === district // TODO 查找对应数据
    })
    aimData = aimData[0]
    let record_date = null
    let day_record = {}
    for (let key in aimData){
        if (key=="address"){
            continue
        }else{
            let temp_k = key.split("_")
            let temp_date = temp_k[0]
            let temp_kind = temp_k[1]
            let temp_num = parseFloat(aimData[key])
            if (record_date!=null){
                console.assert(day_record.hasOwnProperty("date") , "出现错误，单独的天数记录！"+temp_date)
                day_record[temp_kind] = temp_num
                // update record data
                record_date = null
                retData.push(day_record)
                day_record = {}
            }else {
                day_record["date"] = temp_date
                day_record[temp_kind] = temp_num
                record_date = temp_date
            }
        }
    }
    // console.log(retData)
    return retData
}

function plotSide_regionAddingPlot(regionName, partData, div_id, temp_w, temp_h){
    let category_list =  ["quezhen", "wuzhengzhuang"]
    let show_name_dict = {"quezhen":"确诊", "wuzhengzhuang":"无症状感染者"}
    let tempData = chooseData(partData, regionName)
    // console.log("#### check region new case data: ####")
    // console.log(tempData)
    plotStackedBar(tempData, div_id, category_list, show_name_dict, temp_w, temp_h)
}
function plotSide_hospitalOccupyPlot(regionName, partData, div_id, temp_w, temp_h){
    let category_list = ["yiyuan", "fangcang"]
    let show_name_dict = {"yiyuan":"医院治疗", "fangcang":"方舱医院治疗"}
    let tempData = chooseData(partData, regionName)
    // console.log("#### check hospital occupy data: ####")
    // console.log(tempData)
    plotStackedBar(tempData, div_id, category_list, show_name_dict, temp_w, temp_h)
}
function plotSide_societyAddingPlot(regionName, partData, div_id, temp_w, temp_h){
    let category_list =  ["quezhen", "wuzhengzhuang"]
    let show_name_dict = {"quezhen":"社会面确诊", "wuzhengzhuang":"社会面无症状感染者"}
    let tempData = chooseData(partData, regionName)
    // console.log("#### check society new case data: ####")
    // console.log(tempData)
    plotStackedBar(tempData, div_id, category_list, show_name_dict, temp_w, temp_h)
}

function plotStackedBar(tempData, div_id, category_list, show_name_dict, temp_w, temp_h){
    // console.log("#### width is: "+temp_w+" height is: "+temp_h)
    // var margin = {top: 40, right: 20, bottom: 30, left: 40},
    var margin = {top: 5, right: 3, bottom: 5, left: 3},

    width = temp_w - margin.left - margin.right,
    height = temp_h - margin.top - margin.bottom;
    var xScale = d3.scale.ordinal()
    .rangeRoundBands([0, width], .3);

    var yScale = d3.scale.linear()
    .rangeRound([height, 0]);

    // var color = d3.scale.ordinal().range(["#ff6600", "#ffb380"]); // "#ffcc00"
    var color = d3.scale.ordinal().range(["#4b93cf", "#a1e7f7"]); // "#ffcc00"

    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("up")
        .outerTickSize(0)
        .innerTickSize([0])
        .tickFormat(function(d) { return "" }); //设置不显示内容

    var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .tickFormat(d3.format(".2s")); // for the stacked totals version

    var svg = d3.select(div_id).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var stack = d3.layout.stack();
    var stacked = stack(makeData(category_list, tempData));
    // console.log(stacked)

    xScale.domain(tempData.map(function(d) {return d.date;} ))

    svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    // svg.append("g")
    //     .attr("class", "axis")
    //     .call(yAxis)
    //     .append("text")
    //     .attr("transform", "rotate(-90)")
    //     .attr("y", 6)
    //     .attr("dy", ".71em")
    //     .style("text-anchor", "end")
    //     .text("Num");

    var address = svg.selectAll(".address")
        .data(stacked)
        .enter().append("g")
        .attr("class", "address")
        .style("fill", function(d, i) { return color(i); });

    var rectangles = address.selectAll("rect")
        .data(function(d) {
        // console.log("array for a rectangle");
        return d; })  // this just gets the array for bar segment.
        .enter()
        .append("rect")
            // .attr("rx", 3)
            // .attr("ry", 3)
            .attr("width", xScale.rangeBand());

    // var tooltip = d3.tip()
    //     .attr('class', 'd3-tip')
    //     .offset([-10, 0])

    var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

    transitionRects(stacked);

    function transitionRects(stacked) {
    // this domain is using the last of the stacked arrays, which is the last illness, and getting the max height.
    yScale.domain([0, d3.max(stacked[stacked.length-1], function(d) { return d.y0 + d.y; })]);

    // attach new fixed data
    var address = svg.selectAll(".address")
    .data(stacked);

    // same on the rects
    address.selectAll("rect")
    .data(function(d) {
    // console.log("array for a rectangle");
    return d;
    })  // this just gets the array for bar segment.

    svg.selectAll("g.address rect")
    .transition()
    .duration(250)
    .attr("x", function(d) {
    return xScale(d.x); })
    .attr("y", function(d) {
    return yScale(d.y0 + d.y); }) //
    .attr("height", function(d) {
    return yScale(d.y0) - yScale(d.y0 + d.y); });  // height is base - tallness

    // svg.selectAll(".y.axis").transition().call(yAxis);
    }

    // add mouse over function 
    rectangles
    .on("mouseover", mouseoverFunc)
    .on("mousemove", mousemoveFunc)
    .on("mouseout", mouseoutFunc);
    function mouseoverFunc(d) {
        tooltip
        .style("display", null)
        // .html("<strong>" + d.x + "</strong> - <strong>" + show_name_dict[d.component] + "</strong> : <span style='color:red'><strong>" + d.y + "</strong></span>")
        .html("<p><strong>" + d.x + "</strong></p> <p><strong>" + show_name_dict[d.component] + "</strong> : <span style='color:#4b93cf'><strong>" + d.y + "</strong></span> </p>")
    }

    function mousemoveFunc(d) {
    tooltip
    .style("top", (d3.event.pageY - 5) + "px")
    .style("left", (d3.event.pageX + 10) + "px");
    }

    function mouseoutFunc(d) {
    return tooltip.style("display", "none"); // this sets it to invisible!
    }


}



function makeData(segmentsStacked, data) {
    return segmentsStacked.map(function(component) {
        return data.map(function(d) {
        return {x: d["date"], y: +d[component], component: component};
        })
    });
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

var temptempData = [
    {date: "2022-03-06", A_num: 18, B_num: 13},
    {date: "2022-03-07", A_num: 25, B_num: 13},
    {date: "2022-03-08", A_num: 35, B_num: 13},
    {date: "2022-03-09", A_num: 41, B_num: 13},
    {date: "2022-03-10", A_num: 35, B_num: 13},
    {date: "2022-03-11", A_num: 63, B_num: 13},
    {date: "2022-03-12", A_num: 65, B_num: 13},
    {date: "2022-03-13", A_num: 69, B_num: 13},
    {date: "2022-03-14", A_num: 19, B_num: 13},
    {date: "2022-03-15", A_num: 22, B_num: 13},
    {date: "2022-03-16", A_num: 18, B_num: 13},
    {date: "2022-03-17", A_num: 26, B_num: 13},
    {date: "2022-03-18", A_num: 34, B_num: 13},
    {date: "2022-03-19", A_num: 59, B_num: 13},
    {date: "2022-03-20", A_num: 58, B_num: 13},
    {date: "2022-03-21", A_num: 26, B_num: 13},
    {date: "2022-03-22", A_num: 32, B_num: 13},
    {date: "2022-03-23", A_num: 11, B_num: 13} 
]