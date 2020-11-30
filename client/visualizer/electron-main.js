// This is the electron 'main' file.
// All it does is launch a pseudo-browser that runs battlecode.

var electron = require('electron');

// Module to create native browser window.
var BrowserWindow = electron.BrowserWindow;

var path = require('path');
var url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
    options: {
      title: 'Battlecode 2020'
    }
  }));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should devare the corresponding element.
    mainWindow = null;
  });

  // Clicking on a URL with target="_blank" should use your computer's
  // default browser.
  mainWindow.webContents.on('new-window', function(event, url){
    event.preventDefault();
    electron.shell.openExternal(url);
  });
}

// This is needed so that the speedscope iframe on the Profiler tab does not throw cross-origin errors
// The speedscope iframe loads speedscope using the file:// protocol which considers all URLs to have separate origins
// The only way to get around this is to tell Chrome to allow it anyways
electron.app.commandLine.appendSwitch('disable-site-isolation-trials');

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.on('ready', createWindow);

// Quit when all windows are closed.
electron.app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    electron.app.quit();
  }
});

electron.app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
