
var PEOPLE_PATH = "../../data/people_full.csv";
var PLACES_PATH = "../../data/polis_data.csv";

var filesToLoad = 2;

var width = 650,
    height = 550,
    r = 6;

var greatestPolisNumber = 1035;

var excludedCities = ["Lipara", "Mylai", "Ledon", "Lokroi"];

// This allows us to reset the highlighting properly
var lastHighlighted = [];

var peopledata,
    peopledataUnfiltered,
    placesdata;

var endeavors = ['culture', 'philosophy', 'economy', 'politics', 'military', 'religion'];
var checkedEndeavors = [];

var edgeArray = [];

d3.csv(PEOPLE_PATH, function(csv) {
    peopledataUnfiltered = csv;
    if ((--filesToLoad) < 1) initialize();
});

d3.csv(PLACES_PATH, function(csv) {
    placesdata = csv;
    if ((--filesToLoad) < 1) initialize();
});

function initialize() {
    createControlPanel();
    drawGraphs();
}

function drawGraphs() {
    peopledata = {};
    edgeArray = [];
    resetPlacesToPeople();
    d3.selectAll("svg").remove();
    checkedEndeavors = getCheckedEndeavors();
    peopledata = peopledataUnfiltered.filter(function(d) {
            for(var i = 0; i < checkedEndeavors.length; i++) {
                var currentEndeavor = checkedEndeavors[i];
                if(d[currentEndeavor] == 1) {
                    return true;
                }
            }
            return false;
        });
    populatePolisResidents();
    createEdgesBetweenPlaces();

    nodes = placesdata.filter(function(d) {
          return d['edges'] != null;
        });
    
    var graph = drawGraph("#overview", "overview-svg", nodes, edgeArray);
    graph['nodes']
        .attr("id", function(d) { return d['polis_number']; })       
        .on("click", drawIndividualGraphAsCirclePack)
        .on("mouseover", mouseEnteredNode)
        .attr("r", function(d) {
            var totalPeopleCount = parseInt(d['people'].length + 4);
            var bucketed = d3.scale.log().domain([5, 453]).range([5, 20]);
            return bucketed(totalPeopleCount);
          });
    graph['edges'].style("stroke-width", function(d) { 
            return d['sharedPeople'].length;
        })
        .style("stroke", function(d) {
            return getColorForEndeavor(getMostRepEndeavor(d.counts));                     
        })
        .attr("id", function(d) {
            return "n"+d['source']['polis_number'] + "-" + d['target']['polis_number'];
        });
}

function resetPlacesToPeople() {
    for (var place in placesdata) {
        placesdata[place]['people'] = null;
        placesdata[place]['edges'] = null;
    }
}

function getCheckedEndeavors() {
    var checkedValues = [];
    for(var i = 0; i < endeavors.length; i++) {
        if (document.getElementById(endeavors[i] + "_checkbox").checked) {
            checkedValues.push(endeavors[i]);
        }
    }
    return checkedValues;
}

function getMostRepEndeavor(counts) {
    var endeavor = "";
    var maxCount = 0;
    // We do this manually to ensure that ties are broken in the same order
    for (var endeavorKey in checkedEndeavors) {
        if(counts[checkedEndeavors[endeavorKey]] > maxCount) {
           endeavor = checkedEndeavors[endeavorKey];
           maxCount = counts[checkedEndeavors[endeavorKey]];
        }
    }
    return endeavor;
}

function getColorForEndeavor(endeavor) {
    switch(endeavor) {
        case "culture":
            return "#E41A1C";
        case "philosophy":
            return "#377EB8";
        case "economy":
            return "#4DAF4A";
        case "politics":
            return "#984EA3";
        case "military":
            return "#FF7F00";
        case "religion":
            return "#FFFF33";
        default:
            return "000000";
    }
}

function mouseEnteredNode(currentPlace) {
  d3.selectAll(".tooltip").remove(); 
  resetEdgeProperties(lastHighlighted);

  var boxWidth = 140,
      boxHeight = 40
      offset = 0;
  
  var boxX = clipWidth((currentPlace.x + offset) - (boxWidth / 2), boxWidth),
      boxY = clipHeight((currentPlace.y + offset) - (boxHeight / 2), boxHeight); 

  d3.select("#overview svg")
      .append("rect")
      .attr("x", boxX)
      .attr("y", boxY)
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .attr("class", "tooltip")
      .attr("fill", "#CECFDE")
      .attr("opacity", .6)
      .on("mouseout", function() { 
          d3.selectAll(".tooltip").remove(); 
          resetEdgeProperties(currentPlace['edges']);
       })
      .on("mouseclick", drawIndividualGraphAsCirclePack(currentPlace)); 
  d3.select("#overview svg")
      .append("text")
      .attr("class", "node_toponym")
      .attr("text-anchor", "middle")
      .attr("class", "tooltip")
      .attr("x", boxX + boxWidth/2)
      .attr("y", boxY + boxHeight/2)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("font-size", 18)
      .text(currentPlace['Toponym']);
  
  highlightEdges(currentPlace['edges'], 10, "red");
}

function highlightEdges(edges, width, color) {
  for (var i=0; i < edges.length; i++) {
      var edge = edgeArray[edges[i]];
      var edgeId = "#n" + edge['source']['polis_number'] + "-" + edge['target']['polis_number']; 
      d3.selectAll("#overview svg " + edgeId)
          .style("stroke", color)
          .style("stroke-width", width);
  }
  lastHighlighted = edges;
}

