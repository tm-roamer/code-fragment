'use strict';

/**
 *  数据请求响应接口
 *     描述: ptio = ptmind input output
 *     浏览器兼容性: ie9+
 *      * 支持 全局错误处理
 *      * 支持 ajax请求 get, post, put, delete
 *      * 支持 ajax的promise的请求, get, post, put, delete
 *      * 支持 页面顶部loader进度条 ie10+
 *      * 支持 jsonp
 *      * 支持 socket ie10+                                    ??? 欠测试 ???
 *      * 支持 cors ie8,ie9使用XDomainRequest, 其他使用xhr       ??? 欠测试 ???
 *      ? comet 短轮询, 长轮询, 流, 都要支持
 *      ? 遗弃单页面应用中切换menu后请求中返回的数据, 新提交覆盖旧提交
 *      ? promise 的处理不够优雅, 需要兼容很多主流promise插件, 还需要完善, 或者依赖一个promise插件
 *      ? 尽量兼容支持$http语法, shim
 *      ? 支持打包 require commonjs es6打包
 *      ? 改成es6写法
 *      ? 托管所有的请求地址, 自动化请求 ? 请求队列
 */
(function (parent) {

    // 常量
    var XHR_READY_STATE_NO_INIT = 0;    // 请求未初始化
    var XHR_READY_STATE_RUN = 1;        // 请求启动
    var XHR_READY_STATE_SEND = 2;       // 请求发送
    var XHR_READY_STATE_RECEIVE = 3;    // 请求接收
    var XHR_READY_STATE_DONE = 4;       // 请求完成
    var XHR_STATUS_200 = 200;           // HTTP 200
    var XHR_STATUS_304 = 304;           // HTTP 304 缓存
    var XHR_STATUS_404 = 404;           // HTTP 404
    var XHR_STATUS_500 = 500;           // HTTP 500
    var XHR_TYPE_GET = 'GET';           // 阅读资源
    var XHR_TYPE_PUT = 'PUT';           // 更新资源
    var XHR_TYPE_POST = 'POST';         // 插入资源
    var XHR_TYPE_DELETE = 'DELETE';     // 删除资源
    var XHR_TYPE_OPTIONS = 'OPTIONS';   // 列出资源上允许的操作
    var XHR_TYPE_HEAD = 'HEAD';         // 只返回响应头和无响应体
    var XHR_TIMEOUT = 60000;            // 请求超时60s
    var XHR_PREFIX = 'data';            // 请求前缀

    // 默认属性
    var setting = {
        url: '',
        type: 'get',
        async: true,
        user: '',
        password: '',
        data: '',
        success: function(){},
        error: function(){}
    };

    // 全局函数接口
    var global = {
        error: function(){}
    };

    // 页面顶部进度条
    var loader = {
        enable: true,
        progress: function (scale) {
            var kit = this.kit;
            kit.style.visibility = 'visible';
            if (scale >= 100) {
                kit.style.width = scale + '%';
                var self = this;
                setTimeout(function(){
                    self.close();
                },500);
            } else {
                kit.style.width = scale + '%';    
            }
        },
        close: function() {
            var kit = this.kit;
            kit.style.visibility = 'hidden';
            kit.style.width = 0;
        },
        render: function(id, color) {
            var clr = color || '#a2d329',
                id = id || 'ptio-loader',
                kit = this.kit = document.createElement('div');

            kit.setAttribute('id', id);
            kit.style.position = 'fiexd';
            kit.style.zIndex = 2147483647;
            kit.style.top = 0;
            kit.style.width = 0;
            kit.style.height = '2px';
            kit.style.backgroundColor = clr;
            kit.style.transition = 'width, height .5s ease';

            //document.body.removeChild()
            var dom = document.getElementById(id);
            if (dom) {
                document.body.removeChild(dom);    
            }
            document.body.insertBefore(kit, document.body.firstChild);
        }
    };
    // loader.render();

    // 属性拷贝
    function extend(mod) {
        // ????  args 有设计缺陷 如果等于 undefined 就完蛋了 ????
        if (arguments.length <= 1) return mod;
        var opt = {},
            args = Array.prototype.slice.call(arguments, 1);
        args.forEach(function (item, idx, arr) {
            if (typeof item !== 'object') return;
            // 基于mod模型赋值, 多余属性舍弃
            for (var attr in mod) {
                opt[attr] = item[attr] || mod[attr];
            }
        });
        return opt;
    }

    // 装饰
    function before(fn, beforefn) {
        return function () {
            beforefn.apply(this, arguments);
            return fn.apply(this, arguments);
        }
    }

    // 构建请求实例
    function getReqInstance(opt) {
        if (typeof XDomainRequest !== 'undefined' && isCORS(opt.url)) {
            getXDRInstance(opt);
        } else {
            getXHRInstance(opt);
        }
    }

    // 判断是否跨域资源共享
    function isCORS(url) {
        var pattern = /^http/img;
        return pattern.test(url || '');
    }

    // 构建xdr请求实例(针对ie8,ie9的cros优化), 
    function getXDRInstance(opt) {
        var xdr = new XDomainRequest();
        xdr.onload = function() {
            xdr.responseText;
        }
        xdr.timeout = XHR_TIMEOUT;
        xdr.ontimeout = function() {
        }
        xdr.onerror = function() {
        }
        xdr.open(opt.type, opt.url);
        xdr.send(opt.data);
    }

    // 构建xhr请求实例
    function getXHRInstance(opt) {
        var xhr = new XMLHttpRequest();
        // readyState改变就会进入
        xhr.onreadystatechange = function (e) {
            if (xhr.readyState !== XHR_READY_STATE_DONE ) return;
            try {
                if (xhr.status === XHR_STATUS_200 || xhr.status === XHR_STATUS_304 ) {
                    opt.success && opt.success(xhr.responseText);
                } else {
                    opt.error && opt.error(xhr.status);
                    global.error && global.error(xhr.status);
                }
            } catch(evt) {
                throw('ptio xhr evt=' + evt);
                xhr.abort();
            }
        };
        xhr.onerror = function() {
            throw('ptio xhr error'); // access-control-allow-origin
            xhr.abort();
        };
        xhr.ontimeout = function () {
            xhr.abort();
        };
        xhr.onprogress = function(event) {
            if (event.lengthComputable) {
                var scale = (event.loaded/event.total*100).toFixed(2);
                // 执行loader进度条
                if (loader.enable) {
                    if (!loader.kit) loader.render()
                    loader.progress(scale);
                }
            }
        };
        // xhr.upload.onprogress = function(e) {};
        opt.type = (opt.type).toUpperCase();
        setRequestUrl.call(opt);
        xhr.open(opt.type, opt.url, !!opt.async, opt.user, opt.password);
        xhr.timeout = XHR_TIMEOUT;
        setRequestHeader.call(xhr, opt.type);
        xhr.send(setSendData.call(opt));
    }

    // 设置get请求的url拼接
    function setRequestUrl() {
        if (this.type === XHR_TYPE_GET || this.type === XHR_TYPE_DELETE) {
            var param = '';
            if (typeof this.data === 'string') {
                param = this.data;
            } else if (typeof this.data === 'object' && this.data !== null) {
                // 自动过滤函数
                param = JSON.stringify(this.data);
            }
            this.url = param ? this.url + '?' + XHR_PREFIX + '=' + encodeURIComponent(param)  : this.url;
        }
    }

    // 设置请求类型
    function setRequestHeader(type) {
        if (type === XHR_TYPE_POST || type === XHR_TYPE_PUT) {
            this.setRequestHeader('Content-Type', 'application/json');
        }
        //xhr.setRequestHeader('token', 'token');
    }

    // 设置请求数据
    function setSendData() {
        if (this.type === XHR_TYPE_POST || this.type === XHR_TYPE_PUT) {
            // ?????????????? 这里需要进行字符串判断 ????????????????
            return JSON.stringify(this.data);
        }
    }

    function getSocketInstance(opt) {
        var socket = new WebSocket(opt.url);
        // socket.readyState
        WebSocket.OPENING;  // 0 正在建立连接
        WebSocket.OPEN;     // 1 已经建立连接
        WebSocket.CLOSING;  // 2 正在关闭连接
        WebSocket.CLOSE;    // 3 已经关闭连接
        socket.onopen = function(evt) {
        }
        socket.onmessage = function(evt) {
            var data = evt.data;    // 返回的数据, 纯文本 JSON.parse
        }
        socket.onerror = function(evt) {
            socket.close();
        }
        socket.onclose = function(evt) {
            evt.wasClean;   // boolean型, 表示连接是否已经明确关闭
            evt.code;       // 是服务器返回的数值状态码
            evt.reason;     // 是服务器返回的消息
        }
        socket.send(opt.data); // 纯文本 JSON.stringify
    }

    //------------ public function ---------------//

    function jsonp(conf) {
        function handle(response) {
            conf.success(response);
            delete window[name];    
        };
        var name = 'ptio' + '_' + new Date().getTime() + '_' + parseInt(Math.random() * 10e8) + parseInt(Math.random() * 10e8);
        window[name] = handle;
        var script = document.createElement('script');
        script.setAttribute('id','ptio-jsonp');
        script.src = conf.url + '?callback='+ name + '&data=' + encodeURIComponent(JSON.stringify(conf.data));
        var dom = document.getElementById('ptio-jsonp');
        if (dom) {
            document.body.removeChild(dom);    
        }
        document.body.insertBefore(script, document.body.firstChild);
    }

    function socket(conf) {
        getSocketInstance(conf);
    }

    function req(conf) {
        getXHRInstance(extend(setting, conf));
    }

    function reqPromise(conf, deferred) {
        // try {
        //     typeof Promise !== 'undefined'
        // } catch(evt) {
        //     var Promise = deferred;
        // }
        var promise = new Promise(function(resolve, reject) {
            var opt = extend(setting, conf);
            if (typeof opt.success === 'function')
                opt.success = before(opt.success, resolve);
            if (typeof opt.error === 'function')
                opt.error = before(opt.error, reject);
            getXHRInstance(opt);
        });
        return promise;
    }

    function globalFun(conf) {
        global = extend(conf);
    }

    parent && (parent.io = {
        global: globalFun,
        req: req,
        reqPromise: reqPromise,
        socket: socket,
        jsonp: jsonp
    });

})(window.pt || window);

