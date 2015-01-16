'use strict';


module.exports = function (_, app, __) {
    return function *(next) {
    	this.state.app = app;
        yield *next;
    };
};