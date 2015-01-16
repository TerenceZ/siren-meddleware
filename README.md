siren-meddleware
==========

middleware configurator for [koa](https://github.com/koajs/koa).

Note: This isn't like [meddleware](https://github.com/krakenjs/meddleware), which will return middleware.
siren-meddleware carries application and config as arguments and returns the koa APPLICATION.

=======
[![Build Status](https://travis-ci.org/TerenceZ/siren-meddleware.png)](https://travis-ci.org/TerenceZ/siren-meddleware)

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
$ npm test-cov
```