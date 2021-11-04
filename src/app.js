// https://github.com/rafgraph/fractal
// this code may be freely distributed under the GNU GPL v3 copyleft licence

(function(){
  'use strict';

  if (typeof window.mandelbrotFractal === "undefined") {
    window.mandelbrotFractal = {};
  }

  window.mandelbrotFractal.App = App;

  function App(){
    this.fractal = new window.mandelbrotFractal.Fractal(document.getElementById("fractal-canvas"));
    this.fractal.updateFractalSize(290, 240);
    this.fractal.updateNumThreads(6);
  }


  function startApp(){
    window.mandelbrotFractal = new mandelbrotFractal.App();
    window.mandelbrotFractal.fractal.draw();
    window.mandelbrotFractal.fractal.canvas.style.width = "150px"
    window.mandelbrotFractal.fractal.canvas.style.height = "150px"
  }
  document.getElementById("refreshbtn").addEventListener("click", function() {
    startApp();
  });

})();

