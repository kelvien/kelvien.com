////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Kelvien = function() {
	this.element = $('#kelvien');
	this.me = this.element[0];
	this.oriMarginLeft = Math.abs(parseInt(this.element.css('margin-left')));
	this.initialPositionX = parseInt(this.element.css('left'));
	this.initialPositionY = parseInt(this.element.css('top'));

	this.movingThreshold = 6; // Multiple of 2 ONLY
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

var FloorLayer = [];

var Tile = function(img, name, x, y, deg) {
	this.src = img;
	this.name = name;
	// This x and y is inclusive (0) when we are looking at the sprite image
	this.x = x;
	this.y = y;

	this.posX;
	this.posY;

	this.deg = deg;

	this.img = this.processImage(this);
}
Tile.prototype.processImage = function(el) {
	var offscreenCanvas = document.createElement('canvas');
	var offscreenCtx = offscreenCanvas.getContext('2d');
	offscreenCanvas.width = 32;
	offscreenCanvas.height = 32;

	if (el.deg != 0) {
		offscreenCtx.translate(32 / 2, 32 / 2);
		offscreenCtx.rotate(this.deg * Math.PI/180);

		offscreenCtx.drawImage(this.src, this.x, this.y, 32, 32, -(32 / 2), -(32 / 2), 32, 32);
		return offscreenCanvas;
	} else {
		offscreenCtx.drawImage(this.src, this.x, this.y, 32, 32, 0, 0, 32, 32);
		return offscreenCanvas;
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
* Force HTTPS
*/
if(window.location.protocol != 'https:'){
    window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
}

$(window).on('load', function() {
	/*Reference: http://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device-in-jquery*/
	var isMobile = false;
	if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
	|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
		isMobile = true;
	}
	var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

	var midWindow = $(window).height() / 2;
	var kelvien = new Kelvien();

	var c = $('#canvas');
	var cc = c[0].getContext('2d');

	function registerMenu() {
		$('#menu-container li').on('click', function() {
			// $('#menu-container li').removeClass('active');
			// $(this).addClass('active');

			var to = 0;
			switch($(this).data('menu')) {
				case 'about':
					to = 0;
					break;
				case 'story':
					to = $(".event:first").offset().top - ($(window).height() / 2);
					break;
				case 'skills':
					to = $(".event[data-event='skills']").offset().top - ($(window).height() / 2);
					break;
				case 'contact':
					to = $(".event[data-event='contact']").offset().top - ($(window).height() / 2);
					break;
				default:
					to = 0;
					break;
			}
			// Some browsers have small offset
			to += 5;
			$('html, body').animate({
		        scrollTop: to
		    }, 1000);
		});
	}

	function chooseMenu(menu) {
		$('#menu-container li').removeClass('active');
		$("#menu-container li[data-menu='" + menu + "']").addClass('active');
	}

	$('#contact-option li').on('click', function() {
		$('#contact-option li').removeClass('active');
		$(this).addClass('active');
	})

	// var eventsOnSkillTopics = (isMobile) ? 'click' : 'mouseenter mouseleave click';
	// var eventsOnSkillTopics = 'click';
	// $('.skill-topic').on(eventsOnSkillTopics, function() {
	// 	$('.skill-topic').not(this).removeClass('active');
	// 	$('.skill-topic').find('.skill-pb').removeClass('skill-pb-selected').addClass('skill-pb-unselected');
	// 	$('.skill-topic').find('.skill-content').css('max-height', 0);
	// 	if ($(this).hasClass('active')) {
	// 		$(this).removeClass('active');
	// 		$(this).find('.skill-pb').removeClass('skill-pb-selected').addClass('skill-pb-unselected');
	// 		$(this).find('.skill-content').css('max-height', 0);
	// 	} else {
	// 		$(this).addClass('active');
	// 		$(this).find('.skill-pb').removeClass('skill-pb-unselected').addClass('skill-pb-selected');
	// 		$(this).find('.skill-content').css('max-height', 350);
	// 	}
	// });

	function untoggleSkills() {
		$('.skill-topic').removeClass('active');
		$('.skill-topic').find('.skill-pb').removeClass('skill-pb-selected').addClass('skill-pb-unselected');
		$('.skill-topic').find('.skill-content').css('max-height', 0);
	}

	function adjustMain() {
		var marginTop = (window.innerWidth < 768) ? 0 : Math.max(0, ((window.innerHeight - $("#about").outerHeight(true)) / 2) - $('#scroll-helper').outerHeight(true));
		$('#main').css('margin-top', marginTop);
	}

	function addFixedMenuMask() {
		/* Bootstrap MD down */
		if (window.innerWidth < 768) {
			if (!$('#menu-mask').length) {
				var mask = $('<div></div>').attr('id', 'menu-mask').height($('#fixed-menu').height());
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

	var controller = new ScrollMagic.Controller({addIndicators: true});

	function resetController() {
		controller.destroy(true);
		controller = new ScrollMagic.Controller({addIndicators: true});
	}

	function main() {
		new Promise(function(resolve, reject) {
			adjustMain();
			addFixedMenuMask();
			arrangeTimeline();

			resolve();
		}).then(function() {
			// addContact();
			arrangeBg();
		});
	}
	main();

	function changeCompanionBg(companion, moving) {
		var bg = '';
		var behindChar = 38;
		var top = -36;

		if (moving) {
			if (companion.direction == 'up') {
				bg = (companion.evenOdd) ? '-134px -460px' : '-222px -460px';
				top = behindChar;
			} else {
				bg = (companion.evenOdd) ? '-5px -460px' : '-92px -460px';
				top = top;
			}
		} else {
			if (companion.direction == 'up') {
				bg = '-178px -460px';
				top = behindChar;
			} else {
				bg = '-48px -460px';
				top = top;
			}
		}
		companion.element.css({
			'top': top,
			'background-position': bg
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
					'background-position': bg
				});
				if (character.companion) {
					changeCompanionBg(character.companion, true);
				}
			}
		} else {
			bg += stateBg(character, false);

			adjustKelvienX();
			character.element.css({
				'background-position': bg
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
						'width': 47,
						'height': 80
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
						'width': 32,
						'height': 40
					});
					return '-384px -150px';
				default:
					character.element.css({
						'width': 32,
						'height': 40
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
								return '-128px -150px';
							} else {
								return '-160px -150px';
							}
					}
			}
		} else {
			switch(character.state) {
				case 'fly':
					character.element.css({
						'width': 47,
						'height': 80
					});
					switch(character.direction) {
						case 'up':
							return '-626px -150px';
						case 'down':
							return '-578px -150px';
					}
				case 'done':
					character.element.css({
						'width': 32,
						'height': 40
					});
					return '-384px -150px';
				default:
					character.element.css({
						'width': 32,
						'height': 40
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
			'opacity': 1
		});
	}

	function removeCompanion(character) {
		if (character.companion) {
			character.companion.element.css({
				'opacity': 0
			});
		}
	}

	function showDialog(character, type) {
		var dialogBox = character.element.find('.dialog-box');

		var bg;
		switch(type) {
			case 'arm':
				bg = '0 -424px';
				break;
			case 'love':
				bg = '-31px -424px';
				break;
			case 'sweat':
				bg = '-62px -424px';
				break;
		}
		dialogBox.css({
			'background-position': bg,
			'opacity' : 1
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
			triggerElement: '#timeline',
			duration: $('#timeline').height() - $('.event:last').height(), 
			reverse: true
	    })
	    .setPin('#kelvien')
	    .on('enter', function() {
	    	// untoggleSkills();
	    	addScroll();
	    	c.css({
	    		'opacity': 1
	    	});
	    })
	    .on('leave', function() {
	    	removeScroll();
	    	if (controller.info('scrollDirection') == 'REVERSE') {
	    		chooseMenu('about');
	    		kelvien.direction = 'down';
	    		changeBg(kelvien, true);
	    		c.css({
		    		'opacity': 0
		    	});
	    	}
	    })
	    .addTo(controller);
	}

	function adjustKelvienX() {
		kelvien.element.css({
			'margin-left': -((kelvien.element.width() / 2) - kelvien.oriMarginLeft)
		});
	}

	function arrangeTimeline() {
		var evenOdd;

		$.each($('.event'), function(i, e) {
			var mid = $('#timeline').width() / 2;
			/* Bootstrap SM down */
			if (window.innerWidth <= 576) {
				$(e).addClass('event-right').removeClass('event-left');
				var offset = $('#timeline').width() - $(e).outerWidth();
				$(e).css({
					'left': -offset
				});
			} else {
				if (evenOdd) {
					$(e).addClass('event-left');
					var sideOffset = mid - $(e).outerWidth();
					$(e).css({
						'right': -sideOffset
					});
				} else {
					$(e).addClass('event-right');
					var sideOffset = mid - $(e).outerWidth();
					$(e).css({
						'left': -sideOffset
					});
				}
				evenOdd = !evenOdd;
			}

			var element = '.event:eq(' + i + ')';
			var scene = new ScrollMagic.Scene({
				triggerElement: element,
				triggerOffset: midWindow,
				duration: $(e).outerHeight(true),
				reverse: true
			})
			.on('enter', function () {
				$(e).css('opacity', 1);
			})
			.on('leave', function() {
				if (controller.info('scrollDirection') == 'REVERSE') {
					$(e).css('opacity', 0);
				}
			});

			scene.on('enter', function() {
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
						showDialog(kelvien, 'sweat');
						removeCompanion(kelvien);
						break;
					case 'projectKelvien':
						kelvien.state = 'normal';
						break;
					case 'skills':
						kelvien.state = 'normal';
						chooseMenu('skills');

						showCompanion(kelvien);
						break;
					case 'contact':
						chooseMenu('contact');
					case 'done':
						showDialog(kelvien, 'arm');
						removeCompanion(kelvien);
						kelvien.state = 'done';
						changeBg(kelvien, false);
						break;
					default:
						kelvien.state = 'normal';
						chooseMenu('story');
						break;
				}
			})
			scene.on('leave', function() {
				switch($(e).data('event')) {
					case 'skills':
						untoggleSkills();
						break;
				}
				removeDialog(kelvien);
			});
			scene.addTo(controller);
		});

		arrangeKelvien();
		registerMenu();
	}

	function prepareImage() {
		return new Promise(function(resolve, reject) {
			var img = new Image();
			img.src = 'assets/media/sprite.png';
			img.onload = function() {
				resolve(img);
			}
		});	
	}

	function arrangeBg() {	
		cc.canvas.width = $(window).width();
		console.log($('#main').height(), $(window).height());
		cc.canvas.height = $('#main').outerHeight(true) + ($(window).height() / 2) - $('.event:last').outerHeight(true);

		if ($(window).width() <= 768) {
			// cc.canvas.height += $('#fixed-menu').outerHeight(true);
		}

		// Get Kelvien position
		var kelvienX = kelvien.element.offset().left;
		var ocean = $(".event[data-event='fly']");
		var oceanY = ocean.offset().top;
		var oceanH = 0;
		$.each(ocean, function(i, e) {
			oceanH += $(e).outerHeight(true);
		});

		prepareImage().then(function(img) {
			// Insert Floor
			var grass = new Tile(img, 'grass', 34, 226, 0);
			var grass1 = new Tile(img, 'grass1', 136, 260, 0);
			var oceanTL = new Tile(img, 'oceanTL', 34, 260, 0);
			var oceanTM = new Tile(img, 'oceanTM', 102, 192, 0);
			var oceanTR = new Tile(img, 'oceanTR', 136, 192, 0);
			var oceanML = new Tile(img, 'oceanML', 136, 226, 0);
			var oceanMM = new Tile(img, 'oceanMM', 68, 192, 0);
			var oceanMR = new Tile(img, 'oceanMR', 68, 226, 0);
			var oceanBL = new Tile(img, 'oceanBL', 68, 260, 0);
			var oceanBM = new Tile(img, 'oceanBM', 102, 260, 0);
			var oceanBR = new Tile(img, 'oceanBR', 102, 226, 0);
			var roadTL = new Tile(img, 'roadTL', 0, 192, 90);
			var roadTM = new Tile(img, 'roadTM', 0, 226, 0);
			var roadTR = new Tile(img, 'roadTR', 0, 192, 180);
			var roadML = new Tile(img, 'roadML', 0, 226, -90);
			var roadMM = new Tile(img, 'roadMM', 0, 260, 90);
			var roadMR = new Tile(img, 'roadMR', 0, 226, 90);
			var roadBL = new Tile(img, 'roadBL', 0, 192, 0);
			var roadBM = new Tile(img, 'roadBM', 0, 226, 180);
			var roadBR = new Tile(img, 'roadBR', 0, 192, -90);

			var draw = undefined;

			var drawOcean = false;
			var signalDrawOcean = false;

			var drawEndSideRoad = false;
			var signalDrawRoad = false;

			var signalEndRoad = false;

			for (var j = 0; j < cc.canvas.height; j += 32) {
				for (var i = 0; i < cc.canvas.width; i += 32) {			
					if (j < oceanY + (2 * 32)) {
						// Before ocean
						if (i <= kelvienX && i + 32 >= kelvienX) {
							draw = roadML.img;
							signalDrawRoad = true;
						} else if (signalDrawRoad) {
							draw = roadMR.img;
							signalDrawRoad = false;
						} else {
							draw = grass.img;
						}
					} else if (j < oceanY + oceanH) {
						// Ocean detected
						if (j + 32 >= oceanY + oceanH) {
							// End of ocean
							if (i == 0) {
								draw = oceanBL.img;
							} else if (i + 32 >= cc.canvas.width) {
								draw = oceanBR.img;
							} else {
								draw = oceanBM.img;
							}
						} else if (drawOcean) {
							// Draw ocean
							if (i == 0) {
								draw = oceanML.img;
							} else if (i + 32 >= cc.canvas.width) {
								draw = oceanMR.img;
							} else {
								draw = oceanMM.img;
							}
						} else {
							// Beginning of ocean
							if (i == 0) {
								draw = oceanTL.img;
							} else if (i + 32 >= cc.canvas.width) {
								draw = oceanTR.img;
							} else {
								draw = oceanTM.img;
							}
							signalDrawOcean = true;
						}
					} else {
						// After ocean
						if (j - 32 < $(".event:last").offset().top) {
							if (i <= kelvienX && i + 32 >= kelvienX) {
								draw = roadML.img;
								signalDrawRoad = true;
							} else if (signalDrawRoad) {
								draw = roadMR.img;
								signalDrawRoad = false;
							} else {
								draw = grass.img;
							}
						} else {
							if (!signalEndRoad && i <= kelvienX && i + 32 >= kelvienX) {
								draw = roadBL.img;
								signalDrawRoad = true;
							} else if (!signalEndRoad && signalDrawRoad) {
								draw = roadBR.img;
								signalDrawRoad = false;
								signalEndRoad = true;
							} else {
								draw = grass.img;
							}
						}
					}

					cc.drawImage(draw, 0, 0, 32, 32, i, j, 32, 32);
				}
				if (signalDrawOcean) {
					drawOcean = true;
				}
			}

			cc.save();
			cc.globalCompositeOperation = 'source-over';
			
			// Insert Items
			// Draw trees on sides
			// Draw houses on sides after trees
			// Draw lapras on ocean
		});
	}

	function addContact() {
		var h = $(window).height();
		h += (isFirefox) ? 50 : 0;
		$('#contact').height(h);
		var maxH = $(window).height() / 4;

		$('#contact-content').css({
			'padding-top': maxH
		});

		var sceneContact = new ScrollMagic.Scene({
			triggerElement: '#contact',
			duration: $('#contact').height() / 2,
			reverse: true
	    })
	    .setTween('#contact', 1, {opacity: 1})
	    .on('enter', function() {
	    	$('#fixed-menu li:nth(1)').addClass('active');
	    	$('#fixed-menu li:nth(0)').removeClass('active');
	    })
	    .on('leave', function() {
	    	if (controller.info('scrollDirection') == 'REVERSE') {
	    		$('#fixed-menu li:nth(0)').addClass('active');
	    		$('#fixed-menu li:nth(1)').removeClass('active');
	    	}
	    })
	    .addTo(controller);

	    var sceneContact = new ScrollMagic.Scene({
			triggerElement: '#contact',
			duration: $('#contact').height() / 2,
			reverse: true
	    })
	    .setTween('#fixed-menu', 1, {top: 0})
	    .addTo(controller);

	    $('#contact-mask-top').height(0);

	    var sceneContactMaskTop = new ScrollMagic.Scene({
			triggerElement: '#contact',
			duration: $('#contact').height() / 2,
			reverse: true
	    })
	    .setTween('#contact-mask-top', 1, {height: maxH})
	    .addTo(controller);
	    
	    $('#contact-mask-bottom').css({
	    	'height': maxH
	    });

	    $('#contact-content').css({
	    	'height': $('#contact').height() - maxH 
	    });

		$('#contact-top').css({
			'left': $(window).width()
		});

	    var sceneContactTop = new ScrollMagic.Scene({
	    	triggerElement: '#contact',
			duration: $('#contact').height() / 2,
			reverse: true
	    })
	    .setTween('#contact-top', 1, {left: 0})
	    .addTo(controller);

	    $('#contact-bottom').css({
			'left': -$(window).width(),
			'bottom': 0
		});

	    var sceneContactBottom = new ScrollMagic.Scene({
	    	triggerElement: '#contact',
			duration: $('#contact').height() / 2,
			reverse: true
	    })
	    .setTween('#contact-bottom', 1, {left: 0})
	    .addTo(controller);
	}

	function addScroll() {
		var lastScrollTop = 0;
		$(window).bind('scroll', function(event){
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

			clearTimeout($.data(this, 'scrollTimer'));
		    $.data(this, 'scrollTimer', setTimeout(function() {
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

	$(window).on('resize', function() {
		// main();
	});

});