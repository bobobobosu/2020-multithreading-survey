import {upgradeElement} from './dist/main.mjs';
window.workerpath = "http://localhost:63342/final/src/fractalworker.js";

// https://github.com/rafgraph/fractal
// this code may be freely distributed under the GNU GPL v3 copyleft licence

(function () {
    'use strict';

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

    document.getElementById("refreshbtn").addEventListener("click", function () {
        // cleanup
        var workerdomele = document.getElementById("upgrade-fractal");
        var graphics = document.getElementById("fractal-graphics");
        graphics.innerHTML = "";

        // get option
        var ele
        ele = document.getElementById("numthreads");
        var numthreads = ele.options[ele.selectedIndex].value;
        ele = document.getElementById("numfractals");
        var numele = ele.options[ele.selectedIndex].value;
        ele = document.getElementById("impl");
        var impl = ele.options[ele.selectedIndex].value;
        ele = document.getElementById("presentation");
        var presentation = ele.options[ele.selectedIndex].value;
        ele = document.getElementById("fracwidth");
        var fracwidth = ele.options[ele.selectedIndex].value;
        var fracheight = fracwidth * 24/29

        graphics.textContent = JSON.stringify({
            numthreads: numthreads,
            numele: numele,
            impl: impl,
            presentation: presentation,
            fracwidth: fracwidth,
            fracheight: fracheight,
        })

        var arr = [];
        var i;
        var canv;

        switch (presentation){
            case "single_fractal":
                canv = document.createElement('canvas');
                graphics.appendChild(canv);
                arr.push(canv);
                break;
            case "fractal_list":
                for (i = 0; i < numele; i++) {
                    canv = document.createElement('canvas');
                    graphics.appendChild(canv);
                    arr.push(canv);
                }
                break
            case "fractal_nested":
                break
        }

        switch (impl){
            case "naive_st":
                window.benchmark_start(numele);
                for (i = 0; i < arr.length; i++) {
                    calc(arr[i], fracwidth, fracheight, -1, "naive_st");
                }
                break;
            case "naive_ww":
                window.benchmark_start(numele * numthreads);
                for (i = 0; i < arr.length; i++) {
                    calc(arr[i], fracwidth, fracheight, numthreads, "naive_ww");
                }
                break;
            case "ww_wasm":
                window.benchmark_start(numele);
                for (i = 0; i < arr.length; i++) {
                    calc(arr[i], fracwidth, fracheight, numthreads, "ww_wasm");
                }
                break;
            case "ww_offscreen":
                window.benchmark_start(numele);
                for (i = 0; i < arr.length; i++) {
                    calc(arr[i], fracwidth, fracheight, numthreads, "ww_offscreen");
                }
                break;
            case "workerdom":
                upgradeElement(workerdomele, './dist/worker/worker.mjs');
                break;
            case "workerdom_ww":
                upgradeElement(workerdomele, './dist/worker/worker.mjs');
                break;
        }


    });

})();

