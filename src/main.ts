import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { JSDOM } from 'jsdom';

type Arguments = (string | null)[];
type ok = string | null;


const args: Arguments = process.argv.slice(2);
const folderName = args[0];
const fileName = args[1];
let fileContent: string;
const outputFolder = args[2] || './output';
const testName = args[3] || 'test'





try {

    // Argument validation
    if (!folderName) {
        throw new Error('Need to specify the XMl folder location');
    }

    const xmlFile = readFileSync(`${process.cwd()}${folderName}/${fileName}.xml`, 'utf8');
    const parser = new XMLParser();
    const json = parser.parse(xmlFile);
    const dom = new JSDOM(json.rss.channel.item.description);
    const allItems = [...dom.window.document.querySelectorAll("p")].slice(1);
    const includedItems = allItems.filter(item => {
        const str = item.textContent;

        if (!str) {
            return false;
        }
        
        return str.includes('Given');
    }).map(includedItem =>  {
        console.log(includedItem.innerHTML)
        return includedItem.innerHTML
    });
    console.log(includedItems);
    const itemsSorted = includedItems.map(item => {
        const splitLineItems = item.split('<br>\n');
        console.log('SpliLine Item', splitLineItems);
        const newObj: Record<string, string> = {};
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
                `   test.describe('${item.given}${item.and ? `and ${item.and}` : ''}', () => {`,
                `       test.describe('${item.when}', () => {`,
                `           test('${item.then}');`,
                '       });',
                '   });'
            ].join('\n')
        )).join('\n'),
        '});',
        '',
    ].join('\n');
    
    if (!existsSync(outputFolder)) {
        mkdirSync(outputFolder, { recursive: true });
    }

    writeFileSync(`${outputFolder}/${testName}.tsx`, fileContent);
    console.log('Test file created successfully');
} catch(error: unknown) {
    if (error instanceof Error) {
        console.log(error.message);
    }
}

