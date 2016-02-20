const WARNING = 2;

var totalErrorCount = 0;
var totalWarningCount = 0;

addon.port.on("test", function(test, id, autoExpandErrors) {
  var tests = document.getElementById("tests");
  var errorCount = test.errors.length;
  var status = "ok";
  if (errorCount > 0) {
    status = test.type === WARNING ? "hasWarnings" : "hasErrors";
  }
  var testElem = document.getElementById(id);
  if (tests.contains(testElem)) {
    testElem.getElementsByClassName("errorCount")[0].textContent = errorCount;
    testElem.classList.remove("hasErrors", "hasWarnings", "ok");
    testElem.classList.add(status);
  } else {
    var testContainer = document.createElement("li");
    testContainer.setAttribute("class", "test " + status);
    testContainer.setAttribute("id", id);
    testContainer.setAttribute("title", test.desc);
    var testHeadingContainer = document.createElement("div");
    testHeadingContainer.setAttribute("class", "testHeading");
    var testHeading = document.createElement("span");
    testHeading.setAttribute("class", "testName");
    testHeading.textContent = test.name;
    testHeadingContainer.appendChild(testHeading);
    var errorCounter = document.createElement("span");
    errorCounter.setAttribute("class", "errorCount");
    errorCounter.textContent = errorCount;
    testHeadingContainer.appendChild(errorCounter);
    testContainer.appendChild(testHeadingContainer);

    var errorList = document.createElement("ul");
    errorList.setAttribute("class", "errors");
    testContainer.appendChild(errorList);

    tests.appendChild(testContainer);

    testElem = document.getElementById(id);

    if (autoExpandErrors && status !== "ok") {
      testElem.getElementsByClassName("errors")[0].classList.add("show");
    }
  }

  var errors = testElem.getElementsByClassName("errors")[0];
  if (status === "ok") {
    errors.classList.remove("show");
  }
  while (errors.firstChild) {
    errors.removeChild(errors.firstChild);
  }
  test.errors.forEach(function(error) {
    var errorContainer = document.createElement("li");
    errorContainer.textContent = error.msg;
    errors.appendChild(errorContainer);
  });

  if (errorCount !== 0) {
    if (test.type === WARNING) {
      totalWarningCount += errorCount;
    } else {
      totalErrorCount += errorCount;
    }
  }
  updateErrorSummary();
});

function getParentByClassName(node, className) {
  var currentNode = node;

  while (currentNode && (!currentNode.classList || !currentNode.classList.contains(className))) {
    currentNode = currentNode.parentNode;
  }

  return currentNode;
}

function updateErrorSummary() {
  // Show summary
  document.getElementById("summary").style.display = "flex";

  var totalErrorCounter = document.getElementById("totalErrorCount");
  totalErrorCounter.textContent = totalErrorCount;
  if (totalErrorCount === 0) {
    totalErrorCounter.classList.remove("hasErrors");
    totalErrorCounter.classList.add("ok");
  } else {
    totalErrorCounter.classList.remove("ok");
    totalErrorCounter.classList.add("hasErrors");
  }

  var totalWarningCounter = document.getElementById("totalWarningCount");
  totalWarningCounter.textContent = totalWarningCount;
  if (totalWarningCount === 0) {
    totalWarningCounter.classList.remove("hasWarnings");
    totalWarningCounter.classList.add("ok");
  } else {
    totalWarningCounter.classList.remove("ok");
    totalWarningCounter.classList.add("hasWarnings");
  }
}

function runTests() {
  totalErrorCount = 0;
  totalWarningCount = 0;
  addon.port.emit("runTests");
}

window.addEventListener("DOMContentLoaded", function loadTestSuite() {
  window.removeEventListener("DOMContentLoaded", loadTestSuite);

  var btn = document.getElementById("btn-runtests");
  btn.addEventListener("click", runTests);

  setInterval(runTests, 10000);

  var tests = document.getElementById("tests");
  tests.addEventListener("click", (evt) => {
    var testHeading = getParentByClassName(evt.originalTarget, "testHeading");
    if (testHeading) {
      var testElem = getParentByClassName(testHeading, "test");
      if (testElem.classList.contains("hasErrors") || testElem.classList.contains("hasWarnings")) {
        testElem.getElementsByClassName("errors")[0].classList.toggle("show");
      }
    }
  });
});