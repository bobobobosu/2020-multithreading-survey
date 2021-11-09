importScripts("http://localhost:63342/final/src/fractal.js");
window.workerpath = "http://localhost:63342/final/src/fractalworker.js"

function calc(canv, width, height, numthread, mode) {
    var frac = new window.mandelbrotFractal.Fractal(canv);
    frac.updateFractalSize(width, height);
    frac.updateNumThreads(numthread);
    frac.draw(mode);
    frac.canvas.style.width = "150px"
    frac.canvas.style.height = "150px"
}

window.benchmark_start = function (pending){
    window.benchmarkstartstartTime = performance.now();
    window.benchmarkpending = pending;
}
window.benchmark_end = function (){
    window.benchmarkpending = window.benchmarkpending - 1;
    if (window.benchmarkpending === 0){
        var endTime = performance.now();
        document.getElementById("time_completion").textContent = `Took ${endTime - window.benchmarkstartstartTime} milliseconds`
    }
}

// cleanup
var graphics = document.getElementById("fractal-fixed");
var config = JSON.parse(graphics.textContent);
graphics.innerHTML = "";

// status
var completionstatus = document.createElement('p');
completionstatus.setAttribute("id", "time_completion");
graphics.appendChild(completionstatus)

var numthreads = config.numthreads;
var numele = config.numele;
var impl = config.impl;
var presentation = config.presentation;
var fracwidth = config.fracwidth;
var fracheight = config.fracheight;

let canv = document.createElement('canvas');
graphics.appendChild(canv);

// run
switch (impl){
    case "workerdom_ww_multi":
        window.benchmark_start(numthreads);
        calc(canv, fracwidth, fracheight, numthreads, "naive_ww");
        break;
}