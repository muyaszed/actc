import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { JSDOM } from 'jsdom';
import config from 'config';

type GWT = 'given' | 'when' | 'then' | 'and';
type SortedGWT = Record<GWT, string>;

const xmlFolderName = config.get('xml.folder');
const xmlFileName = config.get('xml.file');
const outputFolder = config.get('output.folder');
const outputFile = config.get('output.file');

const includeACRelatedStringOnly = (xmlFile: string) => {
    const parser = new XMLParser();
    const json = parser.parse(xmlFile);
    const dom = new JSDOM(json.rss.channel.item.description);
    const allItems = [...dom.window.document.querySelectorAll("p")].slice(1);

    return ({
        items:  allItems
            .filter(item => {
                const str = item.textContent;

                if (!str) {
                    return false;
                }
                
                return str.includes('Given');
            })
            .map(includedItem => includedItem.innerHTML),
        json,
    });
};

const sortGWT = (listOfClauses: string[]): SortedGWT[] => (
    listOfClauses.map(item => {
        const splitLineItems = item.split('<br>\n');
        const newObj: SortedGWT = {
            given: '',
            when: '',
            then: '',
            and: '',
        };
        splitLineItems.forEach(lineItem => {
            const splitWord = lineItem.split(' ');
            const subject = splitWord[0];
            const description = splitWord.slice(1).join(' ');
            newObj[subject.toLowerCase() as GWT] = description;
        })

        return newObj;
    })
);

const generateTestCases = (sortedGWT: SortedGWT[], sourceJSON: any) => (
    [
        `test.describe('${sourceJSON.rss.channel.item.title}', () => {`,
        sortedGWT.map(item => (
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
    ].join('\n')
);

export const main = () => {
    try {    
        const xmlFile = readFileSync(`${process.cwd()}${xmlFolderName}/${xmlFileName}`, 'utf8');
        const { items: includedItems, json } = includeACRelatedStringOnly(xmlFile);
        const itemsSorted = sortGWT(includedItems);
    
        const fileContent = generateTestCases(itemsSorted, json);
        
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
