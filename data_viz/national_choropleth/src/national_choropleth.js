
// SVG Canvas Definition  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Define margin and canvas size
// - Credit margining style to Mike Bostock  (also just common D3 best practice)
const margin = {top: 20, right: 40, bottom: 60, left: 120}

// Set width and height of the graph canvas
// - note that this will be smaller than the SVG canvas
const svgWidth = 1000
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

// Append 'g' element to contain graph legend and adjust it to fit within the margin
var svgLegend = d3.select("#mapLegend").append("svg")
    .attr("width", svgWidth)
    .attr("height", 50)
var mapLegend =  svgLegend.append("g")
                    .attr("transform", "translate(" + 0 + "," + margin.top + ")")
                    
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
                  .attr("transform", "translate(" + 1.5*margin.left + "," + margin.top + ")")



// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// CHART 3 Canvas
// 

// Now draw the SVG canvas and a 'g' element to house our graph
var svg3 = d3.select("#scatter").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
// .attr("transform", "translate(0," + margin.top*2 + ")")

// Append 'g' element to contain graph and adjust it to fit within the margin
var scatterChart = svg3.append("g")
    .attr("id", "scatterPlot")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")




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
// QUERY PREDICTIVE MODEL

function getEditedCancerValues(values){
    var cancer = predictOnModelOne(values)
    
    return cancer
}

function predictOnModelOne(industryValues){
    var weightArray = []
    var predictedIndicators = []

    d3.dsv(",", "../resources/weights1.csv", 
        function(d) {
            return d
        })
        .then(function(data){
            weights = data

            for (i = 0; i < 5; i++){
                weightArray.push(Object.values(weights[i]))
            }

            for (i = 0; i < 24; i++){
                indicator = parseFloat(weightArray[0][i])
                for (j = 0; j < 4; j++){
                    indicator += parseFloat(industryValues[j]) * parseFloat(weightArray[j+1][i])
                }
                predictedIndicators.push(indicator)
            }

        })

        // console.log(predictedIndicators)

        var cancerOutput = predictOnModelTwo(predictedIndicators)
        return cancerOutput
}

