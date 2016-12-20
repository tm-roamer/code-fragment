'use strict';
/**
 * Copyright (c) 2016 tm-roamer
 * version: 1.0.0
 * 支持: requirejs和commonjs和seajs, 
 */
;(function (parent, fun) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = fun();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(fun);
    } else if (typeof define === 'function' && typeof define.cmd === 'object') {
        define(fun);
    } else {
        parent.mark = fun();
    }
})(window.pt || window, function (mark) {

    // 常量
    var THROTTLE_TIME = 20;                                // 节流函数的间隔时间单位ms, FPS = 1000 / THROTTLE_TIME
    var MARK = 'pt-mark';                                  // 标识块的classname
    var MARK_TOP = 'pt-mark-top';                          // 标识块上线的classname
    var MARK_LEFT = 'pt-mark-left';                        // 标识块左线的classname
    var MARK_RIGHT = 'pt-mark-right';                      // 标识块右线的classname
    var MARK_BOTTOM = 'pt-mark-bottom';                    // 标识块下线的classname
    var MARK_INFO = 'pt-mark-info';                        // 标识块的描述信息

    var nodeNames = [
        "ABBR", "LABEL", "IMG", "EM", "B",
        "SPAN", "CODE",
        "INPUT", "TEXTAREA", "SELECT",
        "STRONG"
    ];

    var style = {
        pos: "position: absolute;z-index: 2147483647;",
        bg: "background-color: red;",
        font: "font-size:12px;color:red;",
        show: "visibility: visible;",
        // hide: "visibility: hidden;",
        hide: "display: none",
        h: "height: 1px;",
        w: "width: 1px;"
    };

    // 节流函数
    function throttle(now) {
        var time = new Date().getTime();
        throttle = function(now) {
            if ( now - time > THROTTLE_TIME ) {
                time = now;
                return true;
            }
            return false;
        };
        throttle(now);
    }

    // 检测点与矩形碰撞
    function checkHit(dot, node) {
        var result = false;
        if (node.x <= dot.x && dot.x <= node.x + node.w) {
            if (node.y <= dot.y && dot.y <= node.y + node.h ) {
                result = true;
            }
        }
        return result;
    }

    // 统计dom数量
    function getDomCount(dom, count) {
        var children = dom.children,
            len = children.length;
        count += 1;
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                count = getDomCount(children[i], count);
            }
        }
        return count;
    }

    // 事件处理对象
    var handleEvent = {
        init: function(isbind) {
            if (this.isbind) return;
            this.isbind = isbind;
            this.unbindEvent();
            this.bindEvent();
        },
        // 绑定监听
        bindEvent: function() {
            document.addEventListener('mouseover', this.mouseover, true);
            document.addEventListener('mouseout', this.mouseout, true);
            this.isbind = true;
        },
        // 移除监听
        unbindEvent: function() {
            document.removeEventListener('mouseover', this.mouseover, true);
            document.removeEventListener('mouseout', this.mouseout, true);
            this.isbind = false;
        },
        mouseover: function (event) {
            // var target = event.target;
            // if (target.className.indexOf('pt-mark') !== -1) return;
            // var x = event.pageX - event.offsetX,
            //     y = event.pageY - event.offsetY,
            //     w = target.clientWidth,
            //     h = target.clientHeight;
            // // 当 clientWidth = 0, clientHeight = 0; 猜测应该不是块级元素
            // if (w == 0 && h == 0) {
            //     w = target.offsetWidth;
            //     h = target.offsetHeight;
            // }
            // if (target.nodeName === "A") {
            //     // 没有发生碰撞
            //     if(!checkHit({x: event.pageX, y: event.pageY}, {x: x, y: y, w: w, h: h})) {
            //         var offset = view.getOffset(target);
            //         x = offset.left;
            //         y = offset.top;
            //     }
            // }
            // else if (nodeNames.indexOf(target.nodeName) !== -1) {
            //     // 没有发生碰撞, 情况2
            //     if (!checkHit({x: event.pageX, y: event.pageY}, {x:x,y:y,w:w,h:h})) {
            //         x = event.pageX - target.offsetLeft;
            //         y = event.pageY - target.offsetTop;
            //         // 没有发生碰撞, 情况3
            //         if (!checkHit({x: event.pageX, y: event.pageY}, {x:x,y:y,w:w,h:h})) {
            //             x = event.pageX - event.offsetX;
            //             // y = offset.top;
            //             // // 没有发生碰撞, 情况4
            //             // if (!checkHit({x: event.pageX, y: event.pageY}, {x:x,y:y,w:w,h:h})) {
            //             //     // x = event.pageX - event.offsetX;
            //             //     y = offset.top;
            //             // }
            //         }
            //     }
            //     // // 没有发生碰撞, 情况1
            //     // if(!checkHit({x: event.pageX, y: event.pageY}, {x: x, y: y, w: w, h: h})) {
            //     //     var offset = view.getOffset(target);
            //     //     x = offset.left;
            //     //     y = offset.top;
            //     // }
            // }
            var target = event.target;
            // if (target.className.indexOf('pt-mark') !== -1) return;
            var rect = target.getBoundingClientRect();
            view.show(rect.left,
                rect.top,
                rect.width,
                rect.height,
                target.nodeName); // +" "+target.className
        },
        mouseout: function(event) {
            view.hide()
        }
    };

    var view = {
        init: function() {
            var body = document.body,
                info = document.createElement('div'),
                top = document.createElement('div'),
                left = document.createElement('div'),
                right = document.createElement('div'),
                bottom = document.createElement('div');
            top.className = MARK + ' ' + MARK_TOP;
            left.className = MARK + ' ' + MARK_LEFT;
            right.className = MARK + ' ' + MARK_RIGHT;
            bottom.className = MARK + ' ' + MARK_BOTTOM;
            body.appendChild(info);
            body.appendChild(top);
            body.appendChild(left);
            body.appendChild(right);
            body.appendChild(bottom);
            this.line = {
                top: top,
                left: left,
                right: right,
                bottom: bottom,
                info: info
            };
        },
        getOffset: function(node, offset) {
            if (!offset) offset = {top: 0, left: 0};
            if (node === null || node === document) return offset;
                offset.top += node.offsetTop;
                offset.left += node.offsetLeft;
            return this.getOffset(node.offsetParent, offset);
        },
        create: function() {},
        remove: function() {
            var body = document.body;
            body.removeChild(line.top);
            body.removeChild(line.left);
            body.removeChild(line.right);
            body.removeChild(line.bottom);
            return this;
        },
        show: function(x, y, w, h, text) {
            var line = this.line;
            var top = y < 12 ? y+h-1 : y-12;
            line.info.innerText = text;
            line.info.style.cssText = style.pos+style.font+';top:'+(top)+'px;left:'+x+'px;';
            line.top.style.cssText = style.pos+style.bg+style.h+';top:'+y+'px;left:'+x+'px;width:'+(w-1)+'px;';
            line.left.style.cssText = style.pos+style.bg+style.w+';top:'+y+'px;left:'+x+'px;height:'+(h-1)+'px;';
            line.right.style.cssText = style.pos+style.bg+style.w+';top:'+y+'px;left:'+(x+w-1)+'px;height:'+(h-1)+'px;';
            line.bottom.style.cssText = style.pos+style.bg+style.h+';top:'+(y+h-1)+'px;left:'+x+'px;width:'+(w)+'px;';
        },
        hide: function() {
            var line = this.line;
            line.info.style.cssText += style.hide;
            line.top.style.cssText += style.hide;
            line.left.style.cssText += style.hide;
            line.right.style.cssText += style.hide;
            line.bottom.style.cssText += style.hide;
        }
    };

    view.init();
    handleEvent.init(true);


    var mark = {
        version: '1.0.0',
        getDomCount:getDomCount
    };

    return mark;
});