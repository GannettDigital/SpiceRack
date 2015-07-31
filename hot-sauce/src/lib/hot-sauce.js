module.exports = (function() {
    var express = require('express');
    var http = require('http');
    var format = require('string-format');
    var bodyParser = require('body-parser');
    var fs = require('fs');
    var expressValidator = require('express-validator');
    var Logger = require('./logger.js');

    function HotSauce(config) {
        if(!config || !config instanceof Object) {
            //TODO: custom error types
            //TODO: validate config
            //TODO: swagger
            throw new Error('config must be present and be an object');
        }

        var hotSauce = {};
        var app = express();
        var server;
        var logger = new Logger(config.logger);

        app.use(bodyParser.json()); // for parsing application/json
        app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
        app.use(expressValidator({
            customValidators: {
                empty: function(value) {
                    return value === null || value === undefined;
                },
                isObject: function(value){
                    return value && value instanceof Object;
                }
            }
        }));

        app.all('/jobs*',function(req,res,next) {
            if(req.query.apiKey) {
                next();
            } else {
                var error = new Error();
                error.message = 'apiKey is required';
                error.status = 400;
                next(error); // 400 Not Authorized
            }
        });

        hotSauce.start = function() {

            initializeRouters(app, config);
            // DEVELOPER'S NOTE
            // since routes are also "middleware",
            // error handler must be registered here as the LAST middleware
            // DO NOT MOVE this line elsewhere unless you know what you are doing
            app.use(errorHandler);

            server = http.createServer(app);
            server.listen(config.port);
            logger.info(format('hot-sauce started on port {0}', config.port));
        };

        hotSauce.stop = function() {
            if(server) {
                server.close(function() {
                    logger.info('Server Stopped!');
                });
            } else {
                //log warning
            }
        };

        function initializeRouters(app, config){
            var routersDirectory = fs.readdirSync(__dirname + '/../api/routers');
            routersDirectory.forEach(function(router){
                logger.info('including router: '+router);
                require('../api/routers/'+router).initialize(app, config);
            });
        }

        function errorHandler(err, req, res, next){
            logger.error(format('error in request: {0}', req.originalUrl), err);
            //since JSON can't stringify errors, build error by hand :(
            res.status(err.status || 500).send({error: err.message});
        }

        return hotSauce;
    }

    return HotSauce;
})();