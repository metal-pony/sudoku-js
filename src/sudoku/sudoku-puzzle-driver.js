import Debugger from '../util/debug.js';
import Sudoku from './Sudoku.js';

const debug = new Debugger(true);

const resultsForNonSieve = Sudoku.generate({
  amount: 100,
  numClues: 24,
  useSieve: true,
  callback: (generated) => { debug.log('+ ', generated.toString()); }
});

debug.log('Generated:', resultsForNonSieve.length);
const timesNonSieve = [];
resultsForNonSieve.forEach((result, index) => {
  const { puzzle, pops, resets, timeMs } = result;
  timesNonSieve.push(timeMs);
  debug.log(`${puzzle.toString()}\n    { time: ${timeMs}ms, pops: ${pops}, resets: ${resets} }`);
});

// Print out the total mean time, interquartile mean time, and median time, and standard deviation
const sum = timesNonSieve.reduce((acc, time) => acc + time, 0);
const mean = sum / timesNonSieve.length;
const sorted = timesNonSieve.sort((a, b) => a - b);
const q1 = sorted[Math.floor(timesNonSieve.length / 4)];
const q3 = sorted[Math.floor(timesNonSieve.length * 3 / 4)];
// const iqr = q3 - q1;
let iqrLength = 0;
const iqrMean = sorted.reduce((acc, time) => {
  if (time >= q1 && time <= q3) {
    iqrLength++;
    return acc + time;
  }
  return acc;
}, 0) / iqrLength;
const median = sorted[Math.floor(timesNonSieve.length / 2)];
const variance = timesNonSieve.reduce((acc, time) => acc + Math.pow(time - mean, 2), 0) / timesNonSieve.length;
const stdDev = Math.sqrt(variance);
debug.log(`\nMean: ${mean}ms, IQR Mean: ${iqrMean}ms, Median: ${median}ms, Standard Deviation: ${stdDev}ms`);
