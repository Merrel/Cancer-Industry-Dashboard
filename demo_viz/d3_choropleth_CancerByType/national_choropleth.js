
// SVG Canvas Definition  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Define margin and canvas size
// - Credit margining style to Mike Bostock  (also just common D3 best practice)
const margin = {top: 15, right: 90, bottom: 10, left: 10}

// Set width and height of the graph canvas
// - note that this will be smaller than the SVG canvas
const svgWidth = 1075
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
                .on("click", reset);

// Append 'g' element to contain graph and adjust it to fit within the margin
var mapChart =  svg1.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

// Configure the paths
var path = d3.geoPath();

// Set up zoom levels
const zoom = d3.zoom()
    .scaleExtent([1,8])
    .on("zoom", zoomed)

svg1.call(zoom)

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// DATA PROCESSING FUNCTIONS
// 
// Define a function to format and process the cancer data
function formatData(rawData, rate_col_title) {

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

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// HELPER FUNCTIONS
// 
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function getFormValues(){
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

function define_colormap(cancer_id, allCancer, scale_type){

    // Get the cancer to scale
    var thisCancer = allCancer.get(cancer_id)

    if (scale_type == "linear"){
        // Get the range of cancer rate values
        rate_vals = [];
        for(var key in thisCancer) {
            rate_vals.push(thisCancer[key]);
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
        color_diverging = d3.scaleDiverging([-100.0, 0, 100], d3.interpolatePuOr)
                            // .domain([extent[0], 0, extent[1]])
                            // .interpolator(d3.interpolateRdBu)
    
        
        colormap = function(d){
            if (Math.abs(d)==100){
                d = 0
            }
            return color_diverging(d)
        }

        return colormap
    }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// INTERACTION FUNCTIONS
// 

function reset() {
    resetStyle()
    svg1.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(svg1.node()).invert([width / 2, height / 2])
    );
}

function resetStyle() {

    mapChart
    .select('#renderedCounties')
    .selectAll('path')
    .data(topojson.feature(us_topojson, us_topojson.objects.counties).features)
    // .style("fill", function(d) { return colormap(d.rate = this_cancer[d.id]); })
    .style("stroke-opacity", 0)

}


function clicked(d) {
    
    resetStyle()
    // Add stroke to selected county
    d3.select(this).style("stroke-opacity", 1)

    // Get the state fips code for the selected county
    var state_fips = d.id.substr(0,2)

    // Pick the state to zoom to
    us_topojson.objects.states.geometries.forEach(d => {
        if (d.id == state_fips){
            d_state = d
        }
    })
    this_state = {type: "GeometryCollection", geometries: [d_state]}
    state_geo = topojson.feature(us_topojson, this_state).features[0]

    // Zoom to path bounds
    const [[x0, y0], [x1, y1]] = path.bounds(state_geo);
    d3.event.stopPropagation();
    svg1.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      d3.mouse(svg1.node())
    );
  }

  function zoomed() {
    const {transform} = d3.event;
    mapChart.attr("transform", transform);
    mapChart.attr("stroke-width", 1 / transform.k);
  }

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// LOAD DATA
// 
var promises = [
d3.json("https://d3js.org/us-10m.v1.json"),
d3.tsv("cancer_byCounty_byType.tsv"),
d3.csv("cancer_ID_list.csv")
]

Promise.all(promises).then(ready)

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// MAIN RUN
// 
function ready(values) {

    us_topojson = values[0];
    cancerData = {
        'ActualRate': formatData(values[1], 'rate'),
        'DeltaRate': formatData(values[1], 'rate_delta_percent')
    }

    var cancer_dict = {}
    values[2].forEach(function(item){
        cancer_dict[+item.Cancer_ID] = item.Cancer_Description
    })


    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    // DATA SELECTOR - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // 

    // Get cancer keys
    var cancer_keys = [];
    for (var i=0; i<Object.keys(cancerData['ActualRate']).length; i++){
        new_key = parseInt(Object.keys(cancerData['ActualRate'])[i].split("$")[1])
        // cancer_keys.push(new_key)
        cancer_keys.push(cancer_dict[new_key])
    }

    // CANCER TYPE
    // Draw the cancert type selector with D3
    d3.select('#dataSelector')
        .append('select')
        .attr('class','select')
        .attr('id', 'hitme')
        .on('change', val => {

            var viewOptions = getFormValues()
            selected_cancer_id = parseInt(getKeyByValue(cancer_dict, viewOptions[0]))
            selected_rate_type = viewOptions[1]

            updateMap(cancer_id=selected_cancer_id, selected_rate_type, isUpdate=true)
        })
        .selectAll('option')
            .data(cancer_keys).enter()
            .append('option')
                .text(d => d)

    // DATA VIEW
    // - Add interactivity on radio button change
    d3.select("#dataView")
        .on("change", val => {

            var viewOptions = getFormValues()
            selected_cancer_id = parseInt(getKeyByValue(cancer_dict, viewOptions[0]))
            selected_rate_type = viewOptions[1]
            
            updateMap(cancer_id=selected_cancer_id, selected_rate_type, isUpdate=true)
        })


    var updateMap = function(cancer_id, rateType, isUpdate){

        if (rateType=="ActualRate"){
            var selectedCancerData = cancerData['ActualRate']
            colormap = define_colormap(cancer_id, selectedCancerData, scale_type="linear")
        } else {

        var selectedCancerData = cancerData['DeltaRate']
        colormap = define_colormap(cancer_id, selectedCancerData, scale_type="diverging")
        }
        
        drawCancerMap(us_topojson, selectedCancerData, cancer_id, colormap, isUpdate)
    }

    updateMap(1, "DeltaRate", isUpdate=false)

}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// MAP DRAW
// 
function drawCancerMap(us_data, all_cancers, cancer_id, colormap, isUpdate) {

    this_cancer = all_cancers.get(cancer_id)

    //
    // Establish Scales for the legend and colormap
    //

    //
    // Draw the map
    //

    if (isUpdate===false){


        mapChart.append("path")
            .attr("d", path(topojson.feature(us_data, us_data.objects.nation)))
            .style("fill", "url(#smalldot)")
            .style("stroke", "black")
            .style("stroke-width", 1)

        mapChart.append("g")
        .attr('id', 'renderedCounties')
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us_data, us_data.objects.counties).features)
      .enter()
        .append("path")
        .on("click", clicked)
        .on("dblclick", reset)
        .style("fill", function(d) { return colormap(d.rate = this_cancer[d.id]); })
        .style("stroke", "black")
        .style("stroke-width", 0.3)
        .style("stroke-opacity", 0)
        .attr("d", path)
        .append("title")
            .text(function(d) { return d.id; });
        
        mapChart.append("path")
            .datum(topojson.mesh(us_data, us_data.objects.states, function(a, b) { return a !== b; }))
            .attr("class", "states")
            .style("stroke", "#aaabad")
            .style("stroke-width", 1)
            .attr("d", path);



    } else {
        mapChart
            .select('#renderedCounties')
            .selectAll('path')
            .data(topojson.feature(us_data, us_data.objects.counties).features)
            .style("fill", function(d) { return colormap(d.rate = this_cancer[d.id]); })
            .attr("d", path)
            // .append("title")
            //     .text(function(d) { return d.rate; });
    }
    
}


