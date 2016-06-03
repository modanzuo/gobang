var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io').listen(server);
server.listen(3001, function () {
    console.log("3001");
});
//app.use(express.static("in"));
// app.get("/socket.io/socket.io.js",function(req,res){
//     res.sendFile(__dirname+"/node_modules/socket.io/node_modules/socket.io-client/socket.io.js");

// });

//在线用户
var onlineUsers = {};
//在线用户服务对象
var onlineUsersSever = {};
//当前在线人数
var onlineCount = 0;

//开始游戏人数
var onplayCount = 0;
//开始游戏表名
var onplayUsers = {};
//对战列表
var rivals = [];

app.get('/*', function (req, res) {
    res.sendfile(__dirname + req.originalUrl);
});


io.sockets.on('connection', function (socket) {
    socket.on("login", function (obj) {
        console.log(obj);
        socket.name = obj.userid;
        if (!onlineUsers.hasOwnProperty(socket.name)) {
            onlineUsers[obj.userid] = obj.username;
            onlineUsersSever[obj.userid] = socket;
            onlineCount++;
        }
        io.emit("login", {
            user: obj,
            onlineCount: onlineCount,
            onlineUsers: onlineUsers
        });
    });
    //开始游戏
    socket.on("play", function (obj) {
        console.log(obj.userid + "开始游戏");
        if (onlineUsers.hasOwnProperty(obj.userid)) {
            if (!onplayUsers.hasOwnProperty(obj.userid)) {
                onplayCount++;
                onplayUsers[obj.userid] = onlineUsers[obj.userid];
                //socket.join(obj.userid);
            }
            if (onlineCount > 1 && onplayCount > 1) {
                var rival = getrend();
                var bol = false;//判断是否在数组
                for (var i = 0; i < rivals.length; i++) {
                    if (rivals[i][1] == obj.userid && rivals[i][2] == rival.id) {
                        bol = true;
                        break;
                    }
                }
                if (!bol) {
                    rivals.push({1: obj.userid, 2: rival.userid});
                }
                var user = {
                    userid: obj.userid,
                    username: onplayUsers[obj.userid],
                    who: 1
                }
                onlineUsersSever[obj.userid].emit("onplay", {star: 1, rival: rival});
                onlineUsersSever[rival.userid].emit("onplay", {star: 1, rival: user});

            } else {
                onlineUsersSever[obj.userid].emit("onplay", {star: 0, mes: "当前人数不足成为你的对手，请等待或选择人机对战!"})
            }
        }

    });
    //随机对手
    var getrend = function () {
        if (onplayCount > 1) {
            var i = 0, arr = [];
            for (var key in onplayUsers) {
                arr[i] = key + "";
                i++
            }
            var rival, rand;
            do {
                rand = parseInt(Math.random() * onlineCount);
                console.log(onlineCount);
            } while (arr[rand] == socket.name);
            rival = {
                userid: arr[rand],
                name: onplayUsers[arr[rand]],
                who: 2
            }
            return rival;
        }
    }
    //下子
    socket.on("later", function (obj) {
        console.log(obj);
        //返回
        for (var i = 0; i < rivals.length; i++) {
            var val = rivals[i];
            if (val[1] == obj.userid || val[2] == obj.userid) {
                console.log("userid" + obj.userid);
                console.log(val[1] == obj.userid ? val[2] : val[1]);
                onlineUsersSever[val[1] == obj.userid ? val[2] : val[1]].emit("onlater", obj);

                break;
            }
        }
        //socket.broadcast.to(obj.userid).emit("onlater",obj);
    });

    socket.on("is_over", function (obj) {
        console.log(obj);
        for (var i = 0; i < rivals.length; i++) {
            var val = rivals[i];
            if (val[1] == obj.userid || val[2] == obj.userid) {
                onlineUsersSever[val[1] == obj.userid ? val[2] : val[1]].emit("on_is_over", obj);
                break;
            }
        }
    });

    socket.on("backChess", function (obj) {
        for (var i = 0; i < rivals.length; i++) {
            var val = rivals[i];
            if (val[1] == obj.userid || val[2] == obj.userid) {
                onlineUsersSever[val[1] == obj.userid ? val[2] : val[1]].emit("onbackChess", obj);
                break;
            }
        }
    });


    socket.on('message', function (obj) {
        //向所有客户端广播发布的消息
        io.emit("message", obj);
        console.log(obj.username + "说：" + obj.content);
    });

    socket.on("disconnect", function () {
        //将退出的用户从在线列表中删除
        console.log(socket.name);

        if (onlineUsers.hasOwnProperty(socket.name)) {
            var obj = {
                userid: socket.name,
                username: onlineUsers[socket.name]
            };

            for (var i = 0; i < rivals.length; i++) {
                var val = rivals[i];
                if (val[1] == obj.userid || val[2] == obj.userid) {
                    var data = {
                        userid: obj.userid,
                        who: val[1] == obj.userid ? 2 : 1,
                        mes: val[1] == obj.userid ? "黑方逃跑,白棋胜" : "白方逃跑，黑棋胜"
                    }
                    onlineUsersSever[val[1] == obj.userid ? val[2] : val[1]].emit("on_is_over", data);
                    rivals.splice(i, 1);
                    break;
                }
            }

            //删除
            delete onlineUsers[socket.name];
            delete  onlineUsersSever[socket.name];


            if (onplayUsers.hasOwnProperty(socket.name)) {
                onplayCount--;
                delete onplayUsers[socket.name];
            }

            //在线人数-1
            onlineCount--;
            io.emit('logout', {
                onlineUser: onlineUsers,
                onlineCount: onlineCount,
                user: obj
            });

            console.log(obj.username + "退出了聊天室");
        }
    })
})
;
