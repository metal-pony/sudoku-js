import Move from '../structs/Move';
import Position from '../structs/Position';
import Blocky from './Blocky';
import BlockyState from './BlockyState';

let DEBUG = true;
const debug = (...args) => {
  if (DEBUG) {
    console.log(...args)
  }
};

async function sleep(timeMs) {
	return new Promise((resolve) => {
		setTimeout(resolve, timeMs);
	});
}

export default class BlockyAi extends Blocky {

  /**
   *
   * @param {BlockyState} state
	 * @param {(state: BlockyState) => number} ranker
   */
  constructor(state = new BlockyState({ useGravity: false }), ranker) {
    super(state);

		this.ranker = ranker;
  }

  /**
   *
   * @param {number} sleepTime
   * @param {*} options
   * @param {*} panel
   * @returns {GameStats}
   */
  async run(sleepTime, options, panel) {
		this.setup();
		this.start();

		// TODO #13 Remove this and the print-outs after debugging.
		// This could be a stat that TetrisGame tracks, but it's unclear what it could be useful for.
		// Turn it into a stat if a use case is found.
		// int ticks = 0;

		while (!this.state.isGameOver) {
			if (this.state.piece.isActive()) {
				const bestPlacement = this.findBestPlacement(options);
				if (bestPlacement !== null) {
					state.piece.position(bestPlacement);
				}
			}

			// debug('.');
			// if (ticks > 80) {
			// 	debug('');
			// 	ticks = 0;
			// }
			this.gameloop();

			if (sleepTime > 0) {
				await sleep(sleepTime);
			}
		}

		return new GameStats(getState());
	}

	/**
	 *
	 * @param {object} options
	 * @param {number} options.lookAhead
	 * @param {number} options.percentage
	 *
	 * @returns {Position | null}
	 */
  findBestPlacement(options) {
		// const percentageToKeep = options.percentage;
		const topPlacements = this.getTopPlacements([], options.percentage);

		// TODO temp turn off
		// for (int n = 0; n < options.lookAhead(); n++) {
		// 	topPlacements.stream().flatMap((p) -> getTopPlacements(
		// 		p.game(),
		// 		p.placements(),
		// 		percentageToKeep
		// 	).stream());
		// }

		if (topPlacements.length === 0) {
			return null;
		}

		topPlacements.sort((a, b) => (b.rank - a.rank));
		return topPlacements[0].placements[0];
	}

	/**
	 * @typedef {Object} PlacementRank
	 * @property {BlockyAi} game
	 * @property {Position[]} placements
	 * @property {number} rank
	 */

  /**
	 * Finds the best placements for the current piece using the given ranker.
	 *
	 * @param {Position[]} prevPositions The previous positions of the current piece.
	 * @param {number} percentageToKeep The percentage of possible placements to keep.
	 * @return {PlacementRank[]} A list of the best placements for the current piece.
	 */
	getTopPlacements(prevPositions, percentageToKeep) {
		/** @type {PlacementRank[]} */
		const placements = [];
		const possiblePlacements = this.getPossiblePlacements();
		possiblePlacements.forEach((placement) => {
			// debug(
			// 	'Looking at %s @ %s\n',
			// 	game.shape.name(),
			// 	placement.toString()
			// );

			const stateCopy = BlockyState.copy(this.state);
			const copy = new BlockyAi(stateCopy);
			copy.state.piece.position(placement);
			copy.plotPiece();
			// copy.attemptClearLines(); // TODO #13 Not sure it is correct to clear lines?
			// copy.nextPiece();

			const prevPositionsCopy = prevPositions.map((p) => Position.copy(p));
			prevPositionsCopy.push(placement);

			const rank = this.ranker(stateCopy);
			// debug('Rank: ' + rank);

			placements.push({
				game: copy,
				placements: prevPositionsCopy,
				rank
			});
		});
		// TODO Make sure this sorts correctly.
		placements.sort((a, b) => (b.rank - a.rank));
		const numToKeep = Math.round(placements.size() * percentageToKeep);

		if (placements.length > 0 && numToKeep === 0) {
			numToKeep = 1;
		}

		const sublist = placements.slice(0, numToKeep);
		//placements.subList(0, numToKeep);
		// debug(
		// 	'TopPlacements ([%d], [%d] possible, [%.2f] keepPercentage): %s\n',
		// 	sublist.size(),
		// 	possiblePlacements.size(),
		// 	percentage,
		// 	sublist
		// );
		return sublist;
	}

  /**
	 * Calculates the set of Tetrominos containing all terminal states for the given
	 * Tetromino on the given Board.
	 *
	 * @return {Set<Position>} The set of all possible placements for the current piece.
	 */
	getPossiblePlacements() {
		// debug('getPossiblePlacements()');
		/** @type {Set<Position>} */
		const placements = new Set();
		/** @type {(position: Position) => Boolean} */
		const acceptance = ((position) => this.state.isPositionValid(position));
		// SearchQueue<Position>
		// const q = new SearchQueue(acceptance);
		/** @type {Position[]} */
		const q = [];
		/** @type {Set<Position>} */
		const seen = new Set();

		// TODO Doc why the (- 3) when you remember.
		const topMostBlockRow = this.getTopmostBlocksRow() - 3;
		/** @type {Position} */
		const startPosition = this.state.piece.position();
		if (startPosition.row < topMostBlockRow) {
			startPosition.row = topMostBlockRow;
			// startPosition.location.set(topMostBlockRow, startPosition.colOffset());
			// startPosition.add(new Coord(position.location().row(), 0), 0);
		}

		q.push(startPosition);
		seen.add(startPosition);

		while (q.length > 0) {
			const currentPosition = q.shift();
			// debug('Looking at ' + currentPosition.toString());

			// Is the move legal?
			// I don't think this this condition will ever be true, given the acceptCriteria on the queue.
			if (!this.state.isPositionValid(currentPosition)) {
				// debug('Invalid, skipping...');
				continue;
			}

			// Is the new position terminal / i.e. can we move down?
			if (!this.state.isPositionValid(Position.copy(currentPosition).add(Move.DOWN))) {
				// debug('Terminal position! Adding to result set.');
				placements.add(currentPosition);
				// debug('.');
			}

			Move.ATOMIC_MOVES.forEach((nextMove) => {
				const nextPosition = Position.copy(currentPosition).add(nextMove);
				if (
					!seen.has(nextPosition) &&
					acceptance(nextPosition)
				) {
					// System.out.printf('Added %s to the queue.\n', nextPosition.toString());
					q.push(nextPosition);
				} else {
					// System.out.printf(
					// 	'Tried to add %s to the queue, but failed. [seen: %b; passedCriteria: %b]\n',
					// 	nextPosition.toString(),
					// 	q.hasSeen(nextPosition),
					// 	acceptance.apply(nextPosition)
					// );
				}
			});
		}

		// System.out.println();
		return placements;
	}

  /**
	 * Calculates the row of the topmost blocks on the board.
	 *
	 * @return {number} The row of the topmost blocks on the board.
	 */
	getTopmostBlocksRow() {
		const board = this.state.board;
		for (let i = 0; i < board.length; i++) {
			if (board[i] > 0) {
				return i / this.state.cols;
			}
		}
		return this.state.rows - 1;
	}
}
