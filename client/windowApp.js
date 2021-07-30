const {app, BrowserWindow} = require("electron");

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.resizable = false;
  win.loadURL("http://localhost:3000");
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

const startWindow = () => app.whenReady().then(() => {
  createWindow()
});

startWindow();