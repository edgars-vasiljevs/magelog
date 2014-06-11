/* global require */
/* global Mark */
module.exports = function(line) {

    /^([^ ]+) - ([^ ]+) \[([^\]]+)\] "([^"]+)" (\d+)/g.test(line);

    // Templates
    var codeTemplate = '<span class="ngnix-code {{class}}">{{code}}</span>',
        methodTemplate ='<span class="ngnix-method">{{method}}</span>',
        lineTemplate = '[{{ip}}] {{code}} {{method}} {{request}}';

    // Extract data
    var ip = RegExp.$1,
        method = RegExp.$4.split(' ')[0],
        path = RegExp.$4.split(' ')[1],
        code = RegExp.$5,
        codeClass = 'ngnix-code' + code.substr(0, 1);

    code = Mark.up(codeTemplate, { class: codeClass, code: code });
    method = Mark.up(methodTemplate, { method: method });

    return Mark.up(lineTemplate, {
        ip: ip,
        code: code,
        method: method,
        request: path
    });
};