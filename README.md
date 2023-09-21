![Header logo](./src/header-logo.png?raw=true)

## Quick start

1. Install the package
`npm i --save-dev actc`

2. Setup your config file
```js
// /config/default.json

{
	"xml": {
		"folder": "/xml",
		"file": "test.xml"
	},
	"output": {
		"folder": "./output",
		"file":	"test.ts"
	}
}
```
3. Place your XMl file in the specified folder.

4. Create a npm script
```js
// package.json
	"scripts": {
		"your-script-name": "actc"
	},
```
5. Run your script
` npm run your-script-name`

## Custom output file name
Run your script with the name you like
`npm run your-script-name your-file-name.js`