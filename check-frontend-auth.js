// 检查前端认证状态的脚本
const puppeteer = require('puppeteer');

async function checkFrontendAuth() {
  let browser;
  try {
    console.log('启动浏览器检查前端认证状态...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // 监听网络请求
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`🌐 API请求: ${request.method()} ${request.url()}`);
        const headers = request.headers();
        if (headers.authorization) {
          console.log(`🔑 Authorization头部: ${headers.authorization.substring(0, 20)}...`);
        } else {
          console.log('❌ 缺少Authorization头部');
        }
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📡 API响应: ${response.status()} ${response.url()}`);
      }
    });
    
    // 访问前端页面
    console.log('访问前端页面...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // 检查localStorage中的token
    const token = await page.evaluate(() => {
      return localStorage.getItem('token');
    });
    
    console.log('localStorage中的token:', token ? `存在 (${token.substring(0, 20)}...)` : '不存在');
    
    // 等待页面加载完成
    await page.waitForTimeout(3000);
    
    // 检查页面标题和内容
    const title = await page.title();
    console.log('页面标题:', title);
    
    // 检查是否在登录页面
    const isLoginPage = await page.evaluate(() => {
      return document.querySelector('input[type="email"]') !== null;
    });
    
    if (isLoginPage) {
      console.log('🔐 当前在登录页面，需要登录');
      
      // 尝试登录
      await page.type('input[type="email"]', 'a133128860897@163.com');
      await page.type('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // 等待登录完成
      await page.waitForTimeout(2000);
      
      // 检查是否登录成功
      const newToken = await page.evaluate(() => {
        return localStorage.getItem('token');
      });
      
      console.log('登录后的token:', newToken ? `存在 (${newToken.substring(0, 20)}...)` : '仍然不存在');
    } else {
      console.log('✅ 已经在主页面');
    }
    
    // 等待一段时间观察网络请求
    console.log('等待观察网络请求...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('检查失败:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

checkFrontendAuth();