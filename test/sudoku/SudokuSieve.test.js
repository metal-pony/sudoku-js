import {
  bitCombo,
  cellMask,
  digitMask,
  nChooseK,
  randomBigInt,
  Sudoku,
  SudokuSieve
} from '../../index.js';
import { NUM_DIGITS, NUM_SPACES } from '../../src/sudoku/Sudoku.js';

// For config = '218574639573896124469123578721459386354681792986237415147962853695318247832745961'
const expectedSieveItemsByK = [
  [],[],
  [ // 2 digits
    306954992322430055219200n,
    9288709664931840n,
    3151872n,
    1511157274518286468383040n,
    1649267453952n,
    9165803807047680n,
    343597386240n,
    11258999152312320n,
    71442432n,
    3458764556770410496n,
    18711025025408n,
    906694367033157887197184n,
    85002776835641929891840n,
    5387583584n,
    2286993044144131n,
    2375090357084813787136n,
    13194173645824n,
    188894661003635668811800n,
    456003513502100115984648n,
    332635868477652992257n,
    1770887431076134011552n,
    1285683059475306671767552n,
    6917529027678962706n,
    623465938509745721704448n,
    46116860185079194641n,
    90715224165318656n,
    313905469185801060352n,
    56751409310457911050240n,
    642247033199690103390208n,
    23833193662228564279302n,
    312561793925627461783552n,
    442722210901249822980n,
    81609584732805024252452n,
    681238871132469039473185n,
    158348076961214400921612n,
    42663861689921679983636n,
    14906266688228606427268n,
    1213815652731362392213572n,
    609371475647174927261701n,
    379265121277624569565984n,
    321492179682895215071490n,
    340319388946031560365328n,
    95704059171078599213602n,
    230215483705507665445416n,
    114531268434214944507440n,
    172442542110778310950922n,
    29000731837792516456578n,
    1227910117880926302242882n,
    163512156372221582688392n,
    1362421542415355368474696n,
    757977365331167903522825n,
    47827941100928861750416n,
    1246737327144062647536720n,
    1218979732142369573980352n,
    614535555058182109028481n,
    1813444941101315894814785n
  ],
  [
    306954992322430055219200n,
    9288709664931840n,
    3151872n,
    1511157274518286468383040n,
    1649267453952n,
    9165803807047680n,
    343597386240n,
    11258999152312320n,
    71442432n,
    3458764556770410496n,
    442721861067576705024n,
    18711025025408n,
    906694367033157887197184n,
    85002776835641929891840n,
    5387583584n,
    2286993044144131n,
    2375090357084813787136n,
    188894661003635668811800n,
    13194173645824n,
    264452523040700131967032n,
    226673592866592830521392n,
    774471057551977370091520n,
    55340232221933964288n,
    864691134897610752n,
    456003513502100115984648n,
    332635868477652992257n,
    1770887431076134011552n,
    1285683059475306671767552n,
    686108199077553062805509n,
    221361773309449469962n,
    6917529027678962706n,
    623465938509745721704448n,
    42658096514878268243992n,
    46116860185079194641n,
    774058469490688n,
    90775682272198656n,
    1275455443268349722624n,
    170116522368844605423616n,
    64563604257983441937n,
    90071993018745089n,
    90715224165318656n,
    42953245054613269250048n,
    313905469185801060352n,
    1290552675651798981148672n,
    56751409310457911050240n,
    33056565380087525228678n,
    23611832590270095245444n,
    1266640121577616n,
    642247033199690103390208n,
    720594256535773184n,
    321123244868491229265920n,
    330567977904599262560256n,
    899440925170158555136n,
    340900586305349249683456n,
    28334199073139769737362n,
    27671279467417832448n,
    27670122789775346688n,
    1034315057901089083392n,
    442726714470813401088n,
    23611834983503441690630n,
    432345570689172064n,
    46118027875017818115n,
    23833193662228564279302n,
    24128341568507416150022n,
    312561793925627461783552n,
    1285813303576530226579524n,
    3463305578447702084n,
    54686427162116608n,
    3541892599231727271936n,
    375852413800404881680n,
    313902091469437537280n,
    666537285915460501696n,
    1228500265035032298653890n,
    2841687869399177n,
    757977362533460163690625n,
    1813388736177343675498569n,
    312342738839777930641408n,
    56751410429761016570897n,
    1397825383921228384829464n,
    442722210901249822980n,
    81609584732805024252452n,
    355331248034052n,
    681238871132469039473185n,
    33795732654891550638080n,
    29073366136837533335558n,
    47827939834288790651904n,
    614534834481861625118849n,
    368935131063336177922n,
    28703133993096835109122n,
    666532764652818022544n,
    1246709657030090440048720n,
    1246709657065330646712400n,
    56757173918144154042374n,
    226673591812437283734056n,
    321234501620512775471361n,
    2951480344821921006736n,
    191846139659607695474840n,
    681350671022789597667328n,
    172590116344842959355904n,
    5766582418295292956n,
    312561794357752845062144n,
    163512173682930369740936n,
    312561866556084370558976n,
    163512155879638092529800n,
    1229016670323769736300610n,
    81019433037637590532772n,
    81019433037637599117860n,
    1366824473334437192225n,
    56209999318296340553n,
    379265121277624569565984n,
    321639753632186364989698n,
    321492179682895215071490n,
    158348076961214400921612n,
    42663861689921679983636n,
    340319388946031560365328n,
    14906266688228606427268n,
    1213815652731362392213572n,
    609371475647174927261701n,
    95704059171078599213602n,
    230215483705507665445416n,
    114531268434214944507440n,
    172442542110778310950922n,
    29000731837792516456578n,
    1227910117880926302242882n,
    163512156372221582688392n,
    1362421542415355368474696n,
    757977365331167903522825n,
    47827941100928861750416n,
    1246737327144062647536720n,
    1218979732142369573980352n,
    614535555058182109028481n,
    1813444941101315894814785n,
    312562086660792947853312n,
    3541893653664602030648n,
    265646996448993544766976n,
    190089132160129267926568n,
    116878688116636180316696n,
    719027029749285408212528n,
    59114969298000358310930n,
    625752833193074747809801n,
    758016490389772582944778n,
    1400200470904937741060176n,
    1813389600869095303031873n,
    1246774220632210335072336n,
    1218980308603115434961088n,
    1813444076410189587179585n,
    614535843288562555682945n,
  ]
];

