const {fraction} = (() => {
	let math = require('mathjs/core').create();
	math.import(require('mathjs/lib/type/fraction'));
	return math;
})();

export default function(x = 0) {
	return fraction(x);
}