var fs = require('fs');
var text = fs.readFileSync('to-dialog.txt').toString();

var lines = text.split('\n');
var dialogLines = [];
var lastWasName = false;
var openTextTag = false;
lines.forEach(function(line){
	line = line.trim();
	if(line === line.toUpperCase()){
		if(openTextTag){
			dialogLines.push('</div>');
		}
		dialogLines.push('<div class="dialog__name">'+line+'</div>');
		lastWasName = true;
	}else{
		if(lastWasName){
			dialogLines.push('<div class="dialog__text">');
			openTextTag = true;
		}

		dialogLines.push('\t<div>'+line+'</div>');
		lastWasName = false;
	}
});

if(openTextTag){
	dialogLines.push('</div>');
}

fs.writeFileSync('to-dialog.html', dialogLines.join('\n'));
