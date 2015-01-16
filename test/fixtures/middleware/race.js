'use strict';

function sleep(dur) {

    return new Promise(function (resolve) {

        setTimeout(function () {

            resolve();
        }, dur);
    });
}

exports.middlewareA = function () {

    return function *raceA(next) {

        yield sleep(1000);
        this.state.winner = "A";
        yield *next;
    };
};

exports.middlewareB = function () {

    return function *raceB(next) {

        yield sleep(200);
        this.state.winner = "B";
        yield *next;
    };
};

exports.middlewareC = function () {

    return function *raceC(next) {

        yield sleep(600);
        this.state.winner = "C";
        yield *next;
    };
};

exports.middlewareD = function () {

    return function *raceD(next) {

        yield sleep(80);
        this.state.winner = "D";
        this.throw("Error from D");
    };
};