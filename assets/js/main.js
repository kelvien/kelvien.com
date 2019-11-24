var debug = false;
var loadingTime = 2000;
var contactSubdomain = ['hey'];
var returnsSubdomain = 'returns';

var isScrolling = false;

var userAgent = window.navigator.userAgent;
var isIE = userAgent.indexOf('MSIE ');
if (isIE > 0 && parseInt(userAgent.substring(isIE + 5, userAgent.indexOf('.', isIE))) < 11) {
    $.each($('#Kelvien').children(), function(i ,e) {
        $(e).find("use[fill='black']").removeAttr('xlink:href');
    });
}

// RAF Fallback handler
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Kelvien = function() {
    this.element = $('#kelvien');
    this.me = this.element[0];
    this.oriMarginLeft = Math.abs(parseInt(this.element.css('margin-left')));
    this.initialPositionX = parseInt(this.element.css('left'));
    this.initialPositionY = parseInt(this.element.css('top'));

    this.movingThreshold = 8; // Multiple of 2 ONLY
    this.movingCount = this.movingThreshold;

    this.isMoving;
    this.evenOdd;
    this.direction = 'down';
    this.state = 'normal';
}

var Companion = function(el) {
    this.element = el;
    this.me = this.element[0];

    this.isMoving;
    this.evenOdd;
    this.direction = 'down';
}

var Tile = function(img, name, x, y, deg, flipH) {
    this.src = img;
    this.name = name;
    // This x and y is inclusive (0) when we are looking at the sprite image
    this.x = x;
    this.y = y;

    this.posX;
    this.posY;

    this.deg = deg;
    this.flipH = flipH;
    this.processedTile = this.processTile(this);
    this.img = this.processedTile;

    this.neighbors = [];
}

Tile.prototype.processTile = function(el) {
    var offscreenCanvas = document.createElement('canvas');
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = 32;
    offscreenCanvas.height = 32;

    var img;
    if (el.deg != 0) {
        offscreenCtx.translate(32 / 2, 32 / 2);
        offscreenCtx.rotate(this.deg * Math.PI/180);

        offscreenCtx.drawImage(this.src, this.x, this.y, 32, 32, -(32 / 2), -(32 / 2), 32, 32);
    } else {
        offscreenCtx.drawImage(this.src, this.x, this.y, 32, 32, 0, 0, 32, 32);
    }
    if (this.flipH) {
        offscreenCtx.translate(32, 0);
        offscreenCtx.scale(-1, 1);
        offscreenCtx.drawImage(offscreenCanvas, 0, 0);
    }
    return offscreenCanvas;
}

var Item = function(img, name, x, y, w, h) {
    this.src = img;
    this.name = name;
    // This x and y is inclusive (0) when we are looking at the sprite image
    this.x = x;
    this.y = y;

    this.w = w;
    this.h = h;

    this.i;
    this.j;

    this.processedItem = this.processItem(this);
    this.img = this.processedItem;
}

Item.prototype.processItem = function() {
    var offscreenCanvas = document.createElement('canvas');
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = this.w;
    offscreenCanvas.height = this.h;

    offscreenCtx.drawImage(this.src, this.x, this.y, this.w, this.h, 0, 0, this.w, this.h);
    return offscreenCanvas;
}

var Character = function(img, name, w, h, direction, imgJson) {
    this.src = img;
    this.name = name;

    this.w = w;
    this.h = h;

    this.evenOdd;
    this.direction = direction;
    this.isMoving;

    this.json = imgJson

    this.processedCharacter = this.processCharacter(this);
    this.img = this.processedCharacter;

    this.boundary;
    this.srcPos = {
        "x": 0,
        "y": 0
    };
    this.destPos = {
        "x": 0,
        "y": 0
    }
}

Character.prototype.processCharacter = function() {
    if (this.json) {
        var behavior = (this.isMoving) ? ((this.evenOdd) ? 'left' : 'right') : 'normal';
        this.x = this.json[this.direction][behavior].x;
        this.y = this.json[this.direction][behavior].y;
    }

    var offscreenCanvas = document.createElement('canvas');
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = this.w;
    offscreenCanvas.height = this.h;

    offscreenCtx.drawImage(this.src, this.x, this.y, this.w, this.h, 0, 0, this.w, this.h);
    return offscreenCanvas;
}

var Story = function(context, anim) {
    var alias = this;

    this.cc = context;
    this.cc.webkitImageSmoothingEnabled = false;
    this.cc.mozImageSmoothingEnabled = false;
    this.cc.msImageSmoothingEnabled = false;
    this.cc.imageSmoothingEnabled = false;

    this.tiles = [];
    this.pointers = this.getPointers();

    this.animation = anim;

    /// TILES ///
    this.tile = [];
    this.loadImage();
    // this.loadImage().then(function() {
    // 	alias.draw();

    // 	alias.setupAnimateDOM();
    // 	alias.startAnimateLapras();
    // });

    this.item = [];
    this.character = [];
    this.movingCharacter = [];

    this.a = [];
    this.aPosI = [];
    this.aPosJ = [];
    this.aStart = [];
    this.aDirection = [];

    this.endingDirection = false;

    this.oceanThreshold = 1 * 32;
    this.adjustedI = 32 - this.position['adjustMostLeft'];
}

Story.prototype.destroy = function() {
    window.clearTimeout(this.loopEnding);
    window.clearInterval(this.laprasInterval);
    window.clearInterval(this.endingInterval);
    for (var key in this.a) {
          if (this.a.hasOwnProperty(key)) {
              $(this.a[key]).remove();
          }
    }
}

