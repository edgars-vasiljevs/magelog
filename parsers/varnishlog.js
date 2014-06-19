var dataBuffer = {},

    requestTemplate = '<div class="varnish-request">' +
                          '<div>' +
                              '<span class="varnish-from-{{class}}">' +
                                  '{{from}}' +
                              '</span>' +
                              '<span>{{link}}</span>' +
                          '</div>' +
                          '{{hashes}}' +
                      '</div>',

    hashTemplate = '<div class="varnish-hash">' +
                       '<span class="varnish-from-{{class}}">' +
                           '{{from}}' +
                       '</span>' +
                       '<span>{{items}}</span>' +
                   '</div>';

function Hash() {
    this.items = [];
    this.hit = false;
    this.pipe = false;
    return this;
}

function getFrom(hash, lower) {
    var from = hash.pipe ? 'Pipe' : (hash.hit ? 'Cache' : 'Server');
    return lower ? from.toLowerCase() : from;
}

function printLine(data) {
    delete dataBuffer[data.id];

    // Get URL
    var url = data.uniqueTags.RxURL || data.uniqueTags.TxURL;
    if (!url) {
        return 'No URL found';
    }

    var hashes = [],
        hash = new Hash();


    data.tags.forEach(function(value, index) {
        var tag = value[0],
            value = value[1];

        if (tag == 'VCL_call' && value.match(/^recv /)) {
            hash = new Hash();
        }

        if (tag == 'Hash') {
            hash.items.push(value);
        }

        if (tag == 'VCL_call' && value.match(/^miss /)) {
            hash.hit = false;
            hashes.push(hash);
        }
        else if (tag == 'Hit') {
            hash.hit = true;
            hashes.push(hash);
        }
        else if (tag == 'HitPass') {
            hash.hit = true;
            hashes.push(hash);
        }
        else if (tag == 'VCL_call' && value == 'pipe pipe') {
            hash.pipe = true;
            hashes.push(hash);
        }

    });

    var context = {
        link: url
    };

    if (hashes.length <= 1) {
        context.hashes = '';
        context.from = getFrom(hashes[0]);
        context.class = getFrom(hashes[0], true);
    }
    else {
        // If multiple lookups, get main lookup
        for(var i in hashes) {
            var hash = hashes[i]
            if (hash.items.indexOf(url) !== -1) {
                context.from = getFrom(hash);
                context.class = getFrom(hash, true);
                delete hashes[i];
                continue;
            }
        }

        var hashHTML = '';
        hashes.forEach(function(hash, i) {
            var url = '';
            for(var i in hash.items) {
                if (/^\//.test(hash.items[i])) {
                    url = hash.items[i];
                    continue;
                }
            }

            hashHTML += Mark.up(hashTemplate, {
                from: getFrom(hash),
                class: getFrom(hash, true),
                items: url
            });
        });

        context.hashes = hashHTML;
    }

    return Mark.up(requestTemplate, context);
}

module.exports = function(line) {

    /^\s*(\d+)\s+([^ ]+)\s+(c|b)\s+(.*)$/.test(line);

    var id = RegExp.$1,
        tag = RegExp.$2,
        side = RegExp.$3,
        value = RegExp.$4;

    // Catch start of a request
    if (tag == 'ReqStart') {
        value.match(/^([^ ]+) (\d+) (\d+)/);
        dataBuffer[id] = {
            tags: [],
            uniqueTags: {},
            side: side,
            id: id,
            xid: RegExp.$3,
            clientIp: RegExp.$1
        };
    }

    // Push info to current buffer
    if (dataBuffer[id]) {
        dataBuffer[id].tags.push([tag, value]);
        dataBuffer[id].uniqueTags[tag] = value;

        // Client request finished
        if (dataBuffer[id].uniqueTags.ReqEnd) {
            return printLine(dataBuffer[id]);
        }
    }

    return false;
}