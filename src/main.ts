import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { JSDOM } from 'jsdom';
import config from 'config';

let fileContent: string;
const xmlFolderName = config.get('xml.folder');
const xmlFileName = config.get('xml.file');
const outputFolder = config.get('output.folder');
const outputFile = config.get('output.file');

export const main = () => {
    try {    
        const xmlFile = readFileSync(`${process.cwd()}${xmlFolderName}/${xmlFileName}`, 'utf8');
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
        
        if (!existsSync(outputFolder as string)) {
            mkdirSync(outputFolder as string, { recursive: true });
        }
    
        writeFileSync(`${outputFolder}/${outputFile}`, fileContent);
        console.log('Test file created successfully');
    } catch(error: unknown) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
};

main();