Story.prototype.loadImage = function() {
    var alias = this;

    // return new Promise(function(resolve, reject) {
        var img = new Image();
        img.src = 'assets/media/sprites.png';
        img.onload = function() {
            alias.tile['grass'] = new Tile(img, 'grass', 34, 226, 0);
            alias.tile['grass1'] = new Tile(img, 'grass1', 136, 260, 0);
            alias.tile['flower'] = new Tile(img, 'flower', 204, 192, 0);
            alias.tile['grassMildMM'] = new Tile(img, 'grassMildMM', 204, 260, 0);
            alias.tile['grassMildML'] = new Tile(img, 'grassMildML', 238, 260, 0);
            alias.tile['grassMildMR'] = new Tile(img, 'grassMildMR', 238, 260, 0, 1);
            alias.tile['grassMildTL'] = new Tile(img, 'grassMildTL', 238, 226, 0);
            alias.tile['grassMildTM'] = new Tile(img, 'grassMildTM', 238, 192, 0);
            alias.tile['grassMildTR'] = new Tile(img, 'grassMildTR', 238, 226, 0, 1);
            alias.tile['grassMildBL'] = new Tile(img, 'grassMildBL', 272, 226, 0, 1);
            alias.tile['grassMildBM'] = new Tile(img, 'grassMildBM', 238, 192, 180);
            alias.tile['grassMildBR'] = new Tile(img, 'grassMildBR', 272, 226, 0);
            alias.tile['rockTile'] = new Tile(img, 'rockTile', 170, 260, 0);
            alias.tile['oceanTL'] = new Tile(img, 'oceanTL', 34, 260, 0);
            alias.tile['oceanTM'] = new Tile(img, 'oceanTM', 102, 192, 0);
            alias.tile['oceanTR'] = new Tile(img, 'oceanTR', 136, 192, 0);
            alias.tile['oceanML'] = new Tile(img, 'oceanML', 136, 226, 0);
            alias.tile['oceanMM'] = new Tile(img, 'oceanMM', 68, 192, 0);
            alias.tile['oceanMR'] = new Tile(img, 'oceanMR', 68, 226, 0);
            alias.tile['oceanBL'] = new Tile(img, 'oceanBL', 68, 260, 0);
            alias.tile['oceanBM'] = new Tile(img, 'oceanBM', 102, 260, 0);
            alias.tile['oceanBR'] = new Tile(img, 'oceanBR', 102, 226, 0);
            alias.tile['roadTL'] = new Tile(img, 'roadTL', 0, 192, 90);
            alias.tile['roadTM'] = new Tile(img, 'roadTM', 0, 226, 0);
            alias.tile['roadTR'] = new Tile(img, 'roadTR', 0, 192, 180);
            alias.tile['roadML'] = new Tile(img, 'roadML', 0, 226, -90);
            alias.tile['roadMM'] = new Tile(img, 'roadMM', 0, 260, 90);
            alias.tile['roadMR'] = new Tile(img, 'roadMR', 0, 226, 90);
            alias.tile['roadBL'] = new Tile(img, 'roadBL', 0, 192, 0);
            alias.tile['roadBM'] = new Tile(img, 'roadBM', 0, 226, 180);
            alias.tile['roadBR'] = new Tile(img, 'roadBR', 0, 192, -90);

            alias.item['tree'] = new Item(img, 'tree', 0, 56, 64, 94);
            alias.item['home'] = new Item(img, 'home', 620, 372, 160, 128);


            var laprasJson = {
                "up": {
                    "left": {
                        "x": 303,
                        "y": 468
                    },
                    "normal": {
                        "x": 303,
                        "y": 468
                    },
                    "right": {
                        "x": 303,
                        "y": 468
                    }
                },
                "down": {
                    "left": {
                        "x": 267,
                        "y": 468
                    },
                    "normal": {
                        "x": 267,
                        "y": 468
                    },
                    "right": {
                        "x": 267,
                        "y": 468
                    }
                },
                "left": {
                    "left": {
                        "x": 339,
                        "y": 468
                    },
                    "normal": {
                        "x": 339,
                        "y": 468
                    },
                    "right": {
                        "x": 339,
                        "y": 468
                    }
                },
                "right": {
                    "left": {
                        "x": 375,
                        "y": 468
                    },
                    "normal": {
                        "x": 375,
                        "y": 468
                    },
                    "right": {
                        "x": 375,
                        "y": 468
                    }
                }
            };
            alias.character['lapras'] = new Character(img, 'lapras', 32, 32, 'left', laprasJson);

            alias.character['dad'] = new Character(img, 'dad', 32, 40, 'down', {"down": {"normal": {"x": 578, "y": 323}}});
            alias.character['mom'] = new Character(img, 'mom', 32, 40, 'down', {"down": {"normal": {"x": 578, "y": 367}}});
            alias.character['tiff'] = new Character(img, 'tiff', 32, 40, 'down', {"down": {"normal": {"x": 578, "y": 412}}});
            alias.character['nic'] = new Character(img, 'nic', 32, 40, 'down', {"down": {"normal": {"x": 578, "y": 456}}});

            alias.draw();

            alias.setupAnimateDOM();
            alias.startAnimateLapras();
        }
    // }).then(function(img) {
    // 	return new Promise(function(resolve, reject) {

    // 		resolve();
    // 	});
    // });
}

Story.prototype.getPointers = function() {
    // Get Kelvien position
    this.position = [];

    this.position['windowW'] = $(window).width();
    this.position['windowH'] = $(window).width();
    this.position['canvasH'] = $('#canvas').height();

    this.position['kelvienT'] = $('#kelvien').offset().top;
    this.position['kelvien'] = $('#kelvien').offset().left;
    this.position['adjustMostLeft'] = this.position['kelvien'] % 32;

    this.position['start'] = $("#timeline-gap").offset().top;
    this.position['ocean'] = $(".event[data-event='fly']:first").offset().top;
    this.position['oceanH'] = $(".event[data-event='fly']:first").outerHeight(true) + $(".event[data-event='fly']:last").outerHeight(true);
    this.position['ending'] = $(".event:last").offset().top;
    this.position['endingH'] = $(".event:last").outerHeight(true);

    this.position['projectKelvien'] = $(".event[data-event='projectKelvien']:first").offset().top;
}

Story.prototype.insertCharacter = function(character, i, j, boundary, movingNPC) {
    character.srcPos['i'] = i;
    character.srcPos['j'] = j;

    character.boundary = boundary;
    if (movingNPC) {
        this.movingCharacter[character.name] = character;
    }

    this.character.push(character);
}

Story.prototype.setupAnimateDOM = function() {
    var container = $('#canvas-container');

    var lapras = $('<div>');
    var laprasLastI = this.position['windowW'] / 2;
    var laprasLastJ = this.position['ocean'] + (3 * this.oceanThreshold);
    lapras.attr('id', 'lapras');
    lapras.css({
        "position": 'absolute',
        "background": 'url(assets/media/sprites.png)',
        "background-position": '-375px -468px', // right
        "width": 32,
        "height": 32,
        "top": laprasLastJ,
        "right": laprasLastI
    });
    container.append(lapras);
    this.a['lapras'] = lapras;
    this.aPosI['lapras'] = laprasLastI;
    this.aPosJ['lapras'] = laprasLastJ;
    this.aDirection['lapras'] = 'right';

    var latias = $('<div>');
    var latiasLastI = -62;
    latias.attr('id', 'latias');
    latias.attr('class', 'flyer');
    latias.css({
        "position": 'absolute',
        "background": 'url(assets/media/sprites.png)',
        "background-position": '-455px -448px',
        "width": 56,
        "height": 52,
        "top": this.position['projectKelvien'] + 64,
        "right": latiasLastI
    });
    container.append(latias);
    this.a['latias'] = latias;

    var latios = $('<div>');
    var latiosLastI = -112;
    latios.attr('id', 'latios');
    latios.attr('class', 'flyer');
    latios.css({
        "position": 'absolute',
        "background": 'url(assets/media/sprites.png)',
        "background-position": '-520px -448px',
        "width": 56,
        "height": 52,
        "top": this.position['projectKelvien'] + 96,
        "right": latiosLastI
    });
    container.append(latios);
    this.a['latios'] = latios;
}

