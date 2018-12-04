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

function getXY(s) {
	var x = false;
	var y = false;

	var d = s.split(' ');

	for (var rr=0; rr<d.length; rr++) {
		if (d[rr].substr(0,1) == 'x') {
			x = Number(d[rr].substr(1));
		} else if (d[rr].substr(0,1) == 'y') {
			y = Number(d[rr].substr(1));
		}
	}

	return [x,y];
}

var priorToG0;
var eof;

gc.addEventListener('change', function(e) {
var r = new FileReader();
r.readAsText(gc.files[0]);
r.onload = function(e) {

	initData();
  priorToG0 = [];
  eof = [];

	var otherCommands = [];
	var verts = [];

	// split the file by newlines
	var nl = r.result.split('\n');


  // store header commands at top of file
  var c = 0;
  while (c < nl.length) {
    nl[c] = nl[c].toLowerCase();
    var command = nl[c].substr(0, 3);
    if (command == 'g0 ' || command == 'g1 ') {
      break;
    }
    priorToG0.push(nl[c]);
    c++;
  }

  // make sure we start at 0, 0
  verts.push({x:0,y:0,followingLines:['g0 x0 y0'], isG1: false});

	// loop through each newline
	for (; c<nl.length; c++) {

		// make everything lowercase
		nl[c] = nl[c].toLowerCase();

		// check if this line is a G0 or G1 command
    var command = nl[c].substr(0,3)
		if ( command == 'g0 ' || command == 'g1 ') {

			// get the X and Y values
			var xy = getXY(nl[c]);
			var x = xy[0];
			var y = xy[1];

			// check if x and y exist for this line
			if (x !== false && y !== false) {

				// verts has entries, so we need to add otherCommands to the followingLines for the previous entry in verts
				for (var cmd=0; cmd<otherCommands.length; cmd++) {
					verts[verts.length-1].followingLines.push(otherCommands[cmd]);
				}

				// this G0 has a valid X or Y coordinate, add it to verts with itself (the G0) as the first entry in followingLines
				verts.push({x:x,y:y,followingLines:[nl[c]], isG1: command == 'g1 '});

				// reset otherCommands
				otherCommands = [];

			} else {
				// there is no X or Y coordinate for this G0, we can just add it as a normal line
				otherCommands.push(nl[c]);
			}
		} else {
			// add this line to otherCommands
			otherCommands.push(nl[c]);
		}
	}

	console.log(otherCommands);

	// add otherCommands to the followingLines for the last entry in verts
	// this gets the lines after the last G0 in the file
	// we also need to check if the commands here are not G0, G1, G2, G3, or G4
	// because in this case they should be left at the end of the file, not put into the parent G0 block
	for (var cmd=0; cmd<otherCommands.length; cmd++) {
		var sb = otherCommands[cmd].substr(0,3);
		if (sb == 'g0 ' || sb == 'g1 ' || sb == 'g2 ' || sb == 'g3 ' || sb == 'g4 ') {
			// this should be added to the parent G0 block
			verts[verts.length-1].followingLines.push(otherCommands[cmd]);
		} else {
			// this should be added to the end of the file as it was already there
			eof.push(otherCommands[cmd]);
		}
	}

	console.log('priorToG0',priorToG0);
	console.log('verts',verts);



	var minX = verts[0].x;
	var minY = verts[0].y;
	var maxX = verts[0].x;
	var maxY = verts[0].y;

	for (var p=0; p<verts.length; p++) {
		if (verts[p].x < minX) {
			minX = verts[p].x;
		} else if (verts[p].x > maxX) {
			maxX = verts[p].x;
		}
		if (verts[p].y < minY) {
			minY = verts[p].y;
		} else if (verts[p].y > maxY) {
			maxY = verts[p].y;
		}

	}

	console.log('x range: ',minX,maxX);
	console.log('y range: ',minY,maxY);

	// scale the points to fit the canvas 860x600

	var xf = 860/(maxX-minX);
	var yf = 600/(maxY-minY);

	var sf = 1;
	if (xf < yf) {
		sf = xf;
	} else {
		sf = yf;
	}

	for (var p=0; p<verts.length; p++) {

		// scale it
		verts[p].y = verts[p].y*sf;
		verts[p].x = verts[p].x*sf;

		// flip the y axis because cnc and canvas world are opposite there
		verts[p].y = 600 - verts[p].y;

	}

  // find pairs of g1s

  // constrainedPairs a dictionary that contains the connected point
  constrainedPairs = {};
  for (var i = 0; i<verts.length - 1; i++) {
    if (verts[i].isG1 == true) {
      if (verts[i+1].isG1) {
        pair1 = [verts[i].x, verts[i].y]
        pair2 = [verts[i+1].x, verts[i+1].y]
        constrainedPairs[pair1] = pair2;
        constrainedPairs[pair2] = pair1;
      }
    }
  }

  // find pairs of g1s
  // constrainedLines is a list of pairs of points
  constrainedLines = [];
  for (var i = 0; i<verts.length - 1; i++) {
    if (verts[i].isG1 == true) {
      constrainedLines.push([verts[i]]);
      i++;
      while((i<verts.length-1) && verts[i].isG1) {
        constrainedLines[constrainedLines.length-1].push(verts[i])
        i++;
      }
    }
  }

  // group together g1s if there are more than 2 g1s in a row
  for (var i = verts.length-2; i>0; i--) {
    current = verts[i];
    after = verts[i+1];
    before = verts[i-1];
    // if the point is a g1's and surrounded by g1's
    // after can also be false if it was just deleted
    if (current.isG1 && (after.isG1 || after==false) && before.isG1) {
      // add it the the following lines of the before point
      before.followingLines = before.followingLines.concat(current.followingLines)
      // delete this point
      verts[i] = false;
    }
  }
  verts = verts.filter(Boolean);

  // remove excess nodes
  for (var i = 1; i<verts.length - 1; i++) {
    current = verts[i];
    prev = verts[i-1];
    // if the previous point is the same point
    if (prev.x == current.x && prev.y == current.y) {
      verts[i-1] = false
    }
  }

  points = verts.filter(Boolean);
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

console.log('bestPath',bestPath);
console.log(points[bestPath[0]]);

//// ---------- EXPORT -------------

var UP = "M03 S525"
var DOWN = "M03 S975"
	// put all the lines back together in the best order
	var fout = '';
  var penUp = true;
	for (var c=0; c<priorToG0.length; c++) {
		fout += priorToG0[c] + '\n';
	}

  // turn points into gcode commands
	for (var c=0; c<bestPath.length-1; c++) {
    var point = points[bestPath[c]];
    var nextPoint = points[bestPath[c+1]];
    // if pen is up, then we write a g0
    if (penUp) {
      fout += 'g0 ' + point.followingLines[0].slice(3) + '\n';
    // if pen is down, write a g1
    } else {
      fout += 'g1 ' + point.followingLines[0].slice(3) + '\n';
      // there may be multiple g1's chained together
      // if so, add those to the output
      for (var d=1; d<point.followingLines.length; d++) {
        var line = point.followingLines[d];
        // print it if the line is not a penup or pendown
        var command = line.toLowerCase().substr(0, 3);
        if (command != 'm03' && command != 'm04') {
          fout += line + '\n';
        }
      }
    }

    // if next point is paired with this point (line should be drawn)
    if (areConnected(point, nextPoint)) {
      // make sure pen is down
      if (penUp) {
        penUp = false;
        fout += DOWN + '\n';
      }
    // if the next point is not connected with this point
    } else {
      // make sure pen is up
      if (!penUp) {
        penUp = true;
        fout += UP + '\n';
      }
    }
	}
  // print out followingLines of last point (this prints out end of gcode file)
  var lastPoint = points[bestPath[bestPath.length-1]];
	for (var n=0; n<lastPoint.followingLines.length; n++) {
		fout += lastPoint.followingLines[n] + '\n';
	}

	for (var c=0; c<eof.length; c++) {
		fout += eof[c] + '\n';
	}

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
