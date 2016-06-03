$(function () {
    $("body").on("tap", function (e) {
        e.preventDefault();
    })
    $("body").on("touchmove", function (e) {
        e.preventDefault();
    });
    var socket;
    var game = {
        $root: $("#mycanvas"),
        context: '',   //画布
        lineH: 30,   //行高
        margin: 90,   //边距
        is_over: false,    //是否结果
        location: [],    //棋盘位置
        who: 1,           //当前到谁
        me_who: 0,         //我是黑还是白    （1黑，2白）
        steps: [],        //记录步骤
        seconds: [15 * 60, 15 * 60],       //游戏总时间 分
        steps_second: 60,         //每步时间 秒
        Computer: [],         //算法
        Player: [],            //人算法
        rival: {},            //对手
        drawLine: function () {
            var me = this;
            var context = me.context;

            me.context.beginPath();
            me.context.strokeStyle = "#000";
            me.context.fillStyle = "#afc";
            me.context.fillRect(me.margin, me.margin, 14 * me.lineH, 14 * me.lineH);
            me.context.closePath();
            for (var i = 0; i < 15; i++) {
                //
                context.beginPath();
                context.moveTo(me.margin, i * me.lineH + me.margin);
                context.lineTo(14 * me.lineH + me.margin, i * me.lineH + me.margin);
                context.closePath();
                context.stroke();
                //
                context.beginPath();
                context.moveTo(i * me.lineH + me.margin, me.margin);
                context.lineTo(i * me.lineH + me.margin, 14 * me.lineH + me.margin);
                context.closePath();
                context.stroke();

            }

        },
        drawWord: function () {
            //写字
            var me = this;
            me.context.font = "60px Arial";
            me.context.fillText("五子棋", me.lineH * 7, 50);
            for (var i = 0; i < 15; i++) {
                me.context.font = "18px Arial";
                me.context.fillText(i, 90 + i * 30 - 10, 90 - 10);
                me.context.fillText(String.fromCharCode(i + 65), 90 - 25, 90 + i * 30 + 5);
            }
        },
        drawboardPoint: function () {
            //画棋盘实心圆
            var me = this;
            var color = "#000";
            var r = 5;
            var d = [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]];
            for (var i = 0; i < d.length; i++) {
                me.context.fillStyle = color;
                me.context.beginPath();
                me.context.arc(d[i][0] * me.lineH + me.margin, d[i][1] * me.lineH + me.margin, r, 0, Math.PI * 2, true);
                me.context.closePath();
                me.context.fill();
            }
        },
        drawPoint: function () {
            //画实心圆
            var me = this;
            var color;
            var r = 15;
            for (var i = 0; i < me.location.length; i++) {
                for (var j = 0; j < me.location[i].length; j++) {
                    if (me.location[i][j] == 0) {
                        continue;
                    }
                    me.location[i][j] == 1 ? (color = "#000") : ( color = "#fff");
                    me.context.fillStyle = color;
                    me.context.beginPath();
                    me.context.arc(i * me.lineH + me.margin, j * me.lineH + me.margin, r - 1, 0, Math.PI * 2, true);
                    me.context.closePath();
                    me.context.fill();
                    me.context.strokeStyle = "#000";
                    me.context.lineWidth = 1;
                    me.context.beginPath();
                    me.context.arc(i * me.lineH + me.margin, j * me.lineH + me.margin, r, 0, Math.PI * 2, true);
                    me.context.closePath();
                    me.context.stroke();
                }
            }
        },
        Judge: function (who, x, y) {
            //判断是否赢
            var me = this;
            var cross = 0;
            //判断横向是否有5子
            for (var i = x; i < 15; i++) {
                if (me.location[i][y] != who) {
                    break;
                }
                cross++;
            }
            for (var i = (x - 1) <= 0 ? 0 : (x - 1); i >= 0; i--) {
                if (me.location[i][y] != who) {
                    break;
                }
                cross++;
            }

            var vertical = 0;
            //判断竖向是否有5子
            for (var i = y; i < 15; i++) {
                if (me.location[x][i] != who) {
                    break;
                }
                vertical++;
            }
            for (var i = (y - 1) <= 0 ? 0 : (y - 1); i >= 0; i--) {
                if (me.location[x][i] != who) {
                    break;
                }
                vertical++;
            }

            var oblique_l = 0;
            //判左斜向是否有5子  (如\)
            for (var i = x, j = y; i < 15 && j < 15; i++, j++) {
                if (me.location[i][j] != who) {
                    break;
                }
                oblique_l++;
            }
            for (var i = (x - 1) <= 0 ? 0 : (x - 1), j = (y - 1) <= 0 ? 0 : (y - 1); i >= 0 && j >= 0; i--, j--) {
                if (me.location[i][j] != who) {
                    break;
                }
                oblique_l++;
            }

            var oblique_r = 0;
            //判顺斜向是否有5子 (如:/)
            for (var i = x, j = y; i >= 0 && j < 15; i--, j++) {
                if (me.location[i][j] != who) {
                    break;
                }
                oblique_r++;
            }
            for (var i = (x + 1) >= 14 ? 14 : (x + 1), j = (y - 1) <= 0 ? 0 : (y - 1); i < 15 && j >= 0; i++, j--) {
                if (me.location[i][j] != who) {
                    break;
                }
                oblique_r++;
            }

            if (oblique_r >= 5 || oblique_l >= 5 || vertical >= 5 || cross >= 5) {
                if (who == 1) {
                    console.log("五子连珠，黑棋胜")
                    me.win(who, "五子连珠，黑棋胜");
                } else {
                    console.log("五子连珠，白棋胜");
                    me.win(who, "五子连珠，白棋胜");
                }
            }
        },
        play: function () {
            var me = this;
            console.log("1")
            socket.emit("play", {userid: login.userid});
            socket.on("onplay", function (obj) {
                if (obj.star == 1) {
                    me.init();
                    me.is_over = false;
                    me.rival = obj.rival;
                    me.timings();
                    me.me_who = obj.rival.who == 1 ? 2 : 1;
                    console.info(obj);
                } else if (obj.star == 0) {
                    //alert(obj.mes);
                    console.info(obj.mes);
                }
            })


        },
        backChess: function (is_me) {
            is_me = is_me ? is_me : false;
            //悔棋
            var me = this;
            if (me.steps.length >= 1) {
                me.location[me.steps[me.steps.length - 1].x][me.steps[me.steps.length - 1].y] = 0;
                me.location[me.steps[me.steps.length - 2].x][me.steps[me.steps.length - 2].y] = 0;
                me.steps.splice(me.steps.length - 2, 2);
                me.board();
                me.drawPoint();
                !is_me && socket.emit("backChess", {userid: login.userid, who: me.me_who});
            }
        },
        BindEvent: function () {
            //事件绑定
            var me = this;
            me.$root.off();

            //悔棋事件
            me.$root.on("touchend", function (e) {

                var touch = e.touches[0] || e.changedTouches[0];
                if (me.is_over || me.me_who != me.who) {
                    return;
                }
                if (touch.pageX >= 120 + 10 && touch.pageX <= (120 + 100 + 10) && touch.pageY >= (15 * 30 + 70 + 10 + 30) && touch.pageY <= (15 * 30 + 70 + 50 + 10 + 30)) {
                    e.preventDefault();
                    e.stopPropagation();
                    me.backChess();
                }
            });

            //认输事件
            me.$root.on("touchend", function (e) {

                if (me.is_over) {
                    return;
                }


                var touch = e.touches[0] || e.changedTouches[0];
                if (touch.pageX >= 120 + 10 + 110 && touch.pageX <= (120 + 100 + 10 + 110) && touch.pageY >= (15 * 30 + 70 + 10 + 30) && touch.pageY <= (15 * 30 + 70 + 50 + 10 + 30)) {
                    e.preventDefault();
                    e.stopPropagation();
                    me.me_who == 1 ? (me.win(2, "黑棋认输，白棋胜"), console.log("黑棋认输，白棋胜") ) : (me.win(1, "白棋认输,黑棋胜"), console.log("白棋认输,黑棋胜"));
                    //me.win(me.me_who, me.me_who == 1 ? "黑棋认输，白棋胜" : "白棋认输,黑棋胜"), console.log(me.me_who == 1 ? "黑棋认输，白棋胜" : "白棋认输,黑棋胜")
                }
            });

            //开始(重新开始 )

            me.$root.on("touchend", function (e) {
                var touch = e.touches[0] || e.changedTouches[0];
                if (touch.pageX >= 120 + 10 + 110 + 100 && touch.pageX <= (120 + 100 + 10 + 110 + 100) && touch.pageY >= (15 * 30 + 70 + 10 + 30) && touch.pageY <= (15 * 30 + 70 + 50 + 10 + 30)) {

                    if (me.is_over) {
                        e.preventDefault();
                        e.stopPropagation();
                        me.play();

                    }

                }
            });

            //下子事件
            me.$root.on({
                "touchstart": function (e) {
                    if (me.is_over || me.me_who != me.who) {
                        return;
                    }
                    var touch = e.touches[0] || e.changedTouches[0];
                    if (touch.pageX < me.margin || touch.pageY < me.margin || touch.pageX > 15 * 30 + me.margin || touch.pageY > 15 * 30 + me.margin) {
                        return;
                    }
                    var x = parseInt((touch.pageX - 15 - me.margin) / 30);//计算鼠标点击的区域，如果点击了（65，65），那么就是点击了（1，1）的位置
                    var y = parseInt((touch.pageY - 15 - me.margin) / me.lineH);
                    me.who == 1 ? (me.moveChess(1, x, y)) : (me.moveChess(2, x, y));
                },
                "touchmove": function (e) {
                    if (me.is_over || me.me_who != me.who) {
                        return;
                    }
                    var touch = e.touches[0] || e.changedTouches[0];
                    if (touch.pageX < me.margin || touch.pageY < me.margin || touch.pageX > 15 * 30 + me.margin || touch.pageY > 15 * 30 + me.margin) {
                        return;
                    }
                    var x = parseInt((touch.pageX - 15 - me.margin) / 30);//计算鼠标点击的区域，如果点击了（65，65），那么就是点击了（1，1）的位置
                    var y = parseInt((touch.pageY - 15 - me.margin) / 30);
                    me.who == 1 ? (me.moveChess(1, x, y)) : (me.moveChess(2, x, y));
                },
                "touchend": function (e) {
                    if (me.is_over || me.me_who != me.who) {
                        return;
                    }
                    var touch = e.touches[0] || e.changedTouches[0];
                    if (touch.pageX < me.margin || touch.pageY < me.margin || touch.pageX > 15 * 30 + me.margin || touch.pageY > 15 * 30 + me.margin) {
                        return;
                    }
                    var x = parseInt((touch.pageX - 15 - me.margin) / 30);//计算鼠标点击的区域，如果点击了（65，65），那么就是点击了（1，1）的位置
                    var y = parseInt((touch.pageY - 15 - me.margin) / 30);
                    me.who == 1 ? (me.drawChess(1, x, y, true)) : (me.drawChess(2, x, y, true));
                }
            });
        },
        moveChess: function (who, x, y) {
            //移动棋子
            var me = this;
            me.board();
            me.drawPoint();
            var color = "";
            //console.info(x + "," + y);
            var r = 15;
            who = who ? who : me.who;
            who == 1 ? (color = "#000") : ( color = "#fff");
            me.context.strokeStyle = "#000";
            me.context.fillStyle = color;
            me.context.beginPath();
            me.context.arc(x * me.lineH + me.margin, y * me.lineH + me.margin, r - 1, 0, Math.PI * 2, true);
            me.context.closePath();
            me.context.fill();
            me.context.strokeStyle = "#000";
            me.context.lineWidth = 1;
            me.context.beginPath();
            me.context.arc(x * me.lineH + me.margin, y * me.lineH + me.margin, r, 0, Math.PI * 2, true);
            me.context.stroke();
            me.context.closePath();


        },
        roundRect: function (x, y, w, h, r) {

            //圆角矩形
            var me = this;
            me.context.beginPath();
            me.context.strokeStyle = "green";
            me.context.fillStyle = "green";
            me.context.moveTo(x + r, y);
            me.context.arcTo(x + w, y, x + w, y + h / 2, r);
            me.context.arcTo(x + w, y + h, x, y + h, r);
            me.context.arcTo(x, y + h, x, y, r);
            me.context.arcTo(x, y, x + w, y, r);
// this.arcTo(x+r, y);
            me.context.stroke();
            me.context.fill();
            me.context.strokeStyle = "";
            me.context.fillStyle = "";
            me.context.closePath();


        },
        drawChess: function (who, x, y, is_me) {
            is_me = is_me ? is_me : false;
            //画棋
            var me = this;
            if (me.is_over) {
                return;
            }
            if (me.location[x][y] != 0) {
                //return;
            } else {
                who = who ? who : me.who;
                me.who == 1 ? me.who = 2 : me.who = 1;
                me.location[x][y] = who;
                me.steps.push({'x': x, 'y': y});
            }
            me.board();
            me.drawPoint();
            me.timing();
            if (is_me) {
                //下子
                socket.emit("later", {
                    'who': me.me_who, 'x': x, 'y': y, userid: login.userid
                })
            }
            me.Judge(who, x, y);

            //me.who == 2 && me.man_machine();
        },
        buttom: function () {
            var me = this;
            //悔棋
            me.roundRect(120, 15 * 30 + 70 + 30, 100, 50, 10);
            me.context.beginPath();
            me.context.font = "38px Arial";
            me.context.fillStyle = "#adc";
            me.context.fillText("悔棋", 120 + 10, 15 * 30 + 140)
            me.context.closePath();
            //认输
            me.roundRect(230, 15 * 30 + 70 + 30, 100, 50, 10);
            me.context.beginPath();
            me.context.font = "38px Arial";
            me.context.fillStyle = "#adc";
            me.context.fillText("认输", 230 + 10, 15 * 30 + 140);
            me.context.closePath();
            //开始(重新开始)
            me.roundRect(340, 15 * 30 + 70 + 30, 100, 50, 10);
            me.context.beginPath();
            me.context.font = "38px Arial";
            me.context.fillStyle = "#adc";
            me.context.fillText("开始", 340 + 10, 15 * 30 + 140);
            me.context.closePath();
        },
        drawTime: function (h_sp, b_sp, h_st, b_st) {
            /**
             *
             * @type {game}
             */
            var me = this;
            //黑方
            //me.context.strokeStyle = "#000";
            me.context.font = "38px Arial";
            me.context.clearRect(30 * 15 + 80, 120, 150, 30 * 15);
            me.context.beginPath();
            me.context.fillStyle = "#000";
            me.context.fillRect(15 * 30 + 80, 120, 100, 150);
            me.context.fill();
            me.context.fillStyle = "#fff";
            me.context.fillText("黑棋", 15 * 30 + 80 + 10, 120 + 40);
            //me.context.font="23px Arial";
            me.context.fillText(h_sp, 15 * 30 + 80, 120 + 80);
            me.context.fillText(h_st, 15 * 30 + 80, 120 + 80 + 40);
            me.context.closePath();

            //白方
            me.context.beginPath();
            me.context.fillStyle = "#000";
            me.context.fillRect(15 * 30 + 80, 120 + 160, 100, 150);
            me.context.fill();
            me.context.fillStyle = "#fff";
            me.context.fillText("白棋", 15 * 30 + 80 + 10, 120 + 40 + 160);
            //me.context.font="23px Arial";
            me.context.fillText(b_sp, 15 * 30 + 80, 120 + 80 + 160);
            me.context.fillText(b_st, 15 * 30 + 80, 120 + 80 + 160 + 40);
            me.context.closePath();

            me.enemy_us();
        },
        timing: function () {
            //每步计时
            var me = this;
            me.steps_second = 60;
        },
        timings: function () {
            //总时间计时器
            var me = this;
            me.setIFs && clearInterval(me.setIFs);
            me.setIFs = setInterval(function () {
                if (me.is_over) {
                    clearInterval(me.setIFs);
                }
                me.steps_second--;
                if (me.who == 1) {
                    me.seconds[0]--;
                    me.drawTime(me.time_cycle(me.seconds[0]), me.time_cycle(me.seconds[1]), me.time_cycle(me.steps_second), "01:00");
                    if (me.steps_second <= 0||me.seconds[0] <= 0) {
                        clearInterval(me.setIFs);
                        console.log("黑棋超时，白棋胜");
                        me.win(2, "黑棋超时，白棋胜");
                    }
                    //if (me.seconds[0] <= 0) {
                    //    clearInterval(me.setIFs);
                    //    console.log("黑棋超时，白棋胜");
                    //    me.win(2, "黑棋超时，白棋胜");
                    //}
                } else {
                    me.seconds[1]--;
                    me.drawTime(me.time_cycle(me.seconds[0]), me.time_cycle(me.seconds[1]), "01:00", me.time_cycle(me.steps_second));
                    if (me.steps_second <= 0||me.seconds[1] <= 0) {
                        clearInterval(me.setIFs);
                        console.log("白棋超时，黑棋胜");
                        me.win(1, "白棋超时，黑棋胜");
                    }
                    //if (me.seconds[1] <= 0) {
                    //    clearInterval(me.setIFs);
                    //    console.log("白棋超时，黑棋胜");
                    //    me.win(1, "白棋超时，黑棋胜");
                    //}
                }
            }, 1000);
        },
        time_cycle: function (d) {
            //时间换字符
            var str = "";
            var f = parseInt(d / 60);
            var s = parseInt(d % 60);
            str = f >= 10 ? f : "0" + f;
            str += ":";
            str += s >= 10 ? s : "0" + s;
            return str;
        },
        board: function () {
            //画棋盘
            var me = this;
            me.context.clearRect(0, 0, me.context.canvas.width, me.context.canvas.height);
            me.drawLine();

            me.drawboardPoint();
            me.drawWord();
            me.buttom();
            if (me.who == 1) {
                me.drawTime(me.time_cycle(me.seconds[0]), me.time_cycle(me.seconds[1]), me.time_cycle(me.steps_second), "01:00");
            } else {
                me.drawTime(me.time_cycle(me.seconds[0]), me.time_cycle(me.seconds[1]), "01:00", me.time_cycle(me.steps_second));
            }
        },
        win: function (who, str, is_me) {
            var me = this;
            is_me = is_me ? is_me : false;
            me.is_over = true;
            who = who ? who : me.who;
            str = str ? str : (who == 1 ? "白棋失败,黑棋胜" : "黑棋失败,白棋胜");
            me.context.beginPath();
            me.context.font = "30px Arial";
            if (who == 1) {
                me.context.shadowBlur = 20;
                me.context.shadowColor = "white";
                me.context.fillStyle = "#fff";
                me.context.fillRect(6 * me.lineH - 10, 7 * me.lineH + 40, 260, 100);
                me.context.fillStyle = "#000";
                me.context.fillText(str, 6 * me.lineH, 7 * me.lineH + me.margin + 15);
            } else {
                //me.context.fillStyle = "#aaa";
                //me.context.fillRect(7 * me.lineH - 20+3, 7 * me.lineH + 30+3, 220, 100);
                me.context.shadowBlur = 20;
                me.context.shadowColor = "black";
                me.context.fillStyle = "#000";
                me.context.fillRect(6 * me.lineH - 10, 7 * me.lineH + 40, 260, 100);
                me.context.fillStyle = "#fff";
                me.context.fillText(str, 6 * me.lineH, 7 * me.lineH + me.margin + 15);
            }
            me.context.closePath();
            me.context.shadowBlur = "";
            me.context.shadowColor = "";
            !is_me && me.who == me.me_who && socket.emit("is_over", {
                userid: login.userid,
                who: (me.me_who == 1 ? 2 : 1),
                mes: str
            })
        },
        init: function () {
            var me = this;
            //棋盘上的棋子
            for (var i = 0; i < 15; i++) {
                me.location[i] = [];
                for (var j = 0; j < 15; j++) {
                    me.location[i][j] = 0;
                }
            }
            me.initAlgorithm();

            me.context = me.$root[0].getContext("2d");
            me.who = 1;
            me.is_over = true;

            me.steps_second = 60;
            me.seconds = [15 * 60, 15 * 60];
            me.board();
            me.BindEvent();
            //me.timings();

        },
        initAlgorithm: function () {
            //初始化算法库
            var me = this;
            //电脑的棋子算法库
            for (var i = 0; i < 15; i++) {
                me.Computer[i] = [];
                for (var j = 0; j < 15; j++) {
                    me.Computer[i][j] = [];
                    for (var k = 0; k < 4; k++) {
                        me.Computer[i][j][k] = 0;
                    }
                }
            }
            //人的棋子算法库
            for (var i = 0; i < 15; i++) {
                me.Player[i] = [];
                for (var j = 0; j < 15; j++) {
                    me.Player[i][j] = [];
                    for (var k = 0; k < 4; k++) {
                        me.Player[i][j][k] = 0;
                    }
                }
            }
        },
        man_machine: function () {
            //算法执行
            var me = this;
            me.initAlgorithm();

            for (var i = 0; i < 15; i++) {
                for (var j = 0; j < 15; j++) {
                    if (me.location[i][j] == 0) {
                        me.calculate(i, j, 1);
                    }
                }
            }
            for (var i = 0; i < 15; i++) {
                for (var j = 0; j < 15; j++) {
                    if (me.location[i][j] == 0) {
                        me.calculate(i, j, 2);
                    }
                }
            }

            var a = me.Computer.join(",").split(",");
            var b = me.Player.join(",").split(",");
            var c_max = Math.max.apply(null, a);
            var p_max = Math.max.apply(null, b);
            console.info(111)
            if (c_max >= p_max) {
                for (var i = 0; i < 15; i++) {
                    for (var j = 0; j < 15; j++) {
                        for (var k = 0; k < 4; k++) {
                            if (me.Computer[i][j][k] == c_max) {
                                if (me.location[i][j] == 0) {
                                    me.drawChess(2, i, j, true);
                                    console.info(111)
                                    return;
                                }
                            }
                        }

                    }
                }
            } else {
                for (var i = 0; i < 15; i++) {
                    for (var j = 0; j < 15; j++) {
                        for (var k = 0; k < 4; k++) {
                            if (me.Player[i][j][k] == p_max) {
                                if (me.location[i][j] == 0) {
                                    me.drawChess(2, i, j, true);
                                    console.info(111)
                                    return;
                                }
                            }
                        }
                    }
                }
            }


        },
        calculate: function (arr1, arr2, who) {
            //算法记录
            var me = this;
            //横向
            //var no_who = who == 1 ? 2 : 1;
            var h = 0, z = 0, zx = 0, yx = 0;
            for (var i = arr1 - 1 > 0 ? (arr1 - 1) : 0; i > 0; i--) {
                if (me.location[i][arr2] != who || (me.location[i][arr2] == 0 && h < 2)) {
                    break;
                }
                if (me.location[i][arr2] == 0) {
                    h++;
                    continue;
                }
                if (who == 2) {
                    me.Computer[arr1][arr2][0] += 1;
                } else {
                    me.Player[arr1][arr2][0] += 1;
                }

            }
            for (var i = arr1 + 1 < 15 ? (arr1 + 1) : 15; i < 15; i++) {
                if (me.location[i][arr2] != who || (me.location[i][arr2] == 0 && h < 2)) {
                    break;
                }
                if (me.location[i][arr2] == 0) {
                    h++;
                    continue;
                }
                if (who == 2) {
                    me.Computer[arr1][arr2][0] += 1;
                } else {
                    me.Player[arr1][arr2][0] += 1;
                }
            }

            //纵向
            for (var i = arr2 - 1 > 0 ? (arr2 - 1) : 0; i > 0; i--) {
                if (me.location[arr1][i] != who || (me.location[arr1][i] == 0 && z < 2)) {
                    break;
                }
                if (me.location[arr1][i] == 0) {
                    z++;
                    continue;
                }
                if (who == 2) {
                    me.Computer[arr1][arr2][1] += 1;
                } else {
                    me.Player[arr1][arr2][1] += 1;
                }
            }
            for (var i = arr2 + 1 < 15 ? (arr2 + 1) : 15; i < 15; i++) {
                if (me.location[arr1][i] != who || (me.location[arr1][i] == 0 && z < 2)) {
                    break;
                }
                if (me.location[arr1][i] == 0) {
                    z++;
                    continue;
                }
                if (who == 2) {
                    me.Computer[arr1][arr2][1] += 1;
                } else {
                    me.Player[arr1][arr2][1] += 1;
                }
            }

            //左斜向 如(\)
            for (var i = (arr1 - 1 > 0 ? (arr1 - 1) : 0), j = (arr2 - 1 > 0 ? arr2 - 1 : 0); i > 0 && j > 0; i--, j--) {

                if (me.location[i][j] != who || (me.location[i][j] == 0 && zx < 2)) {
                    break;
                }
                if (me.location[i][j] == 0) {
                    zx++;
                    continue;
                }
                if (who == 2) {
                    me.Computer[arr1][arr2][2] += 1;
                } else {
                    me.Player[arr1][arr2][2] += 1;
                }
            }
            for (var i = (arr1 + 1 < 15 ? (arr1 + 1) : 15), j = (arr2 + 1 < 15 ? (arr2 + 1) : 15); i < 15 && j < 15; i++, j++) {
                if (me.location[i][j] != who || (me.location[i][j] == 0 && zx < 2)) {
                    break;
                }
                if (me.location[i][j] == 0) {
                    zx++;
                    continue;
                }
                if (who == 2) {
                    me.Computer[arr1][arr2][2] += 1;
                } else {
                    me.Player[arr1][arr2][2] += 1;
                }
            }
            //右斜向 如(/)
            for (var i = (arr1 + 1 < 15 ? (arr1 + 1) : 15), j = (arr2 - 1 > 0 ? arr2 - 1 : 0); i < 15 && j > 0; i++, j--) {
                if (me.location[i][j] != who) {
                    break;
                }
                if (me.location[i][j] == 0) {
                    zx++;
                    continue;
                }
                if (who == 2) {
                    me.Computer[arr1][arr2][3] += 1;
                } else {
                    me.Player[arr1][arr2][3] += 1;
                }
            }
            for (var i = (arr1 - 1 > 0 ? (arr1 - 1) : 0), j = (arr2 + 1 < 15 ? arr2 + 1 : 15); i > 0 && j < 15; i--, j++) {
                if (me.location[i][j] != who) {
                    break;
                }
                if (who == 2) {
                    me.Computer[arr1][arr2][3] += 1;
                } else {
                    me.Player[arr1][arr2][3] += 1;
                }
            }


        },
        enemy_us: function () {
            var me = this;
            //黑方
            //me.context.strokeStyle = "#000";
            if (me.is_over) {
                return;
            }
            var str = ["我方", "敌方"];
            me.context.font = "38px Arial";
            //me.context.clearRect(30 * 15 + 80, 120, 150, 30 * 15);
            me.context.beginPath();
            me.context.fillStyle = "#aaa";
            me.context.fillRect(15 * 30 + 80, 120 - 60, 100, 60);
            me.context.fill();
            me.context.fillStyle = "#fff";
            me.context.fillText(str[me.me_who - 1], 15 * 30 + 80 + 10, 120 + 40 - 60);
            me.context.closePath();


            me.context.beginPath();
            me.context.fillStyle = "#aaa";
            me.context.fillRect(15 * 30 + 80, 120 + 160+150, 100, 60);
            me.context.fill();
            me.context.fillStyle = "#fff";
            me.context.fillText(str[me.me_who == 1 ? 1 : 0], 15 * 30 + 80 + 10, 120 + 40 + 160+150);

            me.context.closePath();
        }

    }
    window.game = game;


    var $onlinecont = $(".onlinecont");
    var login = {
        userid: "",
        username: "",
        genUid: function () {
            return new Date().getTime() + "" + Math.floor(Math.random() * 899 + 100);
        },
        login: function () {
            var me = this;
            me.username = $(".login .name").val();
            if (me.username != "") {
                me.userid = me.genUid();
                $(".login").hide();
                me.init();
                game.init();
            }

        },
        init: function () {
            var me = this;

            socket = io.connect('http://192.168.1.145:3001');
            var userobj = {
                userid: me.userid,
                username: me.username
            }
            socket.emit('login', userobj);
            //接收登录
            socket.on("login", function (obj) {
                me.userControl(obj, "login");
                game.init();
            });
            //接下落子
            socket.on("onlater", function (obj) {
                console.info("onlater");
                if (obj.userid == game.rival.userid && obj.who == game.rival.who) {
                    game.drawChess(game.rival.who, obj.x, obj.y, false);
                }
            });

            socket.on("onbackChess", function (obj) {
                if (obj.userid == game.rival.userid && obj.who == game.rival.who) {
                    game.backChess(true);
                }
            });
            //接收胜败
            socket.on("on_is_over", function (obj) {
                console.info(obj);
                if(game.is_over){
                    return;
                }
                game.win(obj.who, obj.mes, true);
            });

            //接收退出
            socket.on("logout", function (obj) {
                me.userControl(obj, "logout");
            });
            socket.on("message", function (obj) {

            })
        },
        userControl: function (obj, action) {


            var users = obj.onlineUsers;
            var count = obj.onlineCount;
            var user = obj.user;
            var $html = "",
                ss = "";

            for (var i in users) {
                if (users.hasOwnProperty(i)) {
                    $html += ss + users[i];
                    ss = "、";
                }
            }

            console.log(obj);
            $onlinecont.html("前面共有" + count + "人在线,在线列表:" + $html);

        }
    }

    window.login = login;
    $(".login .bt").on("tap", function () {
        login.login();
    })
});