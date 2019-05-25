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
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(bodyParser.json())


//删除活动、悄悄话、竞赛
router.get('/delete', function(req, res) {
	var sqlArr = new Array();
	//需要做删除的部分sqlArr[0] 删除需要删除的活动 sqlArr[1]删除评论 sqlArr[2]删除点赞
	//删除活动
	if (req.query.type) {
		if (req.query.type == 1) {
			sqlArr = [{
				sql: 'delete from activitiesinfo where activityid=? ',
				params: [req.query.id]
			}, {
				sql: 'delete from commentinfo where productId=? and type=? ',
				params: [req.query.id, req.query.type]
			}, {
				sql: 'delete from likeinfo where productId=? and type=?',
				params: [req.query.id, req.query.type]
			}]
		} else if (req.query.type == 2) {
			//删除悄悄话
			sqlArr = [{
				sql: 'delete from ideainfo where ideaId=? ',
				params: [req.query.id]
			}, {
				sql: 'delete from commentinfo where productId=? and type=?',
				params: [req.query.id, req.query.type]
			}, {
				sql: 'delete from likeinfo where productId=? and type=?',
				params: [req.query.id, req.query.type]
			}]
		} else if (req.query.type == 3) {
			//删除竞赛
			sqlArr = [{
				sql: 'delete from competeinfo where competeId=? ',
				params: [req.query.id]
			}, {
				sql: 'delete from commentinfo where productId=? and type=? ',
				params: [req.query.id, req.query.type]
			}, {
				sql: 'delete from likeinfo where productId=? and type=?',
				params: [req.query.id, req.query.type]
			}]
		}
		db.transaction(sqlArr)
			.then(function(data) {
				res.send({
					i: req.query.id
				})
			})
			.catch(function(reason) {
				console.log('cuowu' + reason)
				res.send(reason)
			})
	} else {
		res.send('请发送想要删除的类型')
	}


})

//查询悄悄话,j竞赛，活动评论
router.get('/selectComment', function(req, res) {
	db.myQuery('select a.commentId,a.commentText,c.userName from commentinfo a,selfinfo c where a.productId=? and a.type=? and a.userId=c.userId order by a.commentId desc', [req.query.id, req.query.type])
		.then(function(commit) {
			res.send({
				commentList: commit
			})

		})
		.catch(function(err) {
			console.log(err);
			res.send('查询悄悄话评论失败')
		})

})

//添加评论
router.post('/addComment', function(req, res) {
	var data = req.body;
	db.myQuery('insert into commentinfo(userId,commentText,productId,type) values(?,?,?,?)', [data.userId, data.commentText, data.productId, data.type])
		.then(function(commit) {
			res.send('success')

		})
		.catch(function(err) {
			console.log(err);
			res.send('fail')
		})
})

//查询当前用户是否点赞
router.post('/isLike', function(req, res) {
	var data = req.body;
	db.myQuery('select status from likeinfo where type=? and productId=? and userId=?', [data.type, data.productId, data.userId])
		.then(function(result) {
			res.send(result)
		})
		.catch(function(reason) {
			res.send('fail' + reason);
			console.log(reason);
		})
})

//点赞或取消点赞
router.post('/linkLike', function(req, res) {
	var data = req.body;
	db.myQuery('select status from likeinfo where type=? and productId=? and userId=?', [data.type, data.productId, data.userId])
		.then(function(result) {
			if (result.length == 0) {
				db.myQuery('insert into likeinfo(productId,userId,status,type) values(?,?,?,?)', [data.productId, data.userId, 1, data.type])
					.then(function(result1) {
						res.send('success');
					})
					.catch(function(reason) {
						res.send('fail' + reason);
						console.log(reason);
					})
			} else if (result[0].status == 1) {
				db.myQuery('update likeinfo set status=0 where productId=? and userId=? and type=?', [data.productId, data.userId, data.type])
					.then(function(result1) {
						res.send('success');
					})
					.catch(function(reason) {
						res.send('fail' + reason);
						console.log(reason);
					})
			} else if (result[0].status == 0) {
				db.myQuery('update likeinfo set status=1 where productId=? and userId=? and type=?', [data.productId, data.userId, data.type])
					.then(function(result1) {
						res.send('success');
					})
					.catch(function(reason) {
						res.send('fail' + reason);
						console.log(reason);
					})
			}
		})
		.catch(function(reason) {
			res.send('fail' + reason);
			console.log(reason);
		})
})
module.exports = router;