function resetEdgeProperties(edges) {
  for (var i=0; i < edges.length; i++) {
      var edge = edgeArray[edges[i]];
      var edgeId = "#n" + edge['source']['polis_number'] + "-" + edge['target']['polis_number']; 
      d3.selectAll("#overview svg " + edgeId)
          .style("stroke", getColorForEndeavor(getMostRepEndeavor(edge['counts'])))
          .style("stroke-width", edge['sharedPeople'].length);
  }
}
function clipHeight(heightLoc, proposedHeight) {
    if (heightLoc < 0) { 
        return 0;
    } else if ((heightLoc + proposedHeight) > height) {
        return height - proposedHeight;
    }
    return heightLoc;
}

function clipWidth(widthLoc, proposedWidth) {
    if (widthLoc < 0) {
        return 0;
    } else if ((widthLoc + proposedWidth) > width) {
        return width - proposedWidth;
    }
    return widthLoc;
}

function createEdgesBetweenPlaces() {
    for(var firstPolisNumber = 0; firstPolisNumber < placesdata.length; firstPolisNumber++) {
        for(var secondPolisNumber = 0; secondPolisNumber < placesdata.length; secondPolisNumber++) {
            // We also check to ensure that we are not making an edge between one of the cities
            // we are excluding
            if(firstPolisNumber != secondPolisNumber && 
                excludedCities.indexOf(placesdata[firstPolisNumber]['Toponym']) == -1) {
                var intersection = arraysIntersect(placesdata[firstPolisNumber]['people'], 
                        placesdata[secondPolisNumber]['people']);
                if (intersection.length != 0) {
                    var counts = getEndeavourCounts(intersection);
                    edgeArray.push({source: placesdata[firstPolisNumber], 
                        target: placesdata[secondPolisNumber], sharedPeople: intersection,
                        counts:counts});
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


function getEndeavourCounts(peopleList) {
  var counts = {culture:0, economy:0, philosophy:0, politics:0, military:0, religion:0};
  for (var i=0; i<peopleList.length; i++) {
    var person = peopledata[peopleList[i]];
    counts['culture'] += parseInt(person['culture']);
    counts['economy'] += parseInt(person['economy']);
    counts['philosophy'] += parseInt(person['philosophy']);
    counts['politics'] += parseInt(person['politics']);
    counts['military'] += parseInt(person['military']);
    counts['religion'] += parseInt(person['religion']);
  }
  return counts;
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

function createControlPanel() {
    var checkboxesForm = d3.select("#control").append("form");
   
    var checkboxes = checkboxesForm.selectAll("label")
        .data(endeavors).enter()
        .append("label")
        .text(function(d) {return d;})
        .style("color", function(d) { return getColorForEndeavor(d); }) 
        .append("input")
        .attr("class", "checkboxControl")
        .attr("type", "checkbox")
        .attr("checked", true)
        .attr("id", function(d) {return d + "_checkbox";})
        .attr("name", function(d) {return d;})
        .attr("onClick", "drawGraphs()");
}



function drawIndividualGraphAsCirclePack(currentPlace) {
  var currentPlaceEdges = currentPlace['edges'];
  if (currentPlaceEdges == null) return;
  
  d3.selectAll(".ind-svg").remove();

  var neighbors = [];
  for(var i = 0; i < currentPlaceEdges.length; i++) {
      var edge = edgeArray[currentPlaceEdges[i]]; 
      var target = edge.target;
      var targetIndex = target['polis_number'] - 1;
      neighbors.push({Toponym: placesdata[targetIndex]['Toponym'], 
          value:edge['sharedPeople'].length, mostSharedEndev:getMostRepEndeavor(edge['counts']),
          allCounts:edge['counts']});
  }

  var fill = d3.scale.category20c();

  var bubble = d3.layout.pack()
      .sort(null)
      .size([width, height])
      .padding(1.5);

  var svg = d3.select("#individual").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "ind-svg");
  var flattenedHeirarchy = {children:neighbors};
  var node = svg.selectAll("g.node")
      .data(bubble.nodes(flattenedHeirarchy)
        .filter(function(d) { return !d.children; }))
      .enter().append("g")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  node.append("title")
      .text(function(d) { return d['Toponym']; });

  node.append("circle")
      .attr("r", function(d) { 
          return d.r ;    
      })
      .attr("fill", function(d) {
          return getColorForEndeavor(d['mostSharedEndev']);
      });
  node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .text(function(d) {
          var sum = 0;
          for (var key in d['allCounts']) {
              sum += d['allCounts'][key];
          } 
          return d['Toponym'] + "(" + sum + ")"; 
      });
  
  
  var boxWidth = width,
      boxHeight = 40,
      boxX = 0, 
      boxY = height - boxHeight;
  d3.select("#individual svg")
      .append("rect")
      .attr("x", boxX)
      .attr("y", boxY)
      .attr("width", boxWidth)
      .attr("height", boxHeight)
      .attr("fill", "#CECFDE")
      .attr("opacity", .5);
  d3.select("#individual svg")
      .append("text")
      .attr("class", "individual_desc")
      .attr("x", boxX + boxWidth/16)
      .attr("y", boxY + boxHeight/2)
      .attr("stroke-width", 1)
      .attr("font-size", "24")
      .text("View of the world from the perspective of " + currentPlace['Toponym'] +".");
}

// Draws graph with class 'graphClass' into specified div. Returns reference
// to node object for further custom functionality.
function drawGraph(divToAddTo, graphClass, nodes, edges) {
    var svg = d3.select(divToAddTo).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", graphClass);

    var force = d3.layout.force()
        .charge(-300)
        .linkDistance(70)
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
    // Using bounding box example from:
    // http://mbostock.github.com/d3/talk/20110921/bounding.html
    force.on("tick", function() {
        node.attr("cx", function(d) { return d.x = Math.max(r, Math.min(width - r, d.x)); })
          .attr("cy", function(d) { return d.y = Math.max(r, Math.min(height - r, d.y)); });

        link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
        });
    return {nodes:node, edges:link}; 
}
