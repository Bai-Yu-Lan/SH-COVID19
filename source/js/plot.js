// // var margin = {top: 40, right: 20, bottom: 30, left: 40},
// var margin = {top: 5, right: 3, bottom: 5, left: 3},

// width = 660 - margin.left - margin.right,
// height = 400 - margin.top - margin.bottom;

// // width = 250 - margin.left - margin.right,
// // height = 150 - margin.top - margin.bottom;

// var formatPercent = d3.format(".0%");

// var x = d3.scale.ordinal()
//     .rangeRoundBands([0, width], .1);

// var y = d3.scale.linear()
//     .range([height, 0]);

// var xAxis = d3.svg.axis()
//     .scale(x)
//     .orient("bottom");

// var yAxis = d3.svg.axis()
//     .scale(y)
//     .orient("left")
//     .tickFormat(formatPercent);

// var tip = d3.tip()
//     .attr('class', 'd3-tip')
//     .offset([-10, 0])
//     .html(function(d) {
//     return "<strong>" + d.letter + "</strong> : <span style='color:red'>" + d.frequency + "</span>";
// })

// var svg = d3.select("#barplot").append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// svg.call(tip);

// d3.tsv("source/data/data.tsv", type, function(error, data) {
//     x.domain(data.map(function(d) { return d.letter; }));
//     y.domain([0, d3.max(data, function(d) { return d.frequency; })]);

// svg.append("g")
//     .attr("class", "x axis")
//     .attr("transform", "translate(0," + height + ")")
//     .call(xAxis);

// svg.append("g")
//     .attr("class", "y axis")
//     .call(yAxis)
//     .append("text")
//     .attr("transform", "rotate(-90)")
//     .attr("y", 6)
//     .attr("dy", ".71em")
//     .style("text-anchor", "end");
//     // .text("Value");

// svg.selectAll(".bar")
//     .data(data)
//     .enter().append("rect")
//     .attr("class", "bar")
//     .attr("x", function(d) { return x(d.letter); })
//     .attr("width", x.rangeBand())
//     .attr("y", function(d) { return y(d.frequency); })
//     .attr("height", function(d) { return height - y(d.frequency); })
//     .on('mouseover', tip.show)
//     .on('mouseout', tip.hide)

// });



function plotPOIBar(){
    // var margin = {top: 40, right: 20, bottom: 30, left: 40},
    var margin = {top: 5, right: 3, bottom: 5, left: 3},

    width = 660 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // width = 250 - margin.left - margin.right,
    // height = 150 - margin.top - margin.bottom;

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
        return "<strong>" + d.date + "</strong> : <span style='color:red'>" + d.num + "</span>";
    })

    var svg = d3.select("#barplot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.call(tip);

    tempData = [
        {date: '0401', num: 1},
        {date: '0402', num: 1},
        {date: '0403', num: 0},
        {date: '0404', num: 0},
        {date: '0405', num: 1},
        {date: '0406', num: 0}
    ]
    xrange = tempData.map(function(d){return d.date;})
    console.log(xrange)

    x.domain(xrange);
    y.domain([0, d3.max(tempData, function(d) { return d.num; })])

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");
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

plotPOIBar()