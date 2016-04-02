

module.exports = function(text){
	text = text.replace(/\n\n/gm, '   ').replace(/ /gm, '=').replace(/\n/gm,'=\n=');
	var words = text.split('=');
	return words;
};