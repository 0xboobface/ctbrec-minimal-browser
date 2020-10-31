// Modules to control application life and create native browser window
const { app, BrowserWindow, session } = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let remoteControlSocket
let proxySettings
var stopped = false;

function startBrowser() {
    let net = require('net');
    let server = net.createServer(function (socket) { //'connection' listener
        remoteControlSocket = socket;
        var backlog = '';
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

        socket.on('line', function (data) {
            try {
                let msg = JSON.parse(data.toString('utf8'))
                if (msg.config) {
                    let args = msg.config;
                    let w = args.w != undefined ? args.w : 1024;
                    let h = args.h != undefined ? args.h : 768;
                    mainWindow.setSize(w, h);
                    if (args.proxy != undefined) {
                        proxySettings = args.proxy;
                        let proxyConfig = { 'proxyRules': args.proxy.address };
                        mainWindow.webContents.session.setProxy(proxyConfig, () => {
                            remoteControlSocket.write('Proxy settings configured\n');
                            mainWindow.loadURL(args.url);
                        });
                    } else {
                        mainWindow.loadURL(args.url);
                    }
                } else if (msg.execute) {
                    if (msg.execute === 'quit') {
                        stopped = true;
                        socket.end();
                        app.quit()
                    } else {
                        console.log('Executing ', msg.execute);
                        mainWindow.webContents.executeJavaScript(msg.execute, false)
                            .then((result) => { console.log(result) })
                            .catch((error) => {
                                console.error(error);
                            });
                    }
                }
            } catch (error) {
                console.log('Couldn\'t parse JSON message from socket', error)
            }
        })
    }).listen(3202);
    console.log('Server started. Starting browser window');

    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        icon: app.getAppPath() + '/icon.png'
    });
    mainWindow.webContents.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36');
    mainWindow.setMenu(null);
    mainWindow.on('closed', () => {
        mainWindow = null
    });
    mainWindow.webContents.on('did-frame-finish-load', () => {
        //mainWindow.openDevTools();
        session.defaultSession.cookies.get({})
            .then((cookies) => {
                let event = {
                    'url': mainWindow.webContents.getURL(),
                    'cookies': cookies
                }
                if (!remoteControlSocket.destroyed && !stopped) {
                    remoteControlSocket.write(JSON.stringify(event));
                    remoteControlSocket.write('\n');
                    console.log("Message sent to ctbrec", event);
                } else {
                    console.log("########### socket not ready");
                }
            }).catch((error) => {
                console.log(error)
            });
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', startBrowser)

app.on('login', function (event, webContents, request, authInfo, callback) {
    if (authInfo.isProxy) {
        remoteControlSocket.write('Authentication requested by proxy\n');
        callback(proxySettings.user, proxySettings.password);
    }
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    app.quit();
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        startBrowser();
    }
})
