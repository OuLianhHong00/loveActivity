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

const URL = 'http://39.105.117.213:3000/activity/'
//上传文件的配置
const storage = multer.diskStorage({
	//文件存储位置
	destination: (req, file, cb) => {
		cb(null, path.resolve(__dirname, '../public/images/activity/'));
	},
	//文件名
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}_${Math.ceil(Math.random() * 1000)}_activity.${file.originalname.split('.').pop()}`);
	}
});
const uploadCfg = {
	storage: storage,
	limit: {
		fileSize: 1024 * 1024 * 20
	}
};

//多图上传,返回图片的url,z之后再一起传过来
/*var upload = multer(uploadCfg).array('images');
router.post('/add', function(req, res, next) {
	upload(req, res, function(err) {
		if (err) {
			console.error('[System]' + err.message);
		} else {
			//循环处理
			var fileCount = req.files.length;
			req.files.forEach(function(i) {
				var uploadTmpPath = i.path;
				fs.readFile(uploadTmpPath, function(err, data) {
					if (err) {
						console.error('[System]' + err.message);
					} else {
						fs.writeFile(uploadTmpPath, data, function(err) {
							if (err) {
								console.error('[System]' + err.message);
							}
						});
					}
				});
			});
			res.send('success')
		}
	})
})*/

//添加照片  传参：path key ,返回对应的图片名称
router.post('/addImage', function(req, res) {
	let upload = multer(uploadCfg).any();
	upload(req, res, function(err) {
		if (err) {
			res.send('fail');
			console.log(err);
			return;
		};
		let uploadFile = req.files[0];
		res.send(URL + uploadFile.filename);
	})
});


//添加活动
router.post('/addActivity', function(req, res) {
	var data = req.body;
	var sql = 'insert into activitiesinfo(userId,activityText,activityAvator,activityImage,activityTitle,activityTime) values(?,?,?,?,?,?)';
	var sqlParms = [data.userId, data.activityText, data.activityAvator, data.activityImage, data.activityTitle, data.activityTime]
	db.myQuery(sql, sqlParms)
		.then(function(data) {
			res.send('success')
		})
		.catch(function(data) {
			console.log(data)
			res.send('fail')
		})
})

//查询活动,先查询数据条数，然后五条五条进行返回
router.post('/selectActivity', function(req, res) {
	var length;
	var data = req.body;
	if (data.catagroy == 0) {
		//表示第一次查询数据
		if (data.count == 0) {
			//查询有多少条数据
			let sqlsum = 'select count(*) as sum from activitiesinfo';
			db.myQuery(sqlsum, [])
				.then(function(solve) {
					length = solve;
					//第一次查询所有的活动信息
					let sql = 'select a.activityid,a.userId,c.userName,c.userAvator,a.activityText,a.activityAvator,a.activityTitle,date_format(activityTime,"%Y-%m-%d %H:%i") as time,e.sum,f.count' +
						' from activitiesinfo a ' +
						'left join selfinfo c on a.userId=c.userId ' +
						'left join (select count(*) as sum,productId from likeinfo where type=1 and status=1 group by productId) as e on a.activityid = e.productId ' +
						'left join (select count(*) as count,productId from commentinfo where type=1 group by productId) as f on a.activityid = f.productId ' +
						'order by a.activityid desc LIMIT ?,?';
					let sqlParms = [data.page * data.pagesize, data.pagesize * 1];
					db.myQuery(sql, sqlParms)
						.then(function(data) {
							res.send({
								activities: data,
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
			//TIMESTAMPDIFF(DAY,a.activityTime,now()) as time
			console.log(data.page * data.pagesize)
			console.log(data.pagesize)
			let sqlParmstwo = [data.count, data.page * data.pagesize, data.pagesize * 1]
			let sqltwo = 'select * from(select a.activityid,a.userId,c.userName,c.userAvator,a.activityText,a.activityAvator,a.activityTitle,date_format(activityTime,"%Y-%m-%d %H:%i") as time,e.sum,f.count' +
				' from activitiesinfo a ' +
				'left join selfinfo c on a.userId=c.userId ' +
				'left join (select count(*) as sum,productId from likeinfo where type=1 and status=1 group by productId) as e on a.activityid=e.productId ' +
				'left join (select count(*) as count,productId from commentinfo where type=1 group by productId) as f on a.activityid=f.productId ' +
				'order by a.activityid desc) as  link where activityid<=? LIMIT  ?,?';
			db.myQuery(sqltwo, sqlParmstwo)
				.then(function(data) {
					res.send({
						activities: data
					})
				})
				.catch(function(err) {
					console.log(err);
					res.send('fail')
				})
		}



	} else if (data.catagroy == 1) {
		let sqlsum1 = 'select count(*) as sum from activitiesinfo where userId=?';
		//查询自己的活动信息
		let sql1 = 'select a.activityid,a.userId,a.activityText,a.activityAvator,a.activityTitle,a.time,e.sum,f.count ' +
			'from (select activityid,userId,activityText,activityAvator,activityTitle,date_format(activityTime,"%Y-%m-%d %H:%i") as time from activitiesinfo where userId=?) as a ' +
			'left join (select count(*) as sum,productId from likeinfo where type=1 and status=1 group by productId) as e on a.activityid = e.productId ' +
			'left join (select count(*) as count,productId from commentinfo where type=1 group by productId) as f on a.activityid = f.productId ' +
			'order by a.activityid desc LIMIT ?,?';
		let sqlParms1 = [data.userId, data.page * data.pagesize, data.pagesize * 1];
		db.myQuery(sqlsum1, [data.userId])
			.then(function(data) {
				length = data;
				db.myQuery(sql1, sqlParms1)
					.then(function(data) {
						res.send({
							activities: data,
							total: length
						});
					})
					.catch(function(err) {
						console.log(err)
						res.send('fail')
					})
			})
			.catch(function(err) {
				console.log('查询数据失败' + err)
				res.send('查询数据失败')
			})

	}
})

router.get('/selectOneActivity', function(req, res) {
	var Id = req.query.productId;
	db.myQuery('select date_format(activityTime,"%Y-%m-%d %H:%i") as time,activityTitle,activityText,activityImage from activitiesinfo where activityid=?', [Id])
		.then(function(data) {
			res.send({
				activity: data
			})

		})
		.catch(function(reason) {
			console.log(reason);
			res.send('fail')
		})
})

router.get('/searchActivity', function(req, res) {
	var data1 = req.query.data;
	let sql1 = 'select a.activityid,a.userId,a.activityText,a.activityAvator,a.activityTitle,a.time,e.sum,f.count ' +
		'from (select activityid,userId,activityText,activityAvator,activityTitle,date_format(activityTime,"%Y-%m-%d %H:%i") as time from activitiesinfo where activityTitle like ?) as a ' +
		'left join (select count(*) as sum,productId from likeinfo where type=1 and status=1 group by productId) as e on a.activityid = e.productId ' +
		'left join (select count(*) as count,productId from commentinfo where type=1 group by productId) as f on a.activityid = f.productId ' +
		'order by a.activityid desc';
	console.log(data1)
	db.myQuery(sql1, [data1])
		.then(function(data) {
			res.send({
				activity: data
			})

		})
		.catch(function(reason) {
			console.log(reason);
			res.send('fail')
		})
})
module.exports = router;