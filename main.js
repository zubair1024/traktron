const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const Menu = electron.Menu




// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 800,
        titleBarStyle: 'hidden',
        transparent: false,
        frame: true,
        icon: __dirname + '/favicon.ico'
    });

    createMenu();
    //mainWindow.setMenu(null);

    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/web2/index.html`)

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    mainWindow.maximize();


    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


function createMenu() {
    const template = [
        //{
        //    label: 'ROAM',
        //    submenu: [
        //        {
        //            role: 'undo'
        //        },
        //        {
        //            role: 'redo'
        //        },
        //        {
        //            type: 'separator'
        //        },
        //        {
        //            role: 'cut'
        //        },
        //        {
        //            role: 'copy'
        //        },
        //        {
        //            role: 'paste'
        //        },
        //        {
        //            role: 'pasteandmatchstyle'
        //        },
        //        {
        //            role: 'delete'
        //        },
        //        {
        //            role: 'selectall'
        //        },
        //    ]
        //},
        {
            label: 'ROAM',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click(item, focusedWindow) {
                        if (focusedWindow) focusedWindow.reload();
                    }
                },
                {
                    role: 'togglefullscreen'
                },
                //{
                //    label: 'Toggle Developer Tools',
                //    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
                //    click(item, focusedWindow) {
                //        if (focusedWindow)
                //            focusedWindow.webContents.toggleDevTools();
                //    }
                //},
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'About Roamworks',
                    click() {
                        require('electron').shell.openExternal('http://roamworks.com');
                    }
                },
            ]
        },
    ];

    if (process.platform === 'darwin') {
        const name = require('electron').remote.app.getName();
        template.unshift({
            label: name,
            submenu: [
                {
                    role: 'about'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'services',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    role: 'hide'
                },
                {
                    role: 'hideothers'
                },
                {
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    role: 'quit'
                },
            ]
        });
        // Window menu.
        template[3].submenu = [
            {
                label: 'Close',
                accelerator: 'CmdOrCtrl+W',
                role: 'close'
            },
            {
                label: 'Minimize',
                accelerator: 'CmdOrCtrl+M',
                role: 'minimize'
            },
            {
                label: 'Zoom',
                role: 'zoom'
            },
            {
                type: 'separator'
            },
            {
                label: 'Bring All to Front',
                role: 'front'
            }
        ];
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
