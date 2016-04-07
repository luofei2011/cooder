var qs = require('querystring');
var fs = require('fs');
var koa = require('koa');
var serve = require('koa-static');
var route = require('koa-route');
var views = require('koa-views');
var spawn = require('child_process').spawn;
var app = koa();

var fs = require('fs');

app.use(views());

app.use(serve('.'));

function getIssue(type) {
    // TODO 保留两位00，用于做版本库地址限制
    return type + '00' + (+new Date + '').substr(-6);
}

app.use(route.post('/upload', function* () {
    yield new Promise((resolve, reject) => {
        var data = '';
        this.req.on('data', chunk => {
            data += chunk;
        })
        this.req.on('end', () => {
            var req = qs.parse(data);
            var filename = getIssue(req.type);
            this.body = filename;

            fs.writeFileSync('diff/' + filename, req.diff, 'utf8');
            resolve();
        })
    });
}))

app.use(route.get('/cooder/:id', function *(id) {
    var diff = fs.readFileSync('./diff/' + id, 'utf8');
    diff = diff.split('\n');
    if (/^2/.test(id)) {
        yield new Promise((resolve, reject) => {
            var py = spawn('python', ['bin/diff2html.py', '-i', 'diff/' + id]);

            var html = '';
            py.stdout.on('data', chunk => {
                html += chunk;
            })

            py.stdout.on('end', () => {
                this.body = html;
                resolve();
            })

            py.on('error', (err) => {
                console.log('on error.', err)
            })
        });
    }
    else {
        yield this.render('./views/index.jade', {
            diffCode: JSON.stringify(diff)
        });
    }
}))

app.listen(8855);
