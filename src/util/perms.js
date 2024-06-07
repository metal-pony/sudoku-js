import combos from './combos.js';
import { range } from './arrays.js';

/**
 * @param {BigInt} biggie
 * @returns {number}
 */
function bigIntToNumber(biggie) {
  if (biggie > Number.MAX_SAFE_INTEGER) {
    throw new Error('BigInt value is too large to convert to a number');
  }
  return Number(biggie);
}

const _factorialMap = [1n, 1n];
const _factorialMapMaxSize = (1<<10);
/**
 * Generates the factorial of n. Smaller values (up to 2^10) are cached in a map.
 * @param {number} n The number to compute the factorial of. Must be >= 0.
 * @returns {BigInt} The factorial of n.
 */
export function factorial(n) {
  if (n < 0) {
    throw new Error('n must be >= 0');
  }

  if (_factorialMap[n]) {
    return _factorialMap[n];
  }

  let i = _factorialMap.length;
  let result = _factorialMap[i - 1];
  for (; i <= n; i++) {
    result *= BigInt(i);
    if (i < _factorialMapMaxSize) {
      _factorialMap[i] = result;
    }
  }

  return result;
}

export function bigFactorial(n) {
  if (n < 0n) {
    throw new Error('n must be >= 0');
  }

  let result = 1n;
  for (let i = 1n; i <= n; i++) {
    result *= BigInt(i);
  }

  return result;
}

function test_factorial() {
  range(32).forEach(n => console.log(`${n}! = ${factorial(n)}`));
}

/**
 * Generates a permutation of n items given some r, such that 0 <= r < n!.
 * @param {number} n
 * @param {BigInt} r
 * @returns {number[]}
 */
export function permutation(n, r) {
  if (n < 0 || r < 0n || r >= factorial(n)) {
    throw new Error('n must be >= 0, r must be >= 0 and < n!');
  }

  const perm = [];
  const items = range(n);
  for (let i = 0; i < n; i++) {
    const j = Number(
      (r % factorial(n - i)) / factorial(n - i - 1)
    );
    perm.push(items[j]);
    items.splice(j, 1);
  }
  return perm;
}

/**
 *
 * @param {number} n
 * @param {BigInt} r
 * @returns {number[]}
 */
export function permutation2(n, r) {
  if (n < 0 || r < 0n || r >= factorial(n)) {
    throw new Error('n must be >= 0, r must be >= 0 and < n!');
  }

  const perm = range(n);
  for (let i = 0; i < n; i++) {
    let j = Number(
      (r % factorial(n - i)) / factorial(n - i - 1)
    );
    if (j === 0) {
      continue;
    }

    const temp = perm[i+j];
    while (j > 0) {
      perm[i+j] = perm[i+j-1];
      j--;
    }
    perm[i] = temp;
  }

  return perm;
}

/**
 * Shuffles the given array in place.
 * @param {any[]} arr The array to shuffle.
 * @returns {any[]} The given array.
 */
export function shuffle(arr) {
  const n = arr.length;
  if (n < 2) {
    return arr;
  }
  const r = randomBigInt(factorial(n))

  for (let i = 0; i < n; i++) {
    let j = Number(
      (r % factorial(n - i)) / factorial(n - i - 1)
    );
    if (j === 0) {
      continue;
    }

    const temp = arr[i+j];
    while (j > 0) {
      arr[i+j] = arr[i+j-1];
      j--;
    }
    arr[i] = temp;
  }

  return arr;
}

