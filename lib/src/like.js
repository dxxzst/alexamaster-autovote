async function run(browser, page, page1) {
    //1.获取赞数
    let likeNum;
    try {
        await page1.waitForSelector('#pages_side_column', {visible: true});
        likeNum = await page1.evaluate(() => {
            let items = document.getElementsByClassName('clearfix _ikh');
            for (let i = 0; i < items.length; i++) {
                let tempNum = Number(items[i].innerText.split(' ')[0].split(',').join(''));
                if (!isNaN(tempNum)) {
                    return tempNum;
                }
            }
            return NaN;
        });
    } catch {
        likeNum = NaN;
    }

    //2.设置赞数
    await page.bringToFront();
    await page.waitForSelector('#flst', {visible: true, timeout: 60000});
    await page.evaluate((likeNum) => {
        let resultList = [];
        $("#flst option").each(function () {
            resultList.push($(this).val());
        });

        if (isNaN(likeNum)) {
            $('#flst').val(resultList[0]);
        } else if (likeNum < 100) {
            $('#flst').val(resultList[1]);
        } else if (likeNum >= 100 && likeNum < 500) {
            $('#flst').val(resultList[2]);
        } else if (likeNum >= 500 && likeNum < 1000) {
            $('#flst').val(resultList[3]);
        } else if (likeNum >= 1000 && likeNum < 5000) {
            $('#flst').val(resultList[4]);
        } else if (likeNum >= 5000 && likeNum < 10000) {
            $('#flst').val(resultList[5]);
        } else if (likeNum >= 10000) {
            $('#flst').val(resultList[6]);
        }
    }, likeNum);
    await page.waitFor(1000);
    await page.click('body > div.swal2-container.swal2-fade.swal2-in > div > button.swal2-confirm.swal2-styled');

    //3.关闭页面
    try {
        await page.waitFor(1000);
        await page1.close();
    } catch {
    }
    console.log(`success load facebook like`);
}

module.exports = {run};