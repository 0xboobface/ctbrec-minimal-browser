// Modules to control application life and create native browser window
const {app, BrowserWindow, session} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let remoteControlSocket

function startBrowser () {
  let net = require('net');
  let server = net.createServer(function(socket) { //'connection' listener
    remoteControlSocket = socket;
    var backlog = ''
    socket.on('data', function (data) {
      backlog += data
      var n = backlog.indexOf('\n')
      // got a \n? emit one or more 'line' events
      while (~n) {
        socket.emit('line', backlog.substring(0, n))
        backlog = backlog.substring(n + 1)
        n = backlog.indexOf('\n')
      }
    })

    socket.on('line', function(data) {
      try {
        let msg = JSON.parse(data.toString('utf8'))
        if(msg.config) {
          let args = msg.config;
          let w = args.w != undefined ? args.w : 1024;
          let h = args.h != undefined ? args.h : 768;
          mainWindow.setSize(w, h);
          mainWindow.loadURL(args.url)
        } else if(msg.execute) {
          if(msg.execute === 'quit') {
            socket.end();
            app.quit()
          } else {
            mainWindow.webContents.executeJavaScript(msg.execute, false);
          }
        }
      } catch (error) {
        console.log('Couldn\'t parse JSON message from socket', error)
      }
    })
  }).listen(3202);

  mainWindow = new BrowserWindow({ 
    width: 1024, 
    height: 768,
    icon: app.getAppPath() + '/icon.png'
  })
  mainWindow.setMenu(null)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.webContents.on('did-frame-finish-load', () => {
    session.defaultSession.cookies.get({}, (error, cookies) => {
      let event = {
        'url': mainWindow.webContents.getURL(),
        'cookies': cookies
      }
      remoteControlSocket.write(JSON.stringify(event))
      remoteControlSocket.write('\n')
    })
  })
}
  
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', startBrowser)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    startBrowser()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
