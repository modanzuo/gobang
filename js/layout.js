/*
 魔丹座
 2015/11/11
 QQ :767811128
 */
!function (userAgent) {
    var screen_w = parseInt(window.screen.width), scale = screen_w / 640;
    if (/Android (\d+\.\d+)/.test(userAgent)) {
        var version = parseFloat(RegExp.$1);
        document.write(version > 2.3 ? '<meta name="viewport" content="width=640, initial-scale = ' + scale + ',user-scalable=1, minimum-scale = ' + scale + ', maximum-scale = ' + scale + ', target-densitydpi=device-dpi">' : '<meta name="viewport" content="width=640, target-densitydpi=device-dpi">');
    } else {
        document.write('<meta name="viewport" content="width=640, initial-scale = ' + scale + ' ,minimum-scale = ' + scale + ', maximum-scale = ' + scale + ', user-scalable=no, target-densitydpi=device-dpi">');
    }
}(navigator.userAgent);