Story.prototype.stopAnimateLapras = function() {
    this.isAnimateLapras = false;
}

Story.prototype.startAnimateLapras = function() {
    this.isAnimateLapras = true;

    if (!this.laprasInterval) {
        this.animateLapras();
    }
}

Story.prototype.animateLapras = function() {
    var alias = this;

    var step = 1;
    var laprasGoToI;
    var laprasGoToJ;
    var bg;
    if (alias.aDirection['lapras'] == 'left') {
        laprasGoToI = alias.aPosI['lapras'] - step;
         laprasGoToJ = alias.aPosJ['lapras'];

         if (laprasGoToI - 96 <= 0) {
            alias.aDirection['lapras'] = 'up';
            bg = '-303px -468px';
        }
    } else if (alias.aDirection['lapras'] == 'right') {
        laprasGoToI = alias.aPosI['lapras'] + step;
        laprasGoToJ = alias.aPosJ['lapras'];

        if (laprasGoToI + 96 >= alias.position['windowW']) {
            alias.aDirection['lapras'] = 'down';
            bg = '-267px -468px';
        }
    } else if (alias.aDirection['lapras'] == 'up') {
        laprasGoToI = alias.aPosI['lapras'];
        laprasGoToJ = alias.aPosJ['lapras'] - step;

        if (laprasGoToJ - 96 <= alias.position['ocean']) {
            alias.aDirection['lapras'] = 'right';
            bg = '-375px -468px';
        }
    } else if (alias.aDirection['lapras'] == 'down') {
        laprasGoToI = alias.aPosI['lapras'];
        laprasGoToJ = alias.aPosJ['lapras'] + step;

        if (laprasGoToJ + 96 >= alias.position['ocean'] + alias.position['oceanH']) {
            alias.aDirection['lapras'] = 'left';
            bg = '-339px -468px';
        }
    }

    alias.aPosI['lapras'] = laprasGoToI;
    alias.aPosJ['lapras'] = laprasGoToJ;
    alias.a['lapras'].css({
        "background-position": bg,
        "top": laprasGoToJ,
        "left": laprasGoToI
    });

    alias.laprasInterval = requestAnimationFrame(function() {
        alias.animateLapras();
    });
}

Story.prototype.stopAnimateEnding = function () {
    this.isAnimateEnding = false;

    clearTimeout(this.loopEnding);
    this.loopEnding = undefined;
}

Story.prototype.startAnimateEnding = function () {
    this.isAnimateEnding = true;
    this.loopEnding = true;
    if (!this.endingInterval) {
        this.aStart['latias'] = -62;
        this.aStart['latios'] = -112;
        this.aPosI['latias'] = this.aStart['latias'];
        this.aPosI['latios'] = this.aStart['latios'];
        this.animateEnding();
    }
}

Story.prototype.animateEnding = function() {
    var alias = this;
    if (alias.a['latias'] && alias.a['latios']) {
        var latiasGoTo = alias.aPosI['latias'] + 6.1;

        alias.aPosI['latias'] = latiasGoTo;
        alias.a['latias'].css({
            "right": latiasGoTo
        });

        var latiosGoTo = alias.aPosI['latios'] + 6;
        if (latiosGoTo >= alias.position['windowW'] + 100) {
            window.cancelAnimationFrame(alias.endingInterval);
            alias.endingInterval = undefined;

            if (alias.loopEnding) {
                alias.loopEnding = setTimeout(function() {
                    alias.a['latias'].css({
                        "right": alias.aStart['latias']
                    });
                    alias.aPosI['latias'] = alias.aStart['latias'];
                    alias.a['latios'].css({
                        "right": alias.aStart['latios']
                    });
                    alias.aPosI['latios'] = alias.aStart['latios'];
                    alias.animateEnding();
                }, 20000);
            }
        } else {
            alias.aPosI['latios'] = latiosGoTo;
            alias.a['latios'].css({
                "right": latiosGoTo
            });

            alias.endingInterval = requestAnimationFrame(function() {
                alias.animateEnding();
            });
        }
    }
}

Story.prototype.stopAnimation = function() {
    this.animation = false;
}

Story.prototype.animateLaprasCanvas = function() {
    var fps = 17;
    var alias = this;

    var char = this.movingCharacter['lapras'];

    // Draw before and after character tile and update position
    var tile, tileNeighbor;

    switch (char.direction) {
        case 'up':
            if (char.srcPos.j <= char.boundary.ja) {
                char.direction = 'left';
            } else {
                char.srcPos.j -= 1/fps;
            }

            if (char.srcPos.j % 1 == 0) {
                tile = this.tiles[char.srcPos.j][char.srcPos.i];
                tileNeighbor = this.tiles[char.srcPos.j + 1][char.srcPos.i];
            } else {
                tile = this.tiles[Math.floor(char.srcPos.j)][char.srcPos.i];
                tileNeighbor = this.tiles[Math.ceil(char.srcPos.j)][char.srcPos.i];
            }
        break;
        case 'down':
            if (char.srcPos.j >= char.boundary.jz) {
                char.direction = 'right';
            } else {
                char.srcPos.j += 1/fps;
            }
            if (char.srcPos.j % 1 == 0) {
                tile = this.tiles[char.srcPos.j][char.srcPos.i];
                tileNeighbor = this.tiles[char.srcPos.j - 1][char.srcPos.i];
            } else {
                tile = this.tiles[Math.floor(char.srcPos.j)][char.srcPos.i];
                tileNeighbor = this.tiles[Math.ceil(char.srcPos.j)][char.srcPos.i];
            }
        break;
        case 'left':
            if (char.srcPos.i <= char.boundary.ia) {
                char.direction = 'down';
            } else {
                char.srcPos.i -= 1/fps;
            }
            if (char.srcPos.i % 1 == 0) {
                tile = this.tiles[char.srcPos.j][char.srcPos.i];
                tileNeighbor = this.tiles[char.srcPos.j][char.srcPos.i + 1];
            } else {
                tileNeighbor = this.tiles[char.srcPos.j][Math.floor(char.srcPos.i)];
                tile = this.tiles[char.srcPos.j][Math.ceil(char.srcPos.i)];
            }
        break;
        case 'right':
            if (char.srcPos.i >= char.boundary.iz) {
                char.direction = 'up';
            } else {
                char.srcPos.i += 1/fps;
            }
            if (char.srcPos.i % 1 == 0) {
                tile = this.tiles[char.srcPos.j][char.srcPos.i];
                tileNeighbor = this.tiles[char.srcPos.j][char.srcPos.i - 1];
            } else {
                tile = this.tiles[char.srcPos.j][Math.floor(char.srcPos.i)];
                tileNeighbor = this.tiles[char.srcPos.j][Math.ceil(char.srcPos.i)];
            }
        break;
    }
    // Draw src-dest floor
    this.cc.drawImage(tile.img, 0, 0, 32, 32, (tile.i * 32) - this.adjustedI, tile.j * 32, 33, 33);
    this.cc.drawImage(tileNeighbor.img, 0, 0, 32, 32, (tileNeighbor.i * 32) - this.adjustedI, tileNeighbor.j * 32, 33, 33);

    // Draw character after movement
    char.img = char.processCharacter(char);
    this.cc.drawImage(char.img, 0, 0, char.w, char.h, (char.srcPos.i * 32) - this.adjustedI, char.srcPos.j * 32, char.w, char.h);

    requestAnimationFrame(function() {
        alias.animateLapras();
    });

}

