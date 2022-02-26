#!/usr/bin/env node
import chalk from 'chalk';
import fs from 'fs';
import unzipper from 'unzipper';
import Tmp from './tmp_conf.js';

console.log(chalk.blue('Hello world!'));

const readDirZipFile = (dirPath) => {
    let result = [];
    let files = fs.readdirSync(dirPath);
    files.filter((item) => {
        return /\.zip$/.test(item)
    }).forEach((item) => {
        result.push({
            zipName: item,
            zipFullPath: `${dirPath}/${item}`
        })
    })
    return result;
}

const unzipFile = (file) => {
    return new Promise((resolve, reject) => {
        const files = {key: '',crt:''};
        fs.createReadStream(file).pipe(unzipper.Parse()).on('entry', function (entry) {
            console.log("entry", entry.path);
            if (/[key|crt|pem]$/.test(entry.path)) {
                if (/key$/.test(entry.path)) {
                    files.key = entry.path;
                } else {
                    files.crt = entry.path;
                }
                entry.pipe(fs.createWriteStream(`./cert/${entry.path}`));
            } else {
                entry.autodrain();
            }
        }).on('finish', () => {
            resolve(files);
        })
    })
}

const parseDomain = (file) => {
    let arr = file.split('-');
    return `${arr[0]}.${arr[1]}`
}

const makeContent = (file) => {
    // let tmp = Tmp.slice();
    // console.log("Tmp",tmp.replace('/\$DOMAIN\$/g',file.domain));
    return Tmp.slice()
        .replace(/\$DOMAIN\$/g,file.domain)
        .replace(/\$CRT\$/g,file.cret.crt)
        .replace(/\$KEY\$/g,file.cret.key)
}

const generateConf = (file) => {
    let content = makeContent(file);
    fs.writeFileSync(`./conf.d/${file.domain}-nginx.conf`, content);
}

(() => {
    let file = readDirZipFile('xiezi')

    file.forEach(async (file) => {
        file.domain = parseDomain(file.zipName);
        file.cret = await unzipFile(file.zipFullPath);
        generateConf(file);
    })
})()
