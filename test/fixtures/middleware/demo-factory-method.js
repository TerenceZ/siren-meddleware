'use strict';

module.exports = {

    demo2: function () {
        return function *demo2(next) {
            yield *next;
        };
    },

    demo3: function () {
        return function *demo3(next) {
            yield *next;
        };
    }
};