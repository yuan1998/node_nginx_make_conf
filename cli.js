#!/usr/bin/env node
import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'fs';
import unzipper from 'unzipper';
import Tmp from './tmp_conf.js';
import path from 'path';

const readDirZipFile = (dirPath) => {
    let result = [];
    dirPath = path.resolve(dirPath);
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
        const files = {key: '', crt: ''};
        fs.createReadStream(file).pipe(unzipper.Parse()).on('entry', function (entry) {
            console.log("entry", entry.path);
            if (/[key|crt|pem]$/.test(entry.path)) {
                if (/key$/.test(entry.path)) {
                    files.key = entry.path;
                } else {
                    files.crt = entry.path;
                }

                entry.pipe(fs.createWriteStream(path.resolve(`cert/${entry.path}`)));
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
        .replace(/\$DOMAIN\$/g, file.domain)
        .replace(/\$CRT\$/g, file.cret.crt)
        .replace(/\$KEY\$/g, file.cret.key)
}

const generateConf = (file) => {
    let content = makeContent(file);

    fs.writeFileSync(path.resolve(`conf.d/${file.domain}-nginx.conf`), content);
}
const deleteFile = (path) => {
    if (fs.existsSync(path)) {
        fs.unlinkSync(path)
    }
}

(async () => {
    const response = await prompts({
        type: 'select',
        name: 'value',
        message: '选择你要创建的类型',
        choices: [
            {title: '鞋子', value: 'xiezi'},
            {title: '手表', value: 'shoubiao'},
            {title: '香水', value: 'xiangshui'}
        ],
        initial: 0
    });
    let value = response.value;

    if (value) {
        let file = readDirZipFile(value)

        for (const file1 of file) {
            file1.cret = await unzipFile(file1.zipFullPath);
            if (!file1.cret.key || !file1.cret.crt) {
                console.log(chalk.red(`无效文件 ${file1.zipName}`));
                continue;
            }
            file1.domain = parseDomain(file1.zipName);
            console.log(chalk.blue(`开始创建 ${file1.domain}`));

            generateConf(file1);
            console.log(chalk.blue(`创建成功 ${file1.domain}`));
            deleteFile(file1.zipFullPath);
            console.log(chalk.blue(`删除证书文件 ${file1.zipName}`));
        }
    }

})()
