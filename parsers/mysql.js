var queryTemplate = '<div class="mysql-query">' +
                        '<span class="mysql-{{className}}">{{time}}</span>' +
                        '<span>{{affected}}</span>' +
                        '<div>{{sql}}</div>' +
                    '</div>',
    transTemplate = '<div class="mysql-transaction">{{message}} ({{time}})</div>';

function Query() {
    this.sql = '';
    this.binds = {};
    this.time = 0;
    this.affected = 0;
}

function OutputQuery(query) {
    Object.keys(query.binds).forEach(function(key) {
        var value = query.binds[key];
        if (! /^(\d+|NULL)$/.test(value)) {
            value = "'" + value + "'";
        }
        query.sql = /^\d+$/.test(key)
            ? query.sql.replace('?', value)
            : query.sql.replace(new RegExp(key, "g"), value);
    });


    query.className = getClassFromTime(query.time);
    query.sql = pd.sql(query.sql);
    return Mark.up(queryTemplate, query);
}

function getClassFromTime(time) {
    var time = parseFloat(time),
        className = 'level1';
    if (time > 1.0) {
        className = 'level5';
    }
    else if (time > 0.1) {
        className = 'level4';
    }
    else if (time > 0.01) {
        className = 'level3';
    }
    else if (time > 0.001) {
        className = 'level2';
    }
    else if (time > 0.0001) {
        className = 'level1'
    }
    return className;
}

var query = new Query(),
    binds = false,
    transaction = false,
    connect = false;

module.exports = function(line) {

    if (binds) {
        if (/^\s+(\d+|'[^']+') => (\d+|'[^']+'|NULL),\s*$/i.test(line)) {
            var key = RegExp.$1,
                value = RegExp.$2;
            key = key
                .replace(/^'/g, '')
                .replace(/'$/g, '');
            value = value
                .replace(/^'/g, '')
                .replace(/'$/g, '');

            query.binds[key] = value;
        }
    }

    if (/## \d+ ## TRANSACTION BEGIN/.test(line)) {
        transaction = 1;
    }
    if (/## \d+ ## TRANSACTION COMMIT/.test(line)) {
        transaction = 2;
    }

    if (/## \d+ ## CONNECT/.test(line)) {
        connect = true;
    }

    if (/## \d+ ## QUERY/.test(line)) {
        query = new Query();
    }

    if (/^SQL: (.*)/.test(line)) {
        query.sql = RegExp.$1;
    }

    if (/^BIND: (.*)/.test(line)) {
        binds = true;
    }

    if (/^AFF: (\d+)/.test(line)) {
        binds = false;
        query.affected = RegExp.$1;
    }

    if (/^TIME: ([\d\.]+)/.test(line) && connect) {
        connect = false;
        return Mark.up(queryTemplate, {
            className: getClassFromTime(RegExp.$1),
            time: RegExp.$1,
            affected: '',
            sql: 'CONNECT'
        });
    }

    if (/^TIME: ([\d\.]+)/.test(line) && transaction) {
        var message = transaction == 1
            ? 'Transaction begin'
            : 'Transaction commit';

        transaction = false;
        return Mark.up(transTemplate, {
            message: message,
            time: RegExp.$1
        });
    }

    if (/^TIME: ([\d\.]+)/.test(line) && query.sql) {
        binds = false;
        query.time = RegExp.$1;
        return OutputQuery(query);
    }
}