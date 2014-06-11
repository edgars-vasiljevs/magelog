module.exports = function(line) {
    // Query
    if (/path=\/select/.test(line)) {

        /params={([^}]*)} /.test(line);
        var rawQuery = RegExp.$1,
            _params = RegExp.$1.split('&');;
            params = {};

        /hits=(\d+)/.test(line);
        var hits = RegExp.$1;

        for (var i in _params) {
            var value = _params[i].split('=');
            params[value[0]] = value[1].replace(/\+/g, ' ');
        }

        var queryTemplate = '<div class="solr-query">' +
                                '<div class="solr-raw">{{rawQuery}}</div>' +
                                '<div class="solr-hits">Hits: {{hits}}</div>' +
                                '{{params}}' +
                            '</div>',
            paramTemplate = '<div class="solr-param">' +
                                '<span>{{param}}</span>' +
                                '<span>{{value}}</span>' +
                            '</div>';

        var paramsHTML = '';
        Object.keys(params).forEach(function (key) {
            paramsHTML += Mark.up(paramTemplate, {
                param:key,
                value: params[key]
                    .replace(/\\-/g, '-')
                    .replace(/\\:/g, ':')
            });
        });

        return Mark.up(queryTemplate, {
            rawQuery: rawQuery,
            hits: hits,
            params: paramsHTML
        })
    }
    // Ping
    else if (/path=\/admin\/ping/.test(line)) {
        return '<div class="solr-ping">PING CHECK</div>';
    }
}