function test_permutation() {
  // For each collection size N from 0 to 10, generate each permutation and collect to a set.
  // The output size of the permutation set should be N!.
  range(10).forEach(n => {
    const permSet = new Set();
    range(Number(factorial(n))).forEach(r => permSet.add(permutation(n, BigInt(r)).join('')));
    console.log(`n = ${n}, unique permutations: ${permSet.size}`);
  });

  // Print all permutations of N letters, spread across N columns.
  const n = 4;
  const rows = Number(factorial(n - 1));
  const permSet = new Set();
  const CAPITAL_A_CODE = 'A'.charCodeAt(0);
  for (let row = 0; row < rows; row++) {
    let line = '';
    for (let col = 0; col < n; col++) {
      const r = row + col * rows;
      const perm = permutation(n, BigInt(r));
      const permStr = perm.map(item => String.fromCharCode(item + CAPITAL_A_CODE)).join('');
      line += permStr + '  ';
    }
    console.log(line);
  }
}

/**
 *
 * @param {number} n
 * @param {function} callback Function that takes a permutation as an argument.
 */
export function forEachPerm(n, callback) {
  const nck = factorial(n);
  for (let r = 0n; r < nck; r++) {
    callback(permutation(n, r));
  }
}

const nckCache = {
  0: [1n],
  1: [1n, 1n],
};

/**
 * Computes n choose k.
 *
 * @param {number} n
 * @param {number} k
 * @returns {BigInt}
 */
export function nChooseK(n, k) {
  if (n < 0 || k < 0 || n < k) {
    throw new Error('n and k must both be >= 0 and n must be >= k.');
  }

  if (k === 0 || n === k) {
    return 1n;
  }

  if (nckCache[n] && nckCache[n][k]) {
    return nckCache[n][k];
  }

  if (!nckCache[n]) {
    nckCache[n] = [];
  }

  nckCache[n][k] = factorial(n) / factorial(k) / factorial(n - k);
  return nckCache[n][k];
}

function test_nChooseK() {
  const N = 100;
  for (let n = 0; n <= N; n++) {
    const row = range(n + 1).map(k => nChooseK(n, k).toString().padStart(5, ' ')).join('');
    console.log(row);
  }
}

/**
 * Generates a subset of k numbers from the interval [0,n), given a number r from [0, n choose k).
 *
 * @param {number} n
 * @param {number} k
 * @param {BigInt} r
 * @returns {number[]}
 */
export function combo(n, k, r) {
  if (r < 0n) {
    throw new Error('r must be nonnegative');
  }

  const nck = nChooseK(n, k);
  if (r >= nck) {
    throw new Error(`r must be in interval [0, n choose k (${nck.toString()})`);
  }

  // Anything choose 0 is 1. There's only one way to choose nothing, i.e. the empty set.
  if (k === 0) {
    return [];
  }

  /** @type {number[]} */
  const result = Array(k).fill(0);

  let _n = n - 1;
  let _k = k - 1;
  let _r = BigInt(r);

  let index = 0;
  for (let i = 0; i < n; i++) {
    const _nck = nChooseK(_n, _k);
    if (_r < _nck) {
      result[index++] = i;
      _k--;

      if (index === k) {
        break;
      }
    } else {
      _r -= _nck;
    }
    _n--;
  }

  return result;
}

/**
 * Generates all possible combinations of k numbers from the interval [0,n).
 * Note: This function is not efficient for large values of n and k.
 * @param {number} n
 * @param {number} k
 * @returns {number[][]} An array of all possible combinations.
 */
export function allCombos(n, k) {
  const nck = nChooseK(n, k);
  const combos = [];
  for (let r = 0n; r < nck; r++) {
    combos.push(combo(n, k, r));
  }
  return combos;
}

/**
 * Performs a callback for each combination of k numbers from the interval [0,n).
 * @param {number} n
 * @param {number} k
 * @param {(items: number[]) => boolean} callback
 */
export function forEachCombo(n, k, callback) {
  const nck = nChooseK(n, k);
  for (let r = 0n; r < nck; r++) {
    if (!callback(combo(n, k, r))) {
      break;
    }
  }
}

/**
 * Generates a subset of k numbers from the interval [0,n), given a number r from [0, n choose k).
 *
 * @param {number} n
 * @param {number} k
 * @param {bigint} r
 * @returns {bigint}
 */
