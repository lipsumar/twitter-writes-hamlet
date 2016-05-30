module.exports = function cleanWord(w){
	// — is a "tiret quadratin"
	// the - after is a regular one
	return w.replace(/(^[,.'":;!?\[—-]+)|([,.'":;!?\]—-]+$)/g, '');
};