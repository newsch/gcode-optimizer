#!/usr/bin/env node
// command line tool for optimizing gcode path
// usage: node optimizePath.js inputFile -o outputFile

'use strict';

var ArgumentParser = require('./node_modules/argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Optimization tool for gcode paths'
});

parser.addArgument("inputFile");
parser.addArgument(["-o", "--out"], { help: "output file"})
var args = parser.parseArgs()

console.dir(args);
