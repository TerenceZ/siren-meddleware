'use strict';


function sleep(dur) {

    return new Promise(function (resolve) {

        setTimeout(function () {

            resolve();
        }, dur);
    });
}

exports.middlewareA = function () {

    return function *fallbackA(next) {

        yield sleep(200);
        this.throw("Fail A");
    };
};


exports.middlewareB = function () {

    return function *fallbackB(next) {

        yield sleep(100);
        this.throw("Fail B");
    };
};


exports.middlewareC = function () {

    return function *fallbackC(next) {

        yield sleep(100);
        this.throw("Fail C");
    };
};

exports.middlewareD = function () {

    return function *fallbackD(next) {

        yield sleep(200);
        this.state.fallback = "D";
        yield *next;
    };
};

exports.middlewareE = function () {

    return function *fallbackD(next) {

        yield sleep(300);
        this.throw("Fail E");
    };
};