export function bitCombo(n, k, r) {
  if (r < 0n) {
    throw new Error('r must be nonnegative');
  }

  const nck = nChooseK(n, k);
  if (r >= nck) {
    throw new Error(`r must be in interval [0, n choose k (${nck.toString()})`);
  }

  // Anything choose 0 is 1. There's only one way to choose nothing, i.e. the empty set.
  if (k === 0) {
    return 0n;
  }

  let _result = 0n;

  let _n = n - 1;
  let _k = k - 1;
  let _r = BigInt(r);

  for (let mask = (1n << BigInt(n - 1)); mask > 0n; mask>>=1n) {
    const _nck = nChooseK(_n, _k);
    if (_r < _nck) {
      _result |= mask;
      _k--;
      if (_k < 0) {
        break;
      }
    } else {
      _r -= _nck;
    }
    _n--;
  }

  return _result;
}

/**
 * Generates a subset of k numbers from the interval [0,n), given a number r from [0, n choose k).
 *
 * @param {number} n
 * @param {number} k
 * @param {bigint} r
 * @returns {bigint}
 */
export function bitCombo2(n, k, r) {
  if (r < 0n) {
    throw new Error('r must be nonnegative');
  }

  const nck = nChooseK(n, k);
  if (r >= nck) {
    throw new Error(`r must be in interval [0, n choose k (${nck.toString()})`);
  }

  // Anything choose 0 is 1. There's only one way to choose nothing, i.e. the empty set.
  if (k === 0) {
    return 0n;
  }

  let _result = 0n;
  let _r = BigInt(r);

  for (let _n = n - 1, _k = k - 1; _n >= 0 && _k >= 0; _n--) {
    const _nck = nChooseK(_n, _k);
    if (_r < _nck) {
      _result |= (1n << BigInt(_n));
      _k--;
    } else {
      _r -= _nck;
    }
  }

  return _result;
}

/**
 * Converts a bit combination to a number.
 *
 * @param {number} n
 * @param {number} k
 * @param {bigint} bc
 * @returns {bigint}
 */
export function bitComboToR(n, k, bc) {
  let nck = nChooseK(n, k);

  // Binary search for the bit combination.
  let lo = 0n;
  let hi = nck - 1n;
  let mid = 0n;

  while (lo <= hi) {
    mid = lo + ((hi - lo) / 2n);
    let midBC = bitCombo2(n, k, mid);
    if (midBC > bc) {
      lo = mid + 1n;
    } else if (midBC < bc) {
      hi = mid - 1n;
    } else {
      return mid;
    }
  }

  return -1n;
}

function test_combos_against_another(n, k, r) {
  const _combo = combo(n, k, r);
  let _comboToBitMap = 0n;
  _combo.forEach((i) =>  {
    _comboToBitMap |= (1n << BigInt(n - i - 1))
  });

  const _bigCombo = bitCombo2(n, k, r);

  // Test that both combo functions return the same result when converted to bitmap.
  if (_comboToBitMap !== _bigCombo) {
    console.log(`n = ${n}, k = ${k}, r = ${r}, _comboToBitMap = ${_comboToBitMap}, _bigCombo = ${_bigCombo}`);

    console.log(`comboarr: ${_combo.join(', ')}`);

    let leftPad = n - _comboToBitMap.toString(2).length;
    console.log(`   combo: ${'0'.repeat(leftPad)}${_comboToBitMap.toString(2)}`);

    leftPad = n - _bigCombo.toString(2).length;
    console.log(`bigCombo: ${'0'.repeat(leftPad)}${_bigCombo.toString(2)}`);

    return false;
  }

  return true;
}

function test_combos() {
  const N = 81;
  const k = 27;
  const nck = nChooseK(N, k);

  // Repeat 1000
  // Generate a random r in [0, nChooseK(n, k))]
  // Test that both combo functions return the same result when converted to bitmap.

  for (let i = 0; i < 1000; i++) {
    const r = randomBigInt(nck);
    if (!test_combos_against_another(N, k, r)) {
      return;
    }
  }

  console.log('(test_combos) All tests passed!');
}