Story.prototype.draw = function() {
    // Draw floor tile from top to bottom
    for (var j = 0; j < this.cc.canvas.height / 32; j++) {
        this.tiles[j] = [];
        // 1 is for scrollbar placeholder in mobile devices
        for (var i = 0; i < (this.cc.canvas.width / 32) + 1; i++) {
            var tile = null;

            var adjustedI = i * 32;
            var adjustedJ = j * 32;
            adjustedI = adjustedI - this.adjustedI;

            var hThreshold = 128;

            // ROAD
            var roadThreshold = 1 * 32;
            if (adjustedJ > this.position['start'] && adjustedJ + this.oceanThreshold <= this.position['ocean']
                ||
                adjustedJ - this.oceanThreshold >= this.position['ocean'] + this.position['oceanH'] && adjustedJ <= this.position['ending'] + hThreshold) {
                // Before and after ocean
                if (adjustedI + roadThreshold > this.position['kelvien'] && (adjustedI <= this.position['kelvien'])
                    ||
                    adjustedI >= this.position['kelvien'] && (adjustedI - roadThreshold < this.position['kelvien'])) {
                    if (adjustedJ - roadThreshold <= this.position['kelvienT'] && adjustedJ > this.position['kelvienT']) {
                        tile = this.tile['grassMildTM']; // TM
                    } else if (adjustedJ + roadThreshold > this.position['ending'] + hThreshold && adjustedJ < this.position['ending'] + hThreshold) {
                        tile = this.tile['grassMildBM']; // BM
                    } else {
                        tile = this.tile['grassMildMM']; // MM
                    }
                } else if (adjustedI - roadThreshold <= this.position['kelvien'] && adjustedI > this.position['kelvien']) {
                    if (adjustedJ - roadThreshold <= this.position['kelvienT'] && adjustedJ > this.position['kelvienT']) {
                        tile = this.tile['grassMildTR']; // TR
                    } else if (adjustedJ + roadThreshold > this.position['ending'] + hThreshold && adjustedJ < this.position['ending'] + hThreshold) {
                        tile = this.tile['grassMildBR']; // BR
                    } else {
                        tile = this.tile['grassMildMR']; // MR
                    }
                } else if (adjustedI + roadThreshold >= this.position['kelvien'] && adjustedI < this.position['kelvien']) {
                    if (adjustedJ - roadThreshold <= this.position['kelvienT'] && adjustedJ > this.position['kelvienT']) {
                        tile = this.tile['grassMildTL']; // TL
                    } else if (adjustedJ + roadThreshold > this.position['ending'] + hThreshold && adjustedJ < this.position['ending'] + hThreshold) {
                        tile = this.tile['grassMildBL']; // BL
                    } else {
                        tile = this.tile['grassMildML']; // ML
                    }
                } else {
                    tile = this.tile['grass1'];
                }
            } else if (adjustedJ - this.oceanThreshold >= this.position['ocean'] && adjustedJ + this.oceanThreshold <= this.position['ocean'] + this.position['oceanH']) {
                // Ocean
                if (adjustedJ - (this.oceanThreshold + 32) < this.position['ocean'] && adjustedJ - this.oceanThreshold >= this.position['ocean']) {
                    if (adjustedI <= 0) {
                        tile = this.tile['oceanTL'];
                    } else if (adjustedI + 32 > this.position['windowW']) {
                        tile = this.tile['oceanTR'];
                    } else {
                        tile = this.tile['oceanTM'];
                    }
                } else if (adjustedJ + (this.oceanThreshold + 32) >= this.position['ocean'] + this.position['oceanH']) {
                    if (adjustedI <= 0) {
                        tile = this.tile['oceanBL'];
                    } else if (adjustedI + 32 > this.position['windowW']) {
                        tile = this.tile['oceanBR'];
                    } else {
                        tile = this.tile['oceanBM'];
                    }
                } else {
                    if (adjustedI <= 0) {
                        tile = this.tile['oceanML'];
                    } else if (adjustedI + 32 > this.position['windowW']) {
                        tile = this.tile['oceanMR'];
                    } else {
                        tile = this.tile['oceanMM'];
                    }
                }
            } else if (false) {
                // Ending
                tile = this.tile['grass1'];
            } else {
                tile = this.tile['grass1'];
            }

            // Register top, left, right, and bottom's tile on each other
            // this.tiles[j][i] = this.registerTile(tile, i, j);

            // Image, image Pos X, image Pos Y, image Width, image Height, Canvas x, Canvas Y, draw Width, draw Height
            // draw width and height are higher than the actual because Safari does not process floating point position (i,j)
            this.cc.drawImage(tile.img, 0, 0, 32, 32, adjustedI, adjustedJ, 33, 33);
        }
    }
    // Items

    // Tree
    var tree = this.item['tree'];
    var treeC = 5;
    var windowR = getIOrJ(this.position['windowW']);
    var windowB = getIOrJ(this.position['canvasH']);
    var oceanT = getIOrJ(this.position['ocean']);
    var oceanB = oceanT + getIOrJ(this.position['oceanH']);
    var baseJ = 0;
    var baseI = 0;

    for (var j = 0; j < this.cc.canvas.height / 32; j++) {
        // 1 is for scrollbar placeholder in mobile devices
        for (var i = 0; i < (this.cc.canvas.width / 32) + 1; i++) {
            if (((this.position['windowW'] > 768 && baseI < treeC) || (this.position['windowW'] > 992 && baseI + treeC > windowR) || baseJ < treeC || baseJ + treeC > windowB) && (baseJ < oceanT || baseJ > oceanB)) {
                var diff = (i % 2 == 0) ? 32 : 0;
                this.cc.drawImage(tree.img, 0, 0, tree.w, tree.h, (i * 64) - this.position['adjustMostLeft'], (j * 64) - diff, tree.w, tree.h);
            }
            baseI += 2;
        }
        baseJ += 2;
        baseI = 0;
    }

    var home = this.item['home'];
    var homeI = getIOrJ(this.position['kelvien'] + 64);
    var homeJ = getIOrJ(this.position['kelvienT'] - home.h);
    this.cc.drawImage(home.img, 0, 0, home.w, home.h, homeI * 32, homeJ * 32, home.w, home.h);

    // Family
    var dad = this.character['dad'];
    var mom = this.character['mom'];
    var tiff = this.character['tiff'];
    var nic = this.character['nic'];
    var afterHomeJ = getIOrJ(this.position['kelvienT']);
    this.cc.drawImage(dad.img, 0, 0, dad.w, dad.h, (homeI + 1) * 32, (afterHomeJ * 32) - 8, dad.w, dad.h);
    this.cc.drawImage(mom.img, 0, 0, mom.w, mom.h, (homeI + 2) * 32, (afterHomeJ * 32) - 8, mom.w, mom.h);
    this.cc.drawImage(tiff.img, 0, 0, tiff.w, tiff.h, (homeI + 3) * 32, (afterHomeJ * 32) - 8, tiff.w, tiff.h);
    this.cc.drawImage(nic.img, 0, 0, nic.w, nic.h, (homeI + 4) * 32, (afterHomeJ * 32) - 8, nic.w, nic.h);

}

