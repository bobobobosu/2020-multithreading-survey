var distFromOrigin = function (x, y) {
    return Math.sqrt(x * x + y * y);
};

var calcEscapeTime = function (xCart, yCart, maxEscapeTime) {

    var escapeTime = 0;
    var oldX = xCart;
    var oldY = yCart;
    var newX, newY;

    while (distFromOrigin(oldX, oldY) < 2 && escapeTime < maxEscapeTime) {
        newX = (oldX * oldX) - (oldY * oldY) + xCart;
        newY = (2 * oldX * oldY) + yCart;

        oldX = newX;
        oldY = newY;

        escapeTime += 1;
    }

    return escapeTime;
};

var pixelToCartY = function (y, canvas, cords) {
    var pxRatio = y / canvas.height;
    var cartHeight = cords.yCartMax - cords.yCartMin;
    return cords.yCartMin + (cartHeight * pxRatio);
};

var pixelToCartX = function (x, canvas, cords) {
    var pxRatio = x / canvas.width;
    var cartWidth = cords.xCartMax - cords.xCartMin;
    return cords.xCartMin + (cartWidth * pxRatio);
};

var calcRgbNum = function (escapeTime) {
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

onmessage = function (ev) {
    let canvas;
    let ctx;
    let cords;

    canvas = ev.data.canvas;
    cords = ev.data.cords;
    maxEscapeTime = ev.data.maxEscapeTime;
    ctx = canvas.getContext('2d');

    var imageData = new ImageData(canvas.width, canvas.height);
    var yCart, xCart, escapeTime, rgbNum, index;

    for (var y = 0; y < imageData.height; y++) {
        yCart = pixelToCartY(y, canvas, cords);

        for (var x = 0; x < imageData.width; x++) {
            xCart = pixelToCartX(x, canvas, cords);


            escapeTime = calcEscapeTime(xCart, yCart, maxEscapeTime);
            rgbNum = calcRgbNum(escapeTime);
            index = (y * imageData.width + x) * 4;
            imageData.data[index] = rgbNum[0];
            imageData.data[index + 1] = rgbNum[1];
            imageData.data[index + 2] = rgbNum[2];
            imageData.data[index + 3] = 255;

        }
    }
    ctx.putImageData(imageData, 0, 0);

    postMessage("done");
}