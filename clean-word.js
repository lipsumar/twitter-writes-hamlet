module.exports = function cleanWord(w){
	return w.replace(/(^[,.'":;!?]+)|([,.'":;!?]+$)/g, '');
};