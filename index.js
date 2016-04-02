/*jslint node: true */
process.env.GOOGLE_APPLICATION_CREDENTIALS = './gcred.json';
var Twitter = require('twitter');
var client = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

var gcloud = require('gcloud');
var dataset = gcloud.datastore.dataset({
	projectId: process.env.GCLOUD_PROJECT || 'twitter-writes-hamlet'
});

var TRACK_KEYWORDS = 'writingtwitter,shakespeare,hamlet,act,scene,claudius,gertrude,polonius,horatio,ophelia,laertes,fortinbras,ghost,rosencrantz,guildenstern,osric,voltimand,cornelius,marcellus,bernardo,francesco,reynaldo,elsinor';

//var exec = require('child_process').exec;
//var fs = require('fs');


//var textFileContent = 'I have a dream that one day every valley shall be exalted and every hill and mountain shall be made low the rough places will be made plain and the crooked places will be made straight and the glory of the Lord shall be revealed and all flesh shall see it together.';

// var textFileContent = fs.readFileSync('hamlet.txt').toString();
// var text = textFileContent;
// console.log(text.substring(0,50));
// text = text.replace(/\n\n/gm, '   ').replace(/ /gm, '=').replace(/\n/gm,'=\n=');//.split('==').join('===');
//var words = text.split('=');
var words = [];
var currentWordI = -1;
var currentWordIndex = -1;
var currentWord,currentWordNotClean,matchWordRegex,currentWordDate;
//nextWord();

var allTweets=[];
var searchInt;
var searchWait = 2000;
var searchWaitOri = searchWait;


var lastMinuteBySource = {
	filter: 0,
	sample: 0
};
var connectBySource = {
	filter: function(){
		client.stream('statuses/filter', {track:TRACK_KEYWORDS},  onStream.bind(this, 'filter'));
	},
	sample: function(){
		client.stream('statuses/sample', {},  onStream.bind(this, 'sample'));
	}
};

//var matchWordRegex = ;

function onStream( source, stream){

	stream.on('data', onTweet.bind(this,source));

	stream.on('error', function(error) {
		console.log('STREAM ERROR:', error);
		//exec('say erreur de flux');
	});


	stream.on('close', function(source){
		console.log('STREAM ', source, 'CLOSED!');
		//exec('say flux "'+source+'" fermé');
		connectBySource[source]();
	}.bind(this,source));

	stream.on('end', function(source){
		console.log('STREAM ', source, 'END!');
		//exec('say flux "'+source+'" terminé');
		connectBySource[source]();
	}.bind(this,source));

	stream.on('readable', function(source){
		console.log('STREAM ', source, 'readable!');
		//exec('say flux "'+source+'" disponible');
	}.bind(this,source));

}




function stayAliveLoop(){

	console.log('tweets last minute: ===================');
	for(var source in lastMinuteBySource){
		if(lastMinuteBySource.hasOwnProperty(source)){
			console.log(' '+source+': '+lastMinuteBySource[source]);
			if(lastMinuteBySource[source]===0){
				//exec('say flux '+source+' perdu, reconnection');
				console.log('RECONNECT', source);
				connectBySource[source]();
			}
			lastMinuteBySource[source] = 0;
		}
	}

	setTimeout(stayAliveLoop, 60000);
};


function onTweet(source, tweet){

	if(!tweet.text) return;



	if(typeof lastMinuteBySource[source]!=='undefined'){
		lastMinuteBySource[source]++;
	}




	var tweetDate = new Date(tweet.created_at);

	if(currentWordDate > tweetDate){

		if(source==='search'){
			searchWait+=1000;
			searchFor(currentWord);
		}
		return;
	}

	if(tweet && tweet.text){


		var matched = tweet.text.match(matchWordRegex);
		if(matched!==null){

			if(searchInt){
				clearTimeout(searchInt);
			}
			searchWait = searchWaitOri;

			console.log('FOUND:', currentWord);

			var smallTweet = {
				tweetText: tweet.text,
				screen_name: tweet.user.screen_name,
				word: currentWordNotClean,
				wordClean: currentWord,
				charAt: tweet.text[matched.index].toLowerCase() === currentWord[0].toLowerCase() ? matched.index : matched.index+1,
				id: tweet.id_str,
				profile_image_url: tweet.user.profile_image_url
			};
			io.emit('word',smallTweet);
			allTweets.push(smallTweet);

			nextWord();


			if(currentWord===''){
				onNewLine();
				return;
			}



			searchFor(currentWord);
		}

	}
}


