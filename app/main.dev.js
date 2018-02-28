/* eslint global-require: 1, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow } from 'electron';

const path = require('path');
const spiCaller = require('windows-spi');
const { ipcMain } = require('electron');

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 290,
    height: 490,
    minWidth: 290,
    minHeight: 490,
  });

  mainWindow.setMenu(null);

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipcMain.on('getRegistryValues', async (event) => {
    try {
      const mouseGetValues = await spiCaller.spiGet('SPI_GETMOUSE', 'array');
      const MouseSensitivity = await spiCaller.spiGet('SPI_GETMOUSESPEED', 'integer');
      event.sender.send('getRegistryValues-Result', {
        MouseSensitivity,
        MouseThreshold1: mouseGetValues[0],
        MouseThreshold2: mouseGetValues[1],
        MouseSpeed: mouseGetValues[2],
      });
    } catch (err) {
      console.error(err);
      event.sender.send('getRegistryValues-Error', `Error: ${err}`);
    }
  });

  ipcMain.on('setRegistryValues', async (event, arg) => {
    try {
      await spiCaller.spiSet('SPI_SETMOUSESPEED', parseInt(arg.MouseSensitivity, 10));
      await spiCaller.spiSet(
        'SPI_SETMOUSE',
        [
          parseInt(arg.MouseThreshold1, 10),
          parseInt(arg.MouseThreshold2, 10),
          parseInt(arg.MouseSpeed, 10)
        ]
      );
    } catch (err) {
      console.error(err);
      event.sender.send('setRegistryValues-Error', `Error: ${err}.`);
      return;
    }
    event.sender.send('setRegistryValues-Result', 'Success.');
  });
});
