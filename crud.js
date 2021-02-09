const express = require('express');
const bodyParser = require('body-parser');
const md5 = require('md5');
const randnumber = require('rand-token').generator({ chars: '0-9' });
const randtoken = require('rand-token').generator({ chars: 'a-z' });
const mongodb = require('mongodb').MongoClient;
const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));

var usertype = '';
var userloginid = '';

var dbo;
mongodb.connect('mongodb+srv://admin:8hrNdU6o5cAcrMxl@cluster0.n8sll.mongodb.net?retryWrites=true&w=majority', (err, client) => {
    if (err) return console.log(err);
    console.log('Connected to Database');
    dbo = client.db("percobaan");
});

var middleware = function (req, res, next) {
    dbo.collection('user').findOne({userid: req.body.userid}, function(err, result){
        if(result!=null){
            var verifydb = md5(result.userid+result.token);
            console.log('v:'+verifydb);
            if(verifydb==req.body.verification){
                usertype = result.type;
                userloginid = result.userid;
                next();
            } else {
                res.send(JSON.stringify({status: 0, message: 'Fail verification !'}));
            }
        } else {
            res.send(JSON.stringify({status: 0, message: 'User not found !'}));
        }
    });
}
app.use(middleware);

app.post('/', (req, res) => {
    var command = req.body.command;
    switch(command)
    {
        case 'list':
            dbo.collection('user').find({type: {$not:  {$regex: 'admin'}}}, {_id:0, userid:'', token: 0}).toArray(function(err, result){
                res.send(JSON.stringify({status: 1, message: 'Success', data: result}));
            });
            break;
        case 'create':
            if(usertype=='admin'){
                var newuserid = randnumber.generate(6);
                dbo.collection('user').insertOne({
                    userid: newuserid,
                    token: randtoken.generate(12),
                    username: req.body.username, ////// required ////
                    password: md5(req.body.password), ////// required ////
                    type: 'user'
                }, function(err, result){
                    res.send(JSON.stringify({status: 1, message: 'Success', data: result.ops[0]}));
                });
            } else {
                res.send(JSON.stringify({status: 0, message: 'You not admin type !'}));
            }
            break;
        case 'read':
            var cekid;
            if(usertype=='admin'){
                cekid = req.body.id;
            } else {
                cekid = userloginid;
            }
            dbo.collection('user').findOne({
                userid: cekid  ////// required ////
            }, function(err, result){
                if(result!=null){
                    res.send(JSON.stringify({status: 1, message: 'Success', data: result}));
                } else {
                    res.send(JSON.stringify({status: 0, message: 'User not found !'}));
                }
            });
            break;
        case 'update':
            if(usertype=='admin'){
                dbo.collection('user').update({
                    userid: req.body.id  ////// required ////
                }, {$set: {
                    username: req.body.username, ////// required ////
                    password: md5(req.body.password) ////// required ////
                }}, function(err, result){
                    if(err) throw err;
                    res.send(JSON.stringify({status: 1, message: 'Success'}));
                });
            } else {
                res.send(JSON.stringify({status: 0, message: 'You not admin type !'}));
            }
            break;
        case 'delete':
                if(usertype=='admin'){
                    dbo.collection('user').deleteOne({
                        userid: req.body.id  ////// required ////
                    }, function(err, result){
                        if(err) throw err;
                        res.send(JSON.stringify({status: 1, message: 'Success'}));
                    });
                } else {
                    res.send(JSON.stringify({status: 0, message: 'You not admin type !'}));
                }
                break;
        default:
            res.send(JSON.stringify({status: 0, message: 'Command not found !'}));
    }
});

app.listen(port, () => {
    console.log(`App CRUD listening at http://localhost:${port}`);
});
