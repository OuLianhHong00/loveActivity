var mysql = require("mysql");
var pool = mysql.createPool({
	host: "39.105.117.213",
	port: 3306,
	user: "root",
	password: "Oulianhong123!",
	database: "loveactivity"
});

function myQuery(sql, params) {
	return new Promise((resolve, reject) => {
		pool.getConnection((err, connection) => {
			if (err) {
				resolve(err);
				return;
			}
			connection.query(sql, params, (error, result) => {
				if (error) {
					reject(error)
				} else {
					resolve(result)
				}
				connection.release();
			})
		})
	})
}


function transaction(sqlArr) {
	return new Promise((resolve, reject) => {
		pool.getConnection((err, connection) => {
			if (err) {
				resolve(err);
				return;
			}
			connection.beginTransaction((err) => {
				if (err) {
					reject(err)
				}
				for (let i = 0; i < sqlArr.length; i++) {
					console.log(sqlArr[i]);
					myQuery(sqlArr[i].sql, sqlArr[i].params).catch((err) => {
						connection.rollback((err) => {
							reject(err)
						})
					})
				}
				connection.commit((err) => {
					if (err) {
						connection.rollback(() => {
							reject(err)
						})
					}
				})
				console.log('Transaction complete')
				resolve('Transaction complete')
				connection.release();
			})
		})
	})
}

exports.myQuery = myQuery;
exports.transaction = transaction;