describe('SudokuSieve', () => {
  /** @type {Sudoku} */
  let config;
  /** @type {number[]} */
  let configBoard;
  /** @type {SudokuSieve} */
  let sieve;

  beforeEach(() => {
    config = new Sudoku('218574639573896124469123578721459386354681792986237415147962853695318247832745961');
    configBoard = config.board;
    sieve = new SudokuSieve({ config });
  });

  describe('constructor', () => {
    test('throws error when config is undefined', () => {
      expect(() => { new SudokuSieve(); }).toThrow();
    });

    test('throws error when config is not a Sudoku obj', () => {
      expect(() => { new SudokuSieve({ config: 'meow' }); }).toThrow();
    });

    test('throws error when config is not valid', () => {
      let invalidConfig = new Sudoku(config);
      invalidConfig.setDigit(0, 0);
      expect(() => { new SudokuSieve({ config: invalidConfig }); }).toThrow();

      invalidConfig = new Sudoku(config);
      invalidConfig.setDigit(config.getDigit(1), 0);
      expect(() => { new SudokuSieve({ config: invalidConfig }); }).toThrow();
    });
  });

  describe('addFromMask', () => {
    test('finds all expected UAs containing 2 and 3 digits', () => {
      expect(expectedSieveItemsByK[3]).toEqual(expect.arrayContaining(expectedSieveItemsByK[2]));

      let k = 2;

      let nck = nChooseK(NUM_DIGITS, k);
      for (let r = 0n; r < nck; r++) {
        const dCombo = Number(bitCombo(NUM_DIGITS, k, r));
        let pMask = 0n;
        for (let ci = 0; ci < NUM_SPACES; ci++) {
          if (digitMask(configBoard[ci]) & dCombo) {
            pMask |= cellMask(ci);
          }
        }
        sieve.addFromMask(~pMask);
      }

      expect(sieve.length).toBe(expectedSieveItemsByK[k].length);
      expect(sieve.items).toEqual(expect.arrayContaining(expectedSieveItemsByK[k]));
      // console.log(sieve.items.map(item => config.filter(~item).toString()));

      const sieve2 = new SudokuSieve({ config });
      k = 3;
      nck = nChooseK(NUM_DIGITS, k);
      for (let r = 0n; r < nck; r++) {
        const dCombo = Number(bitCombo(NUM_DIGITS, k, r));
        let pMask = 0n;
        for (let ci = 0; ci < NUM_SPACES; ci++) {
          if (digitMask(configBoard[ci]) & dCombo) {
            pMask |= cellMask(ci);
          }
        }
        sieve2.addFromMask(~pMask);
      }

      expect(sieve2.length).toBe(expectedSieveItemsByK[k].length);
      expect(sieve2.items).toEqual(expect.arrayContaining(expectedSieveItemsByK[k]));
      // console.log(sieve2.items.map(item => config.filter(~item).toString()));

      // Expect all 56 sieve items from k = 2 to be found in k = 3
      expect(sieve2.items).toEqual(expect.arrayContaining(sieve.items));
    });
  });

  describe('add', () => {
    describe('when items are not duplicate', () => {
      test('adds items to the sieve and returns true', () => {
        expect(sieve.add(306954992322430055219200n, ...expectedSieveItemsByK[2])).toBe(true);
        expect(sieve.items).toEqual(expect.arrayContaining(expectedSieveItemsByK[2]));
      });
    });

    describe('when given item is duplicate', () => {
      test('does not add duplicate items and returns false', () => {
        expect(sieve.add(...expectedSieveItemsByK[2])).toBe(true);
        const lengthBefore = sieve.length;
        expect(sieve.add(306954992322430055219200n)).toBe(false);
        expect(sieve.length).toBe(lengthBefore);
      });
    });

    describe('when items are derivatives', () => {
      test('does not add the derivative and returns false', () => {
        const item = 306954992322430055219200n;
        sieve.add(item);

        for (let t = 0; t < 100; t++) {
          expect(sieve.add(item | randomBigInt(item))).toBe(false);
        }
      });
    });
  });

  describe('isDerivative', () => {
    test('mask 0n is always a derivative', () => {
      expect(sieve.isDerivative(0n)).toBe(true);
    });

    test('returns true if the item is a derivative', () => {
      const item = 306954992322430055219200n;
      sieve.add(item);

      for (let t = 0; t < 100; t++) {
        const clearlyDerivative = item | randomBigInt(item);
        expect(sieve.isDerivative(clearlyDerivative)).toBe(true);
      }
    });

    test('returns false if the item is not a derivative', () => {
      let k = 3;
      let j = 0;
      sieve.add(expectedSieveItemsByK[k][j++]);
      for (; j < expectedSieveItemsByK[k].length; j++) {
        expect(sieve.isDerivative(expectedSieveItemsByK[k][j])).toBe(false);
      }
    });
  });

  describe('reductionMatrix', () => {
    test('sums the occurrences of bits', () => {
      // TODO Create a sieve with a preset of items

      // TODO Verify that the reduction matrix is as expected
    });

    test('sdlfkf', () => {
      const c = new Sudoku('847152693921376485635948721472635918316789542598214367263591874789423156154867239');
      const p = new Sudoku('847152693921376485635948721472635.1.3167895425982143672.35.1.747.942315.1548.723.');

      // Verify that c and s is valid and s has solutionsFlag = 2 and c has solutionsFlag = 1
      expect(p.isValid()).toBe(true);
      expect(c.isValid()).toBe(true);
      expect(p.solutionsFlag()).toBe(2);
      expect(c.solutionsFlag()).toBe(1);

      // For every empty cell in p, fill the cell with the corresponding cell in c,
      // and check if the puzzle is still valid and solutionsFlag = 1.
      const cBoard = c.board;
      const pBoard = p.board;
      for (let ci = 0; ci < 81; ci++) {
        if (pBoard[ci] === 0) {
          const pCopy = new Sudoku(p);
          pCopy.setDigit(cBoard[ci], ci);
          expect(pCopy.isValid()).toBe(true);
          expect(pCopy.solutionsFlag()).toBe(1);
        }
      }
    });
  });

  // describe('_generateMask', () => {
  //   // TODO Test that results have bit counts of < maxSelections

  //   // TODO If the sieve is empty, then the mask should be 0n

  //   // TODO Test that results satisfy all sieve items such that the mask overlaps btest(s) with
  //   //      all sieve items.

  //   // TODO What is the expected behavior when it's impossible or difficult to generate a mask that satisfies
  //   //     all sieve items within the maxSelections?
  //   //     - Should it return 0n?
  //   //     - Should it return a mask that satisfies the most sieve items and ignore maxSelections?
  //   //     - How many attempts should it make before increasing maxSelections?

  //   test('', () => {

  //   });
  // });
});
