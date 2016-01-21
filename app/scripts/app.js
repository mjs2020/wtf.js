// Node modules
var fs = require('fs'),
    gui = require('nw.gui'),
    async = require('async'),
    xslt = require('xslt');

// Add DOMParser
global.DOMParser = require('xmldom').DOMParser;

// Main Angular module with deps
var app = angular.module('wtfApp', [
  'ui.bootstrap',
  'uiSwitch',
  'ui.ace'
]);

// Main app controller
app.controller('wtfCtrl', ['$scope', '$interval', '$uibModal', function ($scope, $interval, $uibModal, $uibModalInstance) {
  console.log('App loaded, controller setting up.');

  // BASIC VARIABLES
  var interval, xsltConf;

  $scope.wtfActive = false;

  $scope.watchFolderPath = localStorage.watchFolderPath ? localStorage.watchFolderPath : '//172.1.1.20/in';
  $scope.$watch('watchFolderPath', function() { localStorage.watchFolderPath = $scope.watchFolderPath; });

  $scope.watchFolderFileMask = localStorage.watchFolderFileMask ? localStorage.watchFolderFileMask : '*.*';
  $scope.$watch('watchFolderFileMask', function() { localStorage.watchFolderFileMask = $scope.watchFolderFileMask; });

  $scope.processingOrder = localStorage.processingOrder ? localStorage.processingOrder : 'date';
  $scope.$watch('processingOrder', function() { localStorage.processingOrder = $scope.processingOrder; });

  $scope.pollingInterval = localStorage.pollingInterval ? localStorage.pollingInterval : 3;
  $scope.$watch('pollingInterval', function() { localStorage.pollingInterval = $scope.pollingInterval; });

  $scope.filesPerPoll = localStorage.filesPerPoll ? localStorage.filesPerPoll : 10;
  $scope.$watch('filesPerPoll', function() { localStorage.filesPerPoll = $scope.filesPerPoll; });

  // Angular UI tabs create a sub-scope. In order for the sub-scope to use variables from the parent
  // scope we need to use an object
  $scope.code = {};
  $scope.code.jsCode = localStorage.jsCode ? localStorage.jsCode : '// Js code here';
  $scope.code.jsAceLoaded = function (editor) {
    editor.$blockScrolling = Infinity;
  }
  $scope.code.jsAceChanged = function(editor) {
    localStorage.jsCode = editor[1].getSession().getDocument().getValue();
  }

  $scope.code.xlstCode = localStorage.xlstCode ? localStorage.xlstCode : '<!-- xlst code here -->';
  $scope.code.xlstAceLoaded = function (editor) {
    editor.$blockScrolling = Infinity;
  }
  $scope.code.xlstAceChanged = function(editor) {
    localStorage.xlstCode = editor[1].getSession().getDocument().getValue();
  }
  xsltConf = {
    fullDocument: true, // Is the output a complete document, or a fragment?
    cleanup: true, // false will disable all of the below options
    xmlHeaderInOutput: true,
    normalizeHeader: true,
    encoding: 'UTF-8',
    preserveEncoding: false, // When false, always uses the above encoding. When true, keeps whatever the doc says
    collapseEmptyElements: true, // Forces output of self-closing tags
    removeDupNamespace: true,
    removeDupAttrs: true,
    removeNullNamespace: true,
    removeAllNamespaces: false,
    removeNamespacedNamespace: true
  };

  $scope.treatedPath = localStorage.treatedPath ? localStorage.treatedPath : '//172.1.1.20/out/treated';
  $scope.$watch('treatedPath', function() { localStorage.treatedPath = $scope.treatedPath; });

  $scope.processedPath = localStorage.processedPath ? localStorage.processedPath : '//172.1.1.20/out/processed';
  $scope.$watch('processedPath', function() { localStorage.processedPath = $scope.processedPath; });

  $scope.treatedRename = '// JS code here';
  $scope.processedRename = '// JS code here';
  $scope.logs = [
    {time: new Date(), status: 'success', log: 'App started'}
  ];
  $scope.$watch('logs', function () {
    if ($scope.logs.length > 100) {
      $scope.logs.slice(0,99);
    }
  });

  // GUI FUNCTIONS
  $scope.updatePath = function (folder) {
    var dialog = document.createElement('input');
    dialog.type = 'file';
    dialog.nwdirectory = 'nwdirectory';
    dialog.addEventListener('change', function() {
      $scope[folder] = dialog.value;
      $scope.$apply();
    }, false);
    dialog.click();
  }
  $scope.plus = function (val, min, max, int) {
    if(!$scope.wtfActive) {
      $scope[val] = parseInt($scope[val]) + parseInt(int) > parseInt(max) ? parseInt(max): parseInt($scope[val]) + parseInt(int);
    }
  }
  $scope.minus = function (val, min, max, int) {
    if(!$scope.wtfActive) {
      $scope[val] = parseInt($scope[val]) - parseInt(int) < parseInt(min) ? parseInt(min): parseInt($scope[val]) - parseInt(int);
    }
  }
  $scope.clearLogs = function () {
    $scope.logs = [];
  }
  $scope.openLink = function (link) {
    console.log('open link');
    gui.Shell.openExternal(link);
  }
  $scope.openModal = function () {
    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'modalContent.html',
      size: 'lg'
    });
  };
  $scope.closeModal = function () {
    $uibModalInstance.close();
  }

  // QUEUE FUNCTION
  // Create the queue object that asynchrounously processes files (up to 5 concurrently)
  var queue = async.queue(function(filename, callback) {
    // Read file
    fs.readFile($scope.watchFolderPath + '\\' + filename, 'utf8', function (err, data) {

      // If there's an error reading the file log the error and callback
      if (err) {
        $scope.logs.unshift({time: new Date(), status: 'error', log: 'Failed reading file: '+filename});
        $scope.wtfActive = false;
        $scope.$apply();
        callback();
        return;
      }

      // Otherwise make a copy of the data and trim it
      data = data.trim();
      var originalData = data,
          outFileName = filename,
          treatedFileName = filename;

      // Determine which transformation to use
      if ($scope.code.jsActive) { // JS
        try {
          eval($scope.code.jsCode);
        } catch (e) {
          $scope.logs.unshift({time: new Date(), status: 'error', log: 'Error processing file: '+filename+': '+e});
        }
      }
      if ($scope.code.xlstActive) { // XSLT
        console.log($scope.code.xlstCode.trim());
        data = xslt(data, $scope.code.xlstCode.trim(), xsltConf);
      }

      // Write out, treated and delete original in parallel
      async.parallel([
        function (finished) { // Write treated
          fs.writeFile($scope.treatedPath + '\\' + treatedFileName, originalData, 'utf8', function (err) { finished(err); });
        },
        function (finished) { // Write processed
          fs.writeFile($scope.processedPath + '\\' + outFileName, data, 'utf8', function (err) { finished(err); });
        },
        function (finished) { // Delete original
          fs.unlink($scope.watchFolderPath + '\\' + filename, function (err) { finished(err); });
        }
      ], function (err, results) {
        if (err) $scope.logs.unshift({time: new Date(), status: 'error', log: 'Error writing out '+filename});
        callback();
      });
    })
  }, 5);


  // MAIN LOGIC
  $scope.changeState = function () {
    // If wtf.js is deactivated cancel the interval polling and do nothing
    if (!$scope.wtfActive) {
      $interval.cancel(interval);
      queue.kill();
      $scope.logs.unshift({time: new Date(), status: 'info', log: 'Stopping polling'})
      return;
    }
    // Otherwise setup polling
    $scope.logs.unshift({time: new Date(), status: 'info', log: 'Starting polling'});
    interval = $interval(function () {

      // If there are still items in the queue then skip the round
      if(queue.length() > 0) { return; }

      // Otherwise read directory listing
      fs.readdir($scope.watchFolderPath, function (err, files) {
        // If there's an error reading the directory log the error and stop
        if (err) {
          $scope.logs.unshift({time: new Date(), status: 'error', log: 'Failed reading directory. Stopping.'})
          $interval.cancel(interval);
          $scope.wtfActive = false;
          $scope.$apply();
          return;
        }
        // TODO Otherwise filter files by mask

        // Sort files
        if ($scope.processingOrder == 'date') {
          files.map(function(v) {
            return {
              name:v,
              time:fs.statSync($scope.watchFolderPath + '\\' + v).mtime.getTime()
            };
          })
          .sort(function(a, b) { return a.time - b.time; })
          .map(function(v) { return v.name; });
        }
        if ($scope.processingOrder == 'name') {
          files.sort(function(a, b) {
            return a < b ? -1 : 1;
          });
        }

        // Slice file list to only the files we intend to process
        files = files.slice(0, parseInt($scope.filesPerPoll));
        if (files.count > 0) $scope.logs.unshift({time: new Date(), status: 'success', log: 'Found ' + files.length + ' to process.'});

        // Add files to the queue
        files.forEach(function (filename) {
          queue.push(filename, function (err) {
            $scope.logs.unshift({time: new Date(), status: 'success', log: 'Processed file '+filename})
            $scope.$apply();
          });
        })
      })

    }, $scope.pollingInterval*1000);

  }

}]);

// Modal controller
//app.controller
