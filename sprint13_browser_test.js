const { chromium } = require('playwright');

async function runTests() {
  console.log('=== 启动Playwright浏览器测试 ===\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 截图保存函数
  const screenshots = [];
  async function screenshot(name) {
    const path = `screenshots/${name}.png`;
    await page.screenshot({ path, fullPage: true });
    screenshots.push(path);
    console.log(`📸 截图: ${name}`);
    return path;
  }
  
  try {
    // 1. 访问首页
    console.log('1. 访问登录页...');
    await page.goto('http://1.13.247.173/slsd-vision/', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await screenshot('01_login_page');
    
    // 检查页面标题
    const title = await page.title();
    console.log(`   页面标题: ${title}`);
    
    // 2. 登录
    console.log('\n2. 执行登录...');
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await screenshot('02_login_filled');
    
    // 点击登录按钮
    const loginBtn = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")');
    if (await loginBtn.count() > 0) {
      await loginBtn.click();
      console.log('   点击登录按钮');
    } else {
      await page.keyboard.press('Enter');
    }
    
    await page.waitForTimeout(3000);
    await screenshot('03_after_login');
    
    // 检查当前URL
    console.log(`   当前URL: ${page.url()}`);
    
    // 3. 进入数据集页面
    console.log('\n3. 进入数据集页面...');
    const datasetLink = page.locator('text=数据集, text=Datasets, [href*="dataset"]').first();
    if (await datasetLink.count() > 0) {
      await datasetLink.click();
      console.log('   点击数据集链接');
    } else {
      await page.goto('http://1.13.247.173/slsd-vision/#datasets', { timeout: 10000 });
    }
    
    await page.waitForTimeout(3000);
    await screenshot('04_dataset_list');
    
    // 4. 检查数据集列表
    console.log('\n4. 检查数据集列表...');
    const datasetRows = await page.locator('tr, .table-row, [class*="dataset"]').count();
    console.log(`   数据集相关元素数量: ${datasetRows}`);
    
    // 5. 点击数据集名称进入详情
    console.log('\n5. 进入数据集详情...');
    const datasetName = page.locator('td:first-child, .dataset-name, a:has-text("数据集")').first();
    if (await datasetName.count() > 0) {
      await datasetName.click();
      console.log('   点击数据集名称');
    }
    
    await page.waitForTimeout(3000);
    await screenshot('05_dataset_detail');
    
    // 6. 检查详情页图片展示
    console.log('\n6. 检查详情页图片...');
    const images = await page.locator('img').count();
    console.log(`   图片数量: ${images}`);
    
    // 7. 检查原始数据标签页
    console.log('\n7. 测试原始数据标签页...');
    const rawDataTab = page.locator('text=原始数据, text=Raw Data, [tab*="raw"]').first();
    if (await rawDataTab.count() > 0) {
      await rawDataTab.click();
      console.log('   点击原始数据标签');
      await page.waitForTimeout(2000);
      await screenshot('06_raw_data_tab');
    } else {
      console.log('   未找到原始数据标签');
    }
    
    // 8. 检查页面是否卡死
    console.log('\n8. 检测页面是否卡死...');
    let isResponsive = true;
    try {
      await page.waitForTimeout(1000);
      await page.click('body', { timeout: 2000 });
      console.log('   页面响应正常');
    } catch (e) {
      isResponsive = false;
      console.log('   ⚠️ 页面可能卡死!');
      await screenshot('07_page_frozen');
    }
    
    // 9. 检查控制台错误
    console.log('\n9. 检查控制台错误...');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // 10. 重新加载页面测试稳定性
    console.log('\n10. 测试页面稳定性...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await screenshot('08_page_reload');
    
    // 输出错误
    if (errors.length > 0) {
      console.log('\n⚠️ 控制台错误:');
      errors.forEach(e => console.log(`   - ${e}`));
    } else {
      console.log('\n✅ 无控制台错误');
    }
    
    console.log('\n=== 测试完成 ===');
    console.log(`截图保存位置: screenshots/`);
    screenshots.forEach(s => console.log(`   - ${s}`));
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    await screenshot('error_' + Date.now());
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
