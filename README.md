# Bucket
> A bucket for my js utilities.

```
./src
├── engine [WIP]    Basic 2D game engine.
│   ├── Engine      Main game engine class. Scene management.
│   ├── GameObj     Base class for all game objects.
│   ├── Geo
│   ├── LineSeg
│   ├── Point
│   ├── Polygon
│   └── Scene       Updates and renders game objects.
├── event           Simple event bussing.
│   ├── Event
│   └── EventBussy  Manages event listeners and dispatching.
├── structs         Random data structures.
│   ├── Coord       2D Coordinates.
│   ├── Move        2D Coordinates plus rotation.
│   ├── Position    2D Coordinates plus rotation and maxRotation.
│   └── Vector      Represents a 2D vector.
└── util
    ├── Freezable   Base class for locking down object properties.
    ├── Timer       Executes a callback after a given amount of time. Repeatable.
    ├── Util        Shuffling, generating ranges, number validation, etc.
    └── ZMod        Maintains an integer bounded to a given range (the mod).
```

## Scripts

| Script | Description |
| ------ | ----------- |
| `clean` | Deletes the output directory, `build/`. |
| `build` | Compiles/transforms and places the output directory, `build/`. |
| `test` | Yay tests. |

## Installing

Unfortunately, even public GitHub packages require authentication to install.

Create a personal access token with the `read:packages` scope.

Add the GitHub package registry to your `.npmrc` file like below, replacing `GH_PAT` with your PAT:

```
//npm.pkg.github.com/:_authToken=GH_PAT
@sparklicorn:registry=https://npm.pkg.github.com
```

Then install the package as normal.
```
npm install @sparklicorn/bucket-js
```
