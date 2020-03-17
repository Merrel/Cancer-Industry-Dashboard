
// 
// Start some helper functions  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//

// Time Parseing function
var parseTime = d3.timeParse("%Y")

// Define functions to format and wrangle data

var formatData = function(rawData) {
    return convertDataTypes(rawData)
}


var convertDataTypes = function(d) {
    // Header
    // States, Region, 2010, 2011, 2012, 2013, 2014, 2015, Total Earthquakes
    return {
        state: d['States'],
        region: d['Region'],
        totalQuakes: +d['Total Earthquakes'],
        2010: +d['2010'],
        2011: +d['2011'],
        2012: +d['2012'],
        2013: +d['2013'],
        2014: +d['2014'],
        2015: +d['2015']
    }
}


var nestByYear = function(dataByState, years) {
    // Flatten the dataset
    flat = []
    // Loop over each state (which contains data from multiple years)
    dataByState.forEach(function(d) {
        // Loop over each unique year in the dataset  -- could add logic here to fill missing data
        years.forEach(function(year) {
        // Rebuild a year object for each year/state combo
            flat.push({
                year: year,
                state: d.state,
                region: d.region,
                totalQuakes: d.totalQuakes,
                yearQuakes: d[year]
            })
        })
    })

    // Renest the data set by year
    dataByYear = d3.nest()
                .key(d=>d.year)
                .entries(flat)
    
    return dataByYear
}


var yearArrayToObj = function(dataByYear) {
    dataPerYear = {}
    dataByYear.forEach(function(nested) {
        dataPerYear[nested.key] = nested.values
    })
    return dataPerYear
}


var assignStateDataValues = function(propertyData, geoDataFeatures) {
    for (var i = 0; i < propertyData.length; i++) {

        //Grab state name
        var dataState = propertyData[i].state

        //Grab data value, and convert from string to float
        // var dataValue = parseFloat(propertyData[i].yearQuakes)
        // var dataValue = 100*Math.random()
        var dataValue = 10
        var dataRegion = propertyData[i].region
        var dataYear = propertyData[i].year

        //Find the corresponding state inside the GeoJSON
        for (var j = 0; j < geoDataFeatures.length; j++) {

            var jsonState = geoDataFeatures[j].properties.name

            if (dataState == jsonState) {

                //Copy the data value into the JSON
                geoDataFeatures[j].properties.value = dataValue
                geoDataFeatures[j].properties.region = dataRegion
                geoDataFeatures[j].properties.year = dataYear

                //Stop looking through the JSON
                break

            }
        }
    }
}


var parseDateString = function(s) {
    dateRE = /[a-zA-Z]{3} \d{2} \d{4}/
    dateString = s.match(dateRE)[0]
    return d3.timeParse("%b %d %Y")(dateString)
}

// SVG Canvas Definition  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Define margin and canvas size
// - Credit margining style to Mike Bostock  (also just common D3 best practice)
var margin = {top: 15, right: 90, bottom: 10, left: 10}

// Set width and height of the graph canvas
// - note that this will be smaller than the SVG canvas
var svgWidth = 1075
  , svgHeight = 635
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
var svg1 =    d3.select("#choropleth").append("svg")
                .attr("width", svgWidth)
                .attr("height", svgHeight)

// Append 'g' element to contain graph and adjust it to fit within the margin
var mapChart =  svg1.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

// Instantiate the D3 map and path objects for later drawing
var map1 = d3.map()
  , projection = d3.geoAlbersUsa()
                //    .translate([width/2, height/2])
                //    .scale([1000])
  , path = d3.geoPath()
             .projection(projection)

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// COLOR SCALES
// 
// Instantiate the D3 'quantize' color scale with 9 distince color bins
// - VERY good reference on using quantize scales:
//   https://observablehq.com/@d3/quantile-quantize-and-threshold-scales
//   https://github.com/d3/d3-scale#quantize-scales

// Make the color scale by Log
logScale = d3.scaleLog()
             .range([0.1,1])

var nDiscreteColors = 9
colorScale =  d3.scaleQuantize()
                .domain(logScale.range())
                .range(d3.schemeReds[nDiscreteColors])

// LEGEND
// 
// Append 'g' element to contain legend
var legend1 = svg1.append("g")
                .attr('id', 'legend1')
                .attr("transform", 
                "translate(" + (svgWidth-margin.right*1.5-margin.left) + "," + margin.top*1.95 + ")")

// Add legend title annotation
svg1.append("g")
    .attr("class", "annotation")
    .attr("transform", 
        "translate(" + (svgWidth-margin.right*1.65-margin.left) + "," + margin.top*1.5 + ")")
    .append("text")
    .attr("text-anchor", "left") 
    .text("Earthquake Frequency")
    .style("font-size", "14px")
    .style("font-weight", "bold")


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// TOOL TIP using d3-tip
// 
// Set tooltips
const tool_tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .direction('n')
    .html( function(d) {
        return `<strong>State: </strong><span class='details'>${d.properties.name}<br></span>
                <strong>Region: </strong><span class='details'>${d.properties.region}<br></span>
                <strong>Year: </strong><span class='details'>${d.properties.year}<br></span>
                <strong>Earthquakes: </strong><span class='details'>${d.properties.value}</span>`
    })


svg1.call(tool_tip)

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// LOAD DATA - use javascript 'Promises' to load data before drawing
// 

var years = [2010, 2011, 2012, 2013, 2014, 2015]

var dataPromises = [
    d3.dsv(",", 'state-earthquakes.csv', formatData),
    d3.json("states-10m.json")
]

