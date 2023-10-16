# Bucket
> A little place for my TypeScript / frontend utilities.

```
./src
├── engine          A basic 2D game engine.
│   ├── Engine      Main game engine class. Scene management.
│   ├── GameObj     Base class for all game objects.
│   ├── Geo
│   ├── LineSeg
│   ├── Point
│   ├── Polygon
│   └── Scene       Updates and renders game objects.
├── event
│   ├── Event
│   └── EventBus    Manages event listeners and dispatching.
├── structs
│   ├── Coord
│   ├── Move
│   ├── Position
│   ├── Tuple
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
| `build` | Compiles the TypeScript source code to JavaScript and places in `build/`. |
| `test` | Runs the Jest test suite. |

## Installing

Create a personal access token with the `read:packages` scope. Unfortunately, even public packages require an authentication token to install.

Add the GitHub package registry to your `.npmrc` file, replacing `GH_PAT` with your personal access token and `GITHUB_USERNAME` with your GitHub username:

```
//npm.pkg.github.com/:_authToken=GH_PAT
@GITHUB_USERNAME:registry=https://npm.pkg.github.com
```

Install the package: `npm install @GITHUB_USERNAME/PACKAGE_NAME` as normal.
