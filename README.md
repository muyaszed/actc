![Header logo](./src/header-logo.png?raw=true)

This is a small script that could convert your story acceptance criteria(AC) in Jira to test cases automatically. Your AC should use the Given, When and Then(GWT) format in order for it to work.

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

3.  Create a npm script
```js
// package.json
	"scripts": {
		"your-script-name": "actc"
	},
```

4. Download the XML file from Jira into the specified folder.

5. Run your script
` npm run your-script-name`

## Custom output file name
Run your script with the name you like
`npm run your-script-name your-file-name.js`