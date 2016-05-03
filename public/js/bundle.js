(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var TweetStore = require('./TweetStore');
var tweetTpl = function(tweet){ return '<b>@'+tweet.screen_name+'</b><br>'+tweet.tweetText; };
function TweetBubble(opts){
	this.$el = createEl();
	this.sourceEl = null;// the element we "attach" to bubble to

	if(opts.tweetTpl){
		tweetTpl = opts.tweetTpl;
	}
	$('body').append(this.$el);
	$(window).on('resize', attach.bind(this));
}

TweetBubble.prototype.show = function(sourceEl, tweetId) {
	this.sourceEl = sourceEl;
	this.tweetId = tweetId;
	renderLoading.call(this);
	TweetStore.get(tweetId, renderTweet.bind(this));
	attach.call(this);
	show.call(this);
};

TweetBubble.prototype.hide = hide;


function renderTweet(tweet){
	console.log('renderTweet', tweet);
	if(tweet.index !== this.tweetId) return; //server responded too late
	this.$el.html(tweetTpl(tweet));
	// tweet might have changed $el size
	attach.call(this);
}

function renderLoading(){
	this.$el.html('loading...');
}

function createEl(){
	var $el = $('<div class="tweet-bubble"></div>');
	return $el;
}

function attach(){
	if(!this.sourceEl) return;
	var sourceElPos = $(this.sourceEl).offset();
	sourceElPos.top += $(this.sourceEl).height()+2;
	sourceElPos.left -= 10;
	this.$el.css(sourceElPos);
}

function show(){
	this.$el.addClass('visible');
}

function hide(){
	this.sourceEl = null;
	this.$el.removeClass('visible');
}



module.exports = TweetBubble;


},{"./TweetStore":2}],2:[function(require,module,exports){
/*global $*/
var RANGE_SIZE = 20;
var FETCH_URL = '/tweets/range/';

var noop = function(){};
var tweets = {};
var callbacks = {};

var store = {
	init: function(){
		this.init = noop;
	},

	get: function(tweetId, callback){
		if(tweets[tweetId]){
			callback(tweets[tweetId]);
			return;
		}

		var tweetIdRange = getTweetIdRange(tweetId);
		//@TODO reduce range to only what we haven't requested yet
		//tweetIdRange = removeFetchedRange(tweetIdRange);
		fetchRange(tweetIdRange);
		addCallback(tweetId, callback);

	}
};


function addCallback(tweetId, callback){
	if(!callbacks[tweetId]){
		callbacks[tweetId] = [];
	}
	callbacks[tweetId].push(callback);
	console.log('callbacks',callbacks);
}

function fireCallbacks(tweetId){
	if(callbacks[tweetId] && tweets[tweetId]){
		callbacks[tweetId].forEach(function(cb){
			if(cb) cb(tweets[tweetId]);
		});
		callbacks[tweetId] = null;
	}
}

function fetchRange(range){
	$.ajax({
		dataType:'json',
		url: FETCH_URL + range.join(','),
	}).then(tweetFetched);
}

function tweetFetched(resp){
	console.log('tweetFetched',arguments);

	if(resp && resp.tweets){
		resp.tweets.forEach(function(tweet){
			tweets[tweet.index] = tweet;
			fireCallbacks(tweet.index);
		});
	}
}

function getTweetIdRange(tweetId){
	var min = tweetId - RANGE_SIZE;
	var max = tweetId + RANGE_SIZE;
	if(min<0) min = 0;
	return [min, max];
}
/*
function removeFetchedRange(range){
	var notFetched = [],
		newRange = [];
	for(var i=range[0];i++;i<=range[1]){
		if(!tweets[i]){
			notFetched.push(i);
		}
	}
	newRange[0] = notFetched.min();
	newRange[1] = notFetched.max();
	return newRange;
}
*/
module.exports = store;

},{}],3:[function(require,module,exports){
function millisecondsToStr (milliseconds) {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }

    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks?
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + ' second' + numberEnding(seconds);
    }
    return 'less than a second'; //'just now' //or other string you like;
}
module.exports = millisecondsToStr;


},{}],4:[function(require,module,exports){

var socket = io();
var TweetStore = require('./TweetStore');
var TweetBubble = require('./TweetBubble');
var millisecondsToStr = require('./millisecondsToStr');




	var bubble = new TweetBubble({
		tweetTpl: function(tw){
			var parts = [];
			parts.push(tw.tweetText.substring(0,tw.charAt));
			parts.push(tw.tweetText.substring(tw.charAt+tw.clean.length));

			var text = parts[0]+'<a class="tweet-bubble__word">'+tw.clean+'</a>'+parts[1];

			return '<img class="tweet-bubble__avatar" src="'+tw.profile_image_url+'">'
			+ '<div class="tweet-bubble__body">'
			+ '<div class="tweet-bubble__screen-name">@'+tw.screen_name+'</div>'
			+ '<div class="tweet-bubble__text">'+text+'</div></div>';

		}
	});


	socket.on('state', function(resp){
		console.log('state',resp);
		var html = '';

		for (var i = 0; i < resp.htmlPieces.length; i++) {
			html+= resp.htmlPieces[i].html;
		}
		$('.text').html(html);
		$('.text').find('span').each(function(){
			var i = parseInt(this.getAttribute('data-i'), 10);
			if(i<resp.currentWordIndex){
				$(this).addClass('v');
			}
		});

		var $nextWord = getNextWord(resp.currentWordIndex-1);
		if($nextWord){
			$nextWord.addClass('looking');
		}


		// init stats
		refreshStats(resp);

		scrollText();

	});
	socket.on('word', function(resp){
		console.log('got index',resp.index);
		var $word = $('.text').find('span[data-i="'+resp.index+'"]');
		$word.removeClass('looking').addClass('v');
		var $nextWord = getNextWord(resp.index);
		if($nextWord){
			$nextWord.addClass('looking');
		}

		refreshStats(resp);

		scrollText();
	});

	function refreshStats(resp){
		var pc = ((resp.currentWordCount / 32003)*100).toFixed(2);
		$('.word-count').text(resp.currentWordCount);
		$('.word-count-pc').text(pc + '%');
		$('.timeline__progress').css('width', pc+'%');
	}

	function refreshTimer(){
		var duration = millisecondsToStr( (new Date()).getTime() - (new Date('Sat Apr 16 2016 11:06:10 GMT+0000 (UTC)')).getTime() );
		$('.full-duration').text(duration);
	}
	refreshTimer();
	setInterval(refreshTimer, 60000);


	$(window).on('resize', scrollText);

	$('.text').delegate('span', 'mouseenter', function(){
		var index = $(this).data('i');

		bubble.show(this, index);
		/*TweetStore.get(index, function(tweet){
			console.log(tweet);
		});*/
	});
	$('.text').delegate('span', 'click', function(e){
		var index = $(this).data('i');
		e.preventDefault();
		//window.open('https://twitter.com/'+tw.screen_name+'/status/'+tw.id);
		window.open('https://twitter.com/status/'+tw.id);
	});


	function getNextWord(index){
		var $nextWord,i=1;
		while(true){
			$nextWord = $('.text').find('span[data-i="'+(index+i)+'"]');
			if($nextWord.length===1) break;
			i++;
			if(i>50) break;
		}
		return $nextWord;
	}




	function keepTextScrolled(){
		scrollText();
		setTimeout(keepTextScrolled, 2000);
	}
	function scrollText(){
		var pageEl = $('.app__page')[0];
		pageEl.scrollTop = pageEl.scrollHeight;
	}
	keepTextScrolled();


},{"./TweetBubble":1,"./TweetStore":2,"./millisecondsToStr":3}]},{},[4]);
