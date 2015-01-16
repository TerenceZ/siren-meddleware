"use strict";

module.exports = {
    thisMustBeingFoundByMeddleware: function () {
        return function *(next) {
            this.body = "The method was called with a scope";
            yield *next;
        };
    },
    run: function () {
        return this.thisMustBeingFoundByMeddleware();
    }
};