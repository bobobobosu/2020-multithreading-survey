// https://github.com/rafgraph/fractal
// this code may be freely distributed under the GNU GPL v3 copyleft licence

(function () {
    'use strict';

    function calc(canv) {
        var frac = new window.mandelbrotFractal.Fractal(canv);
        frac.updateFractalSize(290, 240);
        frac.updateNumThreads(6);
        frac.draw();
        frac.canvas.style.width = "150px"
        frac.canvas.style.height = "150px"
    }

    document.getElementById("refreshbtn").addEventListener("click", function () {
        var ele = document.getElementById("fractal-graphics");
        var arr = [];
        var i;
        var num = 10;
        for (i = 0; i < num; i++) {
            var canv = document.createElement('canvas');
            ele.appendChild(canv);
            arr.push(canv);
        }
        for (i = 0; i < num; i++) {
            calc(arr[i]);
        }
    });

})();

