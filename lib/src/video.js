const MaxLOOP = 10;

async function run(browser, page, page1) {
    //1.播放检查
    await page1.waitForSelector('#movie_player', {visible: true});
    let isPaused = true;
    let checkCounter = 0;
    do {
        checkCounter++;
        await page.waitFor(500);
        isPaused = await page1.evaluate(() => {
            let videoElement = document.getElementsByClassName('video-stream html5-main-video');
            return videoElement.length === 0 || videoElement[0].paused;
        });
        if (checkCounter > MaxLOOP) {
            throw {message: 'wait for video play timeout'}
        }
    } while (isPaused);
    await page.waitFor(2000);

    //2.跳过广告
    let hasAD = await page1.evaluate(() => {
        return document.getElementsByClassName('ytp-ad-player-overlay-instream-info').length === 1;
    });
    if (hasAD) {
        await page1.waitForSelector('.ytp-ad-skip-button.ytp-button', {visible: true});
        await page.waitFor(500);
        await page1.click('.ytp-ad-skip-button.ytp-button');
        await page.waitFor(1500);
    }

    //3.获取秒数
    let duration = await page1.evaluate(() => {
        let videoElement = document.getElementsByClassName('video-stream html5-main-video');
        if (videoElement.length === 0) {
            return NaN;
        } else {
            return videoElement[0].duration;
        }
    });

    //4.设置时间
    await page.bringToFront();
    await page.waitForSelector('#vlen', {visible: true, timeout: 60000});
    await page.evaluate((duration) => {
        let resultList = [];
        $("#vlen option").each(function () {
            resultList.push($(this).val());
        });

        //采用Minutes
        if (resultList[0].indexOf(':') === -1) {
            //选择最接近的时间
            let tempMinutes = duration / 60;
            if (tempMinutes < 5) {
                $('#vlen').val(resultList[0]);
            } else if (tempMinutes >= 5 && tempMinutes < 10) {
                $('#vlen').val(resultList[1]);
            } else if (tempMinutes >= 10 && tempMinutes < 15) {
                $('#vlen').val(resultList[2]);
            } else if (tempMinutes >= 15 && tempMinutes < 25) {
                $('#vlen').val(resultList[3]);
            } else if (tempMinutes >= 25 && tempMinutes < 45) {
                $('#vlen').val(resultList[4]);
            } else if (tempMinutes >= 45) {
                $('#vlen').val(resultList[5]);
            } else {
                $('#vlen').val(resultList[6]);
            }
        } else {
            //选择最接近的时间
            for (let i = 0; i < resultList.length; i++) {
                let tempSeconds = 0;
                let tempTime = resultList[i].split(':');
                tempSeconds = Number(tempTime[0]) * 60 * 60 + Number(tempTime[1]) * 60 + Number(tempTime[2]);
                if (Math.abs(tempSeconds - duration) <= 2) {
                    $('#vlen').val(resultList[i]);
                    break;
                }
            }
        }
    }, duration);
    await page.waitFor(1000);
    await page.click('body > div.swal2-container.swal2-fade.swal2-in > div > button.swal2-confirm.swal2-styled');

    //5.关闭播放
    try {
        await page.waitFor(1000);
        await page1.close();
    } catch {
    }
    console.log(`success load youtube video`);
}

module.exports = {run};