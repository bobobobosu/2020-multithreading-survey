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

calRgbNum = function (escapeTime, maxEscapeTime) {
    if (escapeTime <= 2) {
        return [0, 0, 0];
    } else if (escapeTime === maxEscapeTime) {
        return [0, 25, 0];
    }

    var redNum;
    var greenNum;
    var blueNum;
    var rgbIncrements = Math.floor(((maxEscapeTime) / 7));
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


onmessage = function (e) {
    // console.log('Message received from main script'+ JSON.stringify(e.data));
    input_arr = new Float32Array(e.data)
    output_arr = []
    // console.log(e.data.input_arr);
    var maxEscapeTime = input_arr[0];
    for (var i = 1; i < input_arr.length; i += 4) {
        var input = [input_arr[i], input_arr[i + 1], input_arr[i + 2], input_arr[i + 3]];
        output_arr.push([input[0], input[1], calRgbNum(calcEscapeTime(input[2], input[3], maxEscapeTime), maxEscapeTime)])
    }
    postMessage(output_arr);
}