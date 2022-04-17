import * as d3 from 'd3';
export default function graphs(node, dataset) {
    (() => {
        d3.select(node).selectAll('svg').remove();
    })();

    // ***************数据初始化*******************
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    const paddingTop = 60;
    const paddingBottom = 98;
    const paddingLeft = 90;
    const paddingRight = 24;
    const rectWidth = 40;
    const decoRectWidth = 2;
    const delay = 0;
    const duration = 2000;
    const max = Math.max(...dataset.map((item) => item.value));

    const xData = dataset.map((item) => item.name); // 对接数据时根据name名创建

    /****************************** 比例尺 ***************************************/
    const xScale = d3.scaleBand()
        .domain(xData)
        .rangeRound([0, width - paddingLeft - paddingRight])
    const yScale = d3.scaleLinear()
        .domain([0, max * 1.5])
        .range([height - paddingTop - paddingBottom, 0]);

    // 绘制
    const svg = d3.select(node).append('svg')
        .attr('width', width)
        .attr('height', height);
    // 坐标轴
    const xAxis = d3.axisBottom(xScale)
        .ticks(0)
        .tickPadding(12);
    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickPadding(8)
        .tickFormat(d3.format('d'));
    // ***************坐标轴***************
    svg.append('g')
        .attr('class', 'r-xAxis')
        .attr('transform', `translate(${paddingLeft},${height - paddingBottom})`)
        .call(xAxis);

    svg.append('g')
        .attr('class', 'r-yAxis')
        .attr('transform', `translate(${paddingLeft},${paddingTop})`)
        .call(yAxis);
    // 添加横向网格线
    svg.selectAll('.r-yAxis .tick')
        .append('line')
        .attr('class', 'row-grid')
        .attr('x1', 0)
        .attr('x2', width - paddingLeft - paddingRight)
        .attr('y1', 0)
        .attr('y2', 0);

    // ***************矩形图******************
    yScale.range([0, height - paddingTop - paddingBottom]);

    const rectGroup = svg.selectAll('.rectItem')
        .data(dataset)
        .enter()
        .append('g')
        .attr('class', 'rectItem');

    rectGroup.append('rect')
        .attr('width', rectWidth)
        .attr('height', 0)
        .attr('y', height - paddingTop - paddingBottom)
        .attr('fill', 'url(#rbGraphsColor)')
        .attr('transform', `translate(${paddingLeft},${paddingTop})`)
        .attr('x', (d) => xScale(d.name) + ((xScale.bandwidth() - rectWidth) / 2))
        .transition()
        .delay(delay)
        .duration(duration)
        .attr('height', (d) => yScale(d.value))
        .attr('y', (d) => height - paddingTop - paddingBottom - yScale(d.value));
    // 中间装饰矩形
    rectGroup.append('rect')
        .attr('width', decoRectWidth)
        .attr('height', 0)
        .attr('y', height - paddingTop - paddingBottom)
        .attr('fill', '#30ca6e')
        .attr('opacity', 0.6)
        .attr('transform', `translate(${paddingLeft},${paddingTop})`)
        .attr('x', (d) => xScale(d.name) + ((xScale.bandwidth() - decoRectWidth) / 2))
        .transition()
        .delay(delay)
        .duration(duration)
        .attr('height', (d) => yScale(d.value))
        .attr('y', (d) => height - paddingTop - paddingBottom - yScale(d.value));
    // 上方装饰矩形
    rectGroup.append('rect')
        .attr('width', rectWidth)
        .attr('height', 2)
        .attr('y', height - paddingTop - paddingBottom - 4)
        .attr('fill', '#32dd77')
        .attr('transform', `translate(${paddingLeft},${paddingTop})`)
        .attr('x', (d) => xScale(d.name) + ((xScale.bandwidth() - rectWidth) / 2))
        .transition()
        .delay(delay)
        .duration(duration)
        .attr('y', (d) => height - paddingTop - paddingBottom - yScale(d.value));

    rectGroup.append('text')
        .text((d) => d.value)
        .attr('y', height - paddingTop - paddingBottom)
        .attr('class', 'valueDes')
        .attr('transform', `translate(${20},${paddingTop - 5})`)
        .attr('x', (d) => xScale(d.name) + ((xScale.bandwidth() - rectWidth) / 2) + paddingLeft)
        .transition()
        .delay(delay)
        .duration(duration)
        .attr('y', (d) => height - paddingTop - paddingBottom - yScale(d.value));

    const xyLine = svg.append('g')
        .attr('class', 'lineGroup');
    // x
    xyLine.append('line')
        .attr('class', 'xyLine')
        .attr('x1', paddingLeft - 1)
        .attr('x2', width - paddingRight)
        .attr('y1', height - paddingBottom)
        .attr('y2', height - paddingBottom);
    // y
    xyLine.append('line')
        .attr('class', 'xyLine')
        .attr('x1', paddingLeft)
        .attr('x2', paddingLeft)
        .attr('y1', paddingTop)
        .attr('y2', (height - paddingBottom) + 1);
}
