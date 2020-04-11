
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

    var cancer_by_type = d3.map();

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


function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

//
// Load the topojson and cancer rate data
//
var promises = [
d3.json("https://d3js.org/us-10m.v1.json"),
d3.tsv("cancer_byCounty_byType.tsv"),
d3.csv("cancer_ID_list.csv")
]

Promise.all(promises).then(ready)

//
// Define runtime function
//
function ready(values) {

    var us_topojson = values[0];
    cancer_byType = formatData(values[1], 'rate');


    cancer_dict = {}
    values[2].forEach(function(item){
        cancer_dict[+item.Cancer_ID] = item.Cancer_Description
    })


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    // DATA SELECTOR - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // 

    // Get cancer keys
    cancer_keys = [];
    for (var i=0; i<Object.keys(cancer_byType).length; i++){
        new_key = parseInt(Object.keys(cancer_byType)[i].split("$")[1])
        // cancer_keys.push(new_key)
        cancer_keys.push(cancer_dict[new_key])
    }


    // Get the available years in the data set to populate the selector
    var availableCancerIDs = cancer_keys;

    // Draw the selector with D3
    cancerSelectBox = d3.select('#dataSelector')
        .append('select')
        .attr('class','select')
        .attr('id', 'hitme')
        .on('change', val => {

            var viewOptions = getFormValues()
            selected_cancer_id = parseInt(getKeyByValue(cancer_dict, viewOptions[0]))

            updateMap(cancer_id=selected_cancer_id, isUpdate=true)
        })

    var options = cancerSelectBox
        .selectAll('option')
            .data(availableCancerIDs).enter()
            .append('option')
                .text(d => d)

    var dataDim = d3.select("#dataView")
        .on("change", val => {

            var viewOptions = getFormValues()
            selected_cancer_id = parseInt(getKeyByValue(cancer_dict, viewOptions[0]))
            
            updateMap(cancer_id=selected_cancer_id, isUpdate=true)
        })

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    // COLOR MAP DEFINITION  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //
    define_colormap = function(cancer_id, cancer_byType, scale_type){

        // Get the cancer to scale
        var this_cancer = cancer_byType.get(cancer_id)

        if (scale_type == "linear"){
            // Get the range of cancer rate values
            rate_vals = [];
            for(var key in this_cancer) {
                rate_vals.push(this_cancer[key]);
            }
        
            rate_max = Math.ceil(d3.max(rate_vals) / 10) * 10
            rate_step = rate_max / 9


            var x = d3.scaleLinear()
                .rangeRound([600, 860])
                .domain([1, rate_max]);
        
            var colormap = d3.scaleThreshold()
                .range(d3.schemePuRd[9])
                .domain(d3.range(rate_step, rate_max+rate_step, rate_step));
            
            return colormap
        } else {
            extent = [-50.0, 50.0]
            color_diverging = d3.scaleDiverging([-50.0, 0, 50], d3.interpolatePuOr)
                                // .domain([extent[0], 0, extent[1]])
                                // .interpolator(d3.interpolateRdBu)
        
            
            colormap = function(d){
                if (Math.abs(d)>99.9){
                    d = 0
                }
                return color_diverging(d)
            }

            return colormap
        }
    }


    var getFormValues = function(){
        // Pick which data view is selected in radio buttons
        var form = document.getElementById("dataView")
        var view_type;
        for(var i=0; i<form.length; i++){
        if(form[i].checked){
            view_type = form[i].id;}}

        // Get slected value of cancer type
        var sel = document.getElementById('hitme')
        cancer_type = sel.options[sel.selectedIndex].value

        return [cancer_type, view_type]
    }


    var updateMap = function(cancer_id, isUpdate){
        
        colormap = define_colormap(cancer_id, cancer_byType, scale_type="linear")
        drawCancerMap(us_topojson, cancer_byType, cancer_id, colormap, isUpdate)

    }

    // updateMap()

    // drawCancerMap(us_topojson, cancer_byType, cancer_to_plot, colormap, isUpdate=false)

    updateMap(1, isUpdate=false)

}

function drawCancerMap(us_data, all_cancers, cancer_id, colormap, isUpdate) {

    this_cancer = all_cancers.get(cancer_id)

    //
    // Establish Scales for the legend and colormap
    //

    // Configure the paths and scales
    var path = d3.geoPath();

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
        .style("fill", function(d) { return colormap(d.rate = this_cancer[d.id]); })
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
            .style("fill", function(d) { return colormap(d.rate = this_cancer[d.id]); })
    }
    
}


