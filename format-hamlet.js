var fs = require('fs');
var text = fs.readFileSync('hamlet.txt').toString();

var lines = text.split('\n');

var dialogLines = [];
var lastWasName = false;
var openTextTag = false;
var titleOut = false;
var lastWasScene = false;
var lastWasDialog = false;
var openTextDialogTag = false;
var lastWasDirection = false;

var extractWords = require('./extract-words.js');
var cleanWord = require('./clean-word.js');

var allWords = extractWords(fs.readFileSync('hamlet.txt').toString());

var nextWordI = 0;


function out(html, s){
//console.log('out', html, s);
	if(s){
		var words = extractWords(s);
		sReplaced = '';
		words.forEach(function(word){

			var clean = cleanWord(word);
			if(clean){

				if(clean.toLowerCase() !== cleanWord(allWords[nextWordI]).toLowerCase()){
					console.log(s);
					console.log(clean, '!=', allWords[nextWordI]);
					process.exit();
				}

				sReplaced += '<span data-clean="'+clean+'" data-word="'+allWords[nextWordI]+'">'+word+'</span> ';
				nextWordI++;
				if(typeof(allWords[nextWordI])==='undefined'){
						//console.log('last word', word);
						return;
					}
				while(!allWords[nextWordI].trim()){
					nextWordI++;
					if(typeof(allWords[nextWordI])==='undefined'){
						//console.log('last word', word);
						return;
					}
				}
			}else{
				sReplaced += word;
			}

		});

		html = html.split('%s').join(sReplaced);
	}

	dialogLines.push(html);
}


lines.forEach(function(line, i){
//if(i>1001) return;
	line = line.trim();
	var nextLine = lines[i+1];

	if(typeof nextLine==='undefined' || nextLine==='' ){

		lastWasScene = true;
	}

	if(line==='') return;

	if(line.substring(0,4)==='ACT '){
		if(openTextDialogTag){
			out('</div></div>');
			openTextDialogTag = false;
		}
		if(openTextTag){
			out('\t\t</div>');
			openTextTag = false;
		}
		out('<div class="text__act">%s</div>', line);
		lastWasDialog = false;
		lastWasDirection = false;
		return;
	}
	if(line.substring(0,6)==='SCENE '){
		if(openTextDialogTag){
			out('</div></div>');
			openTextDialogTag = false;
		}
		if(openTextTag){
			out('\t\t</div>');
			openTextTag = false;
		}
		out('<div class="text__scene">%s</div>', line);
		lastWasScene = true;
		lastWasDialog = false;
		lastWasDirection = false;
		return;
	}

	if(line === line.toUpperCase()){
		if(openTextTag){
			out('\t\t</div>');
		}
		if(!lastWasDialog){
			out('<div class="text__dialog">\n\t<div class="dialog">');
			openTextDialogTag = true;
		}
		out('\t\t<div class="dialog__name">%s</div>', line);
		lastWasName = true;
		lastWasDialog = true;
		lastWasDirection = false;
	}else{
		if(lastWasName){
			out('\t\t<div class="dialog__text">');
			openTextTag = true;
		}

		if(!titleOut){
			out('<div class="text__title text__title--1">%s</div>', 'The Tragedy of');
			out('<div class="text__title text__title--2">%s</div>', 'Hamlet');
			out('<div class="text__title text__title--3">%s</div>', 'Prince of Denmark');
			titleOut = true;
			lastWasDialog = false;
			lastWasDirection = false;
		}else{
			if(lastWasScene){
				if(openTextTag){
					out('\t\t</div>');
					openTextTag = false;
				}
				if(openTextDialogTag){
					out('\t</div>\n</div>');
					openTextDialogTag = false;
				}
				out('<div class="text__stage-direction">%s</div>', line);
				lastWasDirection = true;
				lastWasScene = false;
				lastWasDialog = false;
			}else{
				if(lastWasDirection){
					out('<div class="text__dialog">\n\t<div class="dialog"><div class="dialog__name"></div><div class="dialog__text">');
					openTextDialogTag = true;
					openTextTag = true;
					//lastWasName = true;
					lastWasDialog = true;
				}
				out('\t\t\t<div>%s</div>', line);
				lastWasDirection = false;
			}

		}

		lastWasName = false;
	}
});



fs.writeFileSync('hamlet.html', fs.readFileSync('hamlet-header.html')+dialogLines.join('\n')+fs.readFileSync('hamlet-footer.html'));
