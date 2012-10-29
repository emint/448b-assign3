
var PEOPLE_PATH = "../../data/people_full.csv";
var PLACES_PATH = "../../data/greek_cities.csv";

var filesToLoad = 2;

var width = 550,
    height = 550;

var greatestPolisNumber = 400;

var peopledata,
    placesdata;

var edgeArray = [];

d3.csv(PEOPLE_PATH, function(csv) {
    peopledata = csv;
    if ((--filesToLoad) < 1) initialize();
});

d3.csv(PLACES_PATH, function(csv) {
    placesdata = csv;
    if ((--filesToLoad) < 1) initialize();
});

function initialize() {
    populatePolisResidents();
    createEdgesBetweenPlaces();
    nodes = placesdata.filter(function(d) { 
        return d['edges'] != null;
        });
    var graph = drawGraph("#overview", "overview-svg", nodes, edgeArray);
    graph['nodes']
        .attr("id", function(d) { return d['polis_number']; })       
        .on("click", drawIndividualGraph)
        .on("mouseover", mouseEnteredNode)
        .on("mouseout", mouseLeftNode);
    graph['edges'].style("stroke-width", function(d) { 
            return d['sharedPeople'].length;
        });
}

function mouseEnteredNode(currentPlace) {
  d3.select(".node_toponym").remove();
  var svg = d3.select("#overview")
      .append("text")
      .attr("class", "node_toponym")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(currentPlace['Toponym']);
  console.log(currentPlace);
}

function mouseLeftNode(currentPlace) {
  console.log("Goodbye world.");
}

function createEdgesBetweenPlaces() {
    for(var firstPolisNumber = 0; firstPolisNumber < placesdata.length; firstPolisNumber++) {
        for(var secondPolisNumber = 0; secondPolisNumber < placesdata.length; secondPolisNumber++) {
            if(firstPolisNumber != secondPolisNumber) {
                var intersection = arraysIntersect(placesdata[firstPolisNumber]['people'], 
                        placesdata[secondPolisNumber]['people']);
                if (intersection.length != 0) {
                    edgeArray.push({source: placesdata[firstPolisNumber], 
                        target: placesdata[secondPolisNumber], sharedPeople: intersection});
                    var currentPlacePolisNumber = placesdata[firstPolisNumber]['polis_number'];
                    if(placesdata[firstPolisNumber]['edges'] == null) {
                        placesdata[firstPolisNumber]['edges'] = [];
                    }
                    placesdata[firstPolisNumber]['edges'].push(edgeArray.length - 1);
                }
            }
        }
    }
}

function arraysIntersect(arrayOne, arrayTwo) {
    if (arrayOne == null || arrayTwo == null) return [];
    var intersection = [];
    var smaller = (arrayOne.length < arrayTwo.length ? arrayOne : arrayTwo);
    var bigger  = (arrayOne.length < arrayTwo.length ? arrayTwo : arrayOne);
    for(var i = 0; i < smaller.length; i ++) {
        if(bigger.indexOf(smaller[i]) != -1) {
            intersection.push(smaller[i]);
        }
    }
    return intersection;
}

function populatePolisResidents() {
    for(var i = 0; i < peopledata.length; i++) {
        var currentPerson = peopledata[i];
        var birthplace = currentPerson['Birthplace_Code'];
        if(birthplace != "") {
            addPersonToPlace(i, birthplace);
        }

        for(var j = 1; j < 20; j++) {
            var newPlace = currentPerson["WL_Place_code_#" + j];
            if(newPlace != "") {
                addPersonToPlace(i, newPlace);
            }
        }
    }
}

function addPersonToPlace(personIndex, placeCode) {
    // If placeCode is 0, the person has no associated place data for that field.
    // If placeCode > greatestPolisNumber, we have no polis information for that polis number.
    // If placeCode is not a number, the person's location in people csv is recorded as a string 
    // (e.g. "Africa") 
    if (placeCode == 0 || placeCode > greatestPolisNumber || isNaN(placeCode)) return; 
    // placeCode starts at 1 (polis_number from csv), placeIndex starts at 0
    var placeIndex = placeCode - 1;     
    if(placesdata[placeIndex]['people'] == null) {
        placesdata[placeIndex]['people'] = [personIndex];
    } else {
        placesdata[placeIndex]['people'].push(personIndex);
    }
}

function drawIndividualGraph(currentPlace) {
    var currentPlaceEdges = currentPlace['edges'];
    if (currentPlaceEdges == null) return;
    
    //Remove previous graph if it exists 
    d3.selectAll(".ind-svg").remove();    

    var neighbors = [currentPlace];
    var individualEdgeArray = [];
    for(var i = 0; i < currentPlaceEdges.length; i++) {
        var target = edgeArray[currentPlaceEdges[i]].target;
        var targetIndex = target['polis_number'] - 1;
        neighbors.push(placesdata[targetIndex]);
        individualEdgeArray.push({source: currentPlace, target: placesdata[targetIndex]});
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
        .charge(-250)
        .linkDistance(100)
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
    return {nodes:node, edges:link}; 
}