function getIOrJ(t) {
    var i = -1;
    var count = 0;
    while(count < t) {
        i++;
        count += 32;
    }
    return i;
}

Story.prototype.registerTile = function(tile, i, j) {
    var tempTile = $.extend(true, {}, tile);
    tempTile.i = i;
    tempTile.j = j;

    if (j != 0) {
        this.tiles[j-1][i].neighbors.bottom = tempTile;
        tempTile.neighbors.top = this.tiles[j-1][i];
    }
    if (i != 0) {
        this.tiles[j][i-1].neighbors.right = tempTile;
        tempTile.neighbors.left = this.tiles[j][i-1];
    }

    return tempTile;
}


function isReturnsSubdomain() {
    var subdomain = window.location.host.split('.')[0];
    return returnsSubdomain === subdomain;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$('#preload').show();
$('#main').show();

$(window).on('load', function(){
    /*Reference: http://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device-in-jquery*/
    var isMobile = false;
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
        isMobile = true;
    }
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    var useFixedMenu = $('#window').width() <= 768;

    var midWindow = $(window).height() / 2;
    var kelvien = new Kelvien();
    var cC = $('#canvas-container');
    var c = $('#canvas');
    var cc = c[0].getContext('2d');

    var controller;
    var scenes = [];
    var triggeredOnSubdomain = false;

    new Promise(function(resolve) {
        setTimeout(function() {
            $('#canvas-container').css({
                "visibility": 'visible'
            });
            $('#preload').css({
                "opacity": 0
            }).remove();
            $('#main').css({
                "opacity": 1
            });
            resolve();
        }, loadingTime);
    }).then(function() {
        main();
        if (isValidSubdomain()) {
            $('html, body').scrollTop($('#canvas-container').height());
        }
    });

    // Orientation object
    var mql = window.matchMedia("(orientation: portrait)");

    // Add a media query change listener
    mql.addListener(function(m) {
        // main();
    });

    function registerMenu() {
        var duration = 1000;
        $('#menu-container li').unbind('click').bind('click', function() {

            var extraAfterTrigger = 2;
            var to = 0;
            switch($(this).data('menu')) {
                case 'about':
                    to = 0;
                    break;
                case 'story':
                    to = $(".event:first").offset().top - ($(window).height() / 2) + extraAfterTrigger;
                    break;
                case 'contact':
                    to = $('body').height();
                    break;
                case 'returns':
                    break;
                default:
                    to = 0;
                    break;
            }

            if ($(this).data('menu') !== 'returns') {
                $('html, body').animate({
                    scrollTop: to
                }, duration);
            }
        });
    }

    function isValidSubdomain() {
        var subdomain = window.location.host.split('.')[0];
        return contactSubdomain.concat(returnsSubdomain).indexOf(subdomain) >= 0;
    }

    function isContactSubdomain() {
        var subdomain = window.location.host.split('.')[0];
        return contactSubdomain.indexOf(subdomain) >= 0;
    }

    const currentMenu = $("#menu-container ul li");
    const returnsMenu =  $("<li data-menu='returns' class='active'>Returns</li>");

    function getInlineInput(text, inputName) {
        return $(`<div class='input-wrapper inline'><div class='input-label inline-input'><b>${text}</b></div><input class='kform-input ${inputName} inline-input' tabindex='1'/></div></div>`);
    }

    function getTextareaInput(text, inputName) {
        return $(`<div class="input-wrapper">
        <div class="input-label"><b>${text}</b></div>
        <textarea class="kform-input ${inputName}" tabindex="2"></textarea>
    </div>`);
    }

    function setupReturnsSubdomain() {
        $("#menu-container ul").empty();
        $("#menu-container ul").append(returnsMenu);
        $("body").css("overflow", "hidden");
        $("#kform").empty();
        $("#kform").append(getInlineInput('Your name', 'name'));
        $("#kform").append(getInlineInput("Your email", 'email'));
        $("#kform").append(getTextareaInput('What did I lose?', 'lost_item'));
        showDialog(kelvien, 'sad');
    }

    if (isReturnsSubdomain()) {
        setupReturnsSubdomain();
    }

    function chooseMenu(menu) {
        $('#menu-container li').removeClass('active');
        $("#menu-container li[data-menu='" + menu + "']").addClass('active');
    }

    $('#contact-option li').on('click', function() {
        $('#contact-option li').removeClass('active');
        $(this).addClass('active');
    })

    function adjustMain() {
        var aboutHeight = $('#about').outerHeight(true) + $('#scroll-helper').outerHeight(true);
        var totalHeight = (window.innerWidth < 768) ? $('#fixed-menu').outerHeight(true) + aboutHeight : aboutHeight;
        var marginTop = (window.innerHeight < totalHeight) ? 0 : Math.max(0, (window.innerHeight - totalHeight) / 2);
        if ((window.innerWidth > 768)) {
            $('#main').css('padding-top', marginTop);
        }
    }

    function addFixedMenuMask() {
        /* Bootstrap MD down */
        if (window.innerWidth < 768) {
            if (!$('#menu-mask').length) {
                var mask = $('<div></div>').attr('id', 'menu-mask').height($('#fixed-menu').outerHeight(true));
                $('#about-container').before(mask);
            }
        } else {
            if ($('#menu-mask').length) {
                $('#menu-mask').remove();
            }
        }
    }

    function addCanvasMask() {
        if (!$('#canvasMask').length) {
            var mainHeight = $('#main').outerHeight(true);
            var mainOffsetWithWindow = Math.abs(window.innerHeight - mainHeight);
            var height = (mainHeight > window.innerHeight) ? mainHeight - mainOffsetWithWindow : mainHeight + mainOffsetWithWindow

            var mask = $('<div></div>').attr('id', 'canvasMask').height(height);
            $('#main').after(mask);
        }
    }

    function main() {
        adjustMain();
        addFixedMenuMask();

        if (controller) {
            controller = controller.destroy(1);
            controller = undefined;
        }
        controller = new ScrollMagic.Controller({
            addIndicators: debug
        });
        arrangeTimeline();
        arrangeBg();
    }

    function changeCompanionBg(companion, moving) {
        var bg = '';
        var behindChar = 38;
        var top = -36;

        if (moving) {
            if (companion.direction == 'up') {
                bg = (companion.evenOdd) ? '-133px -460px' : '-221px -460px';
                top = behindChar;
            } else {
                bg = (companion.evenOdd) ? '-5px -460px' : '-91px -460px';
                top = top;
            }
        } else {
            if (companion.direction == 'up') {
                bg = '-177px -460px';
                top = behindChar;
            } else {
                bg = '-47px -460px';
                top = top;
            }
        }
        companion.element.css({
            "top": top,
            "background-position": bg
        });
    }

    function changeBg(character) {
        var bg = "";

        if (character.isMoving) {
            if (character.movingCount > 0) {
                character.movingCount--;
            } else {
                character.movingCount = character.movingThreshold;
                bg += stateBg(character, true);

                adjustKelvienX();
                character.element.css({
                    "background-position": bg
                });
                if (character.companion) {
                    changeCompanionBg(character.companion, true);
                }
            }
        } else {
            bg += stateBg(character, false);

            adjustKelvienX();
            character.element.css({
                "background-position": bg
            });
            if (character.companion) {
                changeCompanionBg(character.companion, false);
            }
        }
    }

    function stateBg(character, moving) {
        if (moving) {
            switch(character.state) {
                case 'fly':
                    character.element.css({
                        "width": 48,
                        "height": 80
                    });
                    switch(character.direction) {
                        case 'up':
                            return (character.evenOdd) ? '-626px -150px' : '-673px -150px';
                        case 'down':
                            return (character.evenOdd) ? '-578px -150px' : '-531px -150px';
                            break;
                    }
                    break;
                case 'done':
                    character.element.css({
                        "width": 32,
                        "height": 40
                    });
                    return '-384px -150px';
                default:
                    character.element.css({
                        "width": 32,
                        "height": 40
                    });
                    switch(character.direction) {
                        case 'up':
                            if (character.evenOdd) {
                                return '-192px -150px';
                            } else {
                                return '-224px -150px';
                            }
                            break;
                        case 'down':
                            if (character.evenOdd) {
                                return '-129px -150px';
                            } else {
                                return '-159px -150px';
                            }
                    }
            }
        } else {
            switch(character.state) {
                case 'fly':
                    character.element.css({
                        "width": 48,
                        "height": 80
                    });
                    switch(character.direction) {
                        case 'up':
                            return '-626px -150px';
                        case 'down':
                            return '-578px -150px';
                    }
                case 'done':
                    character.element.css({
                        "width": 32,
                        "height": 40
                    });
                    return '-384px -150px';
                default:
                    character.element.css({
                        "width": 32,
                        "height": 40
                    });
                    switch(character.direction) {
                        case 'up':
                            return '-32px -150px';
                        case 'down':
                            return '0 -150px';
                    }
            }
        }
    }

    function showCompanion(character) {
        var companion = character.element.find('#companion');
        character.companion = new Companion(companion);

        companion.css({
            "opacity": 1
        });
    }

    function removeCompanion(character) {
        if (character.companion) {
            character.companion.element.css({
                "opacity": 0
            });
        }
    }

    function showDialog(character, type) {
        var dialogBox = character.element.find('.dialog-box');

        var bg;
        var anim;
        switch(type) {
            case 'love':
                bg = '0 -424px';
                anim = 'love';
                break;
            case 'smile':
                bg = '-64px -424px';
                anim = 'smile';
                break;
            case 'sad':
                bg = '-64px -390px';
                anim = 'sad';
                break;
        }
        anim += ' 1s steps(2) infinite';
        dialogBox.css({
            "background-position": bg,
            "animation": anim,
            "opacity" : 1
        });
    }

    function removeDialog(character) {
        var dialogBox = character.element.find('.dialog-box');
        dialogBox.css({
            opacity: 0
        })
    }

    function arrangeKelvien() {
        var scene = new ScrollMagic.Scene({
            triggerElement: '#timeline-gap',
            duration: $('#timeline').height() + ($(".event:last").outerHeight(), $("#kform-wrapper").outerHeight() + $("#kelvien").outerHeight()),
            reverse: true,
        })
        .setPin('#kelvien')
        .on('start enter', function() {
            addScroll();
            if (controller.info('scrollDirection') == 'FORWARD') {
                cC.css({
                    "opacity": 1
                });
                $('#scroll-helper').css({
                    "opacity": 0
                });
                $('#about').css({
                    "opacity": 0
                });
            }
            chooseMenu('about');
        })
        .on('leave', function() {
            removeScroll();
            if (controller.info('scrollDirection') == 'REVERSE') {
                kelvien.direction = 'down';
                changeBg(kelvien, true);
                cC.css({
                    "opacity": 0
                });
            }
            $('#scroll-helper').css({
                "opacity": 1
            });
            $('#about').css({
                "opacity": 1
            });
        })
        .addTo(controller);
        scenes.push(scene);
    }

    function adjustKelvienX() {
        kelvien.element.css({
            "margin-left": -((kelvien.element.width() / 2) - kelvien.oriMarginLeft)
        });
    }

    var contactScene = null;
    function arrangeTimeline() {
        scenes = [];
        var evenOdd;
        var counter = 0;
        $.each($('.event'), function(i, e) {
            $(e).removeClass('event-right').removeClass('event-left').css({
                "left": '',
                "right": ''
            });
            var mid = $('#timeline').width() / 2;
            /* Bootstrap SM down */
            if (window.innerWidth <= 576) {
                if ($(e).data('event') === 'contact'){
                    $(e).css({
	                    "left": -52,
                    });
                } else {
                    $(e).addClass('event-right').removeClass('event-left');
                    var offset = $('#timeline').width() - $(e).outerWidth();
                    $(e).css({
	                    "left": -offset,
                    });
                }
            } else {
                var extraSpace = 0;
                if ($(e).data('event') === 'contact') {
                    extraSpace = 160;
                }
                if (evenOdd) {
                    $(e).addClass('event-left');
                    var sideOffset = mid - $(e).outerWidth();
                    $(e).css({
                        "right": -sideOffset - extraSpace
                    });
                } else {
                    $(e).addClass('event-right');
                    var sideOffset = mid - $(e).outerWidth();
                    $(e).css({
                        "left": -sideOffset - extraSpace
                    });
                }
                evenOdd = !evenOdd;
            }

            var element = '.event:eq(' + i + ')';
            var scene = new ScrollMagic.Scene({
                triggerElement: element,
                triggerOffset: midWindow,
                duration: $(e).outerHeight(true),
                reverse: true,
            }).on('enter', function() {
                $(e).css('opacity', 1);
            })
            .on('leave', function() {
                if (controller.info('scrollDirection') === 'REVERSE') {
                    $(e).css('opacity', 0);
                }
            });

            if ($(e).data('event') === 'contact') {
                contactScene = scene;
            }
            scene.on('enter', function() {
                if (i === 0) {
                    chooseMenu('story');
                }
                switch($(e).data('event')) {
                    case 'normal':
                        kelvien.state = 'normal';
                        break;
                    case 'fly':
                        kelvien.state = 'fly';
                        removeCompanion(kelvien);
                        break;
                    case 'companion':
                        kelvien.state = 'companion';
                        showCompanion(kelvien);
                        break;
                    case 'love':
                        showDialog(kelvien, 'love');
                        break;
                    case 'sweat':
                        removeCompanion(kelvien);
                        break;
                    case 'projectKelvien':
                        story.startAnimateEnding();
                        break;
                    case 'vscode-hue':
                        kelvien.state = 'normal';
                        showCompanion(kelvien);
                        break;
                    case 'contact':
                        if (isReturnsSubdomain()) {
                            chooseMenu('returns');
                        } else {
                            chooseMenu('contact');
                        }
                        removeCompanion(kelvien);
                        kelvien.state = 'done';
                        changeBg(kelvien, false);
                        $(e).css('opacity', 1);
                        $("#kchats, #kguest").css({
                            "display": "block"
                        });
                        if (controller.info('scrollDirection') == 'FORWARD' && (!isValidSubdomain() || triggeredOnSubdomain)) {
                            new Promise(function(resolve) {
                              $("#transition-window").css({
                                    "opacity": 1,
                                    "visibility": "visible",
                                    "transition": "opacity 1s"
                                });
                                resolve();
                            }).then(function() {
                                return new Promise(function(resolve) {
                                    setTimeout(function() {
                                        cC.css({
                                            "opacity": 0,
                                            "transition": "opacity 0s"
                                        });
                                        $(".event").css({
                                            "opacity": 0,
                                            "transition": "opacity 0s"
                                        });
                                        $("#contact-building").css({
                                            "visibility": "hidden"
                                        });
                                        $("#transition-window").css({
                                            "opacity": 0,
                                            "transition": "opacity 1s"
                                        });
                                        startChat();
                                        resolve();
                                    }, 1000);
                                });
                            }).then(function() {
                                setTimeout(function() {
                                    // Show message box
                                    $("#transition-window").css({
                                        "visibility": "hidden"
                                    });
                                }, 1000);
                            });
                        } else {
                            triggeredOnSubdomain = true;
                            cC.css({
                                "opacity": 0,
                                "visibility": "hidden",
                                "transition": "opacity 0s"
                            });
                            $(".event").css({
                                "opacity": 0,
                                "transition": "opacity 0s"
                            });
                            startChat();
                        }
                        break;
                    default:
                        kelvien.state = 'normal';
                        break;
                }
            })
            scene.on('leave', function() {
                switch($(e).data('event')) {
                    case 'projectKelvien':
                        story.stopAnimateEnding();
                        break;
                    case 'contact':
                        if (controller.info('scrollDirection') == 'REVERSE') {
                            chooseMenu('story');
                            $(e).css('opacity', 0);
                            cC.css({
                                "opacity": 1,
                                "visibility": "visible",
                                "transition": "opacity 0.5s"
                            });
                            $("#contact-building").css({
                                "visibility": "visible"
                            });
                            $('.event').css({
                                "opacity": 1,
                                "transition": "opacity 0.5s"
                            });
                            $('.event.contact').css({
                                "z-index": 2,
                                "transition": "opacity 0.2s"
                            });
                            $("#kchats, #kguest").css({
                                "opacity": 0,
                                "visibility": "visible",
                                "display": "none"
                            });
                        }
                        break;
                }
                if (!isReturnsSubdomain()) {
                    removeDialog(kelvien);
                }
            });
            scene.addTo(controller);
            scenes.push(scene);
        });

        arrangeKelvien();
        registerMenu();
    }

    var story;
    function arrangeBg() {
        // Can't just be firefox, enabling for all, must scroll to most bottom for contact though
        var h = 50;
        cc.canvas.width = $(window).width();
        cc.canvas.height = h + $('#main').outerHeight(true) + ($(window).height() / 2) - $('.event:last').outerHeight(true);
        $('#canvas-container').height(cc.canvas.height);
        $('#transition-window').height(cc.canvas.height);

        if (story) {
            story.destroy();
        }
        story = new Story(cc, true);
    }

    function addScroll() {
        var lastScrollTop = 0;
        $(window).unbind('scroll').bind('scroll', function(event){
            var st = $(this).scrollTop();
            if (st > lastScrollTop){
                kelvien.direction = 'down';
                if (kelvien.companion) {
                    kelvien.companion.direction = 'down';
                }
            } else {
                kelvien.direction = 'up';
                if (kelvien.companion) {
                    kelvien.companion.direction = 'up';
                }
            }
            kelvien.evenOdd = !kelvien.evenOdd;
            kelvien.isMoving = true;
            if (kelvien.companion) {
                kelvien.companion.evenOdd = !kelvien.companion.evenOdd;
                kelvien.companion.isMoving = true;
            }

            changeBg(kelvien, true);

            lastScrollTop = st;

            clearTimeout($.data(this, "scrollCheck"));
            $.data(this, "scrollCheck", setTimeout(function() {
                kelvien.isMoving = false;
                changeBg(kelvien);
                if (kelvien.companion) {
                    kelvien.companion.isMoving = false;
                }
            }, 100));
        });
    }

    function removeScroll() {
        $(window).unbind('scroll');
    }

    // focus in n out
    var focusingOut = false;
    var focusingInEl = null;
    var pendingFocusingIn = false;
    $('#kform .kform-input').focusin(function() {
        focusingInEl = $(':focus');
        if (!focusingOut) {
            scenes.forEach(function(scene) {
                scene.enabled(false);
            });
            pendingFocusingIn = false;
        } else {
            pendingFocusingIn = true;
        }
    });
    $('#kform .kform-input').focusout(function() {
        focusingOut = true;
        $('html,body').animate({
            scrollTop: $('#main').height()
        }, 100, function(){
            scenes.forEach(function(scene) {
                scene.enabled(true);
            });
            if (pendingFocusingIn) {
                focusingInEl.focus();
            }
            focusingOut = false;
        });
    });

    $("#kform-submit").on("click", function() {
        sendMessage();
    });

    var initialChat = false;
    function prepareChat() {
        var width = $(".event:first .event-content").width();
        $("#kchats").width(width);
        $("#kguest").width(width + $("#kelvien").width());
    }
    prepareChat();

    var formShown = false;
    function startChat() {
        $("#kchats").css({
            "opacity": 1
        });
        if (formShown) {
            $("#kguest").css({
                "visibility": "visible",
                "opacity": 1
            });
        }
        if (!initialChat) {
            initialChat = true;
            var pre_messages = [];
            if (isReturnsSubdomain()) {
                pre_messages = [
                    { time: 500, message: "Oh no, I lost it again, didn't I" },
                    { time: 1500, message: "Thank you for reaching out for my lost item" },
                    { time: 1500, message: "Please leave your name and email so that I can personally thank you and plan to get reacquainted to my lost item." }
                ];
            } else {
                pre_messages = [
                    { time: 500, message: "Hey, I'm Kelvien!" },
                    { time: 1500, message: "Thank you for visiting my website" },
                    { time: 1500, message: "Please feel free to send me any messages/questions using the form below" }
                ];
            }
            pre_messages.reduce(function(acc, el) {
                return acc.then(function() {
                    return new Promise(function(resolve) {
                        setTimeout(function() {
                            var chat = $(
                                "<div class='kchat-wrapper'>" +
                                    "<div class='kchat'>" + el.message + "</div>" +
                                "</div>");
                            $("#kchats").append(chat);
                            setTimeout(function() {
                                chat.css({
                                    "opacity": 1,
                                    "max-height": "1000px"
                                });
                            }, 100)
                            resolve();
                        }, el.time);
                    });
                });
            }, Promise.resolve()).then(function() {
                $("#kform-wrapper").css({
                    "visibility": "visible"
                });
                setTimeout(function() {
                    $("#kform-wrapper").css({
                        "opacity": 1
                    });
                    formShown = true;
                }, 1000);
            });
        }
    }

    var success_messages = isReturnsSubdomain() ? [
        { time: 1500, message: "Thank you again for reaching out for my lost item!" },
        { time: 2000, message: "I will get back to you as soon as possible to arrange something!" }
    ] : [
        { time: 1500, message: "Thank you for your message!" },
        { time: 2000, message: "I will get back to you as soon as possible! In the meantime, please scroll up to check out my bio/portfolio" }
    ];
    var error_message = [
        "Oops, looks like there's an error while sending your message",
        "Please send me an email instead at mas@kelvien.com"
    ];
    
    /*
    * Email
    */
    emailjs.init("user_Ldcm6Qmm3YcI879tKUlYo");
    function sendMessage() {
        // You don't have to fill out what I missed, for now
        var isValid = isReturnsSubdomain() ? $("#kform .email").val().length > 0 : $("#kform .message").val().trim().length > 0;
        if (isValid) {
            $("#kform-submit").html("<b>Sending ...</b>");
            $("#kform-submit").unbind("click");
            const emailJSFormID = isReturnsSubdomain() ? 'returns_form' : 'contact_form';
            var body = {};
            if (isReturnsSubdomain()) {
                body = {
                    email: $(".kform-input.email").val(),
                    name: $(".kform-input.name").val(),
                    lost_item: $(".kform-input.lost_item").val()
                }
            } else {
                body = {
                    email: $(".kform-input.email").val(),
                    message: $(".kform-input.message").val()
                };
            }
            emailjs.send("mailgun", emailJSFormID, body).then(function(response) {
                // Success
                var maxDisplayedLength = 255;
                var displayedMessage = '';
                if (isReturnsSubdomain()) {
                    displayedMessage = "Found your lost item";
                } else {
                    const message = $(".kform-input.message").val();
                    displayedMessage = message.trim();
                    message.substring(0, maxDisplayedLength);
                    if (message.length > maxDisplayedLength) {
                        displayedMessage += "...";
                    }
                }
                $(".input-wrapper").remove();
                $("#kform-submit").remove();
                $("#kform").addClass("message");
                $("#kform").text(displayedMessage);
                var width = $("#kform").width();
                var placeholder = $("#kelvien").width() + (5 * 2);
                $("#kform").css({
                    "display": "inline-block",
                    "left": placeholder,
                });
                var date = new Date();
                var time = date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0');
                $("#kform-wrapper").append("<div id='kguest-message-info'>Sent - " + time + "</div>");
    
                if (isReturnsSubdomain()) {
                    showDialog(kelvien, 'smile');
                }
    
                success_messages.reduce(function(acc, el) {
                    return acc.then(function() {
                        return new Promise(function(resolve) {
                            setTimeout(function() {
                                var chat = $(
                                    "<div class='kchat-wrapper'>" +
                                        "<div class='kchat'>" + el.message + "</div>" +
                                    "</div>");
                                $("#kchats").append(chat);
                                setTimeout(function() {
                                    chat.css({
                                        "opacity": 1,
                                        "max-height": "1000px"
                                    });
                                }, 100)
                                resolve();
                            }, el.time);
                        });
                    });
                }, Promise.resolve());
            }, function(error) {
                // Error
                $("#kform-submit").text("Sorry, I can't process your message now, please message me at mas@kelvien.com while I fix this issue.");
            });
        }
    }
});
