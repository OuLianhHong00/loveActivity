var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({
	extended: false
}))
app.use(bodyParser.json());
var db = require("../config/db");

const URL = 'http://39.105.117.213:3000/user/'
//上传文件的配置
const storage = multer.diskStorage({
	//文件存储位置
	destination: (req, file, cb) => {
		cb(null, path.resolve(__dirname, '../public/images/user/'));
	},
	//文件名
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}_${Math.ceil(Math.random() * 1000)}_user.${file.originalname.split('.').pop()}`);
	}
});
const uploadCfg = {
	storage: storage,
	limit: {
		fileSize: 1024 * 1024 * 20
	}
};
//添加照片  传参：path key ,返回对应的图片名称
router.post('/addPillowImage', function(req, res) {
	let upload = multer(uploadCfg).any();
	upload(req, res, function(err) {
		if (err) {
			res.send('fail');
			console.log(err);
			return;
		};
		console.log(req.files);
		let uploadFile = req.files[0];
		res.send(URL + uploadFile.filename);
	})
});

//添加悄悄话
router.post('/addPillow', function(req, res) {
	var data = req.body;
	var sql = 'insert into ideainfo(userId,ideaText,ideaImage,ideaTime) values(?,?,?,?)';
	var sqlParms = [data.userId, data.ideaText, data.ideaImage, data.ideaTime]
	db.myQuery(sql, sqlParms)
		.then(function(data) {
			res.send('success')
		})
		.catch(function(data) {
			console.log(data)
			res.send('fail')
		})
})

//查询悄悄话,先查询数据条数，然后五条五条进行返回
router.post('/selectPillow', function(req, res) {
	var length;
	var data = req.body;

	if (data.catagroy == 0) {
		//表示第一次查询数据
		if (data.count == 0) {
			//查询有多少条数据
			let sqlsum = 'select count(*) as sum from ideainfo';
			db.myQuery(sqlsum, [])
				.then(function(solve) {
					length = solve;
					//第一次查询所有的活动信息11
					let sql = 'select a.ideaid,a.userId,c.userName,c.userAvator,a.ideaText,a.ideaImage,date_format(ideaTime,"%Y-%m-%d %H:%i") as time,e.sum,f.count,b.status ' +
						'from ideainfo a ' +
						'left join selfinfo c on a.userId=c.userId ' +
						'left join (select count(*) as sum,productId from likeinfo where type=2 and status=1 group by productId) as e on a.ideaid = e.productId ' +
						'left join (select count(*) as count,productId from commentinfo where type=2 group by productId) as f on a.ideaid = f.productId ' +
						'left join loveactivity.likeinfo b on b.type=2 and b.productId=a.ideaId and b.userId=?' +
						'order by a.ideaid desc LIMIT ?,?';
					let sqlParms = [data.userId, data.page * data.pagesize, data.pagesize * 1];
					db.myQuery(sql, sqlParms)
						.then(function(data) {

							res.send({
								idea: data,
								total: length
							});

						})
						.catch(function(err) {
							console.log(err)
							res.send('fail')
							return;
						})
				})
				.catch(function(err) {
					console.log('查询数据失败' + err)
					res.send('查询数据失败')
				})
		} else {
			//后几次查询数据，只查当前小于最大id数的数据
			//非第一次查询所有的活动信息
			let sqlParmstwo = [data.userId, data.count, data.page * data.pagesize, data.pagesize * 1]
			let sqltwo = 'select * from(select a.ideaid,a.userId,c.userName,c.userAvator,a.ideaText,a.ideaImage,date_format(ideaTime,"%Y-%m-%d %H:%i") as time,e.sum,f.count,b.status ' +
				'from ideainfo a ' +
				'left join selfinfo c on a.userId=c.userId ' +
				'left join (select count(*) as sum,productId from likeinfo where type=2 and status=1 group by productId) as e on a.ideaid = e.productId ' +
				'left join (select count(*) as count,productId from commentinfo where type=2 group by productId) as f on a.ideaid = f.productId ' +
				'left join loveactivity.likeinfo b on b.type=2 and b.productId=a.ideaId and b.userId=?' +
				'order by a.ideaid desc) as link where ideaid<=? LIMIT ?,?';
			db.myQuery(sqltwo, sqlParmstwo)
				.then(function(data) {
					res.send({
						idea: data
					})
				})
				.catch(function(err) {
					console.log(err);
					res.send('fail')
				})
		}



	} else if (data.catagroy == 1) {
		let sqlsum1 = 'select count(*) as sum from ideainfo where userId=?';
		//查询自己的活动信息
		let sql1 = 'select * from(select a.ideaid,a.userId,c.userName,c.userAvator,a.ideaText,a.ideaImage,date_format(ideaTime,"%Y-%m-%d %H:%i") as time,e.sum,f.count,b.status ' +
			'from ideainfo a ' +
			'left join selfinfo c on a.userId=c.userId ' +
			'left join (select count(*) as sum,productId from likeinfo where type=2 and status=1 group by productId) as e on a.ideaid = e.productId ' +
			'left join (select count(*) as count,productId from commentinfo where type=2 group by productId) as f on a.ideaid = f.productId ' +
			'left join loveactivity.likeinfo b on b.type=2 and b.productId=a.ideaId and b.userId=? ' +
			'order by a.ideaid desc) as link where userId=? LIMIT ?,?';
		let sqlParms1 = [data.userId, data.userId, data.page * data.pagesize, data.pagesize * 1];
		db.myQuery(sqlsum1, [data.userId])
			.then(function(data) {
				length = data;
				db.myQuery(sql1, sqlParms1)
					.then(function(data) {
						res.send({
							idea: data,
							total: length
						});
					})
					.catch(function(err) {
						res.send('fail')
						console.log(err)
					})
			})
			.catch(function(err) {
				console.log('查询数据失败' + err)
				res.send('查询数据失败')
			})

	}
})



module.exports = router;