
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


// Define a function to format and process the cancer data
var formatData = function(rawData, rate_col_title) {

    cancer_by_type = d3.map();

    for (var i = 1; i<rawData.length; i++){

        entry = rawData[i]
        cancer_id = "$" + entry.cancer

        if (cancer_id in cancer_by_type) {
            this_cancer = cancer_by_type.get(entry.cancer)
            this_cancer[entry.id] = +entry[rate_col_title];
        } else {
            id = entry.id;
            cancer_by_type.set(entry.cancer, {id: +entry[rate_col_title]})
        }
    }
    return cancer_by_type
}


//
// Load the topojson and cancer rate data
//
var promises = [
d3.json("https://d3js.org/us-10m.v1.json"),
d3.tsv("cancer_byCounty_byType.tsv")
]

Promise.all(promises).then(ready)





//
// Define runtime function
//
function ready(values) {

    var us_topojson = values[0];
    test = values[1];
    cancer_byType = formatData(values[1], 'rate_delta_percent');

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// DATA SELECTOR - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// 

    // Get cancer keys
    cancer_keys = [];
    for (var i=0; i<Object.keys(cancer_by_type).length; i++){
        new_key = parseInt(Object.keys(cancer_by_type)[i].split("$")[1])
        cancer_keys.push(new_key)
    }


    // Get the available years in the data set to populate the selector
    var availableCancerIDs = cancer_keys;

    // Draw the selector with D3
    var cancerSelectBox = d3.select('#dataSelector')
        .append('select')
            .attr('class','select')
            .on('change', val => {
                selectValue = d3.select('select').property('value')
                updateMap(cancer_id=selectValue, isUpdate=true)
            })

    var options = cancerSelectBox
        .selectAll('option')
            .data(availableCancerIDs).enter()
            .append('option')
                .text(d => d)

    // Start Drawing
    cancer_to_plot = 71

    var updateMap = function(cancer_id, isUpdate){
        drawCancerMap(us_topojson, cancer_byType, cancer_id, isUpdate)
    }

    // updateMap()

    drawCancerMap(us_topojson, cancer_byType, cancer_to_plot, isUpdate=false)

}

function drawCancerMap(us_data, cancer_data, cancer_id, isUpdate) {

    this_cancer = cancer_data.get(cancer_id)

    //
    // Establish Scales for the legend and colormap
    //

    // Configure the paths and scales
    var path = d3.geoPath();

    var x = d3.scaleLinear()
        .rangeRound([600, 860]);

    var color = d3.scaleThreshold()
            .range(d3.schemePuRd[9]);


    // Get the range of cancer rate values
    rate_vals = [];
    for(var key in this_cancer) {
        rate_vals.push(this_cancer[key]);
    }

    rate_max = Math.ceil(d3.max(rate_vals) / 10) * 10
    rate_step = rate_max / 9

    // Set the domains for the x and color scales
    x.domain([1, rate_max]);
    color.domain(d3.range(rate_step, rate_max+rate_step, rate_step));



    //
    // Draw the map
    //

    if (isUpdate===false){
        mapChart.append("g")
        .attr('id', 'renderedCounties')
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us_data, us_data.objects.counties).features)
      .enter()
        .append("path")
        .style("fill", function(d) { return color(d.rate = this_cancer[d.id]); })
        .attr("d", path)
        // .append("title")
        //     .text(function(d) { return d.rate + "%"; });
        
        mapChart.append("path")
            .datum(topojson.mesh(us_data, us_data.objects.states, function(a, b) { return a !== b; }))
            .attr("class", "states")
            .attr("d", path);
    } else {
        mapChart
            .select('#renderedCounties')
            .selectAll('path')
            .data(topojson.feature(us_data, us_data.objects.counties).features)
            .style("fill", function(d) { return color(d.rate = this_cancer[d.id]); })
    }
    
}


