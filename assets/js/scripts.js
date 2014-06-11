var UI = {
    lastActive: null,
    itemCount: {},
    totalItems: 0,
    socketAddress: 'ws://localhost:8082/',
    sh: null,
    init: function() {
        UI.status = $('#status');
        UI.items = $('#items');
        UI.socket.connect();
        UI.keyBinds();
    },
    socket: {
        connect: function() {
            UI.sh = new WebSocket(UI.socketAddress);
            UI.sh.onopen = UI.socket.onOpen;
            UI.sh.onclose = UI.socket.onClose;
            UI.sh.onmessage = UI.socket.onMessage;
        },
        onOpen: function(){
            UI.status.removeClass('fa-minus-circle');
            UI.status.addClass('fa-check-circle');
            UI.sh.send('start');
        },
        onClose: function(){
            UI.status.removeClass('fa-check-circle');
            UI.status.addClass('fa-minus-circle');

            // try reconnecting every 2 seconds
            // if success, reload page
            setInterval(function() {
                new WebSocket(UI.socketAddress)
                    .onopen = function() {
                    window.location.reload();
                };
            }, 2000);
        },
        onMessage: function(msg){
            var json = JSON.parse(msg.data);
            UI[json.action](json);
        }
    },
    keyBinds: function() {
        $(document).keyup(function(e) {
            if (e.keyCode == 27) {
                UI.reset();
            }
            if (e.keyCode == 13) {
                $('.content').each(function() {
                    var sep = $('<span/>')
                        .addClass('separator')
                        .html(new Date());

                    $(this).append(sep);
                });
                UI.scrollDown();
            }
        });
    },
    reset: function() {
        $('.content > div').remove();
        $('.content > span').remove();
        $('i.num').removeClass('new').html('0');
        UI.totalItems = 0;
        Object.keys(UI.itemCount).forEach(function(key) {
            UI.itemCount[key] = 0;
        });

        UI.updateTitle();
    },
    prepareId:function(id) {
        return id.toLowerCase().replace(' ', '_');
    },
    getLi:function(id) {
        return $('#item_' + id);
    },
    getContent:function(id) {
        return $('#content_' + id);
    }  ,
    send: function(socket, json) {
        socket.send(JSON.stringify(json));
    },
    isLiActive: function(id) {
        return UI.getLi(id).hasClass('active');
    },
    scrollDown: function(id) {

        if (!id) {
            $('.content').each(function() {
                $(this).scrollTop(
                    this.scrollHeight
                );
            });
            return;
        }

        var content = UI.getContent(id);
        content.scrollTop(
            content[0].scrollHeight
        );
    },
    updateTitle:function() {
        if (UI.totalItems > 0) {
            document.title = 'Magelog (' + UI.totalItems + ')';
        }
        else {
            document.title = 'Magelog';
        }
    },
    css: function(data) {
        $('<link />')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', data.path)
            .appendTo('head');
    },
    line: function(json) {

        this.totalItems++;

        var id = this.prepareId(json.id);

        if (!json.line) {
            return;
        }

        UI.getContent(id).append(
            $('<div />').html(json.line)
        );

        UI.scrollDown(id);

        UI.itemCount[id]++;
        UI.getLi(id).find('i').html(
            UI.itemCount[id]
        );

        if (!UI.isLiActive(id)) {
            UI.getLi(id)
                .find('i')
                .addClass('new');
        }

        UI.updateTitle();
    },
    itemClick:function(id) {
        $('.content').hide();

        if (UI.lastActive) {
            UI.lastActive.removeClass('active');
        }
        UI.lastActive = $('#item_' + id)
            .addClass('active');

        UI.lastActive.find('i')
            .removeClass('new');

        $('#content_' + id).show();

        UI.scrollDown(id);

        return false;
    },
    createItem: function(json) {
        var id = this.prepareId(json.id);
        if (UI.lastActive) {
            UI.lastActive.removeClass('active');
        }
        UI.lastActive = $('<li />')
            .attr('id', 'item_' + id)
            .addClass('active')
            .html(
                $('<a />')
                    .on('click', function() {
                        return UI.itemClick(id)
                    })
                    .html(json.id)
                    .append('<i class="num">0</i>')
            ).appendTo(UI.items);

        $('.content').hide();

        $('<div />')
            .addClass('content')
            .attr('id', 'content_' + id)
            .appendTo('body');

        UI.itemCount[id] = 0;
    }
};

$(UI.init);