// test_combos();

// Given a subset of k numbers from the interval [0,n), returns the number r from [0, n choose k)
// that represents the subset when fed into combo(n, k, r).
/**
 *
 * @param {bigint} bibits A bigint of bit length n where the k bits set to 1 represent a combination.
 * @param {number} n The number of bits in bibits. Must satisfy k <= n, where k is the number of bits in `bibits` set to 1.
 * @returns {bigint} the number in [0, nChooseK(n, k)] that represents this bit combination.
 */
// export function bigRFromBitCombo(bibits, n) {
//   const k = bibits.toString(2).split('').filter(c => c === '1').length;
//   if (k === 0) {
//     return 0n;
//   }

//   // TODO rewrite below
//   let r = 0n;
//   for (let i = 0; i < k; i++) {
//     r |= (1n << BigInt(arr[i]));
//   }
//   return r;
// }

function test_rFromCombo() {
  const N = 6;
  let total = 0n;
  let failed = 0n;
  for (let n = 0; n < N; n++) {
    for (let k = 0; k <= n; k++) {
      const nck = nChooseK(n, k);
      for (let r = 0n; r < nck; r++) {
        const c = combo(n, k, r);
        const _r = bigRFromBitCombo(c, n);
        total++;
        process.stdout.write(`(${n} c ${k}) r[${r}] _r[${_r}]\t\t`);
        if (r !== _r) {
          console.log(' (FAIL)');
          failed++;
        } else {
          console.log('');
        }
      }
    }
  }
  console.log(`total = ${total}, failed = ${failed}`);
}

function test_combo() {
  let failCount = 0;
  const N = 10;
  for (let n = 1; n < N; n++) {
    for (let k = 0; k < n; k++) {
      const nck = nChooseK(n, k);
      for (let r = 0n; r < nck; r++) {
        const expectedCombo = combos[n][k][r];
        const actualCombo = combo(n, k, r).join('');
        if (actualCombo === expectedCombo) {
          console.log(`[PASS] n = ${n}, k = ${k}, r = ${r}, actualCombo = ${actualCombo}, expectedCombo = ${expectedCombo}`);
        } else {
          console.log(`[FAIL] n = ${n}, k = ${k}, r = ${r}, actualCombo = ${actualCombo}, expectedCombo = ${expectedCombo}`);
          failCount++;
        }
      }
    }
  }

  if (failCount === 0) {
    console.log('All tests passed!');
  } else {
    console.log(`failCount = ${failCount}`);
  }

  console.log('Testing all combos for uniqueness...');
  failCount = 0;
  const _combos = [];
  for (let n = 1; n < 10; n++) {
    _combos[n] = [];
    for (let k = 0; k < n; k++) {
      const nck = nChooseK(n, k);
      _combos[n][k] = [];
      for (let r = 0n; r < nck; r++) {
        const _combo = combo(n, k, r);
        const _comboStr = _combo.join('');
        if (_combo.length !== k || _combos[n][k].includes(_comboStr)) {
          console.log(`[FAIL] n = ${n}, k = ${k}, r = ${r}, _combo = ${_comboStr}`);
          failCount++;
        }
        _combos[n][k].push(_comboStr);
      }
    }
    console.log(_combos[n].map(k => k.length).join(', '));
  }
  if (failCount === 0) {
    console.log('All combos are unique!');
  } else {
    console.log(`failCount = ${failCount}`);
  }
}

// Where bitLengthCache[i]
const bitLengthCache = [
  0n, 1n, 2n, 4n, 8n, 16n, 32n, 64n, 128n, 256n,
  512n, 1024n, 2048n, 4096n, 8192n, 16384n, 32768n, 65536n, 131072n, 262144n,
  524288n, 1048576n, 2097152n, 4194304n, 8388608n, 16777216n, 33554432n,
  67108864n, 134217728n, 268435456n, 536870912n, 1073741824n,
];
/**
 * Computes the bit length of a BigInt.
 * @param {BigInt} bn
 * @returns {number}
 */
