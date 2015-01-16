module.exports = function () {
	return function *middlewareA(next) {
		this.state.ma = this.state.counter = (this.state.counter || 0) + 1;
		yield *next;
	};
};