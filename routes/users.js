var express = require('express');
var router = express.Router();
var request = require('request');
var url = require('url');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
const URL = "http://39.105.117.213:3000/"

var db = require("../config/db");
var app = express();

app.use(cookieParser());
app.use(session({
	secret: 'loveactivity',
	name: 'userId',
	cookie: {
		maxAge: 14400000
	},
	resave: false,
	saveUninitialized: false
}))
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(bodyParser.json())
const appId = "wx7a4111c76a5ece2a";
const appSecret = "0a696d034f12caf03c22d6eb20a0017a";

/*
//活动用户的id
router.get('/getOpenid', function(req, res) {
	var reqs = req.query;
	console.log(reqs);
	request('https://api.weixin.qq.com/sns/jscode2session?appid=' + appId + '&secret=' + appSecret + '&js_code=' + reqs.x + '&grant_type=authorization_code', function(error, response, body) {
		if (!error && response.statusCode === 200) {
			console.log(body + '获得sessionkey返回的信息');
			res.send(body);
		}
	});
})
//保存用户的信息
router.post('/saveUserinfo', function(req, res, next) {
	var userInfo = req.body.userInfo;
	var userId = req.body.userId;
	console.log(req.body)
	db.myQuery('select * from selfInfo where userId=? ', [userId])
		.then(function(data) {
			if (data == '') {
				var insertSql = 'insert into selfInfo(userName,userAvator,userId) values(?,?,?)';
				var insertParams = [userInfo.nickName, userInfo.avatarUrl, userId];
				db.myQuery(insertSql, insertParams)
					.then(function(data) {
						console.log(data)
						res.send('success')
					})
					.catch(function(reason) {
						console.log(reason)
						res.send('fail')
					});
			} else {
				res.send('success')
			}
		})
		.catch(function(reason) {
			console.log(reason)
			res.send('fail')
		});

})
*/
router.post('/Login', function(req, res) {
	var userCode = req.body.code;
	var userInfo = req.body.userInfo;
	request('https://api.weixin.qq.com/sns/jscode2session?appid=' + appId + '&secret=' + appSecret + '&js_code=' + userCode + '&grant_type=authorization_code', function(error, response, body1) {
		if (!error && response.statusCode === 200) {
			var d = JSON.parse(body1);
			var userId = d.openid;
			db.myQuery('select * from selfinfo where userId=? ', [userId])
				.then(function(data) {
					if (data == '') {
						var insertSql = 'insert into selfinfo(userName,userAvator,userId) values(?,?,?)';
						var insertParams = [userInfo.nickName, userInfo.avatarUrl, userId];
						db.myQuery(insertSql, insertParams)
							.then(function(data) {
								//req.session.userId = userId;
								res.send({
									id: userId
								})
							})
							.catch(function(reason) {
								console.log(reason)
								res.send('fail')
							});
					} else {
						res.send({
							id: userId
						})
					}
				})
				.catch(function(reason) {
					console.log(reason)
					res.send('fail')
				});
		} else {
			res.send('fail')
		}
	});

})
//查询用户记事本
router.post('/selectUserBook', function(req, res) {
	var userId = req.body.userId;
	console.log(userId)
	db.myQuery('select userBook from selfinfo where userId=?', [userId])
		.then(function(data) {
			res.send(data)
		})
		.catch(function(reason) {
			console.log(reason)
			res.send('fail')
		})
})
//修改用户记事本
router.post('/saveUserBook', function(req, res) {
	var userContent = req.body.userContent;
	var userId = req.body.userId;
	db.myQuery('update selfinfo set userBook=? where userId=?', [userContent, userId])
		.then(function(data) {
			res.send('success')
		})
		.catch(function(reason) {
			console.log(reason);
			res.send('fail')
		})
})

//查询个性签名
router.post('/selectUserSinature', function(req, res) {
	var userId = req.body.userId;
	console.log(userId)
	db.myQuery('select userSinature from selfinfo where userId=?', [userId])
		.then(function(data) {
			res.send(data)
		})
		.catch(function(data) {
			res.send('fail')
		})
})
//修改个性签名
router.post('/saveUserSinature', function(req, res) {
	var userSinature = req.body.usersinature;
	console.log(req.body)
	var userId = req.body.userId;
	console.log(userId)
	db.myQuery('update selfinfo set userSinature=? where userId=?', [userSinature, userId])
		.then(function(data) {
			console.log(data)
			res.send('success')
		})
		.catch(function(reason) {
			console.log(reason);
			res.send('fail')
		})
})

//反馈
router.post('/saveFeedBack', function(req, res) {
	var data = req.body;
	db.myQuery('insert into feedbackinfo(useerId,content) values(?,?)', [data.userId, data.content])
		.then(function(data) {
			res.send('success')
		})
		.catch(function(reason) {
			console.log(reason)
			res.send(reason)
		})
})

router.get('/getFeedBack', function(req, res) {
	db.myQuery('select * from feedbackinfo orderby id desc', [])
		.then(function(data) {
			res.send(data)
		})
		.catch(function(reason) {
			console.log(reason)
			res.send(reason)
		})
})
module.exports = router;