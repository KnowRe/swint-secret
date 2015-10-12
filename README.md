# swint-secret
Secret string manager for Swint. Save your secret strings in Amazon S3 and avoid accidental commitment of secret strings!

**Warning: This is not the final draft yet, so do not use this until its official version is launched**

## Installation
```sh
$ npm install --save swint-secret
```

## Preparation
You may save your secret credentials at `$HOME/.swint/aws.json` in the format below:
```json
{
	"id": "ADJFNAIAMYAWSID",
	"secret": "DEJNARGMKAJENVADMMYAWSSECRET"
}
```

## Testing
You may save your secret credentials for the test at `$HOME/.swint/swint-secret-test.json` in the format below:
```json
{
	"id": "ADJFNAIAMYAWSID",
	"secret": "DEJNARGMKAJENVADMMYAWSSECRET",
	"bucket": "swint-secret"
}
```

## Options
* `bucket` : `String`, default: `''`
* `credPath` : `String`, default: `path.join(process.env.HOME, '.swint', 'aws.json')`
* `paths` : `Object`, default: `{}`

## Usage
```javascript
var ss = new swintSecret({
	bucket: 'myBucketForSecret',
	paths: {
		a: 'aaa.txt',
		b: 'bbb.txt',
		c: {
			d: ['ddd1.txt', 'ddd2.txt', 'ddd3.txt'],
			e: 'eee.txt'
		}
	}
});

ss.ready(function(err, res) {
	if(err) {
		print(4, err);
		return;
	}

	// res will be the fetched string of your secret credentials
});
```
