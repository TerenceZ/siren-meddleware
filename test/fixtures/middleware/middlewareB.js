module.exports = function () {
	return function *middlewareB(next) {
		this.state.mb = this.state.counter = (this.state.counter || 0) + 1;
		yield *next;
	};
};