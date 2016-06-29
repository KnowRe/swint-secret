var aws = require('aws-sdk'),
	path = require('path'),
	fs = require('fs'),
	os = require('os'),
	assert = require('assert'),
	async = require('async'),
	swintHelper = require('swint-helper'),
	swintS3Upload = require('swint-s3upload'),
	swintSecret = require('../lib');

global.swintVar.printLevel = 5;

describe('secret', function() {
	this.timeout(100000);
	var randKey = String(Math.floor(Math.random() * 10000000));

	before(function(done) {
		var credPath = path.join(process.env.HOME, '.swint', 'swint-secret-test.json'),
			cred;

		try {
			fs.accessSync(credPath);
			cred = JSON.parse(fs.readFileSync(credPath));
		} catch(e) {
			cred = {
				key: process.env.SWINT_SECRET_TEST_KEY,
				secret: process.env.SWINT_SECRET_TEST_SECRET,
				bucket: process.env.SWINT_SECRET_TEST_BUCKET
			};
		}

		swintS3Upload({
			inDir: path.join(__dirname, '../test_case'),
			outDir: randKey,
			s3Info: {
				key: cred.key,
				secret: cred.secret,
				bucket: cred.bucket
			}
		}, function(err, res) {
			if (err) {
				print(4, err);
				return;
			}

			done();
		});
	});

	it('_getPaths()', function() {
		var ss = new swintSecret({
			paths: {
				a: 'aaa',
				b: 'bbb',
				c: {
					d: ['ddd1', 'ddd2', 'ddd3'],
					e: 'eee'
				}
			}
		});

		assert.deepEqual(ss._getPaths(ss.options.paths), ['aaa', 'bbb', 'ddd1', 'ddd2', 'ddd3', 'eee']);
	});

	it('_setPaths()', function() {
		var ss = new swintSecret({
			paths: {
				a: 'aaa',
				b: 'bbb',
				c: {
					d: ['ddd1', 'ddd2', 'ddd3'],
					e: 'eee'
				}
			}
		});

		ss._setPaths(ss.options.paths, {
			aaa: 'AAA',
			bbb: 'BBB',
			ddd1: 'DDD1',
			ddd2: 'DDD2',
			ddd3: 'DDD3',
			eee: 'EEE'
		});

		assert.deepEqual(ss.options.paths, {
			a: 'AAA',
			b: 'BBB',
			c: {
				d: ['DDD1', 'DDD2', 'DDD3'],
				e: 'EEE'
			}
		});
	});

	it('Simple case', function(done) {
		var ss = new swintSecret({
			bucket: 'swint-secret',
			paths: {
				a: randKey + '/' + 'aaa',
				b: randKey + '/' + 'bbb',
				c: {
					d: [randKey + '/' + 'ddd1', randKey + '/' + 'ddd2', randKey + '/' + 'ddd3'],
					e: randKey + '/' + 'eee'
				}
			}
		});

		setTimeout(function() {
			ss.ready(function(err, res) {
				if(err) {
					print(4, err);
					process.exit(-1);
				}

				assert.deepEqual(res, {
					a: 'AAA',
					b: 'BBB',
					c: {
						d: ['DDD1', 'DDD2', 'DDD3'],
						e: 'EEE'
					}
				});

				done();
			});
		}, Math.random() * 30000);
	});

	after(function(done) {
		var credPath = path.join(process.env.HOME, '.swint', 'swint-secret-test.json'),
			cred;

		try {
			fs.accessSync(credPath);
			cred = JSON.parse(fs.readFileSync(credPath));
		} catch(e) {
			cred = {
				key: process.env.SWINT_SECRET_TEST_KEY,
				secret: process.env.SWINT_SECRET_TEST_SECRET,
				bucket: process.env.SWINT_SECRET_TEST_BUCKET
			};
		}

		var files = swintHelper.walk({
				dir: path.join(__dirname, '../test_case')
			}),
			client = new aws.S3({
				accessKeyId: cred.key,
				secretAccessKey: cred.secret
			});

		async.parallel(
			files.map(function(f) {
				return function(cb) {
					client.deleteObject({
						Bucket: 'swint-secret',
						Key: randKey + '/' + f.replace(path.join(__dirname, '../test_case') + path.sep, '').replace('\\', '/')
					}, function(err) {
						cb(null, true);
					})
				};
			}),
			function(err, res) {
				done();
			}
		);
	});
});
