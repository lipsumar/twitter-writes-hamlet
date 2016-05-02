
var socket = io();
var TweetStore = require('./TweetStore');
var TweetBubble = require('./TweetBubble');
var millisecondsToStr = require('./millisecondsToStr');




	var bubble = new TweetBubble();


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

