
// SVG Canvas Definition  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Define margin and canvas size
// - Credit margining style to Mike Bostock  (also just common D3 best practice)
const margin = {top: 20, right: 40, bottom: 60, left: 120}

// Set width and height of the graph canvas
// - note that this will be smaller than the SVG canvas
const svgWidth = 800
    , svgHeight = 600
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
                .style("border", "black")
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
// CHART 2 Canvas
// 

// Now draw the SVG canvas and a 'g' element to house our graph
var svg2 = d3.select("#barsTopCancer").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight/2)
    // .attr("transform", "translate(0," + margin.top*2 + ")")

// Append 'g' element to contain graph and adjust it to fit within the margin
var barChart = svg2.append("g")
                  .attr("id", "dynaBars")
                  .attr("transform", "translate(" + 2*margin.left + "," + margin.top + ")")


function parseSubsetValues(entry, subsetKeys, randOffset) {
    subsets = {}
    subsetKeys.forEach(d=>{
        if (randOffset==true) {
            subsets[d] = +entry[d] + getRndPercentError() * +entry[d]
        } else {
            subsets[d] = +entry[d]
        }
    })
    return subsets
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// DATA PROCESSING FUNCTIONS

function formatCancerData(rawData, randOffset=false) {

    // var cancer_by_type = d3.map();
    var cancerByType = {};

    subsetKeys = ['rate']

    for (var i = 1; i<rawData.length; i++){

        entry = rawData[i]
        cancerID = entry.cancer

        if (cancerID in cancerByType) {
            cancerByType[entry.cancer][entry.id] = parseSubsetValues(entry, subsetKeys, randOffset)
        } else {
            cancerByType[entry.cancer] = {}
            cancerByType[entry.cancer][entry.id] = parseSubsetValues(entry, subsetKeys, randOffset)
        }
    }
    return cancerByType
}

function formatIndustryData(rawData) {
    // var industryByType = d3.map();
    var industryByType = {};

    subsetKeys = ['emp', 'payann', 'estab', 'ACID', 'ENRG', 'ETOX', 'EUTR', 'FOOD', 'GCC', 'HAPS', 'HAZW', 'HC',
    'HNC', 'HRSP', 'HTOX', 'JOBS', 'LAND', 'METL', 'MINE', 'MSW', 'NREN',
    'OZON', 'PEST', 'REN', 'SMOG', 'VADD', 'WATR']

    for (var i = 1; i<rawData.length; i++){

        entry = rawData[i]
        industryID = entry.relevant_naics

        if (industryID in industryByType) {
            industryByType[entry.relevant_naics][entry.id] = parseSubsetValues(entry, subsetKeys)
        } else {
            industryByType[entry.relevant_naics] = {}
            industryByType[entry.relevant_naics][entry.id] = parseSubsetValues(entry, subsetKeys)
        }
    }
    return industryByType
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// HELPER FUNCTIONS
// 

function getRndPercentError() {
    signRnd = Math.random()
    if (signRnd < 0.5) {
        return Math.random() * 0.05 
    } else {
        return -1 * Math.random() * 0.05
    }
    // Source: https://www.w3schools.com/js/js_random.asp
  }

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function getFormValues(elementID){

    if (elementID == "dataSetOption") {
        // Pick which data view is selected in radio buttons
        var form = document.getElementById("dataSetOption")
        var viewType;
        for(var i=0; i<form.length; i++){
        if(form[i].checked){
            viewType = form[i].id;}}

        return viewType

    } else if (elementID == "colorScaleOption") {
        // Pick which data view is selected in radio buttons
        var form = document.getElementById("colorScaleOption")
        var viewType;
        for(var i=0; i<form.length; i++){
        if(form[i].checked){
            viewType = form[i].id;}}

        return viewType

    } else if(elementID == "dataSelector") {
        // Get slected value of data type
        var sel = document.getElementById('dataSelector')
        dataType = sel.options[sel.selectedIndex].value

        return dataType
    } else if (elementID == "detailSelector") {
        // Get slected value of data type
        var sel = document.getElementById('detailSelector')
        dataType = sel.options[sel.selectedIndex].value

        return dataType
    }
}

function define_colormap(dataID, allData, scaleType, whichVal){

    // Get the data to scale
    var thisData = allData[dataID]

    // Rate Value processing if continout scale
    if (scaleType.includes("continuous")) {

        // Get the range of data rate values
        rateVals = [];
        for(var key in thisData) {
            rateVals.push(thisData[key][whichVal]);
        }

        rate_max = Math.ceil(d3.max(rateVals) / 10) * 10
        // rate_max = 100
        rate_step = Math.floor(rate_max / 9)

    }

    // Color mapping
    if (scaleType == "continuous-linear"){
    
        var colormap = d3.scaleThreshold()
            .range(d3.schemePuRd[9])
            .domain(d3.range(rate_step, rate_max+rate_step, rate_step));
        
        return colormap

    } else if (scaleType == "continuous-log"){

        var logScale = d3.scaleLog()
            .domain([1, rate_max])
            // .range([0,1])
    
        var thresholdScale = d3.scaleThreshold()
            .range([d3.schemePuRd[9][0]].concat(d3.schemePuRd[9]))
            .domain(d3.range(0.1, 1.1, 0.1))

        var colormap = function(d) {
            if (d<=0) { d=1}
            return thresholdScale(logScale(d))
        }
        
        return colormap
    } else if (scaleType == "diverging") {
        color_diverging = d3.scaleDiverging([-100.0, 0, 100], d3.interpolatePuOr)
        
        var colormap = function(d){
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
    .style("stroke-opacity", 0)

}

function clicked(d) {
    
    resetStyle()
    // Add stroke to selected county
    d3.select(this).style("stroke-opacity", 1)

    // Get the state fips code for the selected county
    var stateFIPS = d.id.substr(0,2)
    var countyFIPS = d.id    

    // Pick the state to zoom to
    us_topojson.objects.states.geometries.forEach(d => {
        if (d.id == stateFIPS){
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

    // Log top rates

    // var detailToPlot = getFormValues("detailSelector")
    var barData = topRatesInFips(cancerData, cancerNames, countyFIPS, howMany=5)
    drawBars(barData, isUpdate=true)

}

function zoomed() {
    const {transform} = d3.event;
    mapChart.attr("transform", transform);
    mapChart.attr("stroke-width", 1 / transform.k);
}

function topRatesInFips(dataSet, dataNames, fips, howMany, whichVal="rate"){

    rates_dict = {}
    rates_list = []

    selectedFIPS = fips

    Object.keys(dataSet.ActualRate).forEach( this_key=>{
        // this_key = parseInt(d.split("$")[1])
        if (this_key!=1){
            this_rate = dataSet.ActualRate[this_key]
            if (this_rate.hasOwnProperty(fips)){ 
                rates_dict[this_key] = parseFloat(this_rate[fips][whichVal])
                rates_list.push(parseFloat(this_rate[fips][whichVal]))
            } else {
                rates_dict[this_key] = 0.0
                rates_list.push(0.0)
            }
        }
    })

    rates_list = rates_list.sort(function(a,b) { return a - b;}).reverse()

    top_data_list = []
    top_data_ids = []
    naCount = 1
    for (var i=0; i<howMany; i++) {
        id = parseInt(getKeyByValue(rates_dict, rates_list[i]))

        // console.log(rates_list)
        // console.log(rates_dict)
        // console.log(dataSet.ActualRate)
        // console.log(id)

        rateInFips = dataSet.ActualRate[id][fips][whichVal]
        predictedRateInFips = dataSet.PredictedActualRate[id][fips][whichVal]
        if (rateInFips == null) {
            rateInFips = 1
            top_data_list.push(
                {'data_id': dataNames[id], 'rate': 1, 'ratePredicted': 1}
            )
        } else if (rateInFips==0) {
            top_data_list.push(
                {'data_id': 'NA-' + naCount, 'rate': 0.0, 'ratePredicted': 0.0}
            )
            naCount++

        } else {
            top_data_list.push(
                {'data_id': dataNames[id], 'rate': rateInFips, 'ratePredicted': predictedRateInFips}
            )
            top_data_ids.push(id)
        }
    }

    // var viewOptions = getFormValues()
    // selectedDataID = parseInt(getKeyByValue(vizDataNames, viewOptions[0]))

    return top_data_list
}


// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// LOAD DATA
// 
var promises = [
    d3.json("./resources/us-10m.v1.json"),
    d3.tsv("./resources/cancer_byCounty_byType.tsv"),
    d3.csv("./resources/cancer_ID_list.csv"),
    d3.tsv("./resources/industry_byCounty_byType.tsv"),
    d3.csv("./resources/industry_ID_list.csv")
]

Promise.all(promises).then(ready)

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// MAIN RUN
// 
function ready(values) {

    // Load the topojson geographic boundary data 'as-is'
    us_topojson = values[0];

    // Load and process the cancer data
    cancerData = {
        'ActualRate': formatCancerData(values[1], randOffset=false),
        'DeltaRate': formatCancerData(values[1], randOffset=false),
        'PredictedActualRate': formatCancerData(values[1], randOffset=true)
    }

    cancerNames = {}
    values[2].forEach(function(item){
        cancerNames[+item.Cancer_ID] = item.Cancer_Description
    })

    // Load and process the industry data
    industryData = {
        'ActualRate': formatIndustryData(values[3]),
        // 'DeltaRate': formatIndustryData(values[3])
    }

    industryNames = {}
    values[4].forEach(function(item){
        industryNames[+item.relevant_naics] = item.industry_detail
    })

    // Determine which data to plot
    updateAll(getFormValues('dataSetOption'), isUpdate=false)
    reset()


    // Updates for selector
    d3.select('#dataSelector')
        .on('change', val => {
            updateMap(vizData, isUpdate=true)
        })

    d3.select('#detailSelector')
        .on('change', val => {
            updateMap(vizData, isUpdate=true)
        })

    // DATA VIEW
    // - Add interactivity on radio button change
    d3.select("#colorScaleOption")
        .on("change", val => {
            // updateAll(getFormValues('dataSetOption'), isUpdate=true)
            updateMap(vizData, isUpdate=true)
        })

    // - Add interactivity on radio button change
    d3.select("#dataSetOption")
        .on("change", val => {
            updateAll(getFormValues('dataSetOption'), isUpdate=true)
            // updateMap(vizData, isUpdate=true)
        })

    // View Reset button
    d3.select("#resetViewButton")
        .on("click", reset)

}


function updateAll(whichDataSet, isUpdate){
    // whichDataSet can be either "industry" for "cancer"

    if (whichDataSet == "cancer") {
        vizData = cancerData;
        vizDataNames = cancerNames;
        initVizDataID = 53;
        // barChartVal = "rate"

    } else if (whichDataSet == "industry"){
        vizData = industryData;
        vizDataNames = industryNames;
        initVizDataID = 11;
        // barChartVal = "emp"
    }

    // Draw the primary selector box
    dataOptions = [];
    Object.keys(vizData.ActualRate).forEach( k=> {
        // newKey = parseInt(d.split("$")[1])
        // dataOptions.push(newKey)
        dataOptions.push(vizDataNames[k])
    })
    drawSelectorBox(dataOptions, "form1", "dataSelector", isUpdate)

    // Draw the secondary selector box
    dataOption = getKeyByValue(vizDataNames, getFormValues("dataSelector"))
    detailOptions = Object.keys(vizData.ActualRate[dataOption][10001])
    drawSelectorBox(detailOptions, "form2", "detailSelector", isUpdate)


    // Draw the choropleth
    updateMap(vizData, isUpdate)

    // Draw the bar graph
    startUpFIPS = 21197
    barData = topRatesInFips(cancerData, cancerNames, startUpFIPS, howMany=5)
    drawBars(barData, isUpdate)
}

// Update Functions
var updateMap = function(dataSet, isUpdate){

    console.log("UPDATE")

    // Determin which values to draw
    // rateType = getFormValues("colorScaleOption")
    rateType = "ActualRate"
    dataID = parseInt(getKeyByValue(vizDataNames, getFormValues("dataSelector")))
    // dataID = parseInt(dataOption)
    detailValToPlot = getFormValues("detailSelector")
    console.log(getFormValues('colorScaleOption'))

    colorScaleType = getFormValues('colorScaleOption')

    var selectedData = dataSet[rateType]


    if (rateType=="ActualRate"){
        // Pick continuous colorscale to show the range of values
        colormap = define_colormap(dataID, selectedData, scaleType=colorScaleType, whichVal=detailValToPlot)
    } else {
        // pick diverging color scale to properly show + or - changes
        colormap = define_colormap(dataID, selectedData, scaleType="diverging", whichVal=detailValToPlot)
    }

    drawChoropleth(us_topojson, selectedData, dataID, colormap, isUpdate, whichVal)
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// DATA SELECTOR - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// 
function drawSelectorBox(dataOptions, selectorDivID, newSelectorID, isUpdate) {

    if (isUpdate==false) {
        // Draw the Data type selector with D3
        // d3.select('#dataSelector')
        d3.select('#' + selectorDivID)
            .append('select')
            .attr('class','select')
            .attr('id', newSelectorID)
            .selectAll('option')
                .data(dataOptions).enter()
                .append('option')
                .text(d => d)

    } else if (isUpdate==true) {
        d3.select('#' + selectorDivID)
            .selectAll('option')
            .remove()

        d3.select('#' + selectorDivID)
            .select('#' + newSelectorID)
            .selectAll('option')
                .data(dataOptions).enter()
                .append('option')
                .text(d => d)
    }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// BAR CHART - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// 
function drawBars(barData, isUpdate) {

    barChart = d3.select("#dynaBars")

    // SCALES - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //
    // Set up a dynamic scale for the x-axis
    xMaxBar = d3.max(barData, function(d) { return d.rate }),
    xMinBar = d3.min(barData, function(d) { return d.rate }),
    xScaleBar = d3.scaleLinear()
            .domain([0, 250])              // domain of inputs;
            .range([0, width])  // range of output draw coords in px
            // .clamp()

    var y1 = d3.scaleBand()
        .domain(barData.map(function(d) { return d.data_id }))
        .range([0, height/2])
        .padding(0.2)

    // Axes - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //
    // Set up a dynamic x-axis

    var xAxis = d3.axisBottom()
                .scale(xScaleBar)
                .tickSize(5)
                
    // Y Axis
    var yAxis = d3.axisLeft()
                .scale(y1)
                .ticks(10)

    var barColor = 'rgb(150, 163, 168)'

    
    if (isUpdate==false) {

        // Enter the bars d3 object to run the drawing loop for each item in the dataset
        barChart.selectAll('rect')
            .data(barData)
        .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => y1(d.data_id) )
            .attr('width', d => xScaleBar(d.rate) )
            .attr('height', y1.bandwidth() )
            .style('fill', 'rgb(152, 231, 237)')
            .on("mouseover", function(d) {
                d3.select(this).style("fill", d3.rgb(barColor).darker(2));
            })
            .on("mouseout", function(d) {
                d3.select(this).style("fill", barColor);
            })
            // .attr('hello', d => {
            //     console.log(d)
            //     console.log(xScaleBar(d.rate))
            // })
            // .style('opacity', 0.0)

        
        barChart.append('g')        
            .attr("id", "barNames")     
            .attr("fill", "white")
            // .attr("text-anchor", "end")
            // .style("font", "12px sans-serif")
        .selectAll('text')
            .data(barData)
        .enter()
            .append('text')
            .attr('x', d => xScaleBar(d.rate)/2)
            .attr('y', d => y1(d.data_id) )
            .text( d=> {d.data_id})
            // .attr('width', d => xScaleBar(d.rate) )
            // .attr('height', y1.bandwidth() )
        barChart.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        // .style('opacity', 0.0)

        barChart.append('g')
            .attr('class', 'x axis')
            .call(xAxis)
            .attr('transform', 'translate(0,' + height/2 + ')')

    } else {

        barChart.select('.x.axis')
            .transition()
            .duration(transition_time)
            .call(xAxis)
            // .style('opacity', 1.0)

        barChart.select('.y.axis')
            .transition()
            .duration(transition_time)
            .call(yAxis)
            // .style('opacity', 1.0)

        barChart.selectAll('rect')
            // .attr('hello_data', d=>{console.log(barData)})
            .data(barData)
            .transition()
            .duration(transition_time)
            // .ease(d3.easeElasticOut)
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => y1(d.data_id) )
            .attr('width', d => xScaleBar(d.rate) )
            .attr('height', y1.bandwidth() )
            // .attr('hello', d => {
                // return 'world'
            // })
            // .style('opacity', 1.0)

        barChart.select('#barNames')
            .data(barData)
            .transition()
        // .enter()
            .attr('x', d => xScaleBar(d.rate)/2)
            .attr('y', d => y1(d.data_id) )
            .text( d=> {d.data_id})

    }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// MAP DRAW
// 
function drawChoropleth(topoUS, allDataTypes, dataID, colormap, isUpdate, whichVal) {

    thisData = allDataTypes[dataID]

    if (isUpdate===false){


        mapChart.append("path")
            .attr("d", path(topojson.feature(topoUS, topoUS.objects.nation)))
            .style("fill", "url(#smalldot)")
            .style("stroke", "black")
            .style("stroke-width", 1)

        mapChart.append("g")
        .attr('id', 'renderedCounties')
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(topoUS, topoUS.objects.counties).features)
      .enter()
        .append("path")
        .on("click", clicked)
        .on("dblclick", reset)
        .style("fill", d=>{
            thisSet = thisData[d.id]
            if (thisSet == null) {
                d.rate = 0
            } else {
                d.rate = thisSet[whichVal]
            }
            return colormap(d.rate)
        })
        .style("stroke", "black")
        .style("stroke-width", 0.3)
        .style("stroke-opacity", 0)
        .attr("d", path)
        .append("title")
            .text(function(d) { return d.id; });
        
        mapChart.append("path")
            .datum(topojson.mesh(topoUS, topoUS.objects.states, function(a, b) { return a !== b; }))
            .attr("class", "states")
            .style("stroke", "#aaabad")
            .style("stroke-width", 1)
            .attr("d", path);



    } else {
        mapChart
            .select('#renderedCounties')
            .selectAll('path')
            .data(topojson.feature(topoUS, topoUS.objects.counties).features)
            .style("fill", d=>{
                thisSet = thisData[d.id]
                if (thisSet == null) {
                    d.rate = 0
                } else {
                    d.rate = thisSet[whichVal]
                }
                return colormap(d.rate)
            })
            .attr("d", path)
            // .append("title")
            //     .text(function(d) { return d.rate; });
    }
    
}


