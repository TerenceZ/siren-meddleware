"use strict";

var should = require("should");
var request = require("supertest");
var shortstop = require("shortstop");
var handlers = require("shortstop-handlers");
var ssRegex = require("shortstop-regex");
var meddleware = require("..");
var mount = require("siren-mount");
var koa = require("koa");


function doneIfError(done) {

	return function (err) {

	if (err) {
		done(err);
	}
	};
} 


function Resolver() {

	var _resolver = shortstop.create();
	_resolver.use("path", handlers.path(__dirname));
	_resolver.use("regex", ssRegex());

	return function (config, cb) {

	_resolver.resolve(config, cb);
	};
}


var resolve = Resolver();


describe("meddleware", function() {
	
	it("should load empty options properly", function () {

		var app = koa();
		meddleware(app, require("./fixtures/empty"));

		app.middleware.length.should.equal(0);
	});

	it("should load middleware config in options", function (done) {

		var config = require("./fixtures/defaults");
		var names = Object.keys(config);

		resolve(config, function (err, config) {

			if (err) {
				return done(err);
			}

			var app = koa();
			meddleware(app, config);

			app.middleware.length.should.equal(names.length);
			done();
		});
	});

	it("should pass undefined middlware options", function (done) {

		var config = require("./fixtures/undefined");

		resolve(config, function (err, config) {

			if (err) {
				return done(err);
			}

			var app = koa();
			meddleware(app, config);
			app.middleware.length.should.equal(2);
			done();
		});
	});

	describe("priority", function () {

		it("should treat undefined priority as min priority", function (done) {

			var config = require("./fixtures/no-priority");
			resolve(config, function (err, config) {

				if (err) {
					return done(err);
				}

				var app = koa();

				app.use(function *(next) {
					should.not.exist(this.state.ma);
					should.not.exist(this.state.mb);
					should.not.exist(this.state.mc);
					yield *next;
					this.state.ma.should.equal(1);
					this.state.mb.should.equal(3);
					this.state.mc.should.equal(2);
					this.status = 204;
				});

				meddleware(app, config);

				["middlewareA", "middlewareC", "middlewareB"].forEach(function (name, i) {

					var entry = app.middleware[i + 1];
					should.exist(entry);
					entry.should.be.a.Function;
					entry.name.should.equal(name);
				});

				request(app.listen())
				.get("/")
				.expect(204, done);

			});
		});

		it("should load middleware in ascending priority order", function (done) {

			var config = require("./fixtures/priority");
			resolve(config, function (err, config) {

				if (err) {
					return done(err);
				}

				var app = koa();
				app.use(function *(next) {
					should.not.exist(this.state.ma);
					should.not.exist(this.state.mb);
					should.not.exist(this.state.mc);
					yield *next;
					this.state.ma.should.equal(2);
					this.state.mb.should.equal(1);
					this.state.mc.should.equal(3);
					this.status = 204;
				});
				meddleware(app, config);

				["middlewareB", "middlewareA", "middlewareC"].forEach(function (name, i) {

					var entry = app.middleware[i + 1];
					should.exist(entry);
					entry.should.be.a.Function;
					entry.name.should.equal(name);
				});

				request(app.listen())
				.get("/")
				.expect(204, done);
			});
		});
	});

	describe("module", function () {

		it("should throw TypeError when module not defined", function () {

			var config = {
				"missing": {
					"enabled": true,
					"module": null
				}
			};

			(function () {

				var app = koa();
				try {
					meddleware(app, config);
				} catch (e) {
					e.should.be.an.instanceof(TypeError);
					e.message.should.equal("Module not defined");
					throw e;
				}
			}).should.throw("Module not defined");
		});

		it("should throw MODULE_NOT_FOUND code when module missing", function () {

			(function () {

				var app = koa();
				try {
					meddleware(app, require("./fixtures/missing"));
				} catch (e) {
					e.should.be.an.instanceof(Error);
					e.code.should.equal("MODULE_NOT_FOUND");
					throw e;
				}
			}).should.throw();
		});

		it("should throw Error when module is not function", function () {

			(function () {

				var app = koa();
				try {
					meddleware(app, require("./fixtures/non-function"));
				} catch (e) {
					e.should.be.an.instanceof(Error);
					throw e;
				}
			}).should.throw("Unable to locate middleware in ./fixtures/middleware/non-function");
		});

		it("should inject app instance when `__app` in arguments list", function (done) {

			var app = koa();
			meddleware(app, require("./fixtures/app-inject"));

			app.use(function *() {

				should.exist(this.state.app);
				this.state.app.should.equal(app);
				this.status = 204;
			});
			request(app.listen())
			.get("/")
			.expect(204, done);
		});
	});

	describe("when contains custom middleware", function () {

		it("should load properly", function (done) {

			var config = require("./fixtures/customs");
			var names = Object.keys(config);

			resolve(config, function (err, config) {

				if (err) {
					return done(err);
				}

				var app = koa();
				meddleware(app, config);

				app.middleware.length.should.equal(names.length);
				done();
			});
		});
	});

	describe("enabled", function () {

		it("should use middleware in default", function (done) {

			var config = require("./fixtures/disabled");
			var names = Object.keys(config).filter(function (name) {
				return config[name].enabled !== false;
			});

			resolve(config, function (err, config) {

				if (err) {
					return done(err);
				}

				var app = koa();
				meddleware(app, config);

				app.middleware.length.should.equal(2);
				done();
			});
		});
	});

	describe("events", function () {

		it("should fire `before` and `after` registration events", function (done) {

			var config = require("./fixtures/defaults");
			resolve(config, function (err, config) {

				var app = koa();
				var before = 0;
				var after = 0;
				app.on("middleware:before", function () {

					before++;
				});

				app.on("middleware:after", function () {

					after++;
				});

				meddleware(app, config);
				should.equal(before, after);
				before.should.equal(4);
				done();
			});
		});

		it("should fire `before` and `after` named registration events", function (done) {

			var config = require("./fixtures/defaults");
			resolve(config, function (err, config) {

				var app = koa();
				var before = 0;
				var after = 0;
				app.on("middleware:before:favicon", function (event) {

					should.exist(event);
					should.exist(event.app);
					event.app.should.equal(app);
					before++;
				});

				app.on("middleware:after:favicon", function (event) {

					should.exist(event);
					should.exist(event.app);
					event.app.should.equal(app);
					after++;
				});

				meddleware(app, config);
				should.equal(before, after);
				before.should.equal(1);
				done();
			});
		});
	});

	describe("error middleware", function () {

		it("should respond 417", function (done) {

			var app = koa();
			app.env = "test";
			meddleware(app, require("./fixtures/error"));

			app.use(function *(next) {
				this.throw("On noes!");
			});

			request(app.listen())
			.get("/")
			.expect(417, function (err, res) {

				if (err) {
					return done(err);
				}
				res.text.should.equal("On noes!Caught");
				done();
			});
		});
	});

	describe("routes", function () {

		it("should respond properly", function (done) {

			resolve(require("./fixtures/routes"), function (err, config) {

				var app = koa();
				meddleware(app, config);
				app.use(function *(next) {

					switch (this.path) {
						case "/":
							should.not.exist(this.state.routeA);
							should.exist(this.state.routeB);
							should.not.exist(this.state.routeC);
							should.not.exist(this.state.routeD);
							this.status = 204;
							break;
						case "/foo":
							should.exist(this.state.routeA);
							should.exist(this.state.routeB);
							should.not.exist(this.state.routeC);
							should.not.exist(this.state.routeD);
							this.status = 204;
							break;
						case "/bar":
							should.not.exist(this.state.routeA);
							should.exist(this.state.routeB);
							should.exist(this.state.routeC);
							should.not.exist(this.state.routeD);
							this.status = 204;
							break;
						case "/baz":
							should.not.exist(this.state.routeA);
							should.exist(this.state.routeB);
							should.not.exist(this.state.routeC);
							should.exist(this.state.routeD);
							this.status = 204;
							break;
						default:
							return yield *next;
					}
				});

				request(app.listen())
				.get("/")
				.expect(204, doneIfError(done));

				request(app.listen())
				.get("/foo")
				.expect(204, doneIfError(done));

				request(app.listen())
				.get("/bar")
				.expect(204, doneIfError(done));

				request(app.listen())
				.get("/baz")
				.expect(204, done);
			});
		});

		it("should work when mounted", function (done) {

			resolve(require("./fixtures/routes"), function (err, config) {

				var a = koa();
				meddleware(a, config);
				a.use(function *(next) {

					switch (this.path) {
						case "/":
							should.not.exist(this.state.routeA);
							should.exist(this.state.routeB);
							should.not.exist(this.state.routeC);
							should.not.exist(this.state.routeD);
							this.status = 204;
							break;
						case "/foo":
							should.exist(this.state.routeA);
							should.exist(this.state.routeB);
							should.not.exist(this.state.routeC);
							should.not.exist(this.state.routeD);
							this.status = 204;
							break;
						case "/bar":
							should.not.exist(this.state.routeA);
							should.exist(this.state.routeB);
							should.exist(this.state.routeC);
							should.not.exist(this.state.routeD);
							this.status = 204;
							break;
						case "/baz":
							should.not.exist(this.state.routeA);
							should.exist(this.state.routeB);
							should.not.exist(this.state.routeC);
							should.exist(this.state.routeD);
							this.status = 204;
							break;
						default:
							return yield *next;
					}
				});

				var app = koa();
				app.use(mount(/\/bam\/?/i, a));

				request(app.listen())
				.get("/bam")
				.expect(204, doneIfError(done));

				request(app.listen())
				.get("/bam/foo")
				.expect(204, doneIfError(done));

				request(app.listen())
				.get("/bam/bar")
				.expect(204, doneIfError(done));

				request(app.listen())
				.get("/bam/baz")
				.expect(204, done);
			});
		});
	});

	describe("composition", function () {

		it("should run in parallel", function (done) {

			var app = koa();
			meddleware(app, require("./fixtures/parallel"));

			app.use(function *() {

				should.exist(this.state.parallelA);
				should.exist(this.state.parallelB);
				should.exist(this.state.parallelC);
				this.state.parallelA.should.equal(1);
				this.state.parallelB.should.equal(2);
				this.state.parallelC.should.equal(2);
				this.status = 204;
			});

			var start = Date.now();
			request(app.listen())
			.get("/")
			.expect(204, function (err, res) {

				if (err) {
					return done(err);
				}

				start = Date.now() - start;
				start.should.not.below(900);
				done();
			});
		});

		it("should throw error when error in parallel", function (done) {

			var app = koa();

			app.use(function *(next) {

				try {
					yield *next;
				} catch (e) {
					e.message.should.equal("Error from D");
					should.not.exist(this.state.parallelA);
					should.not.exist(this.state.parallelB);
					should.exist(this.state.parallelC);
					should.exist(this.state.parallelD);
					this.state.parallelC.should.equal(2);
					this.state.parallelD.should.equal(1);
					this.status = 204;
				}
			});

			meddleware(app, require("./fixtures/parallel-error"));

			var start = Date.now();
			request(app.listen())
			.get("/")
			.expect(204, function (err, res) {

				if (err) {
					return done(err);
				}

				start = Date.now() - start;
				start.should.below(300);
				done();
			});
		});

		it("should race", function (done) {

			var app = koa();
			meddleware(app, require("./fixtures/race"));

			app.use(function *() {

				should.exist(this.state.winner);
				this.state.winner.should.equal("B");
				this.status = 204;
			});

			var start = Date.now();
			request(app.listen())
			.get("/")
			.expect(204, function (err, res) {

				if (err) {
					return done(err);
				}

				start = Date.now() - start;
				start.should.below(500);
				done();
			});
		});

		it("should throw error when winner error in race", function (done) {

			var app = koa();

			app.use(function *(next) {

				try {
					yield *next;
				} catch (e) {

					e.message.should.equal("Error from D");
					should.exist(this.state.winner);
					this.state.winner.should.equal("D");
					return this.status = 204;
				}
				done(new Error("The winner hasn't thrown an error"));
			});

			meddleware(app, require("./fixtures/race-error"));

			var start = Date.now();
			request(app.listen())
			.get("/")
			.expect(204, function (err, res) {

				if (err) {
					return done(err);
				}

				start = Date.now() - start;
				start.should.below(120);
				done();
			});
		});

		it("should fallback", function (done) {

			var app = koa();
			meddleware(app, require("./fixtures/fallback"));

			app.use(function *() {

				should.exist(this.state.fallback);
				this.state.fallback.should.equal("D");
				this.status = 204;
			});

			var start = Date.now();
			request(app.listen())
			.get("/")
			.expect(204, function (err, res) {

				if (err) {
					return done(err);
				}

				start = Date.now() - start;
				start.should.above(690);
				start.should.below(850);
				done();
			});
		});

		it("should throw error when no middleware success", function (done) {

			var app = koa();
			app.use(function *(next) {

				try {
					yield *next;
				} catch (e) {
					e.message.should.equal("Unable to run any middleware successfully");
					should.not.exist(this.state.fallback);
					this.status = 204;
				}
			});

			meddleware(app, require("./fixtures/fallback-error"));

			app.use(function *(next) {

				this.throw("Should not step into here");
			});

			var start = Date.now();
			request(app.listen())
			.get("/")
			.expect(204, function (err, res) {

				if (err) {
					return done(err);
				}

				start = Date.now() - start;
				start.should.above(790);
				done();
			});
		});
	});

	it("should use module as context when initializing middleware", function (done) {

		var app = koa();
		meddleware(app, require("./fixtures/context"));

		request(app.listen())
		.get("/")
		.expect(200, function (err, res) {

			if (err) {
				return done(err);
			}
			res.text.should.equal("The method was called with a scope");
			done();
		});
	});
});