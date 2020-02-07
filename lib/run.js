const puppeteer = require('puppeteer');
const videoWorker = require('./src/video');
const voteWorker = require('./src/vote');
const likeWorker = require('./src/like');
const timer = require('./src/time');
const pub = require('./pub');

const MaxLOOP = 10;
const SleepInterVal = 30 * 60 * 1000; //休息30分钟

//sleep
function sleep(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}

//关闭多余页面
async function closeOtherTabs(browser) {
    //关闭多余
    try {
        let pages = await browser.pages();
        for (let i = 1; i < pages.length; i++) {
            await pages[i].close();
        }
    } catch (e) {
        let pages = await browser.pages();
        console.log(`${timer.get()} error happened in closeOtherTabs:${pages.length} --- ${e.message}`);
    }
}

//重启浏览器
async function reloadBrowser(browser, page, needSleep) {
    try {
        if (needSleep) {
            console.log(`${timer.get()} need sleep 30 minutes`);
            await browser.close();
            await sleep(SleepInterVal);
        } else {
            await browser.close();
        }
    } catch (e) {
        console.log(`${timer.get()} error happened in reloadBrowser:${e.message}`);
    } finally {
        run();
    }
}

//获取任务列表
async function toGetWorkList(page) {
    try {
        return await page.evaluate(() => {
            let jobList = [];
            $('#fall .timeline-panel').each(function (index) {
                let tempType = {
                    type: '',
                    selector: '.timeline-panel:eq(' + index + ') a:eq(0)'
                };

                if ($(this).find('.fa-youtube-play').length > 0) {
                    tempType.type = 'video';
                    jobList.push(tempType);
                } else if ($(this).find('.fa-eye ').length > 0) {
                    tempType.type = 'vote';
                    jobList.push(tempType);
                } else if ($(this).find('.fa-thumbs-up ').length > 0) {
                    tempType.type = 'like';
                    jobList.push(tempType);
                } else if ($(this).text().indexOf('Paining Eyes') !== -1) {
                    tempType.type = 'sleep';
                    jobList.push(tempType);
                }
            });
            return jobList;
        });
    } catch (e) {
        console.log(`${timer.get()} error happened in toGetWorkList:${e.message}`);
        return [];
    }
}

//运行任务列表
async function toRunWorkList(browser, page) {
    //检查任务是否为空
    let tempList = await toGetWorkList(page);
    if (tempList.length === 0) return true;

    //运行，检查是否全是sleep
    let _length = tempList.length;
    let _sleepCount = 0;
    for (let i = 0; i < _length; i++) {
        if (tempList[i].type === 'sleep') {
            _sleepCount++;
            continue;
        }

        //1.打开tab
        let tempSelector = tempList[i].selector;
        if (tempSelector) {
            await page.evaluate((tempSelector) => {
                $(tempSelector).click();
            }, tempSelector);
        } else {
            continue;
        }

        //2.检查tab是否打开
        await closeOtherTabs(browser);
        let pages = await browser.pages();
        let page1 = pages[1];
        let checkCounter = 0;
        while (pages.length < 2 || page1 === undefined) {
            await page.waitFor(1000);
            pages = await browser.pages();
            page1 = pages[1];
            if (checkCounter > MaxLOOP) {
                throw {message: 'wait for tab open timeout'}
            }
        }

        try {
            //3.运行
            switch (tempList[i].type) {
                case 'video':
                    await videoWorker.run(browser, page, page1);
                    break;
                case 'vote':
                    await voteWorker.run(browser, page, page1);
                    break;
                case 'like':
                    await likeWorker.run(browser, page, page1);
                    break;
            }
        } catch (e) {
            console.log(`${timer.get()} error happened in toRunWorkList:${e.message}`);
        }
    }

    return _sleepCount === _length;
}

//运行类型：video、vote、like、sleep
async function loopRun(browser, page) {
    let needSleep = false; //需要等待刷新
    try {
        while (!needSleep) {
            for (let i = 0; i < 3; i++) {
                await pub.scrollPageToBottom(page);
                await page.waitFor(2000);
            }
            needSleep = await toRunWorkList(browser, page);
        }
    } catch (e) {
        console.log(`${timer.get()} error happened in loopRun:${e.message}`);
    } finally {
        await reloadBrowser(browser, page, needSleep);
    }
}

async function run() {
    let browser;
    try {
        browser = await puppeteer.launch({
            ignoreHTTPSErrors: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--disable-features=site-per-process'
            ],
            executablePath: pub.chromePah,
            headless: true
        });
        const page = (await browser.pages())[0];
        await pub.pageSetting(page);
        await pub.pageLogin(page);

        loopRun(browser, page);
    } catch (e) {
        console.log(`${timer.get()} error happened in run:${e.message}`);
        try {
            if (browser) await browser.close();
        } catch {
        }
        run();
    }
}

module.exports = {run};
