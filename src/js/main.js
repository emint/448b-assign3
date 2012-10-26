function Model() {
    this.width = 660;
    this.eight = 660;
    
    this.peopledata = [];
    this.placesdata = [];

    this.edgeArray = [];
    this.nodeToEdgeArray = {};
    
    var PEOPLE_PATH = "../../data/people_1_100.csv";
    var PLACES_PATH = "../../data/greek_cities.csv";

    var filesToLoad = 2;


    var populateArrays = function () {
        for(var i = 0; i < this.peopledata.length; i++) {
            var rand = Math.random();
            var unqId = this.nodeToEdgeArray[this.peopledata[i]['unique_id']];
            if (rand > .7) {
                var neighbor = Math.floor(Math.random() * 
                    this.peopledata.length);
                this.edgeArray.push({source: i, target: neighbor});
                if(unqId == null) {
                    unqId = []
                }
                unqId.push(this.edgeArray.length - 1);
            }
        }
    }.bind(this);
 
    this.loadData = function() {
        d3.csv(PEOPLE_PATH, function(csv) {
            this.peopledata = csv;
            if ((--filesToLoad) < 1) {
                populateArrays();
                initialize();
            }
        }.bind(this));

        d3.csv(PLACES_PATH, function(csv) {
            this.placesdata = csv;
            if ((--filesToLoad) < 1) {
                populateArrays();
                initialize();
            }
        }.bind(this));

    }
};

var model = new Model();

function initialize() {
    drawGraph("#overview", "overview-svg", model.peopledata, model.edgeArray)
        .on("click", drawIndividualGraph);
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
        .attr("width", model.width)
        .attr("height", model.height)
        .attr("class", graphClass);

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .size([model.width, model.height]);

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

model.loadData();
