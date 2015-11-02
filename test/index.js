var s3 = require('s3'),
	path = require('path'),
	fs = require('fs'),
	os = require('os'),
	assert = require('assert'),
	swintSecret = require('../lib');

global.swintVar.printLevel = 5;

describe('secret', function() {
	this.timeout(10000);

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

		var client = s3.createClient({
				s3Options: {
					accessKeyId: cred.key,
					secretAccessKey: cred.secret
				}
			}),
			params = {
				localDir: path.join(__dirname, '../test_case'),
				deleteRemoved: true,
				s3Params: {
					Bucket: cred.bucket,
					Prefix: ''
				}
			};

		fs.mkdirSync(path.join(os.tmpDir(), 'swint-secret-empty'));

		var uploader = client.uploadDir(params);

		uploader.on('error', function(err) {
			print(4, err);
			process.exit(-1);
		});

		uploader.on('end', function() {
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
				a: 'aaa',
				b: 'bbb',
				c: {
					d: ['ddd1', 'ddd2', 'ddd3'],
					e: 'eee'
				}
			}
		});

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

		var client = s3.createClient({
				s3Options: {
					accessKeyId: cred.key,
					secretAccessKey: cred.secret
				}
			}),
			params = {
				localDir: path.join(os.tmpDir(), 'swint-secret-empty'),
				deleteRemoved: true,
				s3Params: {
					Bucket: 'swint-secret',
					Prefix: ''
				}
			};

		var uploader = client.uploadDir(params);

		uploader.on('error', function(err) {
			print(4, err);
			process.exit(-1);
		});

		uploader.on('end', function() {
			fs.rmdirSync(path.join(os.tmpDir(), 'swint-secret-empty'));
			done();
		});
	});
});
