var canvas, ctx;
var WIDTH, HEIGHT;
var points = [];
var path = [];
var start;
var end;
var constrainedLines = [];
var constrainedPairs = [];
var running;
var ran = false;
var validFile = false;
var canvasMinX, canvasMinY;
var doPreciseMutate;
var chunks = {};

var POPULATION_SIZE;
var ELITE_RATE;
var CROSSOVER_PROBABILITY;
var MUTATION_PROBABILITY;
var OX_CROSSOVER_RATE;
var UNCHANGED_GENS;

var mutationTimes;
// cost between nodes
var costs;
// this contains the actual distance between points
var distances;
var bestValue, best, bestActualDistance;
var bestPath
var currentGeneration;
var currentBest;
var population;
var values;
var fitnessValues;
var roulette;

$(function() {

  var saveAs=saveAs||function(e){"use strict";if("undefined"==typeof navigator||!/MSIE [1-9]\./.test(navigator.userAgent)){var t=e.document,n=function(){return e.URL||e.webkitURL||e},o=t.createElementNS("http://www.w3.org/1999/xhtml","a"),r="download"in o,i=function(n){var o=t.createEvent("MouseEvents");o.initMouseEvent("click",!0,!1,e,0,0,0,0,0,!1,!1,!1,!1,0,null),n.dispatchEvent(o)},a=e.webkitRequestFileSystem,c=e.requestFileSystem||a||e.mozRequestFileSystem,u=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},f="application/octet-stream",s=0,d=500,l=function(t){var o=function(){"string"==typeof t?n().revokeObjectURL(t):t.remove()};e.chrome?o():setTimeout(o,d)},v=function(e,t,n){t=[].concat(t);for(var o=t.length;o--;){var r=e["on"+t[o]];if("function"==typeof r)try{r.call(e,n||e)}catch(i){u(i)}}},p=function(e){return/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob(["\ufeff",e],{type:e.type}):e},w=function(t,u){t=p(t);var d,w,y,m=this,S=t.type,h=!1,O=function(){v(m,"writestart progress write writeend".split(" "))},E=function(){if((h||!d)&&(d=n().createObjectURL(t)),w)w.location.href=d;else{var o=e.open(d,"_blank");void 0==o&&"undefined"!=typeof safari&&(e.location.href=d)}m.readyState=m.DONE,O(),l(d)},R=function(e){return function(){return m.readyState!==m.DONE?e.apply(this,arguments):void 0}},b={create:!0,exclusive:!1};return m.readyState=m.INIT,u||(u="download"),r?(d=n().createObjectURL(t),o.href=d,o.download=u,i(o),m.readyState=m.DONE,O(),void l(d)):(e.chrome&&S&&S!==f&&(y=t.slice||t.webkitSlice,t=y.call(t,0,t.size,f),h=!0),a&&"download"!==u&&(u+=".download"),(S===f||a)&&(w=e),c?(s+=t.size,void c(e.TEMPORARY,s,R(function(e){e.root.getDirectory("saved",b,R(function(e){var n=function(){e.getFile(u,b,R(function(e){e.createWriter(R(function(n){n.onwriteend=function(t){w.location.href=e.toURL(),m.readyState=m.DONE,v(m,"writeend",t),l(e)},n.onerror=function(){var e=n.error;e.code!==e.ABORT_ERR&&E()},"writestart progress write abort".split(" ").forEach(function(e){n["on"+e]=m["on"+e]}),n.write(t),m.abort=function(){n.abort(),m.readyState=m.DONE},m.readyState=m.WRITING}),E)}),E)};e.getFile(u,{create:!1},R(function(e){e.remove(),n()}),R(function(e){e.code===e.NOT_FOUND_ERR?n():E()}))}),E)}),E)):void E())},y=w.prototype,m=function(e,t){return new w(e,t)};return"undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob?function(e,t){return navigator.msSaveOrOpenBlob(p(e),t)}:(y.abort=function(){var e=this;e.readyState=e.DONE,v(e,"abort")},y.readyState=y.INIT=0,y.WRITING=1,y.DONE=2,y.error=y.onwritestart=y.onprogress=y.onwrite=y.onabort=y.onerror=y.onwriteend=null,m)}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||this.content);"undefined"!=typeof module&&module.exports?module.exports.saveAs=saveAs:"undefined"!=typeof define&&null!==define&&null!=define.amd&&define([],function(){return saveAs});

  init();
  initData();

// points expects an array of objects like this
// [ {x:0,y:0},{x:10,y:10} ]
  points = data200;

var gc = document.getElementById('loadGcode');

var priorToG0;
var eof;

gc.addEventListener('change', function(e) {
var r = new FileReader();
r.readAsText(gc.files[0]);
r.onload = function(e) {

	initData();
  var parsedData = parse(r.result);
  points = parsedData.points;
  constrainedPairs = parsedData.constrainedPairs;
  constrainedLines = parsedData.constrainedLines;
  chunks = parsedData.chunks;
  priorToG0 = parsedData.priorToG0;
  eof = parsedData.eof;

	draw();

	validFile = true;

}
});

$('#start_btn').click(function() {
  if(points.length >= 3) {
    initData();
    GAInitialize();
    running = true;
    ran = true;
  } else {
    alert("add some more points to the map!");
  }
});

$('#save_btn').click(function() {

	if (ran === false) {
		alert('you must first click Start/Restart to run the optimisation before saving the file');
		return false;
	}

	running = false;

	if (validFile === false) {
		alert('you must upload a gcode file to save an optimised version');
		return false;
	}

//// ---------- EXPORT -------------

  fout = generateGCode(priorToG0, bestPath, eof, constrainedPairs);


	var blob = new Blob([fout]);
	var fn = gc.value;
	if (fn.substr(0,12) == 'C:\\fakepath\\') {
		// remove that chrome/chromium fakepath
		fn = fn.substr(12);
	}
	saveAs(blob, 'optimised_'+fn, true);
  });

  $('#stop_btn').click(function() {
    if(running === false && currentGeneration !== 0){
      running = true;
    } else {
      running = false;
    }

  });

  var canvas = $('#canvas')[0];
  canvas.addEventListener('mousemove', function(e) {
    var mousePos = getMousePos(canvas, e);
    var message = 'Mouse position: ' + mousePos.x + ', ' + mousePos.y;
    $('#mouse_position').text(message);
  }, false);
});

function init() {
  ctx = $('#canvas')[0].getContext("2d");
  WIDTH = $('#canvas').width();
  HEIGHT = $('#canvas').height();
  setInterval(draw, 10);
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function initData() {
  running = false;
  POPULATION_SIZE = 30;
  ELITE_RATE = 0.3;
  CROSSOVER_PROBABILITY = 0.9;
  MUTATION_PROBABILITY  = 0.01;
  //OX_CROSSOVER_RATE = 0.05;
  UNCHANGED_GENS = 0;
  mutationTimes = 0;
  doPreciseMutate = true;

  bestValue = undefined;
  best = [];
  bestPath = [];
  currentGeneration = 0;
  currentBest;
  population = []; //new Array(POPULATION_SIZE);
  values = new Array(POPULATION_SIZE);
  fitnessValues = new Array(POPULATION_SIZE);
  roulette = new Array(POPULATION_SIZE);
}

function drawCircle(point) {
  ctx.fillStyle   = '#000';
  ctx.beginPath();
  ctx.arc(point.x, point.y, 3, 0, Math.PI*2, true);
  ctx.closePath();
  ctx.fill();
}

function drawLines(array) {
  ctx.strokeStyle = '#f00';
  ctx.lineWidth = 1;
  ctx.beginPath();

// move to the first point in best
  ctx.moveTo(points[array[0]].x, points[array[0]].y);

// loop through and draw lines to each other point
  for(var i=1; i<array.length; i++) {
    ctx.lineTo( points[array[i]].x, points[array[i]].y )
  }
  //ctx.lineTo(points[array[0]].x, points[array[0]].y);

  ctx.stroke();
  ctx.closePath();
}

function drawConstrainedLines(paths) {
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2;
    ctx.beginPath();

    // move to the first point in pairs
    for(var i = 0; i<paths.length; i++) {
      var path = paths[i];
      ctx.moveTo(path[0].x, path[0].y);
      for(var j = 0; j < path.length; j++) {
        ctx.lineTo(path[j].x, path[j].y);
      }
      ctx.stroke();
    }
}

function draw() {

  if(running) {
    GANextGeneration();
    $('#status').text("There are " + points.length + " points, "
                      +"the " + currentGeneration + "th generation with "
                      + mutationTimes + " times of mutation. best value: "
                      + ~~(bestActualDistance));
  } else {
    if (currentGeneration && mutationTimes && bestActualDistance) {
      $('#status').text("There are " + points.length + " points, "
                        +"the " + currentGeneration + "th generation with "
                        + mutationTimes + " times of mutation. best value: "
                        + ~~(bestActualDistance));
    } else {
      $('#status').text("There are " + points.length + " points")
    }

  }

  clearCanvas();

  if (points.length > 0) {
	// draw all the points as dots
    for(var i=0; i<points.length; i++) {
      drawCircle(points[i]);
    }

	// draw the path
    if(bestPath.length === points.length) {
      drawLines(bestPath);
    }

    drawConstrainedLines(constrainedLines)
  }

}

function clearCanvas() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
}
