import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { JSDOM } from 'jsdom';
import config from 'config';

type GWT = 'Given' | 'When' | 'Then';
type SortedGWT = Record<GWT, string>;

interface Clause {
    type: GWT;
    desc: string;
    child: Clause[] | null;
}

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

const sortGWT = (listOfClauses: string[]): Clause[] => {
    const sortedGWT = listOfClauses.map(item => {
        const splitLineItems = item.split('<br>\n');
        

        let clauseObject: SortedGWT = {
            Given: '',
            When: '',
            Then: '',
        };

        splitLineItems.forEach((item, index) => {
            const firstWord = item.split(' ')[0];
            const desc = item.split(' ').slice(1).join(' ');
            
            if (firstWord === 'Given') {
                clauseObject = {
                    ...clauseObject,
                    "Given": desc,
                };

                return;
            }

            if (firstWord === 'When') {
                clauseObject = {
                    ...clauseObject,
                    "When": desc,
                };

                return;
            }

            if (firstWord === 'Then') {
                clauseObject = {
                    ...clauseObject,
                    "Then": desc,
                };

                return;
            }

            if (firstWord === 'And') {
                const key = splitLineItems[index - 1].split(' ')[0];
                const relatedDesc = splitLineItems[index - 1].split(' ').slice(1).join(' ')
                clauseObject = {
                    ...clauseObject,
                    [key]: `${relatedDesc} and ${desc}`,
                };

                return;
            }
        });

        return clauseObject;
    });

    const objectsWithGiven = sortedGWT.filter((filterItem, index) => {
        if ( index === 0) return true;

        if (filterItem.Given === sortedGWT[index - 1].Given) return false;

        return true;
    }).map((clause): Clause => ({
        type: 'Given',
        desc: clause.Given,
        child: null,    
    }));

    const objectsWithGivenAndWhen = objectsWithGiven.map(given => {
        const allSimilarGiven: Clause[] = sortedGWT
        .filter(firstFilteritem => firstFilteritem.Given === given.desc)
        .filter((fiterItem, index, array) => {
            if (index === 0) return true;

            if (
                fiterItem.When === array[index - 1].When
            ) return false;

            return true;

        })
        .map(item => ({
            type: 'When',
            desc: item.When,
            child: null,   
        }))

        return {
            ...given,
            child: allSimilarGiven.length ? [
                ...allSimilarGiven
            ] : null
        };
    });

    const objectsWithGivenWhenAndThen = objectsWithGivenAndWhen.map(object => {
        const allSimilarWhen: Clause[] = sortedGWT
        .filter(firstFilteritem => {
            const given = firstFilteritem.Given;
            const when = firstFilteritem.When;

            return object.child &&
                object.child.filter(item => item.desc === when).length &&
                object.desc === given;
        }).map(mapItem => ({
            type: 'Then',
            desc: mapItem.Then,
            child: null,   
        }));

        return {
            ...object,
            child: object.child ? object.child.map(child => ({
                ...child,
                child: [...allSimilarWhen],
            })) : null,
        }
    });

    return objectsWithGivenWhenAndThen;
};

const generateTestCases = (clauses: Clause[], sourceJSON: any) => (
    [
        `describe('${sourceJSON.rss.channel.item.title}', () => {`,

        clauses.map(given => (
            [
                `   describe('${given.desc}', () => {`,
                (given.child || []).map(when => (
                    [
                        `       describe('${when.desc}', () => {`,
                        (when.child || []).map(then => (
                            [
                                `           test('${then.desc}');`,
                            ]
                        )).join('\n'),
                        '       });'
                    ].join('\n')
                )),
                '   });'
            ].join('\n')
        )).join('\n'),
        
        '});',
        '',
    ].join('\n')
);

export const main = (args: string[]) => {
    try {    
        const xmlFile = readFileSync(`${process.cwd()}${xmlFolderName}/${xmlFileName}`, 'utf8');
        const { items: includedItems, json } = includeACRelatedStringOnly(xmlFile);
        const itemsSorted = sortGWT(includedItems);
        const fileContent = generateTestCases(itemsSorted, json);
        
        if (!existsSync(outputFolder as string)) {
            mkdirSync(outputFolder as string, { recursive: true });
        }

        const outputFileName = args[0];
        const fileName = outputFileName || outputFile;
        writeFileSync(`${outputFolder}/${fileName}`, fileContent);
        console.log('Test file created successfully');
    } catch(error: unknown) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
};
