# <img src="icons/icon48.png" width="24"> Screeps-SC
Modular chrome extension for the game [screeps.com](https://screeps.com/).



## Installation
In your Chrome browser go to `Settings -> Extensions -> Load unpacked extension...` and select the Screeps-SC folder.

## Create your own module
1. Create a new javascript file under the `/modules` folder.
2. Add these functions to your javascript file: `module.exports.init = function(){...}` and `module.exports.update = function(){...}`
3. Add your module to the `modules` array in the `settings.json` file.
   * `path` The path to your javascript file.
   * `runAt` Parameter when your module will run. It has two child parameters `onUpdate` and `onCompleted`
      * `onUpdate` The module will run when a screeps site has loaded a page that starts with the given value in this setting. For more information see [google API for onUpdated](https://developer.chrome.com/extensions/tabs#event-onUpdated).
      * `onCompleted` The module will run when any screeps webrequest is completed that starts with the given value in this setting. For more information see [google API for onCompleted](https://developer.chrome.com/extensions/webRequest#event-onCompleted).
   * `options` Not a required field. It is used to manage manual user configuration for the module
      * `image` The path to an image to be displayed for the module in the settings page
      * `config` Array with configuration elements for the settings page
4. Reload the plugin at `Settings -> Extensions -> Screeps SC -> Reload`

## Samples
The project includes some modules I've created. Click on an image below to see the source code.

[![Alliance map](options/images/map.alliance.png "Alliance map")](modules/map.alliance.js)
[![Detailed market history](options/images/market.history.png "Detailed market history")](modules/market.history.js)
[![Overview for resources](options/images/market.my.resources.png "Overview for resources")](modules/market.my.resources.js)
[![See GCL bar for any player](options/images/profile.gcl.png "See GCL bar for any player")](modules/profile.gcl.js)
[![Detailed leaderboard](options/images/rank.leaderboard.png "Detailed leaderboard")](modules/rank.leaderboard.js)
[![Console macros](options/images/room.console.icons.png "Console macros")](modules/room.console.icons.js)
[![Enemy creep names](options/images/room.creep.names.png "Enemy creep names")](modules/room.creep.names.js)
[![Battle radar](options/images/world.battle.radar.png "Battle radar")](modules/world.battle.radar.js)

Also take a look at the [settings.json](settings.json) to see the module configuration.

## How it works
1. On browser startup the extension will start listening on requests made to and from `*://screeps.com/*`.
2. When a url for a request starts with a given value in `onUpdate` or `onCompleted` the background thread will execute the module `path` connected to the `onUpdate` or `onCompleted`.
3. The `content.js` script will inject the `module.js` script together with the executed module. The executed module can access any function in the `module.js` script. Each module has their own `module.js` and it contains two module specific parameters `module.name` and `module.confg` (if you have set up a config in the `settings.json`).
4. If it's the first time the module is injected to the page session the `module.exports.init` function will be called in the module. All other `onUpdate` or `onCompleted` triggers will call the `module.exports.update` function.

## [FAQ](https://github.com/stybbe/Screeps-SC/wiki/FAQ)