function predictOnModelTwo(indicators){

    var predictedCancer = []

    d3.dsv(",", "../resources/weights2.csv", 
        function(d) {
            return d
        })
        .then(function(data){
            weights = data
            var cancerCalc = parseFloat(weights[0].weights)

            for (i = 0; i < indicators.length; i++){
                cancerCalc += indicators[i] * parseFloat(weights[i+1].weights)
            }

            predictedCancer.push(cancerCalc)
            predictedCancer.push(20)
            predictedCancer.push(40)
            predictedCancer.push(60)
            predictedCancer.push(80)
            // more dummies
            // [23, 24, 25, 25].forEach( d=> {predictedCancer.push(d)})
        })


        return predictedCancer
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// HELPER FUNCTIONS

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

function ColorMap(scaleFunc, domain, range) {
    this.scaleFunc = scaleFunc
    this.domain = domain
    this.range = range
}

function define_colormap(dataID, allData, scaleType, whichVal){

    // Get the data to scale
    var thisData = allData[dataID]

    // Rate Value processing if continout scale
    // Get the range of data rate values
    rateVals = [];
    for(var key in thisData) {
        rateVals.push(thisData[key][whichVal]);
    }

    rate_max = Math.ceil(d3.max(rateVals) / 8) * 8
    // rate_max = 100
    rate_step = Math.floor(rate_max / 7)

    // Color mapping
    if (scaleType == "continuous-linear"){
    
        var colorScale = d3.scaleThreshold()
            .range(d3.schemePuRd[9])
            .domain(d3.range(0, rate_max+rate_step, rate_step));
        
        return new ColorMap(colorScale, colorScale.domain(), colorScale.range())

    } else if (scaleType == "continuous-log"){

        var logScale = d3.scaleLog()
            .range([0.1, 1])
            .domain([1,rate_max])
    
        var colorScale = d3.scaleQuantize()
            .range([d3.schemePuRd[9][0]].concat(d3.schemePuRd[8]))
            .domain(logScale.range())

        // return thresholdScale

        var scaleFunc = function(d) {
            if (d<=0) { d=1}
            return colorScale(logScale(d))
        }

        // Generate the domain
        var domain = []
        logvals = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        logvals.forEach(d=>{domain.push(logScale.invert(d))})
        
        return new ColorMap(scaleFunc, domain, colorScale.range())

    } else if (scaleType == "diverging") {
        color_diverging = d3.scaleDiverging([-100.0, 0, 100], d3.interpolatePuOr)
        // return color_diverging
        var scaleFunc = function(d){
            if (Math.abs(d)==100){
                d = 0
            }
            return color_diverging(d)
        }

        return new ColorMap(scaleFunc, [0.1,1], [10,11])
    }
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

        if (dataSet.ActualRate[id].hasOwnProperty(fips)) {
            rateInFips = dataSet.ActualRate[id][fips][whichVal]
            // predictedRateInFips = dataSet.PredictedActualRate[id][fips][whichVal]
        } else {
            rateInFips = 0
            // predictedRateInFips = 0
        }
        
        var top
        if (rateInFips == null) {
            rateInFips = 1
            top_data_list.push(
                {'data_id': dataNames[id], [whichVal]: 1, 'rank': i}
            )
        } else if (rateInFips==0) {
            top_data_list.push(
                {'data_id': 'NA-' + naCount, [whichVal]: 0.0, 'rank': i}
            )
            naCount++

        } else {
            top_data_list.push(
                {'data_id': dataNames[id], [whichVal]: rateInFips, 'rank': i}
            )
            top_data_ids.push(id)
        }
    }

    // var viewOptions = getFormValues()
    // selectedDataID = parseInt(getKeyByValue(vizDataNames, viewOptions[0]))

    return top_data_list
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
    barData = updatePredictedBarData(barData)
    drawBars(barData, countyFIPS, isUpdate=true)

    // Pick Industry Sliders by Payann
    sliderData = topRatesInFips(industryData, industryNames, String(countyFIPS), 5, "payann")
    drawSliders(sliderData, isUpdate=true)

}

function zoomed() {
    const {transform} = d3.event;
    mapChart.attr("transform", transform);
    mapChart.attr("stroke-width", 1 / transform.k);
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
    d3.csv("./resources/industry_ID_list.csv"),
    d3.csv("./resources/data_viz_full.csv")
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

    drawScatter(values[5])

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


    // Pick Industry Sliders by Payann
    startUpFIPS = 21197
    sliderData = topRatesInFips(industryData, industryNames, String(startUpFIPS), 5, "payann")
    drawSliders(sliderData, isUpdate=false)
}
 
function drawSliders(sliderData, isUpdate=true) {

    var sliderList = ["IndustryA", "IndustryB", "IndustryC", "IndustryD", "IndustryE"]

    for (var i=0; i<sliderList.length; i++) {

        sliderName = sliderList[i]
        industryName = sliderData[i]['data_id']

        // Change the label
        document.getElementById("Label" + sliderName).innerText = industryName

        if (isUpdate==false) {
            rangejs( document.getElementById( sliderName ), {
                css:true,
                buttons:true,
                change: function( event, ui ){

                    whichFIPS = querySelectedFIPS()
                    barData = topRatesInFips(cancerData, cancerNames, whichFIPS, howMany=5)
                    barData = updatePredictedBarData(barData)
                    drawBars(barData, whichFIPS, isUpdate=true)
                }
            })
        }
    }
}


function querySliders() {
    var sliderList = ["IndustryA", "IndustryB", "IndustryC", "IndustryD", "IndustryE"]
    var sliderVals = {}

    sliderList.forEach( sliderName => {

        sliderVals[sliderName] = document.getElementById(sliderName).value

    })
    return sliderVals
}


function getSliderValues(sliderList) {

    sliderValueList = []
    sliderList.forEach(sliderName =>{
        sliderValueList.push(
            document.getElementById(sliderName).value
        )
    })
    return sliderValueList
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
    var startUpFIPS = 21197
    barData = topRatesInFips(cancerData, cancerNames, startUpFIPS, howMany=5)
    barData = updatePredictedBarData(barData)
    drawBars(barData, startUpFIPS, isUpdate)
}


