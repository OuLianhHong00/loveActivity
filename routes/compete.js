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

const URL = 'http://39.105.117.213:3000/compete/'
//上传文件的配置
const storage = multer.diskStorage({
	//文件存储位置
	destination: (req, file, cb) => {
		cb(null, path.resolve(__dirname, '../public/images/compete/'));
	},
	//文件名
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}_${Math.ceil(Math.random() * 1000)}_compete.${file.originalname.split('.').pop()}`);
	}
});
const uploadCfg = {
	storage: storage,
	limit: {
		fileSize: 1024 * 1024 * 20
	}
};
//添加照片  传参：path key ,返回对应的图片名称
router.post('/addCompeteImage', function(req, res) {
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

//添加竞赛
router.post('/addCompete', function(req, res) {
	var data = req.body;
	var sql = 'insert into competeinfo(competeTitle,competeContent,competeImage,competeTime) values(?,?,?,?)';
	var sqlParms = [data.cTitle, data.cContent, data.cImage, data.cTime]
	db.myQuery(sql, sqlParms)
		.then(function(data) {
			res.send('success')
		})
		.catch(function(data) {
			console.log(data)
			res.send('fail')
		})
})

//查询竞赛
router.get('/selectCompete', function(req, res) {
	if (req.query.count == 0) {
		let sqlsum1 = 'select count(*) as sum from competeinfo';
		let sql1 = 'select a.competeId,a.competeTitle,a.competeContent,a.competeImage,date_format(competeTime,"%Y-%m-%d %H:%i") as time,e.sum,f.count ' +
			'from competeinfo a ' +
			'left join (select count(*) as sum,productId from likeinfo where type=3 and status=1 group by productId) as e on a.competeId = e.productId ' +
			'left join (select count(*) as count,productId from commentinfo where type=3 group by productId) as f on a.competeId = f.productId ' +
			'order by a.competeId desc LIMIT ?,?;';
		let sqlParms1 = [req.query.page * req.query.pagesize, req.query.pagesize * 1];
		db.myQuery(sqlsum1, [])
			.then(function(data) {
				length = data;
				db.myQuery(sql1, sqlParms1)
					.then(function(data) {
						res.send({
							competeList: data,
							total: length
						});
					})
					.catch(function(err) {
						res.send('fail')
					})
			})
			.catch(function(err) {
				console.log('查询数据失败' + err)
				res.send('查询数据失败')
			})
	} else {
		let sql1 = 'select * from(select a.competeId,a.competeTitle,a.competeContent,a.competeImage,date_format(competeTime,"%Y-%m-%d %H:%i") as time,e.sum,f.count ' +
			'from competeinfo a ' +
			'left join (select count(*) as sum,productId from likeinfo where type=3 and status=1 group by productId) as e on a.competeId = e.productId ' +
			'left join (select count(*) as count,productId from commentinfo where type=3 group by productId) as f on a.competeId = f.productId ' +
			'order by a.competeId desc) as link where competeId<? LIMIT ?,?;';
		let sqlParms1 = [req.query.count, req.query.page * req.query.pagesize, req.query.pagesize * 1];
		db.myQuery(sqlsum1, [])
			.then(function(data) {
				length = data;
				db.myQuery(sql1, sqlParms1)
					.then(function(data) {
						res.send({
							competeList: data,
						});
					})
					.catch(function(err) {
						res.send('fail')
					})
			})
			.catch(function(err) {
				console.log('查询数据失败' + err)
				res.send('查询数据失败')
			})
	}

})
router.get('/selectOneCompete', function(req, res) {
	var Id = req.query.productId;
	db.myQuery('select date_format(competeTime,"%Y-%m-%d %H:%i") as time,competeTitle,competeContent,competeImage from competeinfo where competeId=?', [Id])
		.then(function(data) {
			res.send({
				compete: data
			})

		})
		.catch(function(reason) {
			console.log(reason);
			res.send('fail')
		})
})
module.exports = router;