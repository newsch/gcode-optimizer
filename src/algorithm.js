function GAInitialize() {
  countDistances();
  for(var i=0; i<POPULATION_SIZE; i++) {
    population.push(randomIndivial(points.length));
  }
  setBestValue();
}
function GANextGeneration() {
  currentGeneration++;
  selection();
  crossover();
  mutation();

  setBestValue();
}
function tribulate() {
  //for(var i=0; i<POPULATION_SIZE; i++) {
  for(var i=population.length>>1; i<POPULATION_SIZE; i++) {
    population[i] = randomIndivial(points.length);
  }
}
function selection() {
  var parents = new Array();
  var initnum = 4;
  parents.push(population[currentBest.bestPosition]);
  parents.push(flipMutate(best.clone()));
  parents.push(swapMutate(best.clone()));
  parents.push(best.clone());

  setRoulette();
  for(var i=initnum; i<POPULATION_SIZE; i++) {
    parents.push(population[wheelOut(Math.random())]);
  }
  population = parents;
}
function crossover() {
  var queue = new Array();
  for(var i=0; i<POPULATION_SIZE; i++) {
    if( Math.random() < CROSSOVER_PROBABILITY ) {
      queue.push(i);
    }
  }
  queue.shuffle();
  for(var i=0, j=queue.length-1; i<j; i+=2) {
    doCrossover(queue[i], queue[i+1]);
  }
}

function doCrossover(x, y) {
  child1 = getChild('next', x, y);
  child2 = getChild('previous', x, y);
  population[x] = child1;
  population[y] = child2;
}
function getChild(fun, x, y) {
  solution = new Array();
  var px = population[x].clone();
  var py = population[y].clone();
  var dx,dy;
  var c = px[randomNumber(px.length)];
  solution.push(c);
  while(px.length > 1) {
    dx = px[fun](px.indexOf(c));
    dy = py[fun](py.indexOf(c));
    px.deleteByValue(c);
    py.deleteByValue(c);
    c = costs[c][dx] < costs[c][dy] ? dx : dy;
    solution.push(c);
  }
  return solution;
}
function mutation() {
  for(var i=0; i<POPULATION_SIZE; i++) {
    if(Math.random() < MUTATION_PROBABILITY) {
      if(Math.random() > 0.5) {
        population[i] = swapMutate(population[i]);
      } else {
        population[i] = flipMutate(population[i]);
      }
      i--;
    }
  }
}

function flipMutate(seq) {
  mutationTimes++;
  // m and n refers to the actual index in the array
  // m range from 0 to length-2, n range from 2...length-m
  do {
    m = randomNumber(seq.length - 2);
    n = randomNumber(seq.length);
  } while (m>=n)

    for(var i=0, j=(n-m+1)>>1; i<j; i++) {
      seq.swap(m+i, n-i);
    }
    return seq;
}
function swapMutate(seq) {
  mutationTimes++;
  var m,n;
  do {
    m = randomNumber(seq.length>>1);
    n = randomNumber(seq.length);
  } while (m>=n)

  var s1 = seq.slice(0,m);
  var s2 = seq.slice(m,n)
  var s3 = seq.slice(n,seq.length);
  return s2.concat(s1).concat(s3).clone();
}
function setBestValue() {
  for(var i=0; i<population.length; i++) {
    values[i] = evaluate(population[i], costs);
  }
  currentBest = getCurrentBest();
  if(bestValue === undefined || bestValue > currentBest.bestValue) {
    best = population[currentBest.bestPosition].clone();
    bestValue = currentBest.bestValue;
    bestActualDistance = evaluate(best, distances)
    UNCHANGED_GENS = 0;
  } else {
    UNCHANGED_GENS += 1;
  }
}

// Calculates the actual distance along a given path
function calculateActualDistance(path) {
  return 5;
}
function getCurrentBest() {
  var bestP = 0,
  currentBestValue = values[0];

  for(var i=1; i<population.length; i++) {
    if(values[i] < currentBestValue) {
      currentBestValue = values[i];
      bestP = i;
    }
  }
  return {
    bestPosition : bestP
    , bestValue    : currentBestValue
  }
}
function setRoulette() {
  //calculate all the fitness
  //make sure that no fitnessValues are negative
  var smallest = Math.min(...values);
  for(var i=0; i<values.length; i++) { fitnessValues[i] = 1.0/(values[i] - smallest + 1); }


  //set the roulette
  var sum = 0;
  for(var i=0; i<fitnessValues.length; i++) { sum += fitnessValues[i]; }
  for(var i=0; i<roulette.length; i++) { roulette[i] = fitnessValues[i]/sum; }
  for(var i=1; i<roulette.length; i++) { roulette[i] += roulette[i-1]; }
}
function wheelOut(rand) {
  var i;
  for(i=0; i<roulette.length; i++) {
    if( rand <= roulette[i] ) {
      return i;
    }
  }
}
function randomIndivial(n) {
  var a = [];
  for(var i=0; i<n; i++) {
    a.push(i);
  }
  return a.shuffle();
}
function evaluate(indivial, costMatrix) {
  var sum = costMatrix[indivial[0]][indivial[indivial.length - 1]];
  for(var i=1; i<indivial.length; i++) {
    sum += costMatrix[indivial[i]][indivial[i-1]];
  }
  return sum;
}
function countDistances() {
  var length = points.length;
  costs = new Array(length);
  distances = new Array(length);
  for(var i=0; i<length; i++) {
    costs[i] = new Array(length);
    distances[i] = new Array(length);
    for(var j=0; j<length; j++) {
      // Check if the two points are already connected by a line

      if (areConnected(points[i], points[j]))  {
        // we give a big negative weight so that the algorithm has an incentive
        // to use this path
        costs[i][j] = -1000;
      } else {
        costs[i][j] = ~~distance(points[i], points[j]);
      }
      distances[i][j] = ~~distance(points[i], points[j]);
    }
  }
}

// returns true if point1 and point2 are connected in the original gcode
function areConnected(point1, point2) {
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
