/* JS1k Julia Fractal Browser
   Written for the 2013 Spring JS1k Competition

   Live entry: http://js1k.com/2013-spring/demo/1509
   Blog post: http://localhost:8000/blog/posts/2015-08-05-JS1k-Julia-Fractal_Browser_Explained.html
   GitHub: https://github.com/leshylabs/js1k-Julia-Fractal-Browser

   Copyright (C) 2013 Douglas Haber
   All rights reserved

   This is available under a BSD license, found in the GitHub repository.
 */

"use strict";

// State
var w, h, imageData; // Width, Height, and ImageData
var xPosition, yPosition, zoom; // Fractal viewport location
var stripes, orbitMultiplier;
var currentRow // When drawing one row at a time, the row we are on
var scale; // When drawing, the scale rate we are using
var c2, a2; // Temporary canvas (c2) and context (a2)
var timeoutId; // Stored timeoutId to cancel draw requests with
var colorR, colorG, colorB; // Color values to use when drawing
var buf8, buf32; // 32 bit and 8 bit buffers for accessing the imagedata

// The mode determines the Julia constants to use.
// They are stored as pairs in the modes array, so mode 1 is the elements with
// the index 0 and 1, and mode 2 has the indices 2 and 3, etc.
var currentMode;
var modes = [ -0.7, 0.3, 0.285, -0.01, -0.8, 0.16, 0.4, 0.4 ];

// Temp variables
var x, y, tmp, tmp2;

// Abbreviations
var MATH = Math;
var SIN = MATH.sin;
var RANDOM = MATH.random;
var ATAN = MATH.atan;
var SET_TIMEOUT = setTimeout;
var FF = 0xff;

function draw() {
    var zx, zy, orbit, totalOrbits;

    clearTimeout(timeoutId); // Cancel any other scheduled draws

    // Draw one row of the fractal
    for (x = 0; x < w / scale;) {
	// y is the iteration count
	totalOrbits = orbit = y = 0;

	zx = xPosition + ((w / h) / w * x * scale) / zoom;
	zy = yPosition + (1 / h * currentRow) / zoom;

	while (zx * zx + zy * zy <= 200) { // While we are less than the bailout of 200
	    tmp = zx;

	    zx = (zx * zx - zy * zy) + modes[tmp2 = (currentMode % 4) * 2];
	    zy = (tmp * zy + tmp * zy) + modes[tmp2 + 1];

	    if (++y > 9) {
		totalOrbits += orbit = SIN(stripes * ATAN(zy, zx));
	    }
	}

	// Do a 32 bit write of the color
	buf32[x++] =
	    ((FF << 24) + // Alpha is always 0x255
 	     ((FF * (0.5 + SIN((tmp2 = ((orbitMultiplier * totalOrbits - orbit) / y * 0.8)) + colorR) / 2)) << 16) +
	     ((FF * (0.5 + SIN(tmp2 + colorG) / 2)) << 8) +
	     ((FF * (0.5 + SIN(tmp2 + colorB) / 2))));
    }

    imageData.data.set(buf8);

    // Write to the temporary canvas buffer, and then draw the scaled results onto the real canvas
    a2.putImageData(imageData, 0, 0);
    a.drawImage(c2, 0, 0, x, 1, 0, currentRow, w, scale);

    currentRow += scale;

    if (currentRow < h && scale > 21) { // At the highest scale, keep drawing until we've filled the screen
	draw();
    }
    else if (currentRow < h) { // At other scales, schedule new draws
	timeoutId = SET_TIMEOUT(draw, 0);
    }
    else if (scale > 1) {
	if (scale > 9) {
	    scale = 8;
	}
	else {
	    scale /= 2;
	}

	timeoutId = SET_TIMEOUT(draw, currentRow = 0);
    }
}

function onScroll(e) {
    // When the mouse wheel scrolls, zoom in or out towards or away from the mouse position
    var x = e.clientX;
    var y = e.clientY - 35;
    var wx = xPosition + ((w / h) / zoom) / (w / x);
    var wy = yPosition + (1 / zoom) / (h / y);

    if ((e.wheelDelta || -e['deltaY']) > 0) {
	zoom *= 1.3;
    }
    else {
	zoom /= 1.3;
    }

    xPosition = wx - ((w / h) / (w / x)) / zoom;

    newDraw(yPosition = wy - (1 / (h / y)) / zoom);
}

function newDraw() {
    // Begin a new scaled lowest quality drawing cycle
    currentRow = 0;

    draw(scale = 22);
}

function resize(event, newMode) {
    // Resize the canvas to fill the window and start a new drawing cycle
    if (newMode) {
	yPosition = xPosition = -1.4;
	zoom = 0.4;
	currentMode++;
    }

    c2 = c.cloneNode();
    a2 = c2.getContext('2d');

    w = c2.width = c.width = innerWidth;
    h = c.height = innerHeight - 35;

    buf8 = new Uint8Array(tmp = new ArrayBuffer(w * 4));
    buf32 = new Uint32Array(tmp);

    newDraw(imageData = a.createImageData(w, 1));
}

function randomize(noDraw) {
    // Choose random colors, number of stripes, and orbitMultiplier, and then start a new draw
    colorR = RANDOM();
    colorG = RANDOM();
    colorB = RANDOM();

    stripes = RANDOM() * 25 + 0.5;
    orbitMultiplier = RANDOM() * 35 + 6;

    ! noDraw && newDraw();
}

// Create the buttons as strings
tmp = "<button onclick=\"";
b.innerHTML = tmp + 'resize(0,1)">Next</button>' + tmp + 'randomize()">Rand</button>';
b.appendChild(c).onwheel = c.onmousewheel = onScroll

randomize(1); // Set the initial values randomly
// Initialize variables to 0, and call resize(0, 1), which begins the first draw
resize(timeoutId = b.style.margin = currentMode = 0, 1);

// Junk to help with replacing strings after minification
window['function_randomize'] = randomize;
window['function_next'] = resize;
