// d3.select("body").append("p").text("New paragraph!"); //selects element, creates and appends
// $.ajax({
//   method: "GET",
//   url: "/data/sleep.json"
// })
// .done(function(data){
//   test_data = data;
//   console.log(data);
// });

var VisualizationController = function(){
  this.unitData = {};
  this.renderGraph();
  this.getAndRenderData();
  this.dateListeners();
  this.selectionListener();
  this.selected = "social";
  this.dates = {startDate: new Date("2015-02-01"), endDate: new Date("2015-02-28")};
  this.width = 700,
  this.height = 400,
  this.padding = 100;
  // this.graphData = this.unitData[this.selected]; // defaults to social
};


VisualizationController.prototype = {
  dateListeners: function(){
    var self = this;
    document.getElementById("start-date").addEventListener('change', function(e){
      self.dates.startDate = new Date(this.value);
    });
    document.getElementById("end-date").addEventListener('change', function(e){
      self.dates.endDate = new Date(this.value);
      console.log(self.dates);
    });
  },
  getData: function(unit, unitName){
    var self = this;
    $.ajax( { url: "https://api.mongolab.com/api/1/databases/healthsweet/collections/filtered_observations?q={'unit': '" + unit + "'}&apiKey=50f3be0fe4b09b3cd11ebcd1",
      type: "GET",
      contentType: "application/json" } )
    .done(function(d){
      d.forEach(function(el){
        el.timestamp = el.timestamp.$date;
      });
      self.unitData[unitName] = d;
    });
  },
  getDate: function(){
    var currentDate = $( ".datepicker" ).datepicker( "getDate" );
  },
  getAndRenderData: function(){
    this.getData("MDC_HF_ACT_SLEEP", "sleep");
    this.getData("MDC_HF_DISTANCE", "steps");
    this.getSentimentData("social");
  },
  getSentimentData: function(unitName){
    var self = this;
    $.ajax( { url: "https://api.mongolab.com/api/1/databases/healthsweet/collections/sentiment?q={}&apiKey=50f3be0fe4b09b3cd11ebcd1",
      type: "GET",
      contentType: "application/json" } )
    .done(function(d){
      d.forEach(function(el){
        el.timestamp = el.created_at;
        el.value = el.sentiment.aggregate.score;
        el.sentValue = el.sentiment.sentiment;
      });
      self.unitData[unitName] = d;
      console.log(self.unitData);
      self.renderData(self.unitData["social"]);
    });
  },
  plotPoints: function(posArray){

  this.graph.selectAll("circle")
    .data(posArray)
    .enter()
    .append("circle")
    .attr("cx", function(d, i){
      return (i * 50 ) + 25; //how to push it along on the graph
    })
    .attr("cy", function(d){
      return d;
    })
    .attr("r", function() {
      return 5 + "px";
    });
  },
  renderData: function(data){
    var dateData = this.setDataDateRange(data);
    var valueData = this.setDataValueRange(data);
    this.plotPoints([dateData, valueData]);
  },
  renderGraph: function(){
    this.graph = d3.select("body")
                    .append("svg:svg")
                    .attr("class", "svg-total")
                    .attr("width", this.width)
                    .attr("height", this.height);
  },
  renderDataValueRange: function(minvalue, maxvalue){
    var yScale = d3.scale.linear()
      .domain([minvalue, maxvalue])    // values within the scope of the data
      .range([this.height - this.padding, this.padding]); 


    var yAxis = d3.svg.axis()
            .orient("left")
            .scale(yScale);

    d3.select("#yaxis").remove();


    this.graph.append("g")
      .attr("id", "yaxis")
      .attr("transform", "translate("+this.padding+",0)")
      .call(yAxis);
  },
  renderDataDateRange: function(mindate, maxdate){
    console.log(mindate, maxdate);
    var xScale = d3.time.scale()
      .domain([mindate, maxdate])    // values within the scope of the data
      .range([this.padding, this.width - this.padding * 2]); // ?


    var xAxis = d3.svg.axis()
            .orient("bottom")
            .scale(xScale);

    d3.select("xaxis").remove();

    this.graph.append("g")
        .attr("class", "xaxis")   // give it a class so it can be used to select only xaxis labels  below
        .attr("id", "xaxis")
        .attr("transform", "translate(0," + (this.height - this.padding) + ")")
        .call(xAxis);

    this.rotateXLabels();            
  },
  rotateXLabels: function(){
    this.graph.selectAll(".xaxis text")  // select all the text elements for the xaxis
      .attr("transform", function(d) {
          return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)";
        });
  },
  setDataDateRange: function(data){
    var daterange = [];
    console.log(data)
    for (var i=0; i<data.length; i++){
      daterange.push(new Date(data[i].timestamp));
    }

    var maxdate = new Date(Math.max.apply(Math, daterange));
    var mindate = new Date(Math.min.apply(Math, daterange));
    this.renderDataDateRange(mindate, maxdate);
    return daterange;
  },
  setDataValueRange: function(data){
    var range = [];
    for (var i=0; i<data.length; i++){
      range.push(data[i].value);
    }
    var maxvalue = Math.max.apply(Math, range);
    var minvalue = Math.min.apply(Math, range);
    this.renderDataValueRange(minvalue, maxvalue);
    return range;
  },
  selectionListener: function(){
    var self = this;
    document.getElementById("type-menu").addEventListener('change', function(){
      self.selected = this.options[this.selectedIndex].value;
      self.renderData(self.unitData[self.selected]);
    });
  }
};
var visualizationController = new VisualizationController();

// d3.select("body").selectAll("div").data(stepset).enter().append("div").attr("class","bar").style("height", function(d){
//     return d*5 + "px";
// });

// vis.selectAll("circle").














// d3.select("body").selectAll("p").data(stepset).enter().append("p").text(function(d){return d;}).style("color", function(d){
//   if (d > 15){
//     return "red";
//   } else {
//     return "black";
//   }
// }); //need function to get data back here

// d3.select("body").selectAll("div").data(stepset).enter().append("div").attr("class","bar").style("height", function(d){
//     return d*5 + "px";
// });
// var h = 50;
// var w = 500;

// // Add in dates dynamically with data to change as it goes

// var svg = d3.select("body")
//   .append("svg")
//   .attr("width", 500)
//   .attr("height", 50);

// svg.selectAll("circle")
//     .data(stepset)
//     .enter()
//     .append("circle")
//     .attr("class", "pumpkin")
//     .attr("cx", function(d, i){
//       return (i * 50 ) + 25; //how to push it along on the graph
//     })
//     .attr("cy", h/2)
//     .attr("r", function(d) {
//       return d;
//     });

// console.log(object);

// var getRange = function(){