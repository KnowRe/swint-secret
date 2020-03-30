var path = require('path'),
	fs = require('fs'),
	swintHelper = require('swint-helper'),
	async = require('async'),
	aws = require('aws-sdk'),
	defaultize = swintHelper.defaultize,
	homepath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

module.exports = function(options) {
	defaultize({
		bucket: '',
		credPath: path.join(homepath, '.swint', 'aws.json'),
		paths: {}
	}, options);

	this.options = options;

	try {
		fs.accessSync(options.credPath);
		this.cred = JSON.parse(fs.readFileSync(options.credPath));
	} catch (e) {
		this.cred = {
			key: process.env.SWINT_SECRET_KEY,
			secret: process.env.SWINT_SECRET_SECRET
		};
	}

	var s3Options = {
		accessKeyId: this.cred.key,
		secretAccessKey: this.cred.secret
	};

	if (options.hasOwnProperty('region')) {
		s3Options.endpoint = 'https://s3-' + options.region + '.amazonaws.com';
		s3Options.region = options.region;
		if (['ap-northeast-2'].indexOf(s3Options.region) !== -1) {
			s3Options.signatureVersion = 'v4';
		}
	}

	this.client = new aws.S3(s3Options);
};

var _ = module.exports.prototype;

_.ready = function(callback) {
	var that = this,
		thePaths = this._getPaths(this.options.paths),
		results = {};

	async.parallel(
		thePaths.map(function(k) {
			return function(cb) {
				that.client.getObject({
					Bucket: that.options.bucket,
					Key: k
				}, function(err, data) {
					results[k] = String(data.Body);
					cb(null, true);
				});
			};
		}),
		function(err) {
			var theResult = JSON.parse(JSON.stringify(that.options.paths));

			that._setPaths(theResult, results);

			callback(err, theResult);
		}
	);
};

_._getPaths = function(paths) {
	var that = this,
		ret = [];

	if (Array.isArray(paths)) {
		ret = paths.reduce(function(prev, p) {
			return prev.concat(that._getPaths(p));
		}, []);
	} else if (typeof paths === 'object') {
		for (var i in paths) {
			ret = ret.concat(this._getPaths(paths[i]));
		}
	} else {
		ret = [paths];
	}

	return ret;
};

_._setPaths = function(paths, results) {
	var that = this;

	if (Array.isArray(paths)) {
		paths.forEach(function(p, idx) {
			if (typeof p === 'object') {
				that._setPaths(p, results);
			} else {
				paths[idx] = results[p];
			}
		});
	} else if (typeof paths === 'object') {
		for (var i in paths) {
			if (typeof paths[i] === 'object') {
				this._setPaths(paths[i], results);
			} else {
				paths[i] = results[paths[i]];
			}
		}
	}
};
