import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { JSDOM } from 'jsdom';

const args = process.argv.slice(2);
const folderName = args[0];
const fileName = args[1];
let fileContent;
const outputFolder = args[2] || './output';
const testName = args[3] || 'test'

try {
    const xmlFile = readFileSync(`${process.cwd()}${folderName}/${fileName}.xml`, 'utf8');
    const parser = new XMLParser();
    const json = parser.parse(xmlFile);
    const dom = new JSDOM(json.rss.channel.item.description);
    const allItems = [...dom.window.document.querySelectorAll("p")].slice(1);
    const includedItems = allItems.filter(item => {
        const str = item.textContent;
        
        return str.includes('Given');
    }).map(includedItem => includedItem.textContent);
    
    const itemsSorted = includedItems.map(item => {
        const splitLineItems = item.split('\n');
        const newObj = {};
        splitLineItems.forEach(lineItem => {
            const splitWord = lineItem.split(' ');
            const subject = splitWord[0];
            const description = splitWord.slice(1).join(' ');
            newObj[subject.toLowerCase()] = description;
        })

        return newObj;
    })

    fileContent = [
        "import { test } from '@playwright/test';",
        '',
        `test.describe('${json.rss.channel.item.title}', () => {`,
        itemsSorted.map(item => (
            [
                `   test.describe('${item.given} ${item.and ? `and ${item.and}` : ''}' , () => {`,
                `       test.describe('${item.when}', () => {`,
                `           test('${item.then}');`,
                '       });',
                '   });'
            ].join('\n')
        )).join('\n'),
        '});',
        '',
    ].join('\n');    
} catch(error) {
    if (error.code === 'ENONENT') {
        console.log('Fiile not found');
    } else {
        console.log('Something not right', error);
    }
}

try {
    if (!existsSync(outputFolder)) {
        mkdirSync(outputFolder, { recursice: true });
    }

    writeFileSync(`${outputFolder}/${testName}.tsx`, fileContent);
    console.log('Test file created successfully');
} catch(error) {
    console.log(error)
}
