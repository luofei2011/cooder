## 在线cooder平台搭建 

> `diff2html`对svn支持不友好，因此本平台基于svn和git两种版本管理采用了两种方式（不同之处在于页面样式） 

### 服务端搭建 

#### 依赖 

* python2.7+ 

* node 需要支持es6 

#### 安装 

```bash
git clone https://github.com/luofei2011/cooder.git
cd cooder
npm install

# run
node index.js # or pm2 start index.js
```

### 客户端使用

把`client/cooder.js`放置到svn或者git项目的根目录

#### 使用方法

```bash
# 常用，会自动检测被添加到版本库中的文件改动diff
node cooder.js

# exclude，排除某些文件
node cooder.js --exclude="a.js,b.css,path/to/image.png"

# include，只包含某些文件
node cooder.js --include="package.json,src/controller/App.js"
