import axios from 'axios';
import cheerio from 'cheerio';
import db from './bin/db.js'
import cron from 'node-cron';
import config from './bin/config.json'

axios.defaults.baseURL = 'https://maplestory.nexon.com/'

cron.schedule('0,30 * * * 4,5', async () => {
    await task();
});

async function task() {
    const eventList = await getEventList();
    const existUrlList = await checkExistUrlList(eventList);
    await sendImageAndInsertDb(existUrlList);
    console.log('Success');
}

async function getEventList() {
    let html = await axios.get('/News/Event');
    html = html.data;
    const $ = cheerio.load(html);

    return $('div.event_board ul li')
        .map((index, element) => $(element).find('a').attr('href'))
        .toArray()
        .reverse();
}

async function sendImageAndInsertDb(eventList) {
    for (const value of eventList) {
        if (value === undefined) continue;
        let html = await axios.get(value);
        html = html.data;
        const $ = cheerio.load(html);
        const img = $('div.new_board_con div div img').attr('src');
        console.log(img);
        await sendDiscordWebhook(img);
        await insertDb(value);
    }
}

async function checkExistUrlList(urlList) {
    return await Promise.all(
        urlList.map(async value => {
            const [rows, fields] = await db.query(
                `SELECT EXISTS(SELECT * FROM tb_event WHERE event_url = ?) exist`
                , [value]);
            if (rows[0].exist === 0) return value;
        })
    )
}

async function sendDiscordWebhook(img) {
    try {
        await axios({
            method: 'post',
            url: config.webhookUrl,
            data: {"content": img}
        })
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
        throw e
    }
}

async function insertDb(url) {
    await db.execute(`INSERT INTO tb_event (event_url)
                      VALUES (?)`
        , [url]);
}