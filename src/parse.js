// parses gcode files
// inputText is the text from the file read as one string
function parse(inputText) {
  var priorToG0 = [];
  var eof = [];

	var otherCommands = [];
	var verts = [];

	// split the file by newlines
	var nl = inputText.split('\n');

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
  var betweenPoints = [];
  var chunks = {};
  var endpoint = null;
  for (var i = verts.length-2; i>0; i--) {
    current = verts[i];
    after = verts[i+1];
    before = verts[i-1];
    // if the point is a g1's and surrounded by g1's
    // after can also be false if it was just deleted
    if (current.isG1 && (after.isG1 || after==false) && before.isG1) {
      // if this is the start of a new line of g1s
      if (endpoint == null) {
        // save the endpoint
        endpoint = after;
      }
      betweenPoints.push(current);
      // delete this point
      verts[i] = false;
    } else {
      // if we have been storing a chunk of g1's
      if (betweenPoints.length > 0) {
        // create a mapping from the endpoints to the g1s that go in the middle
        // the leftmost pair (of the key) should be closest to the first item of the assosciated array
        chunks[[toPair(endpoint), toPair(current)]] = betweenPoints;
        chunks[[toPair(current), toPair(endpoint)]] = betweenPoints.slice().reverse();
        endpoint = null;
        betweenPoints = [];
      }
    }
  }
  verts = verts.filter(Boolean);

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

  // remove excess nodes
  for (var i = 1; i<verts.length - 1; i++) {
    current = verts[i];
    prev = verts[i-1];
    // if the previous point is the same point
    if (prev.x == current.x && prev.y == current.y) {
      if (!verts[i-1].isG1) {
        verts[i-1] = false;
      }
    }
  }

  points = verts.filter(Boolean);

  return {
    points: points,
    constrainedPairs: constrainedPairs,
    constrainedLines: constrainedLines,
    chunks: chunks,
    priorToG0: priorToG0,
    eof: eof,
  }
}

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