function updatePredictedBarData(barData) {
    // Get Predicted
    slidersNow = querySliders()
    sliderKeys = Object.keys(slidersNow)

    for (var i=0; i<sliderKeys.length; i++){
        barData[i]['ratePredicted'] = parseFloat(slidersNow[sliderKeys[i]])
    }
    return barData
}


function querySelectedFIPS() {
    var htmlstr = document.getElementById('selectedFIPS').innerHTML
    var re = new RegExp('>(.*)<')
    var selectedFIPS = re.exec(htmlstr)[1]
    return selectedFIPS
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// DRAWING FUNCTIONS
// 

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

    drawChoropleth(us_topojson, selectedData, dataID, colormap.scaleFunc, isUpdate, whichVal)

    drawLegend(colormap)
}

function removeLegend(cm) {
        // Remove
        mapLegend.selectAll('rect')
        // .data(cm.domain())
        .remove()
}

function drawLegend(cm) {
    // cm is a ColorMap Object

    legendStations = []
    xMax = width * 0.74
    xMin = 0
    xStep = xMax / 9

    for (var i=0; i<9; i++) {
        legendStations.push(xStep*i+15)
    }

    xScaleLegend = d3.scaleThreshold()
        .domain(cm.domain)
        .range(legendStations)
    
    // Remove
    mapLegend.selectAll('rect')
        // .data(cm.domain())
        .remove()

    // Draw
    mapLegend.selectAll('rect')
        .data(cm.domain)
    .enter()
        .append('rect')
        .attr('x', d => xScaleLegend(d-0.001))
        .attr('y', -8)
        .attr('width', xStep - 10)
        .attr('height', 14)
        .style('fill', d => cm.scaleFunc(d))
        .style('stroke', 'black')


    // Remove
    mapLegend.selectAll('text')
        .remove()

    // - legend text entry
    mapLegend.selectAll('text')
        .data(cm.domain)
    .enter()
        .append("text")
        .attr('class', 'legend')
        .attr('x', d => xScaleLegend(d-1))
        .attr('y', 23)
        .attr("text-anchor", "start") 
        .attr("dominant-baseline", "Top") 
        .text(d => Math.floor(d))
        // .text(d => Math.floor(logScale.invert(d))+' - '+Math.floor(logScale.invert(d+0.0999)))

    
        legendLabel = mapLegend.append("g")
        .attr('class', 'annotation')
        .attr('transform', 'translate(' + width*0.76 + ', ' + 0 + ')')

        String.prototype.toProperCase = function () {
            return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        };

        dataTitle = getFormValues("dataSetOption").toProperCase()
        dataSubset = getFormValues("detailSelector")

        legendLabel
        .append("text")
        .attr("text-anchor", "start") 
        .attr("dominant-baseline", "middle") 
        // .attr("text-anchor", "middle") 
        .text(dataTitle + ' - ' + dataSubset)


        subsetUnitsKey = {
            'rate': 'per 100k individuals',
            'emp': 'Total Employees',
            'payann': 'Total Payroll [$]',
            'estab': 'Total Establishments',

            'ACID': 'Acid Rain [kg SO2 eq]',
            'ENRG': 'Energy [MJ]',
            'ETOX': 'Freshwater Aquatic Ecotoxicity [CTUe]',
            'EUTR': 'Eutrophication [kg N eq]',
            'FOOD': 'Food Waste [kg]',
            'GCC':  'Global Climate Change [kg CO2 eq]',
            'HAPS': 'Hazardous Air Pollutants [kg]',
            'HAZW': 'Hazardous Waste [kg]',
            'HC': 'Human Health Cancer [CTUh]',
            'HNC': 'Human Health Non-Cancer [CTUh]',
            'HRSP': 'Human Health - Respiratory Effects [kg PM2.5 eq]',
            'HTOX': 'Human Health Cancer and Noncancer [CTUh]',
            'JOBS': 'Total Jobs',
            'LAND': 'Land Use [m2*yr]',
            'METL': 'Metals Released [kg]',
            'MINE': 'Minerals and Metals [kg]',
            'MSW': 'Muncipal Solid Waste [kg]',
            'NREN': 'Nonrenewable Energy [MJ]',
            'OZON': 'Ozone Depletion [kg O3 eq]',
            'PEST': 'Pesticides [kg]',
            'REN': 'Renewable Energy [MJ]',
            'SMOG': 'Smog Formation [kg O3 eq]',
            'VADD': 'Value Added [$]',
            'WATR': 'Water Use [m3]'
        }


        legendLabel
        .append("text")
        .attr("font-size", "16px")
        .attr("text-anchor", "start") 
        .attr("dominant-baseline", "middle") 
        // .attr("text-anchor", "middle") 
        .attr('dy', '18px')
        .text(subsetUnitsKey[dataSubset])

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
function drawBars(barData, whichFIPS, isUpdate) {

    barChart = d3.select("#dynaBars")

    // SCALES - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //
    // Set up a dynamic scale for the x-axis
    xMaxBar = d3.max(barData, function(d) { return d.rate }),
    xMinBar = d3.min(barData, function(d) { return d.rate }),
    xScaleBar = d3.scaleLinear()
            .domain([0, 250])              // domain of inputs;
            .range([0, width])  // range of output draw coords in px

    y1 = d3.scaleBand()
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

    barColor = 'rgb(150, 163, 168)'


    
    if (isUpdate==false) {

        // title
        barChart.append('g')
            .attr('class', 'annotation')
            .attr('id', 'selectedFIPS')
            .attr('transform', 'translate(' + width-10 + ', ' + 0 + ')')
            .append("text")
            .attr("text-anchor", "start") 
            .attr("dominant-baseline", "middle") 
            .text(whichFIPS)

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
            .style('fill', barColor)
            .on("mouseover", function(d) {
                d3.select(this).style("fill", d3.rgb(barColor).darker(2));
            })
            .on("mouseout", function(d) {
                d3.select(this).style("fill", barColor);
            })
            .on("click", function(d) {
                console.log(d)
                document.getElementById('selectedCancerReadOut').innerHTML = d.data_id
            })

        barChart.selectAll('circle')
            .data(barData)
        .enter()
            .append('circle')
            .attr('class', 'predPoint')
            .attr('cx', d => xScaleBar(d.ratePredicted))
            .attr('cy', d => y1(d.data_id)+y1.bandwidth()/2 )
            .attr('r', 5)
            .style('fill', 'black')


        
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

        barChart.select('#selectedFIPS')
            .selectAll('text').remove()

        barChart.select('#selectedFIPS')
            .append("text")
            .attr("text-anchor", "start") 
            .attr("dominant-baseline", "middle") 
            .text(whichFIPS)

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

        barChart.selectAll('circle')
            .data(barData)
            .transition()
            .duration(transition_time)
            // .append('circle')
            .attr('class', 'predPoint')
            .attr('cx', d => xScaleBar(d.ratePredicted))
            .attr('cy', d => y1(d.data_id)+y1.bandwidth()/2 )
            .attr('r', 5)
            .style('fill', 'black')


        barChart.select('#barNames')
            .data(barData)
            .transition()
        // .enter()
            .attr('x', d => xScaleBar(d.rate)/2)
            .attr('y', d => y1(d.data_id) )
            .text( d=> {d.data_id})

    }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// SCATTER PLOT  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
// 
function drawScatter(data) {

    scatterChart = d3.select("#scatterPlot")

    var x = d3.scaleLog()
        //.range([margin.left, width - margin.left - margin.right]);
        .range([0, width - margin.right]);

    var y = d3.scaleLinear()
        //.range([height - margin.bottom, margin.top]);
        .range([height, 0]);

    var xAxis = d3.axisBottom()
        .scale(x);
    /* .tickFormat(function (d) {
        return d3.format(".1f")(d);
    }); */

    var yAxis = d3.axisLeft()
        .scale(y);


        console.log(d3.max(data, function (d) { return +d.ACID }));

        var columns = null;

        data.forEach(function (row) {
            columns = Object.keys(row).slice(9, 36);
        });

        console.log(columns);

        var allGroup = d3.map(data, function (d) { return (d.cancerName) }).keys();

        console.log(allGroup);

        var selectedCancer = "All Cancer Sites";

        var selectedOption = "ACID";

        /* var allGroup = ["valueA", "valueB", "valueC"] */

        // add the options to the button
        d3.select("#selectButton")
            .selectAll('myOptions')
            .data(allGroup)
            .enter()
            .append('option')
            .text(function (d) { return d; }) // text showed in the menu
            .attr("value", function (d) { return d; }) // corresponding value returned by the button 
            .property("selected", function (d) { return d === "All Cancer Sites"; });

        // add the options to the button
        d3.select("#selectButton2")
            .selectAll('myOptions')
            .data(columns)
            .enter()
            .append('option')
            .text(function (d) { return d; }) // text showed in the menu
            .attr("value", function (d) { return d; })
            .property("selected", function (d) { return d === "ACID"; });
        // corresponding value returned by the button

        //document.getElementById("selectButton").align = "center";

        var subData = data.filter(function (d) {
            return d.cancerName == selectedCancer
        })


        y.domain(d3.extent(subData, function (d) { return +d.count }));
        x.domain([0.01, d3.max(subData, function (d) { return +d.ACID })])
        //x.domain(d3.extent(data, function(d){ return d.ACID}));

        // see below for an explanation of the calcLinear function
        //var lg = calcLinear(data, "x", "y", d3.min(data, function(d){ return d.ACID}), d3.min(data, function(d){ return d.ACID}));

	    /* svg.append("line")
	        .attr("class", "regression")
	        .attr("x1", x(lg.ptA.x))
	        .attr("y1", y(lg.ptA.y))
	        .attr("x2", x(lg.ptB.x))
	        .attr("y2", y(lg.ptB.y)); */

        scatterChart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)

        scatterChart.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        scatterChart.selectAll(".point")
            .data(subData)
            .enter().append("circle")
            .filter(function (d) { return +d.ACID > 0.01 && +d.count > 0 })
            //&& +d.cancer == 72
            .attr("class", "point")
            .attr("r", 3)
            .attr("cy", function (d) { return y(+d.count); })
            .attr("cx", function (d) { return x(+d.ACID); });

        // text label for the y axis
        var myText = scatterChart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("All Cancer Sites incidents");


        // text label for the x axis
        var myText2 = scatterChart.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text("ACID levels");



		/* svg.selectAll("text")
			  .data(data)
			  .enter()
			  .append("text")
			  .text(function (d) {
				  return d.fips;
			  })
			  .attr("x", function (d) {
				  return x(d.ACID);
			  })
			  .attr("y", function (d) {
				  return y(d.Cancer);
			  })
			  .attr("font-family", "sans-serif")
			  .attr("font-size", "15px")
			  .attr("fill", "red"); */

        function update(selectedCancer) {

            console.log(selectedOption);

            subData = data.filter(function (d) {
                return d.cancerName == selectedCancer
            })

            // Create new data with the selection?
            //var dataFilter = subData.map(function (d) { return { time: d[selectedOption], value: d.count } })
            if (d3.select("#myCheckbox").property("checked")) {
                dataFilter = subData.map(function (d) { return { time: d[selectedOption], value: d.rate } });
            } else {
                dataFilter = subData.map(function (d) { return { time: d[selectedOption], value: d.count } });
            }

            //console.log(dataFilter);

            // Give these new data to update line
            /* line
                .datum(dataFilter)
                .transition()
                .duration(1000)
                .attr("d", d3.line()
                    .x(function (d) { return x(+d.time) })
                    .y(function (d) { return y(+d.value) })
                ) */

            y.domain(d3.extent(dataFilter, function (d) { return +d.value }))

            scatterChart.selectAll(".point")
                .remove()
                .exit()

            scatterChart.selectAll(".point")
                .data(dataFilter)
                .enter().append("circle")
                .filter(function (d) { return +d.time > 0.01 && +d.value > 0 })
                //&& +d.cancer == 72
                .attr("class", "point")
                .attr("r", 3)
                .attr("cx", function (d) { return x(+d.time) })
                .attr("cy", function (d) { return y(+d.value) });

            scatterChart.selectAll("g.y.axis")
                .call(yAxis);

            //var newText = "Cancer " + selectedCancer + " incidents";
            var newText;
            if (d3.select("#myCheckbox").property("checked")) {
                newText = selectedCancer + " incident rates";
            } else {
                newText = selectedCancer + " incidents";
            }

            myText
                .transition()
                .duration(1000)
                .style("opacity", 0)
                .transition().duration(500)
                .style("opacity", 1)
                .text(newText); //			(function (d) { return d.tag })


        }

        function update2(selectedGroup) {

            // Create new data with the selection?
            //var dataFilter = subData.map(function (d) { return { time: d[selectedGroup], value: d.count } })
            if (d3.select("#myCheckbox").property("checked")) {
                dataFilter = subData.map(function (d) { return { time: d[selectedOption], value: d.rate } });
            } else {
                dataFilter = subData.map(function (d) { return { time: d[selectedOption], value: d.count } });
            }

            // Give these new data to update line
            /* line
                .datum(dataFilter)
                .transition()
                .duration(1000)
                .attr("d", d3.line()
                    .x(function (d) { return x(+d.time) })
                    .y(function (d) { return y(+d.value) })
                ) */

            x.domain([0.01, d3.max(dataFilter, function (d) { return +d.time })])

            scatterChart.selectAll(".point")
                .remove()
                .exit()

            scatterChart.selectAll(".point")
                .data(dataFilter)
                .enter().append("circle")
                .filter(function (d) { return +d.time > 0.01 && +d.value > 0 })
                //&& +d.cancer == 72
                .attr("class", "point")
                .attr("r", 3)
                .attr("cx", function (d) { return x(+d.time) })
                .attr("cy", function (d) { return y(+d.value) });

            scatterChart.selectAll("g.x.axis")
                .call(xAxis);

            var newText2 = selectedGroup + " levels";

            myText2
                .transition()
                .duration(1000)
                .style("opacity", 0)
                .transition().duration(500)
                .style("opacity", 1)
                .text(newText2); //			(function (d) { return d.tag })


        }

        // When the button is changed, run the updateChart function
        d3.select("#selectButton").on("change", function (d) {
            // recover the option that has been chosen
            selectedCancer = d3.select(this).property("value")
            // run the updateChart function with this selected option
            update(selectedCancer)
        })




        // When the button is changed, run the updateChart function
        d3.select("#selectButton2").on("change", function (d) {
            // recover the option that has been chosen
            selectedOption = d3.select(this).property("value")
            // run the updateChart function with this selected option
            update2(selectedOption)
        })


        d3.select("#myCheckbox").on("change", function () {
            var dataFilter;
            if (d3.select("#myCheckbox").property("checked")) {
                dataFilter = subData.map(function (d) { return { time: d[selectedOption], value: d.rate } });
            } else {
                dataFilter = subData.map(function (d) { return { time: d[selectedOption], value: d.count } });
            }
            console.log("entered");
            console.log(dataFilter);

            y.domain(d3.extent(dataFilter, function (d) { return +d.value }))

            scatterChart.selectAll(".point")
                .remove()
                .exit()

            scatterChart.selectAll(".point")
                .data(dataFilter)
                .enter().append("circle")
                .filter(function (d) { return +d.time > 0.01 && +d.value > 0 })
                //&& +d.cancer == 72
                .attr("class", "point")
                .attr("r", 3)
                .attr("cx", function (d) { return x(+d.time) })
                .attr("cy", function (d) { return y(+d.value) });

            scatterChart.selectAll("g.y.axis")
                .call(yAxis);

            var newText3;
            if (d3.select("#myCheckbox").property("checked")) {
                newText3 = selectedCancer + " incident rates";
            } else {
                newText3 = selectedCancer + " incidents";
            }


            myText
                .transition()
                .duration(1000)
                .style("opacity", 0)
                .transition().duration(500)
                .style("opacity", 1)
                .text(newText3); //			(function (d) { return d.tag })
        })

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


