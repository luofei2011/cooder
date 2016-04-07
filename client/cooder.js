/**
 * @file 修改diff查看
 * @author luofeihit2010@gmail.com
 * @date 2016-04-07
 * TODO 目前只支持在根目录进行比较
 */
'use strict';
var http = require('http');
var fs = require('fs');
var qs = require('querystring');
var spawnSync = require('child_process').spawnSync;
var execSync = require('child_process').execSync;

const REPO_TYPE = {
    git: 1,
    svn: 2
}

function getRepoType() {
    return fs.readdirSync(__dirname).indexOf('.svn') !== -1 ? 'svn' : 'git'
}

function Cooder() {
    this.fullPathExclude = [];
    this.fullPathInclude = [];

    this.init();
}

Cooder.prototype.init = function () {
    process.argv.filter((arg, index) => index > 1).forEach((arg, index) => {
        let _arg = this.getParam(arg);
        if (/^--exclude=/.test(arg)) {
            this._handleExclude(_arg);
        }
        else if (/^--include=/.test(arg)) {
            this._handleInclude(_arg);
        }
    })
}

// TODO 添加正则支持

Cooder.prototype._handleExclude = function (str) {
    console.log(str)
    this.fullPathExclude = str.split(',').filter(file => file.length)
    console.log(this.fullPathExclude);
}

Cooder.prototype._handleInclude = function (str) {
    this.fullPathInclude = str.split(',').filter(file => file.length)
}

Cooder.prototype.getParam = function (arg) {
    return arg.replace(/^--\w+=/, '').replace(/^['|"]|['|"]$/, '');
}

Cooder.prototype.getSvnDiff = function () {
    //var st = spawnSync('svn', ['st | grep -r'], {encoding: 'utf8'});
    var changes = execSync('svn st | grep -re "^[M|A|E|D]"', {encoding: 'utf8'});
    changes = changes && changes.split('\n') || [];
    changes = changes.filter(file => file.length).map(file => file.replace(/^[M|A|E|D]\s*/, ''));
    changes = changes.filter(file => this.fullPathExclude.indexOf(file) === -1)

    if (this.fullPathInclude.length) {
        changes = this.fullPathInclude;
    }

    changes.unshift('diff');

    var diff = spawnSync('svn', changes, {encoding: 'utf8'});
    this.plainDiff = diff.stdout;
}

Cooder.prototype._isNoneDiff = function () {
    return !this.plainDiff.length;
}

Cooder.prototype.upload = function () {
    if (this._isNoneDiff()) {
        console.log('nothing to change.')
    }
    else {
        var req = http.request({
            host: 'serverHost',
            port: 8855,
            path: '/upload',
            method: 'POST'
        }, res => {
            res.setEncoding('utf8');
            var response = '';
            res.on('data', chunk => {
                response += chunk;
            })
            res.on('end', () => {
                console.log('see.', 'http://serverHost:8855/cooder/' + response);
            })
        });

        req.on('error', (err) => {
            console.log('error.', err)
        });

        req.write(qs.stringify({
            type: this.repoType,
            diff: this.plainDiff
        }));

        req.end();
    }
}

Cooder.prototype.start = function () {
    const type = getRepoType();
    this.repoType = REPO_TYPE[type];
    if (type === 'svn') {
        this.getSvnDiff();
    }
    else if (type === 'git') {
        this.getGitDiff();
    }

    this.upload();
}


var cooder = new Cooder();
cooder.start();
