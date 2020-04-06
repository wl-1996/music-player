var EventCenter = {
    on: function (type, handler) {
        $(document).on(type, handler);
    },
    fire: function (type, data) {
        $(document).trigger(type, data);
    }
};

// EventCenter.on('hello', function(e, data){
//   console.log(data);
// })
//
// EventCenter.fire('hello', '你好')


var Footer = {
    init: function () {
        this.$footer = $('footer');
        this.$ul = this.$footer.find('ul');
        this.$box = this.$footer.find('.box');
        this.$leftBtn = this.$footer.find('.icon-left');
        this.$rightBtn = this.$footer.find('.icon-right');
        //isToEnd表示向右滚动是否到头
        this.isToEnd = false;
        //isToStart表示向左滚动是否到头
        this.isToStart = true;
        //isAnimate表示当前ul是否在运动
        this.isAnimate = false;

        this.bind();
        this.render();
    },

    bind: function () {
        var _this = this;

        //点击底部轮播图右按钮时做的事情：
        this.$rightBtn.on('click', function () {
            console.log('右按钮被点击啦');
            if (_this.isAnimate) return;
            //outerWidth表示获取元素集合中第一个元素的当前计算宽度值,包括padding，border和选择性的margin。
            //true表示包括外边距
            var itemWidth = _this.$box.find('li').outerWidth(true);
            // Math.floor() 返回小于或等于一个给定数字的最大整数。
            var rowCount = Math.floor(_this.$box.width() / itemWidth);
            //如果向右滚动没有到头就继续做下边的事
            if (!_this.isToEnd) {
                _this.isAnimate = true;
                _this.$ul.animate({
                    left: '-=' + rowCount * itemWidth
                }, 400, function () {
                    _this.isAnimate = false;
                    _this.isToStart = false;
                    //判断是否向右拉到头了
                    if (parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))) {
                        _this.isToEnd = true;
                    }
                });
            }
        });

        //点击底部轮播图左按钮时做的事情：
        this.$leftBtn.on('click', function () {
            console.log('左按钮被点击啦');
            if (_this.isAnimate) return;
            var itemWidth = _this.$box.find('li').outerWidth(true);
            var rowCount = Math.floor(_this.$box.width() / itemWidth);
            //如果向左滚动没有到头
            if (!_this.isToStart) {
                _this.isAnimate = true;
                _this.$ul.animate({
                    left: '+=' + rowCount * itemWidth
                }, 400, function () {
                    _this.isAnimate = false;
                    _this.isToEnd = false;
                    //如果ul的left>=0，说明向左滚动到头了
                    if (parseFloat(_this.$ul.css('left')) >= 0) {
                        _this.isToStart = true;
                    }
                });
            }
        });

        //点击底部轮播图每一项时做的事情
        //这里的事件监听要用on代理监听，因为li是发送请求后获取的数据
        //直接用click监听的话会监听不到，详情见谷歌
        this.$footer.on('click', 'li', function () {
            console.log('li被点击啦');
            //这里的this指的是被点击的li元素
            $(this).addClass('active')
                .siblings().removeClass('active');
            EventCenter.fire('select-albumn', {
                //我想问这里的this指的是谁？
                //是EventCenter这个对象么？
                //还是当前点击的li元素？
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name')
            });
        });
    },

    render() {
        //this重新赋值因为下边的JSON请求数据后回调函数里的this会发生改变
        var _this = this;
        $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
            .done(function (ret) {
                console.log(ret);
                _this.renderFooter(ret.channels);
            }).fail(function () {
            console.log('error');
        });
    },

    renderFooter: function (channels) {
        console.log(channels);
        var html = '';
        channels.forEach(function (channel) {
            html += '<li data-channel-id=' + channel.channel_id + ' data-channel-name=' + channel.name + '>'
                + '<div class="cover" style="background-image:url(' + channel.cover_small + ')"></div>'
                + '<h3>' + channel.name + '</h3>'
                + '</li>';
        });
        //把上边的html变量放到ul元素的html里，替换原有的html内容
        //这是jQuery的API
        this.$ul.html(html);
        //把新的html内容渲染到ul里后如果渲染的得到的li太多，ul原有的宽度不够，就需要重新设置ul的宽度
        //因此调用setStyle方法
        this.setStyle();
    },

    setStyle: function () {
        //获取现在footer里li的个数
        var count = this.$footer.find('li').length;
        //获取li的外部宽度
        //outerWidth表示获取元素集合中第一个元素的当前计算宽度值,包括padding，border和选择性的margin。
        //true表示包括外边距
        var width = this.$footer.find('li').outerWidth(true);
        this.$ul.css({
            width: count * width + 'px'
        });
    }
};


