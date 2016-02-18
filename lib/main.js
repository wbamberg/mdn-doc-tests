const data = require("sdk/self").data;
const tabs = require("sdk/tabs");
const localize = require("sdk/l10n").get;
const prefs = require('sdk/simple-prefs').prefs;
const { ToggleButton } = require("sdk/ui/button/toggle");
const testList = require("../data/tests/testlist").testList;
var sidebar = null;
var tabWorker = null;

function createSidebar(mode) {
  return require("sdk/ui/sidebar").Sidebar({
    id: 'mdn-doc-tests',
    title: 'MDN documentation tester',
    url: data.url("sidebar.html"),
    onReady: function (sbWorker) {
      sbWorker.port.on("runTests", function() {
        var tabWorker = tabs.activeTab.attach({
          contentScriptFile: [
            "./doctests.js",
            ...testList.map(test => "./tests/" + test),
            "./runtests.js"
          ],
          contentScriptOptions: {
            "tabURL" : tabs.activeTab.url,
            "mode": mode
          }
        });
        tabWorker.port.emit("runTests");
        tabWorker.port.on("test", function(testObj, id) {
          testObj.name = localize(testObj.name);
          testObj.desc = localize(testObj.desc);
          testObj.errors.forEach((error, i, errors) => {
            errors[i] = {msg: localize.apply(this, [error.msg].concat(error.msgParams))};
          })
          sbWorker.port.emit("test", testObj, id, prefs.autoExpandErrors);
        });
        tabWorker.port.on("badgeUpdate", function(badgeCount) {
          button.state("window", {
            badge: badgeCount
          });
        });
      });
    }
  });
}

var button = ToggleButton({
  id: "mdn-doc-tests-button",
  label: "MDN documentation linter",
  icon: "./icon-disabled.png",
  disabled: true,
  onClick: function (state){
    if (state.checked) {
      sidebar = createSidebar("reading");
      sidebar.show();
    } else {
      sidebar.dispose();
    }
  },
});


var checkIfMdn = function(tab) {
  if (sidebar) {
    sidebar.dispose();
  }
  if (tabWorker) {
    delete tabWorker;
  }
  button.state("window", {
    disabled: true,
    checked: false,
    icon: "./icon-disabled.png",
    badge: ""
  });
  var editURL= /https:\/\/developer\.mozilla\.org\/.+\$(?:edit|translate)/;
  var viewURL = /https:\/\/developer\.mozilla\.org\/([a-z]){2}(?:-[A-Z]{2})?\/.+/;
  if ((editURL.test(tab.url) && tab.url.indexOf("Template") === -1) ||
       tab.title == 'Create a New Article | MDN') {
         sidebar = createSidebar("editing");
         sidebar.show();
  } else if (viewURL.test(tab.url) && tab.url.indexOf("Template") === -1) {
    var tabWorker = tabs.activeTab.attach({
      contentScriptFile: [
        "./doctests.js",
        ...testList.map(test => "./tests/" + test),
        "./runtests.js"
      ],
      contentScriptOptions: {
        "tabURL" : tabs.activeTab.url,
        "mode": "reading"
      }
    });
    tabWorker.port.emit("runTests");
    tabWorker.port.on("badgeUpdate", function(badgeCount) {
      button.state("window", {
        disabled: false,
        icon: "./icon.png",
        badge: badgeCount
      });
    });
  }
};

tabs.on('activate', function(tab) { checkIfMdn(tab); });
tabs.on('ready', function(tab) { checkIfMdn(tabs.activeTab); });