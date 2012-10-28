
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
    if ((--filesToLoad) < 1) initialize();
});

d3.csv(PLACES_PATH, function(csv) {
    placesdata = csv;
    if ((--filesToLoad) < 1) initialize();
});

function initialize() {
    populateArrays();
    drawGraph("#overview", "overview-svg", peopledata, edgeArray)
        .on("click", drawIndividualGraph);
}

function populateArrays() {
    for(var i = 0; i < peopledata.length; i++) {
        var rand = Math.random();
        if (rand > .7) {
            var neighbor = Math.floor(Math.random() * peopledata.length);
            edgeArray.push({source: i, target: neighbor});
            if(nodeToEdgeArray[peopledata[i]['unique_id']] == null) {
                nodeToEdgeArray[peopledata[i]['unique_id']] = [];
            }
            nodeToEdgeArray[peopledata[i]['unique_id']].push(
                edgeArray.length - 1);
        }
    }
}

function drawIndividualGraph(currentPerson) {
    var currentPersonEdges = nodeToEdgeArray[currentPerson.unique_id];
    if (currentPersonEdges == null) return;
    
    //Remove previous graph if it exists 
    d3.selectAll(".ind-svg").remove();    

    var neighbors = [currentPerson];
    var individualEdgeArray = [];
    for(var i = 0; i < currentPersonEdges.length; i++) {
        var targetIndex = edgeArray[currentPersonEdges[i]].target.index;
        neighbors.push(peopledata[targetIndex]);
        individualEdgeArray.push({source: 0, target: i + 1});
    }

    drawGraph("#individual", "ind-svg", neighbors, individualEdgeArray);
}

// Draws graph with class 'graphClass' into specified div. Returns reference
// to node object for further custom functionality.
function drawGraph(divToAddTo, graphClass, nodes, edges) {
    var svg = d3.select(divToAddTo).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", graphClass);

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([width, height]);

    force
        .nodes(nodes)
        .links(edges)
        .start();

    var link = svg.selectAll("line.link")
        .data(edges)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke", "#999")
        .style("opacity", ".6")
        .style("stroke-width", 4);

    var node = svg.selectAll("circle.node")
        .data(nodes)
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
    return node; 
}
