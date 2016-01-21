// Menus
var gui = require('nw.gui'),
    fs = require('fs'),
    win = gui.Window.get(),
    windowMenu = new gui.Menu({ type: 'menubar' }),
    fileMenu = new gui.MenuItem({
      label:'File',
      submenu: new gui.Menu()
    }),
    helpMenu = new gui.MenuItem({
      label: 'Help',
      submenu: new gui.Menu()
    }),
    helpOption = new gui.MenuItem({label: 'Help' }),
    creditsOption = new gui.MenuItem({label: 'Credits' }),
    openOption = new gui.MenuItem({ label: 'Open script' }),
    saveOption = new gui.MenuItem({ label: 'Save script' }),
    runOption = new gui.MenuItem({ label: 'Run once' }),
    closeOption = new gui.MenuItem({ label: 'Close' });

windowMenu.append(fileMenu);
windowMenu.append(helpMenu);
fileMenu.submenu.append(openOption);
fileMenu.submenu.append(saveOption);
fileMenu.submenu.append(closeOption);
helpMenu.submenu.append(helpOption);
helpMenu.submenu.append(creditsOption);

openOption.click  = function() { console.log('clicked open'); }
saveOption.click  = function() {
  var scope = angular.element($("#enabled")).scope();
  scope.$apply(function(){
    scope.logs.unshift({time: new Date(), status: 'info', log: 'clicked save'})
  })
}
runOption.click   = function() { console.log('clicked run'); }
closeOption.click = function() { console.log('clicked close'); }
helpOption.click = function() { console.log('clicked help'); }
creditsOption.click = function() {
  var scope = angular.element($("#enabled")).scope();
  scope.openModal();
}

win.menu = windowMenu;

// Minimize to tray
var tray;
win.on('minimize', function() {
  // Hide window
  this.hide();

  // Show tray
  tray = new gui.Tray({ icon: 'icon.png' });
  tray.tooltip = 'Watchfolder processor';

  // Show window and remove tray when clicked
  tray.on('click', function() {
    win.show();
    this.remove();
    tray = null;
  });
});
