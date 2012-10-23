var PEOPLE_PATH = "../../data/people_1_100.csv";
var PLACES_PATH = "../../data/greek_cities.csv";
var filesToLoad = 2;
var width = 1060,
    height = 1000;
var peopledata,
    placesdata;


d3.csv(PEOPLE_PATH, function(csv) {
  peopledata = csv;
  if ((--filesToLoad) < 1) Initialize();
});

d3.csv(PLACES_PATH, function(csv) {
  placesdata = csv;
  if ((--filesToLoad) < 1) Initialize();
});

function Initialize() {
  var force = d3.layout.force()
    .charge(-120)
    .linkDistance(30)
    .size([width, height]);

  var svg = d3.select("#viz").append("svg")
    .attr("width", width)
    .attr("height", height);

  DrawGraph(force, svg);
}

function DrawGraph(force, svg) {
    var edge = [{source:0, target:1}, {source:3,target:4}];
 
  force
    .nodes(peopledata)
    .links(edge)
    .start();

  var link = svg.selectAll("line.link")
    .data(edge)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke", "#999")
      .style("opacity", ".6")
      .style("stroke-width", 22);
  
  var node = svg.selectAll("circle.node")
    .data(peopledata)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 5);

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
    node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
  });
}