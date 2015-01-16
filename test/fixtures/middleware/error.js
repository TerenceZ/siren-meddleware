'use strict';

module.exports = function () {
	return function *serverError(next) {
        try {
        	yield *next;
        } catch (e) {
        	e.message += "Caught";
        	e.status = 417;
        	this.throw(e);
        };
    };
};