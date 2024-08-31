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

const BASE_API_URL = 'https://restapi.amap.com/v3/weather/weatherInfo';

program
  .version('0.0.4')
  .description('云知 - 终端魔法师系列之天气查询精灵')
  .option('--cron', '启动定时任务')
  .option('-c, --city <city>', '要查询的城市名称或城市编码')
  .option('-d, --days <days>', '要查询的天数（1-4）', '4')
  .option('-f, --format <format>', '输出格式 (text/json)', 'text')
  .option('-l, --language <lang>', '语言 (zh/en)', 'zh')
  .parse(process.argv);

const options = program.opts();

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error('API密钥未设置，请在.env文件中设置API_KEY');
  process.exit(1);
}

async function getWeather(city) {
  const params = new URLSearchParams({
    key: API_KEY,
    city: city,
    extensions: 'all',
    output: 'JSON'
  });
  const API_URL = `${BASE_API_URL}?${params.toString()}`;
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    if (data.forecasts && data.forecasts.length > 0) {
      const weather = data.forecasts[0];
      let weatherInfo = `${weather.city}未来4天天气预报：\n`;
      weatherInfo += `报告时间：${weather.reporttime}\n\n`;

      weather.casts.forEach((cast, index) => {
        weatherInfo += `--- 第${index + 1}天 (${cast.date}) ---\n`;
        weatherInfo += `天气：白天 ${cast.dayweather}，夜间 ${cast.nightweather}\n`;
        weatherInfo += `温度：${cast.nighttemp}°C ~ ${cast.daytemp}°C\n`;
        weatherInfo += `风向：白天 ${cast.daywind}，夜间 ${cast.nightwind}\n`;
        weatherInfo += `风力：白天 ${cast.daypower}级，夜间 ${cast.nightpower}级\n`;

        // 添加新的天气信息（假设API提供这些数据）
        if (cast.humidity) weatherInfo += `湿度：${cast.humidity}%\n`;
        if (cast.precipitation) weatherInfo += `降水概率：${cast.precipitation}%\n`;
        if (cast.visibility) weatherInfo += `能见度：${cast.visibility}公里\n`;
        if (cast.uv_index) weatherInfo += `紫外线指数：${cast.uv_index}\n`;
        if (cast.aqi) weatherInfo += `空气质量指数：${cast.aqi}\n`;
        if (cast.pressure) weatherInfo += `气压：${cast.pressure}百帕\n`;

        weatherInfo += '\n';
      });

      return weatherInfo;
    } else {
      return '未找到有效的天气信息';
    }
  } catch (error) {
    return `获取天气信息失败: ${error.message}`;
  }
}

async function sendEmail(content) {
  let transporter = nodemailer.createTransport({
    host: 'smtp.mail.me.com',
    port: 587,
    secure: false, // 使用 TLS
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

async function executeWeatherTask() {
  console.log('开始执行天气任务...');
  const weatherInfo = await getWeather(options.city || '北京');
  console.log('获取到的天气信息：', weatherInfo);
  await sendEmail(weatherInfo);
  console.log('天气任务执行完毕');
}

if (options.cron) {
  console.log('天气预报任务启动');

  // 立即执行一次
  executeWeatherTask();

  // 设置每天早上7点执行的定时任务
  cron.schedule('0 7 * * *', executeWeatherTask);

  console.log('定时任务已设置，将在每天早上7点重复执行');
} else {
  if (!options.city) {
    console.error('请指定要查询的城市名称或城市编码');
    process.exit(1);
  }
  getWeather(options.city).then(console.log);
}