var Fm = {
    init: function () {
        this.$container = $('#page-music');
        this.audio = new Audio();
        this.audio.autoplay = true;

        this.bind();
    },

    bind: function () {
        var _this = this;
        //EventCenter第一行声明的对象，有on和fire两个方法
        //on接受两个参数：type和handler
        EventCenter.on('select-albumn', function (e, channelObj) {
            _this.channelId = channelObj.channelId;
            _this.channelName = channelObj.channelName;
            //调用FM对象的loadMusic方法
            _this.loadMusic();
        });

        //点击播放暂停按钮时
        this.$container.find('.btn-play').on('click', function () {
            //这里的this指的是监听的.btn-play元素
            var $btn = $(this);
            //如果有icon-play类，即在暂停状态
            //但我觉得如果有icon-play类，应该是处于播放状态
            //但没办法，css是这样封装的，我用的别人的css
            if ($btn.hasClass('icon-play')) {
                $btn.removeClass('icon-play').addClass('icon-pause');
                _this.audio.play();
            } else {
                $btn.removeClass('icon-pause').addClass('icon-play');
                _this.audio.pause();
            }
        });

        //点击下一曲按钮时
        this.$container.find('.btn-next').on('click', function () {
            _this.loadMusic();
        });

        //原生JS写法addEventListener，也可以用onPlay监听音乐播放事件
        //为什么用原生API？因为this.audio不是jQuery对象
        this.audio.addEventListener('play', function () {
            //清除定时器
            //有时候没有点击暂停，而是点击下一曲有开始播放，又被监听了，又生成了一个定时器
            //那么就需要首先清除定时器，然后再生成新的定时器
            clearInterval(this.statusClock);
            //设置定时器，每隔1s就调用updateStatus方法更新进度栏的进度
            _this.statusClock = setInterval(function () {
                _this.updateStatus();
            }, 1000);
            console.log('音乐正在播放')
        });

        this.audio.addEventListener('pause', function () {
            clearInterval(_this.statusClock);
            console.log('音乐已经暂停');
        });

    },

    loadMusic(callback) {
        var _this = this;
        console.log('loadMusic...');
        //获取数据，jQuery的API，也可以用.ajaxAPI
        // 使用一个HTTP GET请求从服务器加载JSON编码的数据。
        $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php', {channel: this.channelId}).done(function (ret) {
            console.log(ret)
            //ret是从服务器获取的数据，是一个对象，对象有一个song属性
            //song属性值是一个数组，形如：{song: []}
            _this.song = ret['song'][0];
            _this.setMusic();
            _this.loadLyric();
        });
    },

    loadLyric() {
        var _this = this;

        //通过sid发送查询歌词请求
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php', {sid: this.song.sid}).done(function (ret) {
            console.log('下面是获取到的歌词对象')
            console.log(ret)
            var lyric = ret.lyric;
            //下面是获取到的歌词
            console.log(lyric)
            var lyricObj = {};
            lyric.split('\n').forEach(function (line) {
                //[01:10.25][01:20.25]It a new day
                var times = line.match(/\d{2}:\d{2}/g);
                //times == ['01:10.25', '01:20.25']
                var str = line.replace(/\[.+?\]/g, '');
                if (Array.isArray(times)) {
                    times.forEach(function (time) {
                        lyricObj[time] = str;
                    });
                }
            });
            _this.lyricObj = lyricObj;
        });
    },

    setMusic() {
        console.log('set music...');
        console.log(this.song);
        this.audio.src = this.song.url;
        $('.bg').css('background-image', 'url(' + this.song.picture + ')');
        this.$container.find('.aside figure').css('background-image', 'url(' + this.song.picture + ')');
        this.$container.find('.detail h1').text(this.song.title);
        this.$container.find('.detail .author').text(this.song.artist);
        this.$container.find('.tag').text(this.channelName);
        this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-pause');
    },

    updateStatus() {
        //min表示分钟数
        var min = Math.floor(this.audio.currentTime / 60);
        //second表示秒
        var second = Math.floor(Fm.audio.currentTime % 60) + '';
        //判断秒的个数，如果是一位，就在前边加个0
        //最后边加空格表示把数字转变为字符串
        second = second.length === 2 ? second : '0' + second;
        //更新当前播放时间
        this.$container.find('.current-time').text(min + ':' + second);
        //更新进度条，通过css来设置
        this.$container.find('.bar-progress').css('width', this.audio.currentTime / this.audio.duration * 100 + '%');

        var line = this.lyricObj['0' + min + ':' + second];
        if (line) {
            this.$container.find('.lyric p').text(line)
                .boomText();
        }
    }
};


$.fn.boomText = function (type) {
    type = type || 'rollIn';
    console.log(type);
    this.html(function () {
        var arr = $(this).text()
            .split('').map(function (word) {
                return '<span class="boomText">' + word + '</span>';
            });
        return arr.join('');
    });

    var index = 0;
    var $boomTexts = $(this).find('span');
    var clock = setInterval(function () {
        $boomTexts.eq(index).addClass('animated ' + type);
        index++;
        if (index >= $boomTexts.length) {
            clearInterval(clock);
        }
    }, 300);
};

Footer.init();
Fm.init();

