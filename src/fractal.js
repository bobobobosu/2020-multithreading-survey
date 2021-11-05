// https://github.com/rafgraph/fractal
// this code may be freely distributed under the GNU GPL v3 copyleft licence

(function () {
    'use strict';

    if (typeof window.mandelbrotFractal === "undefined") {
        window.mandelbrotFractal = {};
    }
    window.mandelbrotFractal.Fractal = Fractal;

    function Fractal(canvas) {
        this.canvas = canvas;
        this.cords = {};
        this.maxEscapeTime = 224;
    }

    Fractal.prototype.updateNumThreads = function (num) {
        this.threads = num;
    };

    Fractal.prototype.updateFractalSize = function (width, height) {
        this.cords.xCartMin = -2.1;
        this.cords.xCartMax = 0.8;
        this.cords.yCartMin = -1.2;
        this.cords.yCartMax = 1.2;
        this.canvas.width = width;
        this.canvas.height = height;
    };

    Fractal.prototype.pixelToCartX = function (x) {
        var pxRatio = x / this.canvas.width;
        var cartWidth = this.cords.xCartMax - this.cords.xCartMin;
        return this.cords.xCartMin + (cartWidth * pxRatio);
    };


    Fractal.prototype.pixelToCartY = function (y) {
        var pxRatio = y / this.canvas.height;
        var cartHeight = this.cords.yCartMax - this.cords.yCartMin;
        return this.cords.yCartMin + (cartHeight * pxRatio);
    };

    Fractal.prototype.draw = function (mode) {
        switch (mode){
            case "naive_st":
                this.drawToImageData();
                break;
            case "naive_ww":
                this.drawToImageDataWorker();
                break;
            case "ww_wasm":
                this.drawToImageDataWASM();
                break;
            case "ww_offscreen":
                this.drawToImageDataOffscreen();
                break;
        }
    };

    Fractal.prototype.drawToImageDataOffscreen = function () {
        var offscreen = this.canvas.transferControlToOffscreen();
        const worker = new Worker('./fractaloffscreenworker.js');
        worker.postMessage({ canvas: offscreen, cords: this.cords, maxEscapeTime: this.maxEscapeTime}, [offscreen]);
        worker.onmessage = function (e) {
            window.benchmark_end();
        };
    };

    Fractal.prototype.drawToImageData = function () {
        var ctx = this.canvas.getContext("2d");
        var imageData = new ImageData(this.canvas.width, this.canvas.height);
        var yCart, xCart, escapeTime, rgbNum, index;

        for (var y = 0; y < imageData.height; y++) {
            yCart = this.pixelToCartY(y);

            for (var x = 0; x < imageData.width; x++) {
                xCart = this.pixelToCartX(x);


                escapeTime = this.calcEscapeTime(xCart, yCart);
                rgbNum = this.rgbNum(escapeTime);
                index = (y * imageData.width + x) * 4;
                imageData.data[index] = rgbNum[0];
                imageData.data[index + 1] = rgbNum[1];
                imageData.data[index + 2] = rgbNum[2];
                imageData.data[index + 3] = 255;

            }
        }
        ctx.putImageData(imageData, 0, 0);
        window.benchmark_end();
        return imageData;
    };


    Fractal.prototype.drawToImageDataWASM = function () {
        var ctx = this.canvas.getContext("2d");
        var imageData = new ImageData(this.canvas.width, this.canvas.height);
        var yCart, xCart, escapeTime, rgbNum, index;

        var arrlen = imageData.height * imageData.width * 4 + 1;
        var idx = 1;
        var arr = 0;
        var i;
        var arrs = [];
        for (i = 0; i < this.threads; i++) {
            arrs.push(new Float32Array(arrlen))
        }
        var arrsbuffs = arrs.map(x => x.buffer);
        for (i = 0; i < arrs.length; i++) {
            arrs[i][0] = this.maxEscapeTime;
        }

        for (var y = 0; y < imageData.height; y++) {
            yCart = this.pixelToCartY(y);

            for (var x = 0; x < imageData.width; x++) {
                xCart = this.pixelToCartX(x);

                arrs[arr][idx] = x;
                arrs[arr][idx + 1] = y;
                arrs[arr][idx + 2] = xCart;
                arrs[arr][idx + 3] = yCart;
                idx = idx + 4;
            }
        }

        // Create example data to test float_multiply_array
        // var data = new Float32Array([1, 2, 3, 4, 5]);
        var data = new Float32Array(arrs[0]);

// Get data byte size, allocate memory on Emscripten heap, and get pointer
        var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
        var dataPtr = Module._malloc(nDataBytes);

// Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
        var dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
        dataHeap.set(new Uint8Array(data.buffer));

// Call function and get result
        Module.ccall('myFunction', 'number', ['number', 'number', 'number'], [data.length, dataHeap.byteOffset, this.threads]);
        var result = new Float32Array(dataHeap.buffer, dataHeap.byteOffset + data.BYTES_PER_ELEMENT, data.length - 1); // remove first

// Free memory
        imageData.data.set(Uint8ClampedArray.from(result));
        ctx.putImageData(imageData, 0, 0);
        Module._free(dataHeap.byteOffset);
        window.benchmark_end();
        return imageData;
    };


    Fractal.prototype.drawToImageDataWorker = function () {
        var ctx = this.canvas.getContext("2d");
        var imageData = new ImageData(this.canvas.width, this.canvas.height);
        var yCart, xCart, escapeTime, rgbNum, index;

        var arrlen = imageData.height * imageData.width * 4 + 1;
        var idx = 1;
        var arr = 0;
        var arrs = [];
        for (i = 0; i < this.threads; i++) {
            arrs.push(new Float32Array(arrlen))
        }
        var arrsbuffs = arrs.map(x => x.buffer);
        for (var i = 0; i < arrs.length; i++) {
            arrs[i][0] = this.maxEscapeTime;
        }

        for (var y = 0; y < imageData.height; y++) {
            yCart = this.pixelToCartY(y);

            for (var x = 0; x < imageData.width; x++) {
                xCart = this.pixelToCartX(x);

                if (idx >= arrs[arr].length) {
                    idx = 1;
                    arr = arr + 1;
                }

                arrs[arr][idx] = x;
                arrs[arr][idx + 1] = y;
                arrs[arr][idx + 2] = xCart;
                arrs[arr][idx + 3] = yCart;
                idx = idx + 4;
            }
        }

        var workeronmessage = function (e) {
            var result = e.data;
            var index = 0;
            for (var idx = 0; idx < result.length; idx++) {
                var x = result[idx][0];
                var y = result[idx][1];
                index = (y * imageData.width + x) * 4;
                var rgbNum = result[idx][2];
                imageData.data[index] = rgbNum[0];
                imageData.data[index + 1] = rgbNum[1];
                imageData.data[index + 2] = 0; //rgbNum[2];
                imageData.data[index + 3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);
            window.benchmark_end();
        }

        var workerarr = []
        for (i = 0; i < this.threads; i++) {
            workerarr.push(new Worker(window.workerpath))
            workerarr[i].onmessage = workeronmessage;
        }
        for (i = 0; i < this.threads; i++) {
            workerarr[i].postMessage(arrsbuffs[i], [arrsbuffs[i]]);
        }
        return imageData;
    };


    Fractal.prototype.calcEscapeTime = function (xCart, yCart) {

        var escapeTime = 0;
        var oldX = xCart;
        var oldY = yCart;
        var newX, newY;

        while (this.distFromOrigin(oldX, oldY) < 2 && escapeTime < this.maxEscapeTime) {
            newX = (oldX * oldX) - (oldY * oldY) + xCart;
            newY = (2 * oldX * oldY) + yCart;

            oldX = newX;
            oldY = newY;

            escapeTime += 1;
        }

        return escapeTime;
    };


    Fractal.prototype.distFromOrigin = function (x, y) {
        return Math.sqrt(x * x + y * y);
    };


    ///////////////////////////////////////////////////////////////////////////////
    //coloring algorithim:
    //start with 2 of the 3 red, green and blue values fixed at either 0 or 255,
    //then increase the other R, G or B value in a given number of increments
    //repeat this for seven cases and you get a maximum of 1792 colors (7*256)
    //note that white repeats 3 times, at the end of cases 2, 4 and 6
    //the seven case are:
    //case 0: R=0, B=0, increase green from 0 to 255
    //case 1: R=0 G=255, increase blue from 0 to 255
    //case 2: G=255, B=255, increase red form 0 to 255
    //case 3: G=0, B=255, increase red from 0 to 255
    //case 4: R=255, B=255, increase green from 0 to 255
    //case 5: R=255, B=0, increase green from 0 to 255
    //case 6: R=255, G=255, increase blue from 0 to 255
    ///////////////////////////////////////////////////////////////////////////////

    Fractal.prototype.rgbNum = function (escapeTime) {
        if (escapeTime <= 2) {
            return [0, 0, 0];
        } else if (escapeTime === this.maxEscapeTime) {
            return [0, 25, 0];
        }

        var redNum;
        var greenNum;
        var blueNum;
        var rgbIncrements = Math.floor(((this.maxEscapeTime) / 7));
        var caseNum = Math.floor(escapeTime / rgbIncrements);
        var remainNum = escapeTime % rgbIncrements;

        switch (caseNum) {
            case 0:
                redNum = 0;
                greenNum = Math.floor(256 / rgbIncrements) * remainNum;
                blueNum = 0;
                break;
            case 1:
                redNum = 0;
                greenNum = 255;
                blueNum = Math.floor(256 / rgbIncrements) * remainNum;
                break;
            case 2:
                redNum = Math.floor(256 / rgbIncrements) * remainNum;
                greenNum = 255;
                blueNum = 255;
                break;
            case 3:
                redNum = Math.floor(256 / rgbIncrements) * remainNum;
                greenNum = 0;
                blueNum = 255;
                break;
            case 4:
                redNum = 255;
                greenNum = Math.floor(256 / rgbIncrements) * remainNum;
                blueNum = 255;
                break;
            case 5:
                redNum = 255;
                greenNum = Math.floor(256 / rgbIncrements) * remainNum;
                blueNum = 0;
                break;
            case 6:
                redNum = 255;
                greenNum = 255;
                blueNum = Math.floor(256 / rgbIncrements) * remainNum;
                break;
        }

        return [redNum, greenNum, blueNum];
    };

})();