function onNewLine(){
	console.log('new line');
	var smallTweet = {
		tweetText: '',
		screen_name: '',
		word: '\n',
		wordClean: '\n'
	};
	io.emit('word',smallTweet);
	allTweets.push(smallTweet);
	nextWord();

	if(currentWord===''){
		onNewLine();
		return;
	}

	searchFor(currentWord);
}

function nextWord(){
	currentWordDate = new Date();
	currentWordI++;
	currentWord = words[currentWordI].word.trim();

	if(words.length - currentWordI < 10){
		fetchNextWordsFromStore();
	}

	currentWordNotClean = currentWord;
	currentWord = cleanWord(currentWord);
	matchWordRegex = new RegExp('([^a-z]|^)'+currentWord+'([^a-z]|$)','mi');
	//exec('afplay /System/Library/Sounds/Pop.aiff -v 0.5');

	if(typeof currentWord === 'undefined'){
		console.log('the end!');
		process.exit();
	}
}

function cleanWord(w){
	return w.replace(/(^[,.'":;!?]+)|([,.'":;!?]+$)/g, '');
}


function fetchNextWordsFromStore(start){
	var query = dataset.createQuery('Word')
		.filter('index >', currentWordIndex)
		.order('index')
		.limit(10);

	dataset.runQuery(query, function(err,wordsFromStore){

		if(err){
			throw err;
		}
		var lastIndex;
		wordsFromStore.forEach(function(word){
			words.push(word.data);
			lastIndex = word.data.index;
		});
		currentWordIndex = lastIndex;

		if(start){
			nextWord();
			stayAliveLoop();
		}

	});
}

/**
* Stream statuses filtered by keyword
* number of tweets per second depends on topic popularity
**/

//currentWord='twitter';
//console.log('search/tweets', {q:currentWord});
//searchFor(currentWord);


function searchFor(w){

	if(searchWait>10000){
		searchWait = 10000;
	}

	searchInt = setTimeout(function(w){

		if(w !== currentWord) return;

		console.log('search', w);
		client.get('search/tweets', {q:w,result_type:'recent'}, function(error, resp){
			if(error){
				//exec('say erreur! erreur! erreur!');

				console.log('ERROR',error);
				searchFor(w);
				return;
			}
			console.log('=>',w,resp.statuses.length);
			if(resp && resp.statuses && resp.statuses.length){
				var yay = false;
				for (var i = 0; i < resp.statuses.length; i++) {

					if(resp.statuses[i].text.match(matchWordRegex)){
						onTweet('search',resp.statuses[i]);
						yay = true;
						break;
					}

				}

				if(!yay){
					console.log(resp.statuses[0].text);
					console.log('alas');
					searchWait+=1000;
					searchFor(w);
				}

			}else{
				console.log(':(');
				searchWait+=1000;
				searchFor(w);
			}
		});

	}.bind(this, w), searchWait);
	//console.log('wait',searchWait/1000,'sec');

}







var express = require('express'),
	app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket){
	console.log('a user connected');
	socket.emit('state', {
		all:allTweets
	});
});


// Routes
// Routes - static
app.use(express.static('.'));
//app.use('/node_modules',express.static('node_modules'));
//app.use('/genetic-evolution',express.static('genetic-evolution'));



//app.listen(1337);

http.listen(3000, function(){
  console.log('listening on *:3000');
});


fetchNextWordsFromStore(true);