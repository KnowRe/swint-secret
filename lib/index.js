'use strict';

var path = require('path'),
	fs = require('fs'),
	swintHelper = require('swint-helper'),
	async = require('async'),
	s3 = require('s3'),
	defaultize = swintHelper.defaultize;

module.exports = function(options) {
	defaultize({
		bucket: '',
		credPath: path.join(process.env.HOME, '.swint', 'aws.json'),
		paths: {}
	}, options);

	this.options = options;
	this.cred = JSON.parse(fs.readFileSync(options.credPath));
	this.client = s3.createClient({
		s3Options: {
			accessKeyId: this.cred.id,
			secretAccessKey: this.cred.secret
		}
	});
};

var _ = module.exports.prototype;

_.ready = function(callback) {
	var that = this,
		thePaths = this._getPaths(this.options.paths),
		results = {};

	async.parallel(
		thePaths.map(function(k) {
			return function(cb) {
				results[k] = '';

				var dl = that.client.downloadStream({
					Bucket: that.options.bucket,
					Key: k
				});

				dl.on('data', function(chunk) {
					results[k] += chunk;
				});

				dl.on('end', function() {
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

	if(Array.isArray(paths)) {
		ret = paths.reduce(function(prev, p) {
			return prev.concat(that._getPaths(p));
		}, []);
	} else if(typeof paths === 'object') {
		for(var i in paths) {
			ret = ret.concat(this._getPaths(paths[i]));
		}
	} else {
		ret = [paths];
	}

	return ret;
};

_._setPaths = function(paths, results) {
	var that = this;

	if(Array.isArray(paths)) {
		paths.forEach(function(p, idx) {
			if(typeof p === 'object') {
				that._setPaths(p, results);
			} else {
				paths[idx] = results[p];
			}
		});
	} else if(typeof paths === 'object') {
		for(var i in paths) {
			if(typeof paths[i] === 'object') {
				this._setPaths(paths[i], results);
			} else {
				paths[i] = results[paths[i]];
			}
		}
	}
};
