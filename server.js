var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var chatServer = require('./lib/chat_server');
var cache = {};

// 发送数据
function send404(response) {
    response.writeHead(404,{
        'Content-type':'text/plain'
    });
    response.write('Error 404: resource not found');
    response.end();
}

//提供文件数据
function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200,
        {"content-type":mime.getType(path.basename(filePath))}
    )
    response.end(fileContents)
}


//放回静态文件；
function serverStatic(response, cache, absPath) {
    if(cache[absPath]){
        sendFile(response, absPath, cache[absPath]); //从内存中返回数据
    } else {
        fs.exists(absPath, function (exists) { //检查文件是否存在
            if (exists){
                fs.readFile(absPath, function (err, data) {
                    if(err){
                        send404(response)
                    }else{
                        cache[absPath] = data;
                        sendFile(response, absPath, data)
                    }
                })
            }else{
                send404(response);
            }
        })
    }
}

// 创建http服务器，用匿名函数定义对每个请求的处理行为
var server = http.createServer(function (request, response) {
    var filePath = false;
    if(request.url == '/'){
        filePath = 'public/index.html';
    }else{
        filePath = 'public' + request.url;
    }
    var absPath = './' + filePath;
    console.log(absPath);
    serverStatic(response, cache, absPath)
})
server.listen(3000, function () {
    console.log('server listening on port 3000;')
})

chatServer.listen(server);
