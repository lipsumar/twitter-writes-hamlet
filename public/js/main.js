var TOTAL_WORDS = 32003;
var WORDS_PER_PAGE = 150;
var PAGE_COUNT = Math.ceil(TOTAL_WORDS / WORDS_PER_PAGE);
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
	buildStatsPages($('.stats-pages'));
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
	var pc = ((resp.currentWordCount / TOTAL_WORDS)*100).toFixed(2);
	$('.word-count').text(resp.currentWordCount);
	$('.word-count-pc').text(pc + '%');
	$('.timeline__progress').css('width', pc+'%');
	refreshStatsPages(resp);
}

// simply builds all the pages, empty
function buildStatsPages($el){
	var html = '';
	for(var i=0;i<PAGE_COUNT;i++){
		html+='<div class="stat-page" data-p="'+i+'"></div>';

	}
	$el.html(html);
}
function refreshStatsPages(resp){
	var w;
	for(var i=0;i<PAGE_COUNT;i++){
		w = i*WORDS_PER_PAGE;
		if(resp.currentWordCount > w){
			$('.stat-page[data-p="'+i+'"]').addClass('written');
		}
	}
}

function refreshTimer(){
	var duration = millisecondsToStr( (new Date()).getTime() - (new Date('Sat Apr 16 2016 11:06:10 GMT+0000 (UTC)')).getTime() );
	$('.full-duration').text(duration);
}
refreshTimer();
setInterval(refreshTimer, 60000);


$(window).on('resize', scrollText);

$('.hover-words').delegate('span', 'mouseenter', function(){
	var index = $(this).data('i');
	bubble.show(this, index);
});
$('.hover-words').delegate('span', 'mouseleave', function(){
	bubble.hide();
});
$('.hover-words').delegate('span', 'click', function(e){
	var index = $(this).data('i');
	e.preventDefault();
	TweetStore.get(index, function(tw){
		window.open('https://twitter.com/status/'+tw.id);
	});
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

