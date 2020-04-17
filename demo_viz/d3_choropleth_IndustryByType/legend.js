// //
// // Draw the legend
// //
// var g = svg1.append("g")
// .attr("class", "key")
// .attr("transform", "translate(0,40)");

// g.selectAll("rect")
// .data(color.range().map(function(d) {
//   d = color.invertExtent(d);
//   if (d[0] == null) d[0] = x.domain()[0];
//   if (d[1] == null) d[1] = x.domain()[1];
//   return d;
// }))
// .enter().append("rect")
// .attr("height", 8)
// .attr("x", function(d) { return x(d[0]); })
// .attr("width", function(d) { return x(d[1]) - x(d[0]); })
// .attr("fill", function(d) { return color(d[0]); });

// g.append("text")
// .attr("class", "caption")
// .attr("x", x.range()[0])
// .attr("y", -6)
// .attr("fill", "#000")
// .attr("text-anchor", "start")
// .attr("font-weight", "bold")
// .text("Cancer Incidence Rate  -  per 100,000 Individuals");

// g.call(d3.axisBottom(x)
// .tickSize(13)
// .tickFormat(function(x, i) { return i ? x : x; })
// .tickValues(color.domain().map(Math.round)))
// .select(".domain")
// .remove();


// var x = d3.scaleLinear()
// .rangeRound([600, 860])
// .domain([1, rate_max]);