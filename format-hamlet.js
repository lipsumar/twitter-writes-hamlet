var fs = require('fs');
var text = fs.readFileSync('hamlet.txt').toString();

var lines = text.split('\n');
console.log(lines.slice(0,20));
var dialogLines = [];
var lastWasName = false;
var openTextTag = false;
var titleOut = false;
var lastWasScene = false;
var lastWasDialog = false;
var openTextDialogTag = false;
var lastWasDirection = false;

function out(s){
	dialogLines.push(s);
}


lines.forEach(function(line, i){
//if(i>50) return;
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
		out('<div class="text__act">'+line+'</div>');
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
		out('<div class="text__scene">'+line+'</div>');
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
		out('\t\t<div class="dialog__name">'+line+'</div>');
		lastWasName = true;
		lastWasDialog = true;
		lastWasDirection = false;
	}else{
		if(lastWasName){
			out('\t\t<div class="dialog__text">');
			openTextTag = true;
		}

		if(!titleOut){
			out('<div class="text__title text__title--1">The Tragedy of</div>');
			out('<div class="text__title text__title--2">Hamlet</div>');
			out('<div class="text__title text__title--3">Prince of Denmark</div>');
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
				out('<div class="text__stage-direction">'+line+'</div>');
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
				out('\t\t\t<div>'+line+'</div>');
				lastWasDirection = false;
			}

		}

		lastWasName = false;
	}
});



fs.writeFileSync('hamlet.html', fs.readFileSync('hamlet-header.html')+dialogLines.join('\n')+fs.readFileSync('hamlet-footer.html'));
