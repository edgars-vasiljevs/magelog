// Load libraries
var connect = require('connect')()
    .use(require('connect').static(__dirname))
    .listen(8081);
Mark = require("markup-js");
pd = require('pretty-data').pd;
var spawn = require('child_process').spawn;
var StreamSplitter = require("stream-splitter");
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8082});
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json'));
var processData = {};
var processErrors = {};

// Broadcast data to all clients
wss.broadcast = function (data) {
    for (var i in this.clients) {
        this.clients[i].send(data);
    }
};

// Clients connection handler
wss.on('connection', function (ws) {
    // On connect, send config info
    Object.keys(config).forEach(function (key) {
        ws.send(JSON.stringify({
            action: 'createItem',
            id: key
        }));
    });

    Object.keys(processErrors).forEach(function (key) {
        ws.send(JSON.stringify({
            action: 'error',
            id: key,
            error: processErrors[key]
        }));
    });

    // Include CSS files
    fs.readdir('parsers/css/', function(err, files) {
        files.forEach(function(file, i) {
            ws.send(JSON.stringify({
                action: 'css',
                path: '/parsers/css/' + file
            }));
        });
    });

});

var LineSplitter = function(key) {
    var std = StreamSplitter("\n");
    std.encoding = "utf8";
    std.on("token", function (token) {
        // Parse line if parser is set
        if (processData[key].parser) {
            token = processData[key].parser(token);
        }
        // broadcast log line
        if (token) {
            wss.broadcast(JSON.stringify({
                action: 'line',
                id: key,
                line: token
            }));
        }
    });
    return std;
};

var ErrorSplitter = function(key) {
    var std = StreamSplitter("\n");
    std.encoding = "utf8";
    std.on("token", function (error) {
        if (/(No such file or directory|command not found)/g.test(error)) {
            processErrors[key] = error;
            wss.broadcast(JSON.stringify({
                action: 'error',
                id: key,
                error: error
            }));
        }
    });
    return std;
};


// Load script
(function (config) {
    // Loop config object
    Object.keys(config).forEach(function (key) {
        var process, data = config[key], params = [];

        // ssh?
        if (data.ssh) {
            params.push(data.ssh.user + '@' + data.ssh.host);
            params.push('-p');
            params.push(data.ssh.port);
            if (data.isFile) {
                params.push('tail');
                params.push('-f');
            }
            params.push(data.path);
            process = spawn('ssh', params);
        }
        // nah, file/tool is on local machine
        else {
            process = data.isFile
                ? spawn('tail', ['-f', data.path])
                : spawn(data.path);
        }

        processData[key] = {
            process: process,
            data: data,
            parser: data.parser
                ? require('./parsers/' + data.parser)
                : null
        };

        // Read std
        process.stdout.pipe(new LineSplitter(key));
        process.stderr.pipe(new ErrorSplitter(key));
    });

})(config);