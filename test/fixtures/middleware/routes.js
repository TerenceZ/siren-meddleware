'use strict';



exports.routeA = function () {
    return function *routeA(next) {
        this.state.routeA = true;
        yield *next;
    };
};


exports.routeB = function () {
    return function *routeB(next) {
        this.state.routeB = true;
        yield *next;
    };
};


exports.routeC = function () {
    return function *routeC(next) {
        this.state.routeC = true;
        yield *next;
    };
};

exports.routeD = function () {
    return function *routeD(next) {
        this.state.routeD = true;
        yield *next;
    };
};
