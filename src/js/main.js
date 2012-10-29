var PEOPLE_PATH = "../../data/people_full.csv";
var PLACES_PATH = "../../data/greek_cities.csv";

var filesToLoad = 2;

var width = 450,
    height = 450;

var greatestPolisNumber = 1000;

var peopledata,
    placesdata;

var edgeArray = [];
var nodeToEdgeArray = {};
var placesToPeople = {};

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
        return nodeToEdgeArray[d['polis_number']] != null;
        });
    drawGraph("#overview", "overview-svg", nodes, edgeArray)
        .on("click", drawIndividualGraph);
}

function populateArrays() {
    for(var i = 0; i < placesdata.length; i++) {
        var rand = Math.random();
        if (rand > .7) {
            var neighbor = Math.floor(Math.random() * peopledata.length);
            edgeArray.push({source: i, target: neighbor});
            var currentPlaceID = placesdata[i]['polis_number'];
            if(nodeToEdgeArray[currentPlaceID] == null) {
                nodeToEdgeArray[currentPlaceID] = [];
            }
            nodeToEdgeArray[currentPlaceID].push(edgeArray.length - 1);
        }
    }
}

function createEdgesBetweenPlaces() {
    for(var firstPolisNumber in placesToPeople) {
        for(var secondPolisNumber in placesToPeople) {
            if(firstPolisNumber != secondPolisNumber) {
                if(arraysIntersect(placesToPeople[firstPolisNumber], placesToPeople[secondPolisNumber])) {
                    edgeArray.push({source: placesdata[firstPolisNumber], target: placesdata[secondPolisNumber]});
                    var currentPlacePolisNumber = placesdata[firstPolisNumber]['polis_number'];
                    if(nodeToEdgeArray[currentPlacePolisNumber] == null) {
                        nodeToEdgeArray[currentPlacePolisNumber] = [];
                    }
                    nodeToEdgeArray[currentPlacePolisNumber].push(edgeArray.length - 1);
                }
            }
        }
    }
}

function arraysIntersect(arrayOne, arrayTwo) {
    for(var i = 0; i < arrayOne.length; i ++) {
        if(arrayTwo.indexOf(arrayOne[i]) != -1) {
            return true;
        }
    }
    return false;
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

    if (placeCode == 0 || placeCode > greatestPolisNumber) return; 
    var placeIndex = placeCode - 1; // placeCode starts at 1 (polis_number from csv), placeIndex starts at 0
    if(placesToPeople[placeIndex] == null) {
        placesToPeople[placeIndex] = [personIndex];
    } else {
        placesToPeople[placeIndex].push(personIndex);
    }
}

function drawIndividualGraph(currentPlace) {
    var currentPlaceEdges = nodeToEdgeArray[currentPlace['polis_number']];
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
