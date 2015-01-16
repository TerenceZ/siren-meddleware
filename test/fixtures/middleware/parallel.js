'use strict';

function sleep(dur) {

    return new Promise(function (resolve) {

        setTimeout(function () {

            resolve();
        }, dur);
    });
}

exports.middlewareA = function () {

    return function *parallelA(next) {

        yield sleep(1000);
        this.state.parallelA = (this.state.parallelA || 0) + 1;
        yield *next;
    };
};

exports.middlewareB = function () {

    return function *parallelB(next) {

        yield sleep(500);
        this.state.parallelB = (this.state.parallelB || 0) + 1;
        yield *next;
    };
};

exports.middlewareC = function () {

    return function *parallelC(next) {

        yield sleep(100);
        this.state.parallelC = (this.state.parallelC || 0) + 1;
        yield *next;
    };
};

exports.middlewareD = function () {

    return function *parallelD() {

        yield sleep(150);
        this.state.parallelD = (this.state.parallelD || 0) + 1;
        this.throw("Error from D");
    };
};