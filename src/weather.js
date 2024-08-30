#!/usr/bin/env node

import { program } from 'commander';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件
dotenv.config({ path: join(__dirname, '.env') });

program
  .version('0.0.2')
  .description('云知 - 终端魔法师系列之天气查询精灵')
  .option('--cron', '启动定时任务')
  .option('-c, --city <city>', '要查询的城市名称或城市编码')
  .option('-d, --days <days>', '要查询的天数（1-4）', '4')
  .option('-f, --format <format>', '输出格式 (text/json)', 'text')
  .option('-l, --language <lang>', '语言 (zh/en)', 'zh')
  .parse(process.argv);

const options = program.opts();

if (options.cron) {
  cron.schedule('0 7 * * *', async () => {
    const weatherInfo = await getWeather(options.city);
    await sendEmail(weatherInfo);
  });
  console.log('天气预报定时任务已启动');
} else {
  // 原有的命令行查询逻辑
  if (!options.city) {
  console.error('请指定要查询的城市名称或城市编码');
  process.exit(1);
}
getWeather(options.city).then(console.log);
}

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error('API密钥未设置，请在.env文件中设置API_KEY');
  process.exit(1);
}

const API_URL = `https://restapi.amap.com/v3/weather/weatherInfo?key=${API_KEY}&city=${options.city}&extensions=all&output=JSON`;

async function sendEmail(content) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.TARGET_EMAIL,
    subject: '每日天气预报',
    text: content
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('邮件发送成功');
  } catch (error) {
    console.error('邮件发送失败:', error);
  }
}
cron.schedule('0 7 * * *', async () => {
  const weatherInfo = await getWeather();
  await sendEmail(weatherInfo);
});

console.log('天气预报定时任务已启动');

getWeather();
