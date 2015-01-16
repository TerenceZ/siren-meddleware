module.exports = function () {
	return function *middlewareC(next) {
		this.state.mc = this.state.counter = (this.state.counter || 0) + 1;
		yield *next;
	};
};