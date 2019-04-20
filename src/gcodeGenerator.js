// generates gcode files from a bestPath and a list of points

const UP = "G1Z1"
const DOWN = "G1Z-1"

function generateGCode(priorToG0, bestPath, eof, constrainedPairs) {
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
    }

    // if next point is paired with this point (line should be drawn)
    if (areConnected(point, nextPoint, constrainedPairs)) {
      // make sure pen is down
      if (penUp) {
        penUp = false;
        fout += DOWN + '\n';
      }

      // draw all points in between the two vertices
      if ([toPair(point), toPair(nextPoint)] in chunks) {
        var inBetweenPoints = chunks[[toPair(point), toPair(nextPoint)]];
        for (var v=0; v<inBetweenPoints.length; v++) {
          var text = inBetweenPoints[v].followingLines[0];
          // print it if the command is not a penup or pendown
          var command = text.toLowerCase().substr(0, 3);
          if (command != 'm03' && command != 'm04') {
            fout += text + '\n';
          }
        }
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

  return fout;
}

// returns true if point1 and point2 are connected in the original gcode
function areConnected(point1, point2, constrainedPairs) {
  p1 = [point1.x, point1.y];
  p2 = [point2.x, point2.y];
  // If constrainedPairs doesnt contain p1
  if(!constrainedPairs[p1]) {
    // then its obviously not part of a pair
    return false
  }
  return equal(constrainedPairs[p1], p2);
}

// returns true if two point pairs are the same
function equal(p1, p2) {
  return p1[0] === p2[0] && p1[1] === p2[1];
}

// takes a point object and returns its x, y pair
function toPair(point) {
  return [point.x, point.y];
}
