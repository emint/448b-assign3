var PEOPLE_PATH = "../../data/people_1_100.csv";
var PLACES_PATH = "../../data/greek_cities.csv";
var filesToLoad = 2;
var width = 660,
      height = 660;
var peopledata,
      placesdata;
var edgeArray = [];
var nodeToEdgeArray = {};

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

    var svg = d3.select("#overview").append("svg")
        .attr("width", width)
        .attr("height", height);

    PopulateArrays();
    DrawOverviewGraph(force, svg);
}

function PopulateArrays() {
    for(var i = 0; i < peopledata.length; i++) {
        var rand = Math.random();
        if (rand > .7) {
            var neighbor = Math.floor(Math.random() * peopledata.length);
            edgeArray.push({source: i, target: neighbor});
            if(nodeToEdgeArray[peopledata[i]['unique_id']] == null) {
                nodeToEdgeArray[peopledata[i]['unique_id']] = [];
            }
            nodeToEdgeArray[peopledata[i]['unique_id']].push(edgeArray.length - 1);
        }
    }
}

function DrawOverviewGraph(force, svg) {
    force
        .nodes(peopledata)
        .links(edgeArray)
        .start();

    var link = svg.selectAll("line.link")
        .data(edgeArray)
        .enter().append("line")
          .attr("class", "link")
          .style("stroke", "#999")
          .style("opacity", ".6")
          .style("stroke-width", 4);
  
    var node = svg.selectAll("circle.node")
        .data(peopledata)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)
        .on("click", DrawIndividualGraph);

    force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
        node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });
}

function DrawIndividualGraph(currentSite) {
    var svg = d3.select("#individual").append("svg")
        .attr("width", width)
        .attr("height", height);

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([width, height]);

    var neighbors = [currentSite];
    var individualEdgeArray = [];
    if (nodeToEdgeArray[currentSite.unique_id] == null) return;
    for(var i = 0; i < nodeToEdgeArray[currentSite.unique_id].length; i++) {
        var targetIndex = edgeArray[nodeToEdgeArray[currentSite.unique_id][i]].target;
        neighbors.push(peopledata[targetIndex]);
        individualEdgeArray.push({source: 0, target: i + 1});
    }

    force
        .nodes(neighbors)
        .links(individualEdgeArray)
        .start();

    var link = svg.selectAll("line.link")
        .data(individualEdgeArray)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke", "#999")
        .style("opacity", ".6")
        .style("stroke-width", 4);

    var node = svg.selectAll("circle.node")
        .data(neighbors)
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