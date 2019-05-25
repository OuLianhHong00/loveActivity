function userModel() {
	var that = this;
	//登录
	that.login = function(codeid, userinfo) {
		let str;
		const appId = "wx7a4111c76a5ece2a";
		const appSecret = "0a696d034f12caf03c22d6eb20a0017a";
		request('https://api.weixin.qq.com/sns/jscode2session?appid=' + appId + '&secret=' + appSecret + '&js_code=' + codeid + '&grant_type=authorization_code', function(error, response, body) {
			if (!error && response.statusCode === 200) {
				console.log(body + '获得sessionkey返回的信息');
				db.myQuery('select * from selfInfo where userId=? ', [body.openid])
					.then(function(data) {
						if (data == '') {
							var insertSql = 'insert into selfInfo(userName,userAvator,userId) values(?,?,?)';
							var insertParams = [userInfo.nickName, userInfo.avatarUrl, body.openid];
							db.myQuery(insertSql, insertParams)
								.then(function(data) {
									console.log(data)
									//登录成功设置session
									req.session.userId = body.openid;
									str = req.session.userId;
								})
								.catch(function(reason) {
									console.log(reason)
									str = reason;
								});
						} else {
							str = '登录成功';
						}
					})
					.catch(function(reason) {
						console.log(reason)
						str = reason;
					});
			} else {
				str = '获得登录者id失败';
			}
		});
		return str;
	}
}

module.exports.userModel = userModel;