export function bitLength(bn) {
  bn = BigInt(bn);
  if (bn < 0n) {
    bn = -bn;
  }

  let bits = 0;
  let i = bitLengthCache.length - 1;
  while (i > 0) {
    if (bn === 0n) {
      return bits;
    }
    while (bn >= bitLengthCache[i]) {
      bits += i;
      bn >>= BigInt(i);
    }
    i--;
  }

  return bits;
}

function test_bitLength() {
  [
    [414856887881740073965728593681n, 99],
    [141383060217536481862799697542n, 97],
    [184813142392016790842646459707n, 98],
    [514994434223024047778568435712n, 99],
    [1159996790379937067950973929647n, 100],
    [381101659872745631035277052198n, 99],
    [1170801340026017371569760397298n, 100],
    [901386676344563059891669675397n, 100],
    [1060977509650157210085347947504n, 100],
    [675782894543969379802151692796n, 100],
    [1226311869746061357354768755160n, 100],
    [459864662556709936444962676825n, 99],
    [162429285339323834935542912023n, 98],
    [754195862158807866061032975058n, 100],
    [859140980937711533154450297855n, 100],
    [861545769879643469175880332194n, 100],
    [353127639855704906746689959867n, 99],
    [1144164724605619946730021182953n, 100],
    [768622242651426754394941299162n, 100],
    [887924384473628454576566940816n, 100],
    [222020400023661409964239738920n, 98],
    [955712853985511478719782269495n, 100],
    [1003351994378562191159311935313n, 100],
    [359188954937423310647299150878n, 99],
    [605061469138650290221098853384n, 99],
    [928962030311158486197863521364n, 100],
    [1183579948707951216715558707100n, 100],
    [902705046058715018184278560301n, 100],
    [316837591006297311168082261756n, 98],
    [621651541385240320899721549484n, 99],
    [533478057368102944199454084771n, 99],
    [309469251917201367299197323800n, 98],
  ].forEach(([r, expectedbLen]) => {
    const bLen = bitLength(BigInt(r));
    console.log(`r = ${r.toString()}, bitLength = ${bLen}, expected = ${expectedbLen}`);
  });
}

/**
 * Generates a random BigInt between 0 and upperBound.
 * @param {bigint} upperBound (Default: `Number.MAX_SAFE_INTEGER`)
 * @returns {bigint}
 */
// export function randomBigInt(upperBound = BigInt(Number.MAX_SAFE_INTEGER)) {
//   const bLen = bitLength(upperBound);
//   const byteLen = Math.ceil(Number(bLen) / 8);
//   const randBytes = new Uint8Array(byteLen);

//   let randInt = BigInt(upperBound);
//   let i;
//   do {
//     for (i = 0; i < byteLen; i++) {
//       randBytes[i] = Math.floor(Math.random() * 256);
//     }

//     randInt = BigInt('0x' + Array.from(randBytes).map(byte => byte.toString(16).padStart(2, '0')).join(''));
//     // randInt = BigInt('0x' + Array.from(randBytes).map(byte => byte.toString(16).padStart(2, '0')).join(''));
//   } while (randInt >= upperBound);

//   return randInt;
// }

function rand(max) {
  return Math.floor(Math.random() * max);
}

/**
 * Generates a random BigInt between 0 and upperBound.
 * @param {bigint} upperBound (Default: `Number.MAX_SAFE_INTEGER`)
 * @returns {bigint}
 */
