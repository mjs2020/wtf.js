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
//fileMenu.submenu.append(runOption);
helpMenu.submenu.append(helpOption);
helpMenu.submenu.append(creditsOption);

openOption.click  = function() {
  var scope = angular.element($("#enabled")).scope(),
      button = $('#openFile');
  button.unbind('change');
  button.change(function(evt) { // Read file
    var filename = $(this).val();
    fs.readFile(filename, 'utf8', function(err, data) {
      console.log(data);
      if(err) { return console.log(err); }
      var ext = filename.split('.');
      if (ext[ext.length-1] == 'js') { scope.code.jsCode = data; }
      if (ext[ext.length-1] == 'xslt')   { scope.code.xlstCode = data; }
      scope.$apply();
    });
  });
  button.trigger('click');
}
saveOption.click  = function() {
  var scope = angular.element($("#enabled")).scope(),
      code = "";
  if (scope.code.jsActive)   {  code = scope.code.jsCode; }
  if (scope.code.xlstActive) {  code = scope.code.xlstCode.trim(); }
  var button = $('#saveAs');
  button.unbind('change');
  button.change(function(evt) { // Write file
    fs.writeFile($(this).val(), code, function(err) {
      if(err) { return console.log(err); }
      console.log("The file was saved!");
    });
  });
  button.trigger('click');
}
runOption.click   = function() {
  // TODO
}
closeOption.click = function() {
  win.close();
}
helpOption.click = function() {
  var scope = angular.element($("#enabled")).scope();
  scope.openModal('codeInfo');
}
creditsOption.click = function() {
  var scope = angular.element($("#enabled")).scope();
  scope.openModal('credits');
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
