// Load libraries
var connect = require('connect')()
    .use(require('connect').static(__dirname))
    .listen(8081);
Mark = require("markup-js");
var spawn = require('child_process').spawn;
var StreamSplitter = require("stream-splitter");
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8082});
var fs = require('fs');
var config = JSON.parse(fs.readFileSync('./config.json'));

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

// Load script
(function (config) {
    // Loop config object
    Object.keys(config).forEach(function (key) {
        var process = null,
            std = StreamSplitter("\n"),
            data = config[key],
            params = [];

        // ssh?
        if (data.ssh) {
            params.push(data.ssh.user + '@' + data.ssh.host);
            params.push('-p ' + data.ssh.port);
            params.push((data.isFile ? 'tail -f ' : '') + data.path);

            process = spawn('ssh', params);
        }
        // nah, file/tool is on local machine
        else {
            process = data.isFile
                ? spawn('tail', ['-f', data.path])
                : spawn(data.path);
        }

        if (data.parser) {
            var parser = require('./parsers/' + data.parser);
        }

        std.encoding = "utf8";
        std.on("token", function (token) {
            // Parse line if parser is set
            if (parser) {
                token = parser(token);
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
        process.stdout.pipe(std);
    });

})(config);