// JavaScript Document

var canvas = document.getElementById('canvas'),
	context = canvas.getContext('2d'),
    previewCanvas = document.getElementById('preview'),
    previewContext = previewCanvas.getContext('2d'),
    origImgWidth,
    origImgHeight,
    resizeWidth = canvas.width,
    resizeHeight = canvas.height;

//image uploader

function doUpload(e){
    var file = e.target.files[0];
    if(file){
        var reader = new FileReader();
        reader.onload = function loadBg(event){
            canvasLoadImage(event.target.result);
        }
        reader.readAsDataURL(file);
    }
}

//write image to canvas

function canvasLoadImage(imgData){

    var img = new Image();
    img.src = imgData;
    oData = imgData;
    origImgWidth = img.width;
    origImgHeight = img.height;

	if((img.height/canvas.height)>(img.width/canvas.width)) {
		var newWidth = resizeWidth
        newHeight = origImgHeight / origImgWidth * resizeWidth;
	} else {
		var newHeight = resizeHeight
		newWidth = origImgWidth / origImgHeight * resizeHeight;
	}

	var coordinates = {
		x : canvas.width / 2 - newWidth / 2,
        y : canvas.height / 2 - newHeight / 2
    }

	img.onload = function() {
		console.log(coordinates)

	    var branding = new Image();
	    branding.src = 'images/clash-branding.png';

	    branding.onload = function drawAsset(){
	        context.drawImage(img, coordinates.x , coordinates.y , newWidth, newHeight);
			makeCanvasOverexposed(canvas, context);
			makeCanvasGreyscale(canvas, context);
			blurCanvas(canvas, context);
			makeCanvasNoisy(canvas, context);

	        context.drawImage(branding, 0, 0, 1000, 1000);
	        previewContext.drawImage(canvas, 0, 0, 500, 500);
	    }
	}
}

document.getElementById('upload').addEventListener('change', doUpload);

document.getElementById('placeInput').addEventListener('keyup', addLettering);

function addLettering() {

    var img = new Image();
    img.src = oData;
    origImgWidth = img.width;
    origImgHeight = img.height;

    if((img.height/canvas.height)>(img.width/canvas.width)){
        var newWidth = resizeWidth
        newHeight = origImgHeight / origImgWidth * resizeWidth;
    }else{
        var newHeight = resizeHeight
        newWidth = origImgWidth / origImgHeight * resizeHeight;
    }

    var coordinates = {
        x : canvas.width / 2 - newWidth / 2,
        y : canvas.height / 2 - newHeight / 2
    }

    console.log(coordinates);

    var branding = new Image();
    branding.src = 'images/clash-branding.png';

    var place = document.getElementById('placeInput').value;

    var correction = 0.8;

    if(place.length > 5) {
        var fontSize = (755 / correction) / place.length
        var lineHeight = fontSize * correction;
    } else {
        var fontSize = 140;
        var lineHeight = 140 * correction;
    }

    context.font = ''+fontSize+'px House-A-Rama';
    context.fillStyle = '#f6a5bc'
    branding.onload = function drawAsset(){
        context.drawImage(img, coordinates.x , coordinates.y , newWidth, newHeight);
		makeCanvasOverexposed(canvas, context);
		makeCanvasGreyscale(canvas, context);
		blurCanvas(canvas, context);
		makeCanvasNoisy(canvas, context);
        context.drawImage(branding, 0, 0, 1000, 1000);
        var yPosition = 775;
        for(var i = place.length-1; i > -1; i--){
            var character = place[i];
            context.fillText(character, 40, yPosition);
            yPosition -= lineHeight;
        }
        //context.fillText(place, 40, 775);
        previewContext.drawImage(canvas, 0, 0, 500, 500);
    }
	//document.getElementById('warning').innerHTML = place;
}


function getImageData(cnv, ctx) {
    return ctx.getImageData(0, 0, cnv.width, cnv.height);
}

function makeCanvasGreyscale(cnv, ctx) {
    var data = getImageData(cnv, ctx);
    var pixels = data.data;
    for(var i=0; i<pixels.length; i+=4) {
        var r = pixels[i];
        var g = pixels[i+1];
        var b = pixels[i+2];
        // CIE luminance for the RGB
        // The human eye is bad at seeing red and blue, so we de-emphasize them.
        var v = 0.2126*r + 0.7152*g + 0.0722*b;
        pixels[i] = pixels[i+1] = pixels[i+2] = v
    }
    ctx.putImageData(data, 0, 0);
}

function makeCanvasNoisy(cnv, ctx) {
    var data = getImageData(cnv, ctx);
    var pixels = data.data;
    var threshold = 0.1;
    for(var i=0; i<pixels.length; i+=4) {
        var r = pixels[i];
        var g = pixels[i+1];
        var b = pixels[i+2];
        var newVal = blurWithThreshold(r, threshold);
        pixels[i] = newVal;
        pixels[i+1] = newVal;
        pixels[i+2] = newVal;
    }
    ctx.putImageData(data, 0, 0);
}

// Returns a random number between min (inclusive) and max (exclusive)
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function blurWithThreshold(y, threshold) {
    return getRandomArbitrary(y + (y*threshold), y - (y*threshold));
}

function makeCanvasOverexposed(cnv, ctx) {
    var data = getImageData(cnv, ctx);
    var pixels = data.data;
    var overExposureValue = 1.4;
    for(var i=0; i<pixels.length; i+=4) {
        pixels[i] *= overExposureValue * overExposureValue;
        pixels[i+1] *= overExposureValue;
        pixels[i+2] *= overExposureValue;
    }
    ctx.putImageData(data, 0, 0);
}

function luminance(pixels) {
    var result = [];
    for(var i=0; i<pixels.length; i+=4) {
        result.push(pixels[i]);
    }
    return result;
}

function blurCanvas(cnv, ctx) {
    var data = getImageData(cnv, ctx);
    var pixels = data.data;
    var oldLuminance = luminance(pixels);
    var radius = 5;
    var newLuminance = [];
    for(var i=0; i<oldLuminance.length; i++) {
        var average = 0;
        var counted = 0;
        for(var j=i-radius; j<=i+radius; j++) {
            average += oldLuminance[j];
            counted++;
        }
        average = average / counted;
        if(isNaN(average)) {
            average = oldLuminance[i];
        }
        newLuminance.push(average);
    }
    for(var i=0; i<pixels.length; i+=4) {
        var lum = newLuminance[i/4];
        pixels[i] = lum;
        pixels[i+1] = lum;
        pixels[i+2] = lum;
    }
    data.data = pixels;
    ctx.putImageData(data, 0, 0);
}

function download() {
    var dt = canvas.toDataURL("6-music-calling/jpeg");
    this.href = dt;
};
downloadLnk.addEventListener("click", download, false);