export function randomBigInt(upperBound = BigInt(Number.MAX_SAFE_INTEGER)) {
  // Normalize upperbound within [2,inf)
  if (upperBound < 2n) {
    if (upperBound < -2n) {
      upperBound = -upperBound;
    } else {
      upperBound = 2n;
    }
  }

  let bound = upperBound;
  let result = 0n
  let i = 0n;

  while (bound > 0n) {
    if (bound >= 65536n) {
      result |= (BigInt(rand(65536)) << i);
      i += 16n;
      bound >>= 16n;
    } else if (bound >= 256n) {
      result |= (BigInt(rand(256)) << i);
      i += 8n;
      bound >>= 8n;
    } else if (bound >= 16n) {
      result |= (BigInt(rand(16)) << i);
      i += 4n;
      bound >>= 4n;
    } else {
      let r = 0;
      do {
        r = BigInt(rand(Number(bound)));
      } while ((result | (BigInt(r) << i)) >= upperBound);
      result |= (r << i);
      bound = 0n;
    }
  }

  return result;
}

function test_randomBigInt() {
  const upperBound = 1000;
  const trials = 1000000;
  const counts = Array(upperBound).fill(0);
  for (let i = 0; i < trials; i++) {
    const randInt = randomBigInt(BigInt(upperBound));
    counts[Number(randInt)]++;
  }
  console.log(counts);
}
// test_randomBigInt();

export function randomPermutation(n) {
  return permutation(n, randomBigInt(factorial(n)));
}

function test_randomPermutation() {
  const N = 9;
  const counts = Array(N).fill(0);
  const trials = 10000;
  for (let i = 0; i < trials; i++) {
    const perm = randomPermutation(N);
    counts[perm[0]]++;
    if ((i % 1000) === 0) {
      // Log '.' every 10,000 trials.
      process.stdout.write('.');
    }
  }
  console.log(`\n${counts}`);
}

/**
 * Generates a random combination of k numbers from the interval [0,n).
 * @param {number} n
 * @param {number} k
 * @returns {number[]}
 */
export function randomCombo(n, k) {
  return combo(n, k, randomBigInt(nChooseK(n, k)));
}

function test_randomCombo() {
  const N = 9;
  const K = 3;
  const comboMap = {};
  const nck = nChooseK(N, K);
  for (let i = 0; i < nck; i++) {
    const c = combo(N, K, BigInt(i));
    const combStr = c.join('');
    if (comboMap[combStr]) {
      console.log(`[FAIL] Duplicate combo: ${combStr}`);
    }
    comboMap[combStr] = i;
  }

  const counts = Array(parseInt(nck.toString())).fill(0);
  const trials = 1000000;
  for (let i = 0; i < trials; i++) {
    const comb = randomCombo(N, K);
    const combStr = comb.join('');
    counts[comboMap[combStr]]++;

    if ((i % 10000) === 0) {
      // Log '.' every 10,000 trials.
      process.stdout.write('.');
    }
  }
  console.log(`\n${counts}`);
  console.log(`Unique combos: ${Object.keys(comboMap).length}`);
  console.log(`#counts: ${counts.length}`);
  const sum = counts.reduce((a, b) => a + b, 0);
  console.log(`sum(counts): ${sum}`);
}

export function randomBigCombo(n, k) {
  return bitCombo2(n, k, randomBigInt(nChooseK(n, k)));
}

// console.log(`bitCombo2(7, 5, 17n) = ${bitCombo2(7, 5, 17n)}`);

// const N = 8;
// const K = 6;
// const NCK = nChooseK(N, K);
// const rSpaces = NCK.toString(10).length;
// const bcSpacesDecimal = (1<<(N-1)).toString(10).length;
// for (let r = 0n; r < NCK; r++) {
//   const bc = bitCombo2(N, K, r);
//   console.log(`[${r.toString(10).padStart(rSpaces)} | ${bc.toString(10).padStart(bcSpacesDecimal)}] ${bc.toString(2).padStart(N, '0')}`);
// }


export default {
  factorial,
  permutation,
  permutation2,
  shuffle,
  nChooseK,
  combo,
  bitCombo,
  bitCombo2,
  bitLength,
  randomBigInt
};
