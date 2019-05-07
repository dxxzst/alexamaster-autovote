const colourList = [
    {
        value: '000000',
        color: '#000000'
    },
    {
        value: 'FF0000',
        color: '#FF0000'
    },
    {
        value: 'FFA500',
        color: '#FFA500'
    },
    {
        value: 'FFFF00',
        color: '#FFFF00'
    },
    {
        value: '008000',
        color: '#008000'
    },
    {
        value: '00FFFF',
        color: '#00FFFF'
    },
    {
        value: '0000FF',
        color: '#0000FF'
    },
    {
        value: '800080',
        color: '#800080'
    },
    {
        value: 'A52A2A',
        color: '#A52A2A'
    },
    {
        value: '808080',
        color: '#808080'
    },
    {
        value: 'FFFFFF',
        color: '#FFFFFF'
    }
];

async function run(browser, page, page1) {
    //1. TODO 获取背景色
    //await page1.waitFor('body', {waitUntil: 'domcontentloaded'});
    let tempValue = 'FFFFFF';

    //2.设置背景色
    await page.bringToFront();
    await page.waitForSelector('body > div.swal2-container.swal2-fade.swal2-in > div > button.swal2-confirm.btn.btn-success', {visible: true});
    await page.waitFor(500);
    await page.click('.swal2-confirm');
    await page.waitForSelector('#backcol', {visible: true});
    await page.waitFor(500);
    await page.evaluate((tempValue) => {
        $('#backcol').val(tempValue);
    }, tempValue);
    await page.waitFor(1000);
    await page.click('body > div.swal2-container.swal2-fade.swal2-in > div > button.swal2-confirm.swal2-styled');

    //3.关闭页面
    try {
        await page.waitFor(1000);
        await page1.close();
    } catch {
    }
    console.log(`success load good vote`);
}

module.exports = {run};