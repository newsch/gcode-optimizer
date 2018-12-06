#!/usr/bin/env node
// command line tool for optimizing gcode path
// usage: node optimizePath.js inputFile -o outputFile

'use strict';

var fs = require('fs');
var ArgumentParser = require('./node_modules/argparse').ArgumentParser;
var Parser = require('./src/parser').Parser;

// ------- Argument Parsing ---------

var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Optimization tool for gcode paths'
});

parser.addArgument("inputFile");
parser.addArgument(["-o", "--out"], { help: "output file"})
var args = parser.parseArgs()

var inputFile = args.inputFile;
var outputFile = args.outputFile;

// ------- Parse inputFile ------

var contents = fs.readFileSync(inputFile, 'utf8');
var parsedData = Parser.parse(contents);
console.log(parsedData);
