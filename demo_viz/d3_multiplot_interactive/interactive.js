// 
// Start some helper functions  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//

// Time Parseing function
var parseTime = d3.timeParse("%Y")

// Define a function to convert the data on csv read
var formatData = function(d) {
    return {
        year: parseTime(d.year), // convert "Year" column to Date
        running_total: parseInt(d.running_total),
    }
}

var parseDateString = function(s) {
    dateRE = /[a-zA-Z]{3} \d{2} \d{4}/
    dateString = s.match(dateRE)[0]
    return d3.timeParse("%b %d %Y")(dateString)
}

var formatEarthquakeData = function(d) {
    return {
        year: parseTime(d.year), // convert "Year" column to Date
        mag8Plus: +d["8.0+"],
        mag7to8: +d["7_7.9"],
        mag6to7: +d["6_6.9"],
        mag5to6: +d["5_5.9"],
        estDeaths: +d["Estimated Deaths"]
    }
}

var formatStateYearEarthquakeData = function(d) {
    return {
        state: d.state,
        region: d.region,
        year: parseTime(d.year), // convert "Year" column to Date
        count: +d.count
    }
}

// SVG Canvas Definition  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Define margin and canvas size
// - Credit margining style to Mike Bostock  (also just common D3 best practice)
var margin = {top: 40, right: 160, bottom: 40, left: 120}

// Set width and height of the graph canvas
// - note that this will be smaller than the SVG canvas
var svgWidth = 850
  , svgHeight = 350
    // - set height & width of the drawing canvas element
  , width = svgWidth - margin.left - margin.right
  , height = svgHeight - margin.top - margin.bottom
  , symbolSize = 40
  , transition_time = 350
  , circle_rad = 4


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// CHART 1 Canvas
// 

// Now draw the SVG canvas and a 'g' element to house our graph
var svg1 = d3.select("#lineChart").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)

// Append 'g' element to contain graph and adjust it to fit within the margin
var lineChart = svg1.append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// CHART 2 Canvas
// 

// Now draw the SVG canvas and a 'g' element to house our graph
var svg2 = d3.select("#barsTopCancer").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    // .attr("transform", "translate(0," + margin.top*2 + ")")

// Append 'g' element to contain graph and adjust it to fit within the margin
var barChart = svg2.append("g")
                  .attr("id", "dynaBars")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")")


// DATA & PLOTTING  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