// Call on the promises --> Completes list of asynchronus operations (data loads in this case),
//                          Then runs specified function

check = []

Promise.all(dataPromises).then(function(promiseData) {

    // Capture and pre-process the state-earthquakes data
    var dataByState = promiseData[0]
      , dataByYear = nestByYear(dataByState, years)
      , dataPerYear = yearArrayToObj(dataByYear)
      // Capture the state geodata and extract the features
      , stateData = promiseData[1]
      , stateDataFeatures = topojson.feature(stateData, stateData.objects.states).features

    check.push(stateDataFeatures)
    // Filter our the state geo/topojson where the state name is not in the dataByState list
    // - Build a list of all the states in the data set
    var stateList = []
    dataByState.forEach(function(d) {
        stateList.push(d.state)
    })
    // Filter our all state geo features that are no included
    var stateDataFeatures = stateDataFeatures.filter(function(obj) {
        return stateList.includes(obj.properties.name)
    })

    // Merge the quake data with the topojson data


    drawChoropleth = function(selectedYear, isUpdate) {

        // Update the selected data
        data = dataPerYear[selectedYear]
        assignStateDataValues(data, stateDataFeatures)

        // Update the colorScale domain
        // colorScale.domain(d3.extent(data, d => d.yearQuakes))
        var yearQuakesMax = d3.max(data, d => d.yearQuakes)
        logScale.domain([1, yearQuakesMax])

        var legend_buffer = 5
        , legend_size = 24

        // Add a legend entry
        var legendPseudo = [0.100, 0.200, 0.300, 0.400, 0.500, 0.600, 0.700, 0.800, 0.900]

        // - color block
        if (isUpdate===false){

            // Draw the states
            mapChart.append('g')
            .attr('id', 'renderedStates')
            .attr('class', 'states')
            .selectAll('path')
            .data(stateDataFeatures)
          .enter()
            .append('path')
            .attr('d', path)
            .style('stroke', 'black') 
            .style('fill', d => colorScale(logScale(d.properties.value)))
            // .on('mouseover', function(d) {
            //     tool_tip.direction(function(d) {
            //         if (d.properties.region === 'Northeast') return 's'
            //         if (d.properties.region === 'South') return 'n'
            //         if (d.properties.region === 'Midwest') return 's'
            //         if (d.properties.region === 'West') return 'e'
            //     })
            //     tool_tip.attr('class', 'd3-tip animate').show(d)
            // })
            // .on('mouseout', function(d) {
            //     tool_tip.hide(d)
            // })

            legend1.selectAll('rect')
                   .data(legendPseudo)
                 .enter()
                 .append("rect")
                 .style("fill", d => colorScale(d))
                 .attr("x", 0)
                 .attr("y", function(d, i) {return (i*legend_size)} ) // 100 is where the first dot appears. 25 is the distance between dots
                 .attr("width", legend_size-legend_buffer)
                 .attr("height", legend_size-legend_buffer)

            // - legend text entry
            legend1.selectAll('text')
                .data(legendPseudo)
            .enter()
                .append("text")
                .attr('class', 'legend')
                .attr("x", legend_buffer+legend_size)
                .attr("y", (d, i) => i*(legend_size) + (legend_size/2) - (legend_buffer/2)  )
                .attr("text-anchor", "start") 
                .attr("dominant-baseline", "middle") 
                .text(d => Math.floor(logScale.invert(d))+' - '+Math.floor(logScale.invert(d+0.0999)))

        } else {
        
            mapChart.select('#renderedStates')
                    .selectAll('path')
                    .data(stateDataFeatures)
                    // .attr('d', path)
                    // .style('stroke', 'black') 
                    .style('fill', d => colorScale(logScale(d.properties.value)))


            legend1.selectAll('rect')
                .data(legendPseudo)
                .style("fill", d => colorScale(d))

            // - legend text entry
            legend1.selectAll('text')
                .data(legendPseudo)
                .text(d => Math.floor(logScale.invert(d))+' - '+Math.floor(logScale.invert(d+0.0999)))

        }
    }


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // D3 simple-slider to select year
    // 

    // We make a simple slider in a very similar fashion to the d3-axis call
    // 1. Define the slider object
    // 2. Define an SVG (instead of group) to house the slider and place it on the page
    // 3. call() the slider from the newly created svg to render it

    // var yearSlider = d3.sliderBottom()
    //                     .min(d3.min(years))
    //                     .max(d3.max(years))
    //                     .width(300)
    //                     .tickFormat(d3.format('c'))
    //                     .ticks(years.length)
    //                     .step(1)
    //                     .default(years[0])
    //                     .on('onchange', val => {
    //                         drawChoropleth(val, isUpdate=true)
    //                     })

    // var yearSliderSVG = d3.select('#year-selector')
    //                     .append('svg')
    //                     .attr('width', 600)
    //                     .attr('height', 60)
    //                     .append('g')
    //                     .attr('transform', 'translate(125,20)')

    // yearSliderSVG.call(yearSlider)

    // CALL THE CHART
    {
        drawChoropleth(years[0], isUpdate=false)
    }
    
})

// svg1.append("g")
//     .attr('class', 'annotation')
//     .attr('transform', 'translate(' + (0.85*svgWidth) + ', ' + svgHeight + ')')
//     .append("text")
//     .attr("text-anchor", "middle") 
//     .text("bmerrel3")


// Some good references
// https://bl.ocks.org/lbui30/e58fd812a3c14583fd47da8c17866042
// https://gist.github.com/dougdowson/9732115  -  reuseable bar chart
