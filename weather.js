#!/usr/bin/env node

import { program } from 'commander';
import axios from 'axios';

program
  .version('1.0.0')
  .description('一个简单的天气查询工具')
  .option('-c, --city <city>', '要查询的城市名称')
  .parse(process.argv);

const options = program.opts();

if (!options.city) {
  console.error('请指定要查询的城市名称');
  process.exit(1);
}

const API_KEY = '您的API密钥'; // 请替换为您的实际API密钥
const API_URL = `http://api.openweathermap.org/data/2.5/weather?q=${options.city}&appid=${API_KEY}&units=metric&lang=zh_cn`;

async function getWeather() {
  try {
    const response = await axios.get(API_URL);
    const data = response.data;
    console.log(`${data.name}的天气情况:`);
    console.log(`温度: ${data.main.temp}°C`);
    console.log(`天气: ${data.weather[0].description}`);
    console.log(`湿度: ${data.main.humidity}%`);
  } catch (error) {
    console.error('获取天气信息失败:', error.message);
  }
}

getWeather();写
