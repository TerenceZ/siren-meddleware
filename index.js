/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2014 eBay Software Foundation                               │
 │                                                                            │
 │  Licensed under the Apache License, Version 2.0 (the "License");           │
 │  you may not use this file except in compliance with the License.          │
 │  You may obtain a copy of the License at                                   │
 │                                                                            │
 │    http://www.apache.org/licenses/LICENSE-2.0                              │
 │                                                                            │
 │  Unless required by applicable law or agreed to in writing, software       │
 │  distributed under the License is distributed on an "AS IS" BASIS,         │
 │  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
 │  See the License for the specific language governing permissions and       │
 │  limitations under the License.                                            │
 \*───────────────────────────────────────────────────────────────────────────*/
"use strict";

var co = require("co");
var path = require("path");
var thing = require("core-util-is");
var caller = require("caller");
var util = require("./lib/util");
var mount = require("siren-mount");
var debug = require("debuglog")("siren/meddleware");


/**
 * Creates a middleware resolver based on the provided basedir.
 * @param basedir the directory against which to resolve relative paths.
 * @param app the koa application.
 * @returns {Function} a the implementation that converts a given spec to a middleware function.
 */
function resolvery(basedir, app) {

  return function resolve(spec, name) {

    spec.name = spec.name || name;

    if (spec.parallel) {
      return parallel(util.mapValues(spec.parallel, resolve));
    }

    if (spec.race) {
      return race(util.mapValues(spec.race, resolve));
    }

    if (spec.fallback) {
      let generators = util.mapValues(spec.fallback, util.nameObject)
        .filter(thing.isObject)
        .sort(compare);

      return fallback(util.mapValues(generators, resolve));
    }

    return resolveImpl(basedir, spec.module, app);
  };
}


/**
 * Attempts to locate a node module and get the specified middleware implementation.
 * @param root The root directory to resolve to if file is a relative path.
 * @param config The configuration object or string describing the module and option factory method.
 * @param app The koa application.
 * @returns {Function} The middleware implementation, if located.
 */
function resolveImpl(root, options, app) {

  if (typeof options === "string") {
    options = {
      name: options
    };
  }

  if (!options || !options.name) {
    throw new TypeError("Module not defined");
  }

  debug("loading module", options.name);

  var modulePath = util.tryResolve(options.name) || util.tryResolve(path.resolve(root, options.name));
  var module = require(modulePath || options.name);

  var factory = module;
  if (options.method !== undefined) {
    factory = module[options.method];
    if (!thing.isFunction(factory)) {
      factory = module;
    }
  }

  if (!thing.isFunction(factory)) {
    throw new Error("Unable to locate middleware in " + options.name);
  }

  var args = thing.isArray(options["arguments"]) ? options["arguments"] : [];
  var appPlaceholder = args.indexOf("__app");

  if (appPlaceholder >= 0) {
    args[appPlaceholder] = app;
  }
  return factory.apply(module, args);
}

/**
 * The empty iterator.
 */
var noop = (function *() { })();

/**
 * Run all middleware in parallel, and go to next until all done.
 * @param fns the array of middleware
 * @returns {Function}
 */
function parallel(fns) {

  return function *parallelMiddleware(next) {
    
    var ctx = this;

    yield Promise.all(fns.map(function (fn) {

      return co(function *() {

        yield *fn.call(ctx, noop);
      });
    }));

    yield *next;
  };
}

/**
 * Race all middleware in parallel, and go to next as long as one win.
 * @param fns the array of middleware
 * @returns {Function}
 */
function race(fns) {

  return function *raceMiddleware(next) {

    var ctx = this;

    yield Promise.race(fns.map(function (fn) {

      return co(function *() {

        yield *fn.call(ctx, noop);
      });
    }));

    yield *next;
  };
}

/**
 * Run middleware in sequence as long as the running middleware throws error.
 * @param fns the array of middleware
 * @returns {Function}
 */
function fallback(fns) {

  return function *fallbackMiddleware(next) {

    var ctx = this;
    var index = -1;
    var length = fns.length;

    yield (function retry() {

      return co(function *() {

        if (++index >= length) {
          return ctx.throw("Unable to run any middleware successfully");
        }

        try {
          yield *fns[index].call(ctx, noop);

        } catch (e) {
          yield retry();
        }
      });
    })();

    yield *next;
  };
}

/**
 * Comparator for sorting middleware by priority
 * @param a
 * @param b
 * @returns {number}
 */
function compare(a, b) {

  return (typeof a.priority ==="number" ? a.priority : Number.MIN_VALUE) -
    (typeof b.priority === "number" ? b.priority : Number.MIN_VALUE);
}

/**
 * Read the `options` to load and config middleware and used in `app`.
 * @param app koa application
 * @param options
 * @returns {Application} app
 */
module.exports = function meddleware(app, options) {

  // The `require`-ing module (caller) is considered the `basedir`
  // against which relative file paths will be resolved.
  // Don't like it? Then pass absolute module paths. :D
  var basedir = path.dirname(caller());
  var resolve = resolvery(basedir, app);

  util.mapValues(options, util.nameObject)
    .filter(thing.isObject)
    .sort(compare)
    .forEach(function register(spec) {

      if (!spec.enabled && "enabled" in spec) {
        return;
      }

      var fn = resolve(spec, spec.name);

      var route = "/";
      var isstr = typeof spec.route === "string";
      if (isstr) {
        if (spec.route[0] === "/") {
          route = spec.route;
        } else {
          route = "/" + spec.route;
        }
      }

      debug("registering", spec.name, "middleware");

      var event = { app: app, config: spec };
      app.emit("middleware:before", event);
      app.emit("middleware:before:" + spec.name, event);

      app.use(
        mount(
          !isstr && (spec.route instanceof RegExp) ?
            spec.route :
            route,
          fn
        )
      );

      app.emit("middleware:after", event);
      app.emit("middleware:after:" + spec.name, event);
    });

  return app;
};