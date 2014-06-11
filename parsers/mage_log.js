module.exports = function(line) {
    if (/^([^ ]+) ([^ ]+) \((\d+)\): (.*)/g.test(line)) {
        var messageLabels = {
            0 : 'EMERGENCY',
            1 : 'ALERT',
            2 : 'CRITICAL',
            3 : 'ERROR',
            4 : 'WARNING',
            5 : 'NOTICE',
            6 : 'INFO',
            7 : 'DEBUG'
        };

        var level = RegExp.$3,
            message = RegExp.$4;

        var messageTemplate = '<div class="mage-system-message">' +
                                   '<span class="mage-system-level mage-system-level-{{level}}">{{label}}</span>' +
                                   '{{message}}' +
                               '</div>';

        return Mark.up(messageTemplate, {
            message: message,
            label: messageLabels[level],
            level: level
        });
    }
    else {
        return line;
    }


}