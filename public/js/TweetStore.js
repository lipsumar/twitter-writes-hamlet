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
