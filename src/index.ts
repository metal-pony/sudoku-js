import { Event } from './event/Event';
import EventBus from './event/EventBus';

import Freezable from './util/Freezable';
import Timer from './util/Timer';
import ZMod from './util/ZMod';

import * as Util from './util/Util';

import Coord from './structs/Coord';
import Move from './structs/Move';
import Position from './structs/Position';
import Tuple from './structs/Tuple';
import Vector from './structs/Vector';

import Engine from './engine/Engine';
import GameObj from './engine/GameObj';
import LineSeg from './engine/LineSeg';
import Point from './engine/Point';
import Polygon from './engine/Polygon';
import Scene from './engine/Scene';

export = {
  event: {
    Event,
    EventBus
  },
  util: {
    Freezable,
    Timer,
    ZMod,

    bounded: Util.bounded,
    shuffle: Util.shuffle,
    swap: Util.swap,
    range: Util.range,

    validateNonNegative: Util.validateNonNegative,
    validatePositive: Util.validatePositive,
    validateNegative: Util.validateNegative,
    validateInteger: Util.validateInteger,
    validatePositiveInteger: Util.validatePositiveInteger,
    validateNegativeInteger: Util.validateNegativeInteger
  },
  structs: {
    Coord,
    Move,
    Position,
    Tuple,
    Vector
  },
  engine: {
    Engine,
    GameObj,
    LineSeg,
    Point,
    Polygon,
    Scene
  }
};
