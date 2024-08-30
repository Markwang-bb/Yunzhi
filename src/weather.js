#!/usr/bin/env node

import { program } from 'commander';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env 文件
dotenv.config({ path: join(__dirname, '.env') });

program
  .version('1.0.0')
  .description('云知 - 终端魔法师系列之天气查询精灵')
  .option('-c, --city <city>', '要查询的城市名称或城市编码')
  .option('-d, --days <days>', '要查询的天数（1-4）', '4')
  .option('-f, --format <format>', '输出格式 (text/json)', 'text')
  .option('-l, --language <lang>', '语言 (zh/en)', 'zh')
  .parse(process.argv);

const options = program.opts();

if (!options.city) {
  console.error('请指定要查询的城市名称或城市编码');
  process.exit(1);
}

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error('API密钥未设置，请在.env文件中设置API_KEY');
  process.exit(1);
}

const API_URL = `https://restapi.amap.com/v3/weather/weatherInfo?key=${API_KEY}&city=${options.city}&extensions=all&output=JSON`;

async function getWeather() {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    if (data.forecasts && data.forecasts.length > 0) {
      const weather = data.forecasts[0];
      console.log(`${weather.city}未来4天天气预报：`);
      console.log(`报告时间：${weather.reporttime}\n`);

      weather.casts.forEach((cast, index) => {
        console.log(`--- 第${index + 1}天 (${cast.date}) ---`);
        console.log(`天气：白天 ${cast.dayweather}，夜间 ${cast.nightweather}`);
        console.log(`温度：${cast.nighttemp}°C ~ ${cast.daytemp}°C`);
        console.log(`风向：白天 ${cast.daywind}，夜间 ${cast.nightwind}`);
        console.log(`风力：白天 ${cast.daypower}级，夜间 ${cast.nightpower}级`);
        console.log();
      });
    } else {
      console.log('未找到有效的天气信息');
    }
  } catch (error) {
    console.error('获取天气信息失败:', error.message);
  }
}

getWeather();
