// This file is a dirty hack that is necessary because nobody expected anyone
// to make an app that runs both in the browser and electron.

// To add another electron-exclusive module, add it to this file,
// and add it to 'externals' for non-webpack in webpack.config.js

// if we're on the web, we define these objects to be null
// they will ERROR AT RUNTIME if used
// only use them if you've made sure that process.env.ELECTRON === true

// ambient webpack function: creates modules
declare function define(...args: any[]);

// only define if non-browser
if (!process.env.ELECTRON) {
  define('electron', [], () => null);
  define('os', [], () => null);
  define('fs', [], () => null);
  define('path', [], () => null);
  define('child_process', [], () => null);
  define('http', [], () => null);
}

// in electron, actually imports
// in browser, imports null
import * as _electron from 'electron';
import * as _os from 'os';
import * as _fs from 'fs';
import * as _path from 'path';
import * as _child_process from 'child_process';
import * as _http from 'http';

export var electron = _electron;
export var os = _os;
export var fs = _fs;
export var path = _path;
export var child_process = _child_process;
export var http = _http;

export default {
  electron: _electron,
  os: _os,
  fs: _fs,
  path: _path,
  child_process: _child_process,
  http: _http
}
