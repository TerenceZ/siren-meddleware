'use strict';


module.exports = function () {
    return function *demo(next) {
        yield *next;
    };
};