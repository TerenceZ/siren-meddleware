<<<<<<< HEAD
meddleware
==========

Lead Maintainer: [Jean-Charles Sisk](https://github.com/jasisk)  

[![Build Status](https://travis-ci.org/krakenjs/meddleware.svg?branch=v3.0.0)](https://travis-ci.org/krakenjs/meddleware)  


Configuration-based middleware registration for express.
=======
#### siren-meddleware
middleware configurator for [koa](https://github.com/koajs/koa).
>>>>>>> v2.0.0-release

Note: This isn't like [meddleware](https://github.com/krakenjs/meddleware), which will return middleware.
siren-meddleware carries application and config as arguments and returns the koa APPLICATION.

<<<<<<< HEAD
=======
[![Build Status](https://travis-ci.org/TerenceZ/siren-meddleware.png)](https://travis-ci.org/TerenceZ/siren-meddleware)

>>>>>>> v2.0.0-release
#### Usage
```javascript
var koa = require('koa');
var meddleware = require('meddleware');
var config = require('shush')('./config/middleware');

var app = koa();
meddleware(app, config);
app.listen(3000);
```

#### Configuration
Even though the configuration is almost the same as [meddleware](https://github.com/krakenjs/meddleware),
many koa middleware need to take application as an argument. To make application injection available, the 
placeholder '__app' is supported:

```json
{
    "middlewareA": {
        "enabled": true,
<<<<<<< HEAD
        "priority": 10,
        "module": "static-favicon"
    },

    "static": {
        "enabled": true,
        "priority": 20,
        "module": {
            "name": "serve-static",
            "arguments": [ "public" ]
        }
    },

    "custom": {
        "enabled": true,
        "priority": 30,
        "route": "/foo",
        "module": {
            "name": "path:./lib/middleware",
            "method": "customMiddleware",
            "arguments": [ "foo", { "bar": "baz" } ]
        }
    },

    "cookieParser": {
        "enabled": false,
        "priority": 40,
=======
>>>>>>> v2.0.0-release
        "module": {
            "name": "koa-router",
            "arguments": [
                "__app",
                {
                    "strict": true
                }
            ]
        }
    }
}
```

#### Options, App Events and Middleware Flow Control
Please refer to [meddleware](https://github.com/krakenjs/meddleware), except the app is a koa application.

#### Tests
```bash
$ npm test
```

#### Coverage
````bash
<<<<<<< HEAD
$ npm run cover && open coverage/lcov-report/index.html
```

#### Breaking changes

* `v2.0.0` removed `toggle` function from middleware. Middleware is enabled at configuration time only, not toggled at runtime.
* `v3.0.0` removed the default time limit on parallel middlewares, and made middlewares enabled by default.
=======
$ npm test-cov
```
>>>>>>> v2.0.0-release