d3.dsv(",", 'state-year-earthquakes.csv', formatStateYearEarthquakeData).then(function(dataset) {

    // DATA PRE-PROCESSING  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //

    var datasetNestedStates = d3.nest()
        .key(function(d) { return d.region })
        .key(function(d) { return d.year })
        .key(function(d) { return d.state })
        .rollup(function(v) {return {
            total: d3.sum(v, function(d) {return d.count})
        }})
        .entries(dataset)
    
    var datasetNestedRollup = d3.nest()
        .key(function(d) { return d.region })
        .key(function(d) { return d.year })
        .rollup(function(v) {return {
            total: d3.sum(v, function(d) {return d.count})
        }})
        // .entries(dataset)
        .entries(dataset)

    var datasetNested = d3.nest()
        .key(function(d) { return d.region })
        .key(function(d) { return d.year })
        .entries(dataset)

    // Organize datasets into a single data object
    dataObj = {
        raw: dataset,
        nested: datasetNested,
        rollup: datasetNestedRollup,
        states: datasetNestedStates
    }

    // Evaluate the max and min count of quakes per region for any given year
    var totalMaxArray = dataObj.rollup.map(function(regionData) {
        return d3.max(
            regionData.values, function(d) { return d.value.total }
            )
    })
    var totalMinArray = dataObj.rollup.map(function(regionData) {
        return d3.min(
            regionData.values, function(d) { return d.value.total }
            )
    })

    var regionYearMax = d3.max(totalMaxArray)
      , regionYearMin = d3.min(totalMinArray)

    // SCALES - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //
    // Set up a dynamic scale for the x-axis
    var xMax = d3.max(dataObj.raw, function(d) {return d.year})
      , xMin = d3.min(dataObj.raw, function(d) {return d.year})
      , xScale = d3.scaleTime()
                   .domain([xMin, xMax])              // domain of inputs
                   .range([0, width])  // range of output draw coords in px

    // Set up a dynamic scale for the y-axis
    var yScale = d3.scaleLinear()
                   .domain([regionYearMin, regionYearMax])
                   .range([height, 0])
                   .nice()  
                    // NOTE: the reversed order of [h,0] so that 
                    // the scale is more vertical

    // Set up ordinal color scale
    colorScale = d3.scaleOrdinal(d3.schemeCategory10)

    // Axes - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //
    // Set up a dynamic x-axis

    var xAxis = d3.axisBottom()
                .scale(xScale)
                // .tickValues(d3.timeYear.range(xMin, xMax, 3))
                .ticks(d3.timeYear.every(1))
                // .tickSubdivide(3)
                // .ticks([d3.timeYears(xMin, xMax)])
                
    // Y Axis
    var yAxis = d3.axisLeft()
                .scale(yScale)
                .ticks(4)

    // DRAWING  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //
    // x-axis
    lineChart.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis)

    // y-axis
    lineChart.append('g')
            .attr('class', 'axis')
            .call(yAxis)
            //    .attr('transform', 'translate()

    // LEGEND
    // 
    // Append 'g' element to contain legend
    var legend1 = svg1.append("g")
                    .attr("transform", 
                    "translate(" + (svgWidth-(margin.right*(2/3))) + "," + margin.top + ")")

    // FOR EACH LINE
    // 
    dataObj.rollup.forEach(function(subSet, i) {

        subSetLabel = subSet.key
        subSetData = subSet.values

        var newLine = d3.line()
            .x(function(d) { 
                // NOTE: Must parse key as a date string b/c the date is converted to string by d3.nest
                return xScale(parseDateString(d.key))
            })
            .y(function(d) {
                return yScale(d.value.total)
            })

        // Get the line metadata
        lineName = subSet.key
        lineColor = colorScale(lineName)

        // Draw the line plot by binding data to the path element via the line generator
        lineChart.append("path")
        .datum(subSetData)
        .attr("class", "line")
        .attr("d", newLine)
        .attr("data-legend",function(d) { return lineName})
        .style("stroke", lineColor)

        // ALTERNATE plotting useing circle elements instead of d3 symbols
        lineChart.selectAll('circle'+i)
            .data(subSetData)
          .enter().append('circle')
            .attr("region", function(d) {
                d.region = subSetLabel
                return subSetLabel
            })
            .attr('cx', function(d) {
                xDateParsed = parseDateString(d.key)
                return xScale(xDateParsed)
            })
            .attr('cy', function(d) {
                return yScale(d.value.total)
            })
            .attr('r', circle_rad)
            .style("fill", lineColor)
            // Add interactivity callbacks
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)

        // Add a legend entry
        // - color block
        legend_buffer = 0
        legend_size = 16
        legend1.append("circle")
            .attr("r", legend_size/4)
            .attr("cx", 0)
            .attr("cy", i*(legend_size)) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("width", legend_size)
            .attr("height", legend_size)
            .style("fill", lineColor)

        // - legend text entry
        legend1.append("text")
            .attr("x", legend_buffer+legend_size)
            .attr("y", i*(legend_size)) 
            .attr("text-anchor", "start") 
            .attr("dominant-baseline", "middle") 
            .text(lineName)
    })

    // Plot Title
    lineChart.append('text')
        .attr('class', 'title')
        .attr("x", (width / 2))             
        .attr("y", 0-25)
        .attr("text-anchor", "middle") 
        .text("US Earthquakes by Region 2011-2015")

    svg1.append("g")
        .attr('class', 'annotation')
        .attr('transform', 'translate(' + (0.5*svgWidth) + ', ' + 0.1*svgHeight + ')')
        .append("text")
        .attr("text-anchor", "middle") 
        .text("bmerrel3");

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Drawing the bar chart
    // 

    // DRAWING  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    barData = dataObj.nested[0].values[2].values
    // Sort by count then by state alphabetical
    barData.sort(function (a, b) {
        return b.count - a.count || b.state - a.state
      })

    // SCALES - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //
    // Set up a dynamic scale for the x-axis
    var xMax_bar = d3.max(barData, function(d) { return d.count }),
        xMin_bar = d3.min(barData, function(d) { return d.count }),
        xScale_bar = d3.scaleLinear()
                   .domain([xMin_bar, xMax_bar])              // domain of inputs;
                   .range([0, width])  // range of output draw coords in px

    var barScale = d3.scaleBand()
        .domain(barData.map(function(d) { return d.state }))
        .range([0, height])
        .padding(0.2)

    // Axes - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //
    // Set up a dynamic x-axis

    var xAxis = d3.axisBottom()
                .scale(xScale_bar)
                .tickSize(50)
                
    // Y Axis
    var yAxis = d3.axisLeft()
                .scale(barScale)
                .ticks(10)

    barChart.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .style('opacity', 0.0)

    barChart.append('g')
        .attr('class', 'x axis')
        .call(xAxis)
        .attr('transform', 'translate(0,' + height + ')')
        .style('opacity', 0.0)

    // Enter the bars d3 object to run the drawing loop for each item in the dataset
    barChart.selectAll('rect')
        .data(barData)
      .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => barScale(d.state) )
        .attr('width', d => xScale_bar(d.count) )
        .attr('height', barScale.bandwidth() )
        .style('opacity', 0.0)

    // Plot Title
    barChart.append('text')
        .attr('class', 'title')
        .attr("x", (width / 2))             
        .attr("y", 0-25)
        .attr("text-anchor", "middle") 
        .text("")
})

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // Mousover Handler Functions to enable interactivity

    function handleMouseOut(d,i) {
        // Use D3 to select element, change color and size
        d3.select(this)
            .transition()
            .duration(transition_time/2)
            .attr('r', circle_rad)

        barChart = d3.select("#dynaBars")

        barChart.selectAll('rect')
            .data(barData)
            .transition()
            .duration(transition_time)
            .style('opacity', 0.0)

        barChart.select('.x.axis')
            .transition()
            .duration(transition_time)
            .style('opacity', 0.0)

        barChart.select('.y.axis')
            .transition()
            .duration(transition_time)
            .style('opacity', 0.0)

        barChart.select('.title')
            .attr("x", (width / 2))             
            .attr("y", 0-25)
            .attr("text-anchor", "middle") 
            .transition()
            .duration(transition_time)
            .text(d.region + "ern Region Earthquakes " + parseDateString(thisData.key).getFullYear())
            .style('opacity', 0.0)
    }


    theseBars = {}
    function handleMouseOver(d,i) {
        thisData = d
        whatsThis = this
        // Access the main nested data set and downselect to the region of the moused point
        someData = dataObj.nested.find(element => element.key==d.region)
        // Downselect to the year of the moused point
        bData = someData.values.find(element => element.key == thisData.key).values
        // Assign to the bar data
        barData = bData

        d3.select(this)
            .transition()
            .duration(transition_time/2)
            .attr('r', circle_rad*2)

        // Sort by count then by state alphabetical
        barData.sort(function (a, b) {
            return b.count - a.count || b.state - a.state
        })
        // console.log(barData)

        // SCALES - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        //
        // Set up a dynamic scale for the x-axis
        var xMax_bar = d3.max(barData, function(d) { return d.count }),
            xMin_bar = d3.min(barData, function(d) { return d.count }),
            xScale_bar = d3.scaleLinear()
                    .domain([xMin_bar, xMax_bar])              // domain of inputs;
                    .range([0, width])  // range of output draw coords in px
                    // note that we can specifiy the range as starting with 0, because it will be 
                    // with respect to the already margined 'g element

        var barScale = d3.scaleBand()
            .domain(barData.map(function(d) { return d.state }))
            .range([0, height])
            .padding(0.2)

        // Axes - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        //
        // Set up a dynamic x-axis

        var xAxis = d3.axisBottom()
                    .scale(xScale_bar)
                    .tickSize(-1*height)
                    
        // Y Axis
        var yAxis = d3.axisLeft()
                    .scale(barScale)
                    .ticks(10)

        barChart = d3.select("#dynaBars")

        barChart.select('.x.axis')
            .transition()
            .duration(transition_time)
            .call(xAxis)
            .style('opacity', 1.0)

        barChart.select('.y.axis')
            .transition()
            .duration(transition_time)
            .call(yAxis)
            .style('opacity', 1.0)

        barChart.selectAll('rect')
            .data(barData)
            .transition()
            .duration(transition_time)
            // .ease(d3.easeElasticOut)
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => barScale(d.state) )
            .attr('width', d => xScale_bar(d.count) )
            .attr('height', barScale.bandwidth() )
            .style('opacity', 1.0)

        barChart.select('.title')
            .attr("x", (width / 2))             
            .attr("y", 0-25)
            .attr("text-anchor", "middle") 
            .transition()
            .duration(transition_time)
            .text(d.region + "ern Region Earthquakes " + parseDateString(thisData.key).getFullYear())
            .style('opacity', 1.0)
}


// Some relevent references used to create this viz
// https://medium.com/@kj_schmidt/hover-effects-for-your-scatter-plot-447df80ea116
// https://www.d3-graph-gallery.com/graph/barplot_stacked_hover.html
// http://learnjsdata.com/group_data.html