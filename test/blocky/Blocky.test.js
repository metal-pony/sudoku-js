import {jest} from '@jest/globals';
import {
  Blocky,
  BlockyState,
  BlockyEvent,
  Event,
  EventBus,
  Move
} from '../../index.js';

const mockTimer = {
  delayNextTick: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

// jest.mock('../util/Timer', () => jest.fn().mockImplementation(() => mockTimer));

describe("Blocky", () => {
  // GameOptions
  let options;

  /** @type {BlockyState} */
  let state;

  /** @type {Blocky} */
  let blocky;

  const setupWithOptions = (newOptions) => {
    blocky.setup(Object.assign(options, newOptions));
  }

  beforeEach(() => {
    jest.clearAllMocks();
    options = BlockyState.defaultOptions();
    state = new BlockyState(options);
    blocky = new Blocky(state);
    blocky.setup();
  });

  /**
   *
   * @param {string[]} eventNames
   * @param {Function} exe
   */
  const expectEventsThrown = (eventNames, exe) => {
    const mockEvents = eventNames.map(eventName => new BlockyEvent(eventName));
    eventNames.forEach((eventName, index) => {
      jest.spyOn(BlockyEvent, eventName).mockReturnValue(mockEvents[index]);
    });
    jest.spyOn(blocky, 'throwEvent');
    exe();
    eventNames.forEach((eventName, index) => {
      expect(BlockyEvent[eventName]).toHaveBeenCalled();
      expect(blocky.throwEvent).toHaveBeenCalledWith(mockEvents[index]);
    });
  };

  /**
   *
   * @param {string} eventName
   * @param {Function} exe
   */
  const expectEventThrown = (eventName, exe) => expectEventsThrown([eventName], exe);

  /**
   * @param {string} eventName
   * @param {Function} exe
   */
  const expectEventNotThrown = (eventName, exe) => {
    const mockEvent = new BlockyEvent(eventName);
    jest.spyOn(BlockyEvent, eventName).mockReturnValue(mockEvent);
    jest.spyOn(blocky, 'throwEvent');
    exe();
    expect(BlockyEvent[eventName]).not.toHaveBeenCalled();
    expect(blocky.throwEvent).not.toHaveBeenCalledWith(mockEvent);
  };

  /**
   * @param {Function} exe
   */
  const expectNoEventsThrown = (exe) => {
    jest.spyOn(blocky, 'throwEvent');
    exe();
    expect(blocky.throwEvent).not.toHaveBeenCalled();
  };

  /**
   * @param {string} eventName
   * @param {Function} exe
   */
  const expectMethodsCalled = (methodNames, exe) => {
    const _blocky = blocky;
    methodNames.forEach(methodName => jest.spyOn(_blocky, methodName));
    exe();
    methodNames.forEach(methodName => expect(_blocky[methodName]).toHaveBeenCalled());
  };

  /**
   * @param {string} eventName
   * @param {Function} exe
   */
  const expectMethodsNotCalled = (methodNames, exe) => {
    const _blocky = blocky;
    methodNames.forEach(methodName => jest.spyOn(_blocky, methodName));
    exe();
    methodNames.forEach(methodName => expect(_blocky[methodName]).not.toHaveBeenCalled());
  };

  const expectMethodCalled = (methodName, exe) => expectMethodsCalled([methodName], exe);
  const expectMethodNotCalled = (methodName, exe) => expectMethodsNotCalled([methodName], exe);

  const expectStateMethodsCalled = (methodNames, exe) => {
    const _state = state;
    methodNames.forEach(methodName => jest.spyOn(_state, methodName));
    exe();
    methodNames.forEach(methodName => expect(_state[methodName]).toHaveBeenCalled());
  };

  // const expectStateMethodsNotCalled = (methodNames, exe) => {
  //   const _state = state;
  //   methodNames.forEach(methodName => jest.spyOn(_state, methodName));
  //   exe();
  //   methodNames.forEach(methodName => expect(_state[methodName]).not.toHaveBeenCalled());
  // };

  const expectStateMethodCalled = (methodName, exe) => expectStateMethodsCalled([methodName], exe);
  // const expectStateMethodNotCalled = (methodName, exe) => expectStateMethodsNotCalled([methodName], exe);

  describe('setup', () => {
    describe('when the game has already been started', () => {
      test('stops the game', () => {
        expectMethodCalled('stop', () => {
          blocky.start();
          blocky.setup();
        });
      });
    });

    test('resets the game state with the given options', () => {
      const newRows = 10;
      const newCols = 20;
      const newOptions = Object.assign(
        BlockyState.defaultOptions(),
        { rows: newRows, cols: newCols }
      );
      jest.spyOn(state, 'reset');

      blocky.setup(newOptions);

      expect(state.reset).toHaveBeenCalledWith(newOptions);
      expect(state.rows).toBe(newRows);
      expect(state.cols).toBe(newCols);
    });

    test('throws SETUP event', () => {
      expectEventThrown('SETUP', () => blocky.setup());
    });

    describe('when the gravity effect in options', () => {
      describe('if configured true (ON)', () => {
        // Gravity is enabled by default
        test('enables the gravity effect', () => {
          expectMethodCalled('enableGravity', () => blocky.setup());
        });
      });

      describe('if configured false (OFF)', () => {
        test('disables the gravity effect', () => {
          expectMethodCalled('disableGravity', () => setupWithOptions({ useGravity: false }));
        });
      });
    });
  });

  describe('start', () => {
    describe('when the game has already started', () => {
      beforeEach(() => {
        jest.spyOn(state, 'hasStarted', 'get').mockReturnValue(true);
      });

      test('does not throw an event', () => {
        expectNoEventsThrown(() => blocky.start());
      });
    });

    describe('when the game has not yet started', () => {
      const startWithoutGravity = () => {
        setupWithOptions({ useGravity: false });
        blocky.start();
      }

      test('sets up the first game piece', () => {
        expectMethodCalled('nextPiece', startWithoutGravity);
      });

      test('throws START event', () => {
        expectEventThrown('START', startWithoutGravity);
      });

      describe('when the gravity option is set true', () => {
        test('enables gravity and sets the timer delay', () => {
          expectMethodCalled('updateGravityTimerDelayMs', () => blocky.start());
        });
      });

      describe('when the gravity option is set false', () => {
        test('does not enable gravity or update the timer delay', () => {
          expectMethodNotCalled('updateGravityTimerDelayMs', startWithoutGravity);
        });

        test('disables gravity', () => {
          expectMethodCalled('disableGravity', startWithoutGravity);
        });
      });
    });
  });

  describe('stop', () => {
    test('sets isPaused, isGameOver, isClearingLines', () => {
      blocky.stop();
      expect(state.isPaused).toBe(false);
      expect(state.isGameOver).toBe(true);
      expect(state.isClearingLines).toBe(false);
    });

    test('defers to state placePiece and throws STOP event', () => {
      expectStateMethodCalled('placePiece', () => blocky.stop());
      expectEventThrown('STOP', () => blocky.stop());
    });

    // describe('when gravity is enabled', () => {
    //   beforeEach(() => {
    //     jest.spyOn(blocky, 'isGravityEnabled').mockReturnValue(true);
    //   });

    //   test('stops the gravity timer', () => {
    //     blocky.stop();
    //     expect(mockTimer.stop).toHaveBeenCalled();
    //   });
    // });
  });

  describe('inProgress', () => {
    describe('before the game has started', () => {
      test('returns false', () => {
        expect(blocky.inProgress()).toBe(false);
      });
    });

    describe('after the game has been started', () => {
      beforeEach(() => {
        blocky.start();
      });

      describe('before the game is over', () => {
        test('returns true', () => {
          expect(blocky.inProgress()).toBe(true);
        });
      });

      describe('after the game is over', () => {
        beforeEach(() => {
          blocky.gameOver();
        });

        test('returns false', () => {
          expect(blocky.inProgress()).toBe(false);
        });
      });
    });
  });

  describe('pause', () => {
    describe('when the game is over', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(true);
      });

      test('does not throw PAUSE event', () => {
        expectNoEventsThrown(() => blocky.pause());
      });
    });

    describe('when the game is already paused', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isPaused', 'get').mockReturnValue(true);
      });

      test('does not throw PAUSE event', () => {
        expectNoEventsThrown(() => blocky.pause());
      });
    });

    describe('when the game has not yet started', () => {
      beforeEach(() => {
        jest.spyOn(state, 'hasStarted', 'get').mockReturnValue(false);
      });

      test('does not throw PAUSE event', () => {
        expectNoEventsThrown(() => blocky.pause());
      });
    });

    describe('when the game is started, not yet over, and not paused', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(false);
        jest.spyOn(state, 'isPaused', 'get').mockReturnValueOnce(false);
        jest.spyOn(state, 'hasStarted', 'get').mockReturnValue(true);
      });

      test('sets isPaused on state', () => {
        blocky.pause();
        expect(state.isPaused).toBe(true);
      });

      test('throws PAUSE event', () => {
        expectEventThrown('PAUSE', () => blocky.pause());
      });

      // describe('when gravity is enabled', () => {
      //   beforeEach(() => {
      //     jest.spyOn(blocky, 'isGravityEnabled').mockReturnValue(true);
      //   });

      //   test('stops the gravity timer', () => {
      //     blocky.pause();
      //     expect(mockTimer.stop).toHaveBeenCalled();
      //   });
      // });
    });
  });

  describe('resume', () => {
    describe('when the game has not yet started', () => {
      beforeEach(() => {
        jest.spyOn(state, 'hasStarted', 'get').mockReturnValue(false);
      });

      test('does not throw RESUME event', () => {
        expectNoEventsThrown(() => blocky.resume());
      });
    });

    describe('when the game has been started', () => {
      beforeEach(() => {
        jest.spyOn(state, 'hasStarted', 'get').mockReturnValue(true);
      });

      describe('when the game is over', () => {
        beforeEach(() => {
          jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(true);
        });

        test('does not throw RESUME event', () => {
          expectNoEventsThrown(() => blocky.resume());
        });
      });

      describe('when the game is not over', () => {
        beforeEach(() => {
          jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(false);
        });

        test('sets isPaused', () => {
          blocky.resume();
          expect(state.isPaused).toBe(false);
        });

        test('throws RESUME event', () => {
          expectEventThrown('RESUME', () => blocky.resume());
        });

        // describe('when gravity is enabled', () => {
        //   beforeEach(() => {
        //     jest.spyOn(blocky, 'isGravityEnabled').mockReturnValue(true);
        //   });

        //   test('starts the gravity timer', () => {
        //     const gravityDelayMs = 1234;
        //     jest.spyOn(blocky, 'gravityDelayMsForLevel').mockReturnValue(gravityDelayMs);
        //     blocky.resume();
        //     expect(mockTimer.start).toHaveBeenCalledWith(gravityDelayMs);
        //   });
        // });
      });
    });
  });

  describe('moveLeft', () => {
    test('defers to shift with the appropriate offset', () => {
      jest.spyOn(blocky, 'shift');
      blocky.moveLeft();
      expect(blocky.shift).toHaveBeenCalledWith(0, -1);
    });
  });

  describe('moveRight', () => {
    test('defers to shift with the appropriate offset', () => {
      jest.spyOn(blocky, 'shift');
      blocky.moveRight();
      expect(blocky.shift).toHaveBeenCalledWith(0, 1);
    });
  });

  describe('moveUp', () => {
    test('returns false as it is not allowed', () => {
      expect(blocky.moveUp()).toBe(false);
      expectEventNotThrown('PIECE_SHIFT', () => blocky.moveUp());
    });
  });

  describe('moveDown', () => {
    test('defers to shift with the appropriate offset', () => {
      jest.spyOn(blocky, 'shift');
      blocky.moveDown();
      expect(blocky.shift).toHaveBeenCalledWith(1, 0);
    });
  });

  describe('rotateClockwise', () => {
    test('defers to handleRotation with the appropriate rotation', () => {
      jest.spyOn(blocky, 'handleRotation');
      blocky.rotateClockwise();
      expect(blocky.handleRotation).toHaveBeenCalledWith(Move.CLOCKWISE);
    });
  });

  describe('rotateCounterClockwise', () => {
    test('defers to handleRotation with the appropriate rotation', () => {
      jest.spyOn(blocky, 'handleRotation');
      blocky.rotateCounterClockwise();
      expect(blocky.handleRotation).toHaveBeenCalledWith(Move.COUNTERCLOCKWISE);
    });
  });

  describe('getState', () => {
    test('returns a copy of the game state', () => {
      const expectedState = new BlockyState();
      jest.spyOn(BlockyState, 'copy').mockReturnValue(expectedState);

      const state = blocky.getState();

      expect(state).toBe(expectedState);
      expect(BlockyState.copy).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    /** @type {(Event) => void} */
    let mockListener;

    beforeEach(() => {
      mockListener = jest.fn();
      BlockyEvent.ALL.forEach(eventName => {
        blocky.registerEventListener(eventName, mockListener);
      });
    });

    test('removes all event listeners', () => {
      blocky.dispose();
      BlockyEvent.ALL.forEach(eventName => {
        expect(blocky.unregisterEventListener(eventName, mockListener)).toBe(false);
      });
    });

    test('stops the game', () => {
      expectMethodCalled('stop', () => blocky.dispose());
    });
  });

  describe('calcPointsForClearing', () => {
    test('returns the expected points for the given number of lines cleared', () => {
      for (let lines = 0; lines <= 4; lines++) {
        for (let level = 0; level < 20; level++) {
          jest.spyOn(state, 'level', 'get').mockReturnValue(level);
          expect(blocky.calcPointsForClearing(lines)).toBe(
            Blocky.POINTS_BY_LINES_CLEARED[lines] * (level + 1)
          );
        }
      }
    });
  });

  describe('rotate', () => {
    /** @type {Move} */
    let move;

    beforeEach(() => {
      move = Move.CLOCKWISE;
      jest.spyOn(state, 'tryRotation').mockReturnValue(move);
    });

    test('checks the rotation against the state', () => {
      blocky.rotate(move);
      expect(state.tryRotation).toHaveBeenCalledWith(move);
    });

    describe('when the rotation is not possible', () => {
      beforeEach(() => {
        jest.spyOn(state, 'tryRotation').mockReturnValue(Move.STAND);
      });

      test('returns false', () => {
        expect(blocky.rotate(move)).toBe(false);
      });
    });

    describe('when the rotation is possible', () => {
      test('throws PIECE_ROTATE event and returns true', () => {
        expectEventThrown('PIECE_ROTATE', () => blocky.rotate(move));
        expect(blocky.rotate(move)).toBe(true);
      });

      test('rotates the piece', () => {
        jest.spyOn(state.piece, 'move');
        blocky.rotate(move);
        expect(state.piece.move).toHaveBeenCalledWith(move);
      });
    });
  });

  describe('shiftPiece', () => {
    /** @type {Move} */
    let move;

    beforeEach(() => {
      move = Move.DOWN;
    });

    describe('when the piece can move', () => {
      beforeEach(() => {
        jest.spyOn(state, 'canPieceMove').mockReturnValue(true);
      });

      test('throws PIECE_SHIFT event and returns true', () => {
        expectEventThrown('PIECE_SHIFT', () => blocky.shiftPiece(move));
        expect(blocky.shiftPiece(move)).toBe(true);
      });

      test('shifts the piece', () => {
        jest.spyOn(state.piece, 'move');
        blocky.shiftPiece(move);
        expect(state.piece.move).toHaveBeenCalledWith(move);
      });
    });

    describe('when the piece cannot move', () => {
      beforeEach(() => {
        jest.spyOn(state, 'canPieceMove').mockReturnValue(false);
      });

      test('does not throw PIECE_SHIFT event returns false', () => {
        expectNoEventsThrown(() => blocky.shiftPiece(move));
        expect(blocky.shiftPiece(move)).toBe(false);
      });
    });
  });

  describe('plotPiece', () => {
    test('defers to state placePiece', () => {
      expectStateMethodCalled('placePiece', () => blocky.plotPiece());
    });

    test('throws PIECE_PLACED, BLOCKS events', () => {
      expectEventThrown('PIECE_PLACED', () => blocky.plotPiece());
      expectEventThrown('BLOCKS', () => blocky.plotPiece());
    });
  });

  describe('clearLines', () => {
    describe('when there are no full rows', () => {
      beforeEach(() => {
        jest.spyOn(state, 'getFullRows').mockReturnValue([]);
      });

      test('returns an empty array', () => {
        expect(blocky.clearLines()).toEqual([]);
      });

      test('does not modify the board', () => {
        const boardBefore = state.board;
        blocky.clearLines();
        expect(state.board).toEqual(boardBefore);
      });
    });

    describe('when there are full rows', () => {
      const cols = 5;
      const fullRows = [6, 7, 9];
      const board = [
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,1,
        1,1,0,0,0,
        0,1,1,0,0,
        1,1,1,1,1, // full
        1,1,1,1,1, //
        0,0,1,1,0,
        1,1,1,1,1  //
      ];

      const expectedBoardAfterClearing = [
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,0,
        0,0,0,0,1,
        1,1,0,0,0,
        0,1,1,0,0,
        0,0,1,1,0
      ];

      beforeEach(() => {
        const options = BlockyState.defaultOptions();
        options.rows = board.length / cols;
        options.cols = cols;

        state = new BlockyState(options);
        blocky = new Blocky(state);

        board.forEach((block, index) => {
          state.setCellByIndex(index, block);
        });
      });

      test('returns an array of the full row indices', () => {
        expect(blocky.clearLines()).toEqual(fullRows);
      });

      test('shifts the appropriate non-full rows down', () => {
        blocky.clearLines();
        expect(state.board).toEqual(expectedBoardAfterClearing);
      });
    });
  });

  describe('isGravityEnabled', () => {
    test('returns whether gravity is enabled', () => {
      expect(blocky.isGravityEnabled()).toBe(true);
      blocky.disableGravity();
      expect(blocky.isGravityEnabled()).toBe(false);
      blocky.enableGravity();
      expect(blocky.isGravityEnabled()).toBe(true);
    });
  });

  describe('disableGravity', () => {
    test('disables gravity and throws the GRAVITY_DISABLED event', () => {
      const eventName = 'GRAVITY_DISABLED';
      const mockEvent = new BlockyEvent(eventName);
      jest.spyOn(blocky, 'throwEvent');
      jest.spyOn(BlockyEvent, eventName).mockReturnValue(mockEvent);

      expect(blocky.isGravityEnabled()).toBe(true);
      blocky.disableGravity();
      expect(blocky.isGravityEnabled()).toBe(false);
      // expect(mockTimer.stop).toHaveBeenCalled();
      expect(BlockyEvent[eventName]).toHaveBeenCalled();
      expect(blocky.throwEvent).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('enableGravity', () => {
    test('enables gravity and throws the GRAVITY_ENABLED event', () => {
      const mockEvent = new BlockyEvent('GRAVITY_ENABLED');
      setupWithOptions({ useGravity: false });
      jest.spyOn(blocky, 'throwEvent');
      jest.spyOn(BlockyEvent, 'GRAVITY_ENABLED').mockReturnValue(mockEvent);

      expect(blocky.isGravityEnabled()).toBe(false);
      blocky.enableGravity();
      expect(blocky.isGravityEnabled()).toBe(true);
      expect(BlockyEvent.GRAVITY_ENABLED).toHaveBeenCalled();
      expect(blocky.throwEvent).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('updateGravityTimerDelayMs', () => {
    const gravityDelayMs = 1234;

    beforeEach(() => {
      jest.spyOn(blocky, 'gravityDelayMsForLevel').mockReturnValue(gravityDelayMs);
    });

    test('returns the delay', () => {
      expect(blocky.updateGravityTimerDelayMs()).toBe(gravityDelayMs);
    });

    // TODO Test that the timer delay is set
    // describe('when gravity is enabled', () => {
    //   beforeEach(() => {
    //     jest.spyOn(blocky, 'isGravityEnabled').mockReturnValue(true);
    //   });

    //   test('sets the delay appropriately', () => {
    //     // expect(mockTimer.delay.set).toHaveBeenCalledWith(gravityDelayMs);
    //   });
    // });
  });

  describe('attemptClearLines', () => {
    describe('when there are no full rows', () => {
      beforeEach(() => {
        jest.spyOn(state, 'getFullRows').mockReturnValue([]);
      });

      test('returns false', () => {
        expect(blocky.attemptClearLines()).toBe(false);
      });
    });

    describe('when there are some full rows', () => {
      /** @type {number[]} */
      let fullRows;

      beforeEach(() => {
        fullRows = [1, 2, 3];
        jest.spyOn(state, 'getFullRows').mockReturnValue(fullRows);
        jest.spyOn(blocky, 'calcPointsForClearing').mockReturnValue(fullRows.length);
      });

      test('updates state linesCleared, score, linesUntilNextLevel, and isClearingLines', () => {
        const linesClearedBefore = state.linesCleared;
        const scoreBefore = state.score;
        const linesUntilNextLevelBefore = state.linesUntilNextLevel;

        blocky.attemptClearLines();

        expect(state.linesCleared).toBe(linesClearedBefore + fullRows.length);
        expect(state.score).toBe(scoreBefore + fullRows.length);
        expect(state.linesUntilNextLevel).toBe(linesUntilNextLevelBefore - fullRows.length);
        expect(state.isClearingLines).toBe(true);
      });

      test('throws LINE_CLEAR, SCORE_UPDATE, and BLOCKS events', () => {
        expectEventsThrown(['LINE_CLEAR', 'SCORE_UPDATE', 'BLOCKS'], () => blocky.attemptClearLines());
      });

      test('returns true', () => {
        expect(blocky.attemptClearLines()).toBe(true);
      });
    });
  });

  describe('gameloop', () => {
    beforeEach(() => {
      blocky.disableGravity();
      blocky.start();
    });

    describe('when the game is over', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(true);
      });

      test('does not throw GAMELOOP event', () => {
        expectEventNotThrown('GAMELOOP', () => blocky.gameloop());
      });
    });

    describe('when the game is paused', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isPaused', 'get').mockReturnValue(true);
      });

      test('does nothing, does not throw GAMELOOP event', () => {
        expectEventNotThrown('GAMELOOP', () => blocky.gameloop());
      });
    });

    describe('when the game is in progress', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(false);
        jest.spyOn(state, 'isPaused', 'get').mockReturnValue(false);
      });

      test('throws GAMELOOP event', () => {
        expectEventThrown('GAMELOOP', () => blocky.gameloop());
      });

      describe('when the piece is not active', () => {
        beforeEach(() => {
          jest.spyOn(state.piece, 'isActive', 'get').mockReturnValue(false);
        });

        describe('when there are no lines to clear', () => {
          beforeEach(() => {
            jest.spyOn(blocky, 'attemptClearLines').mockReturnValue(false);
          });

          test('Sets up the next piece', () => {
            expectMethodCalled('nextPiece', () => blocky.gameloop());
          });

          describe('when the gameover condition is true', () => {
            beforeEach(() => {
              jest.spyOn(blocky, 'checkGameOver').mockReturnValue(true);
            });

            test('returns without throwing GAMELOOP event', () => {
              expectEventNotThrown('GAMELOOP', () => blocky.gameloop());
            });
          });

          describe('when the gameover condition is false', () => {
            beforeEach(() => {
              jest.spyOn(blocky, 'checkGameOver').mockReturnValue(false);
            });

            test('throws GAMELOOP event', () => {
              expectEventThrown('GAMELOOP', () => blocky.gameloop());
            });
          });
        });

        describe('when there are full lines', () => {
          beforeEach(() => {
            jest.spyOn(blocky, 'attemptClearLines').mockReturnValue(true);
          });

          describe('when enough lines have cleared', () => {
            beforeEach(() => {
              jest.spyOn(state, 'linesUntilNextLevel', 'get').mockReturnValue(0);
            });

            test('increases the level', () => {
              expectMethodCalled('increaseLevel', () => blocky.gameloop());
            });
          });

          describe('when more lines are needed to advance to the next level', () => {
            beforeEach(() => {
              jest.spyOn(state, 'linesUntilNextLevel', 'get').mockReturnValue(1);
            });

            test('does not increase the level', () => {
              expectMethodNotCalled('increaseLevel', () => blocky.gameloop());
            });
          });
        });
      });

      describe('when the piece is active', () => {
        beforeEach(() => {
          jest.spyOn(state.piece, 'isActive', 'get').mockReturnValue(true);
        });

        describe('when the piece cannot move DOWN', () => {
          beforeEach(() => {
            jest.spyOn(state, 'canPieceMove').mockReturnValue(false);
          });

          test('plots the piece blocks to the board', () => {
            expectMethodCalled('plotPiece', () => blocky.gameloop());
          });

          // TODO Test that the timer is delayed appropriately
          // describe('when gravity is enabled', () => {
          //   beforeEach(() => {
          //     jest.spyOn(blocky, 'isGravityEnabled').mockReturnValue(true);
          //   });

          //   test('delays the gravity effect for 3 gameloop calls', () => {
          //     // Test gravityTimer delay setter is called
          //   });
          // });

          test('throws GAMELOOP event', () => {
            expectEventThrown('GAMELOOP', () => blocky.gameloop());
          });
        });

        describe('when the piece can move DOWN', () => {
          beforeEach(() => {
            jest.spyOn(state, 'canPieceMove').mockReturnValue(true);
          });

          describe('when gravity is enabled', () => {
            beforeEach(() => {
              jest.spyOn(blocky, 'isGravityEnabled').mockReturnValue(true);
            });

            describe('when the gravity effect is delayed', () => {
              beforeEach(() => {
                // TODO Find a better way to test this.
                blocky['ticksUntilNextGravity'] = 2;
              });

              test('decrements the gravity effect delay by one gameloop', () => {
                blocky.gameloop();
                expect(blocky['ticksUntilNextGravity']).toBe(1);
              });

              describe('when the gravity effect delay decreases 0', () => {
                beforeEach(() => {
                  blocky['ticksUntilNextGravity'] = 1;
                });

                test('updates the gravity timer delay', () => {
                  expectMethodCalled('updateGravityTimerDelayMs', () => blocky.gameloop());
                });
              });

              describe('when the gravity effect delay is still > 0', () => {
                test('does not update the gravity timer delay', () => {
                  expectMethodNotCalled('updateGravityTimerDelayMs', () => blocky.gameloop());
                });
              });
            });

            describe('when the gravity effect is not under delay', () => {
              beforeEach(() => {
                // TODO Find a better way to test this.
                blocky['ticksUntilNextGravity'] = 0;
              });

              test('shifts the piece DOWN', () => {
                jest.spyOn(blocky, 'shiftPiece');
                blocky.gameloop();
                expect(blocky.shiftPiece).toHaveBeenCalledWith(Move.DOWN);
              });
            });
          });

          describe('when gravity is disabled', () => {
            beforeEach(() => {
              jest.spyOn(blocky, 'isGravityEnabled').mockReturnValue(false);
            });

            test('does not shift the piece', () => {
              expectMethodNotCalled('shiftPiece', () => blocky.gameloop());
            });

            test('does not update the gravity timer delay', () => {
              expectMethodNotCalled('updateGravityTimerDelayMs', () => blocky.gameloop());
            });
          });
        });
      });
    });
  });

  describe('checkGameOver', () => {
    describe('when the game is already over', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(true);
      });

      test('returns true', () => {
        expect(blocky.checkGameOver()).toBe(true);
      });
    });

    describe('when the game is not over', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(false);
      });

      describe('when the piece blocks overlap existing board blocks', () => {
        beforeEach(() => {
          jest.spyOn(state, 'pieceOverlapsBlocks').mockReturnValue(true);
        });

        test('calls gameOver and returns true', () => {
          jest.spyOn(blocky, 'gameOver');
          const result = blocky.checkGameOver();
          expect(blocky.gameOver).toHaveBeenCalled();
          expect(result).toBe(true);
        });
      });

      describe('when the piece blocks do not overlap board blocks', () => {
        beforeEach(() => {
          jest.spyOn(state, 'pieceOverlapsBlocks').mockReturnValue(false);
        });

        test('returns false', () => {
          jest.spyOn(blocky, 'gameOver');
          const result = blocky.checkGameOver();
          expect(blocky.gameOver).not.toHaveBeenCalled();
          expect(result).toBe(false);
        });
      });
    });
  });

  describe('increaseLevel', () => {
    let linesPerLevel;

    beforeEach(() => {
      linesPerLevel = 10;
      jest.spyOn(state, 'getLinesPerLevel').mockReturnValue(linesPerLevel);
    });

    test('increments state level', () => {
      const levelBefore = state.level;
      blocky.increaseLevel();
      expect(state.level).toBe(levelBefore + 1);
    });

    test('adds to the linesUntilNextLevel counter', () => {
      const linesUntilNextLevelBefore = state.linesUntilNextLevel;
      blocky.increaseLevel();
      expect(state.linesUntilNextLevel).toBe(linesUntilNextLevelBefore + linesPerLevel);
    });

    test('updates the gravity delay timer', () => {
      expectMethodCalled('updateGravityTimerDelayMs', () => blocky.increaseLevel());
    });

    test('throws the LEVEL_UPDATE event', () => {
      expectEventThrown('LEVEL_UPDATE', () => blocky.increaseLevel());
    });
  });

  describe('gameOver', () => {
    test('sets state isGameOver, isPaused, isClearingLines', () => {
      blocky.gameOver();
      expect(state.isGameOver).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.isClearingLines).toBe(false);
    });

    test('places the piece on the board wherever it currently is', () => {
      expectStateMethodCalled('placePiece', () => blocky.gameOver());
    });

    test('throws the GAME_OVER event', () => {
      expectEventThrown('GAME_OVER', () => blocky.gameOver());
    });

    // describe('when gravity is enabled', () => {
    //   beforeEach(() => {
    //     jest.spyOn(blocky, 'isGravityEnabled').mockReturnValue(true);
    //   });

    //   test('stops the gravity timer', () => {
    //     blocky.gameOver();
    //     expect(mockTimer.stop).toHaveBeenCalled();
    //   });
    // });
  });

  describe('handleRotation', () => {
    /** @type {Move} */
    let move;

    beforeEach(() => {
      move = Move.CLOCKWISE;
    });

    describe('when the piece is inactive', () => {
      beforeEach(() => {
        jest.spyOn(state.piece, 'isActive', 'get').mockReturnValue(false);
      });

      test('returns false', () => {
        expect(blocky.handleRotation(move)).toBe(false);
      });
    });

    describe('when the game is paused', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isPaused', 'get').mockReturnValue(true);
      });

      test('returns false', () => {
        expect(blocky.handleRotation(move)).toBe(false);
      });
    });

    describe('when the game is over', () => {
      beforeEach(() => {
        jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(true);
      });

      test('returns false', () => {
        expect(blocky.handleRotation(move)).toBe(false);
      });
    });

    describe('when the piece is active, and game is unpaused in progress', () => {
      beforeEach(() => {
        jest.spyOn(state.piece, 'isActive', 'get').mockReturnValue(true);
        jest.spyOn(state, 'isPaused', 'get').mockReturnValue(false);
        jest.spyOn(state, 'isGameOver', 'get').mockReturnValue(false);
      });

      describe('when the rotation is valid', () => {
        beforeEach(() => {
          jest.spyOn(blocky, 'rotate').mockReturnValue(true);
        });

        test('returns true', () => {
          expect(blocky.handleRotation(move)).toBe(true);
        });
      });

      describe('when the rotation is invalid', () => {
        beforeEach(() => {
          jest.spyOn(blocky, 'rotate').mockReturnValue(false);
        });

        test('returns false', () => {
          expect(blocky.handleRotation(move)).toBe(false);
        });
      });
    });
  });

  describe('shift', () => {
    let rowOffset;
    let colOffset;

    beforeEach(() => {
      rowOffset = 1;
      colOffset = 1;
    });

    describe('when the shift is valid', () => {
      beforeEach(() => {
        jest.spyOn(blocky, 'shiftPiece').mockReturnValue(true);
      });

      test('returns true', () => {
        expect(blocky.shift(rowOffset, colOffset)).toBe(true);
      });

      describe('when the given rowOffset is positive and gravity is enabled', () => {
        beforeEach(() => {
          jest.spyOn(blocky, 'isGravityEnabled').mockReturnValue(true);
        });

        // test('delays the gravity timer tick', () => {
        //   blocky.shift(rowOffset, colOffset);
        //   expect(mockTimer.delayNextTick).toHaveBeenCalled();
        // });

        // Note: To avoid confusion:
        // - The gravity timer is a repeating timer with a given delay (time between ticks).
        // - The gravity effect is the part of the gameloop that shifts the piece down.
        // The effect can be delayed by setting ticksUntilNextGravity counter, which tracks
        // the amount of timer ticks (gameloop calls) that the gravity effect will be ignored.
        describe('when the gravity effect is delayed', () => {
          beforeEach(() => {
            blocky['ticksUntilNextGravity'] = 2;
          });

          test('clears the effect delay and updates the timer delay', () => {
            jest.spyOn(blocky, 'updateGravityTimerDelayMs');
            blocky.shift(rowOffset, colOffset);
            expect(blocky['ticksUntilNextGravity']).toBe(0);
            expect(blocky.updateGravityTimerDelayMs).toHaveBeenCalled();
          });
        });
      });
    });

    describe('when the shift is not valid', () => {
      beforeEach(() => {
        jest.spyOn(blocky, 'shiftPiece').mockReturnValue(false);
      });

      test('returns false', () => {
        expect(blocky.shift(rowOffset, colOffset)).toBe(false);
      });
    });
  });

  describe('event methods', () => {
    let eventName;
    let listener;
    let event;

    beforeEach(() => {
      eventName = 'TEST_EVENT';
      listener = jest.fn();
      event = new Event(eventName);
    });

    describe('when the eventBus has not yet been initialized', () => {
      beforeEach(() => {
        blocky['eventBus'] = null;
      });

      describe('registerEvent', () => {
        test('initializes eventBus and registers the event with it', () => {
          jest.spyOn(EventBus.prototype, 'registerEventListener');
          blocky.registerEventListener(eventName, listener);

          const eventBus = blocky['eventBus'];
          if (!eventBus) {
            fail('eventBus was not initialized as expected');
          } else {
            expect(eventBus).toBeInstanceOf(EventBus);
            expect(eventBus.registerEventListener).toHaveBeenCalledWith(eventName, listener);
          }
        });
      });

      describe('unregisterEventListener', () => {
        test('returns false', () => {
          expect(blocky.unregisterEventListener(eventName, listener)).toBe(false);
        });
      });

      describe('unregisterAllEventListeners', () => {
        test('returns false', () => {
          expect(blocky.unregisterAllEventListeners(eventName)).toBe(false);
        });
      });

      describe('throwEvent', () => {
        test('does nothing; does not call throwEvent on eventBus', () => {
          jest.spyOn(EventBus.prototype, 'throwEvent');
          blocky.throwEvent(event);
          expect(EventBus.prototype.throwEvent).not.toHaveBeenCalled();
        });
      });

      describe('hasListeners', () => {
        test('returns false', () => {
          expect(blocky.hasListeners(eventName)).toBe(false);
        });
      });
    });

    describe('when eventBus has been initialized', () => {
      let eventBus;

      beforeEach(() => {
        eventBus = new EventBus();
        blocky['eventBus'] = eventBus;
      });

      describe('registerEventListener', () => {
        test('defers to the eventBus registerEventListener', () => {
          const result = true;
          jest.spyOn(eventBus, 'registerEventListener').mockReturnValue(result);
          expect(blocky.registerEventListener(eventName, listener)).toBe(result);
          expect(eventBus.registerEventListener).toHaveBeenCalledWith(eventName, listener);
        });
      });

      describe('unregisterEventListener', () => {
        test('defers to the eventBus unregisterEventListener', () => {
          const result = true;
          jest.spyOn(eventBus, 'unregisterEventListener').mockReturnValue(result);
          expect(blocky.unregisterEventListener(eventName, listener)).toBe(result);
          expect(eventBus.unregisterEventListener).toHaveBeenCalledWith(eventName, listener);
        });
      });

      describe('unregisterAllEventListeners', () => {
        test('defers to the eventBus unregisterAllEventListeners', () => {
          const result = true;
          jest.spyOn(eventBus, 'unregisterAllEventListeners').mockReturnValue(result);
          expect(blocky.unregisterAllEventListeners(eventName)).toBe(result);
          expect(eventBus.unregisterAllEventListeners).toHaveBeenCalledWith(eventName);
        });
      });

      describe('throwEvent', () => {
        test('defers to the eventBus throwEvent', () => {
          jest.spyOn(eventBus, 'throwEvent');
          blocky.throwEvent(event);
          expect(eventBus.throwEvent).toHaveBeenCalledWith(event);
        });
      });

      describe('hasListeners', () => {
        test('defers to the eventBus hasListeners', () => {
          const result = true;
          jest.spyOn(eventBus, 'hasListeners').mockReturnValue(result);
          expect(blocky.hasListeners(eventName)).toBe(result);
          expect(eventBus.hasListeners).toHaveBeenCalledWith(eventName);
        });
      });
    });
  });

  describe('nextPiece', () => {
    test('resets the piece on the state', () => {
      expectStateMethodCalled('resetPiece', () => blocky.nextPiece());
    });

    test('throws the PIECE_CREATE event', () => {
      expectEventThrown('PIECE_CREATE', () => blocky.nextPiece());
    });
  });
});
