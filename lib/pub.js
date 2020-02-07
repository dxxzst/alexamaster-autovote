const user = '你的账号';
const password = '你的密码';
const chromePah = process.platform === 'win32' ? 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' : '/opt/google/chrome/chrome';
const terminalImage = require('terminal-image');
const readline = require('readline');

//基本设置
async function pageSetting(page) {
    //防反爬虫 navigator.webdriver || window.webdriver || self != top
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {get: () => false});
        Object.defineProperty(window, 'webdriver', {get: () => false});
    });
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3724.8 Safari/537.36");
    await page.setViewport({width: 1366, height: 667});
}

//滚动到底部
async function scrollPageToBottom(page) {
    await page.evaluate(() => {
        let content = $(".main-panel");
        content.animate({scrollTop: content[0].scrollHeight});
    });
}

//解决验证码
function waitCode(page) {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Please enter the verification code and press Enter: ', async function (answer) {
            console.log('You have entered %s', answer);
            rl.close(); //不加close，则不会结束

            await page.focus('body > div.wrapper > div.content > div > div > div > div > div > div.col-md-5.col-md-offset-1 > form > div.card-content.text-center > div > div > input');
            await page.type('body > div.wrapper > div.content > div > div > div > div > div > div.col-md-5.col-md-offset-1 > form > div.card-content.text-center > div > div > input', answer);
            await page.waitFor(100);

            await Promise.all([
                page.waitForNavigation(),
                page.click('body > div.wrapper > div.content > div > div > div > div > div > div.col-md-5.col-md-offset-1 > form > div.footer.text-center > input')
            ]);
            let needCheck = await page.evaluate(() => {
                let _href = window.location.href;
                return _href.indexOf("loginvalidate") > -1;
            });
            if (needCheck) {
                await validateCode(page, false);
            } else {
                await page.goto('https://www.alexamaster.net/a/earn_points.php', {waitUntil: 'networkidle2'});
                console.log(`login success`);
            }
            resolve();
        });
    });
}

async function validateCode(page, firstTime = true) {

    if (firstTime) {
        await page.screenshot({
            path: './img/temp.png',
            clip: {
                x: 290,//rect.left,
                y: 342,//rect.top,
                width: 300, //rect.width + padding * 2,
                height: 150 //rect.height + padding * 2
            }
        });
    } else {
        await page.screenshot({
            path: './img/temp.png',
            clip: {
                x: 290,//rect.left,
                y: 432,//rect.top,
                width: 300, //rect.width + padding * 2,
                height: 150 //rect.height + padding * 2
            }
        });
    }

    console.log(await terminalImage.file('./img/temp.png'));
    await waitCode(page);
}

//登陆
async function pageLogin(page) {
    await page.goto('https://www.alexamaster.net/sec/login.php', {waitUntil: 'networkidle2'});

    await page.focus('body > div.wrapper > div.content > div > div > div > div > div > div.col-md-5.col-md-offset-1 > form > div.card-content > div:nth-child(2) > div > input');
    await page.type('body > div.wrapper > div.content > div > div > div > div > div > div.col-md-5.col-md-offset-1 > form > div.card-content > div:nth-child(2) > div > input', user);
    await page.waitFor(100);
    await page.focus('body > div.wrapper > div.content > div > div > div > div > div > div.col-md-5.col-md-offset-1 > form > div.card-content > div:nth-child(3) > div > input');
    await page.type('body > div.wrapper > div.content > div > div > div > div > div > div.col-md-5.col-md-offset-1 > form > div.card-content > div:nth-child(3) > div > input', password);
    await page.waitFor(100);

    await Promise.all([
        page.waitForNavigation(),
        page.click('body > div.wrapper > div.content > div > div > div > div > div > div.col-md-5.col-md-offset-1 > form > div.footer.text-center > input')
    ]);

    let needCheck = await page.evaluate(() => {
        let _href = window.location.href;
        return _href.indexOf("loginvalidate") > -1;
    });

    if (needCheck) {
        //await page.goto('https://www.alexamaster.net/sec/loginvalidate.php', {waitUntil: 'networkidle2'});
        await validateCode(page);
    } else {
        await page.goto('https://www.alexamaster.net/a/earn_points.php', {waitUntil: 'networkidle2'});
        console.log(`login success`);
    }
}

module.exports = {pageSetting, scrollPageToBottom, pageLogin, chromePah};
