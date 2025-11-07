const axios = require('axios');
require('dotenv').config();

// Paddle API配置
const PADDLE_API_URL = process.env.PADDLE_API_URL || 'https://api.paddle.com';
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;

// 创建axios实例
const paddleApi = axios.create({
  baseURL: PADDLE_API_URL,
  headers: {
    'Authorization': `Bearer ${PADDLE_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * 创建产品
 */
async function createProduct(productData) {
  try {
    const response = await paddleApi.post('/products', productData);
    console.log('Product created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating product:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 创建价格
 */
async function createPrice(priceData) {
  try {
    const response = await paddleApi.post('/prices', priceData);
    console.log('Price created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating price:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 创建发票软件的产品和价格
 */
async function createInvoiceSoftwareProducts() {
  try {
    // 创建入门版产品
    const starterProduct = await createProduct({
      name: '入门版',
      description: '适合小型企业和个人用户的基础发票解决方案',
      tax_category: 'saas'
    });

    // 创建入门版月度价格
    await createPrice({
      product_id: starterProduct.data.id,
      description: '入门版 - 月付',
      amount: 1000, // 10.00 EUR
      currency: 'EUR',
      billing_cycle: {
        interval: 'month',
        frequency: 1
      }
    });

    // 创建入门版年度价格
    await createPrice({
      product_id: starterProduct.data.id,
      description: '入门版 - 年付',
      amount: 10000, // 100.00 EUR
      currency: 'EUR',
      billing_cycle: {
        interval: 'year',
        frequency: 1
      }
    });

    // 创建专业版产品
    const proProduct = await createProduct({
      name: '专业版',
      description: '适合中型企业的功能丰富的发票解决方案',
      tax_category: 'saas'
    });

    // 创建专业版月度价格
    await createPrice({
      product_id: proProduct.data.id,
      description: '专业版 - 月付',
      amount: 3000, // 30.00 EUR
      currency: 'EUR',
      billing_cycle: {
        interval: 'month',
        frequency: 1
      }
    });

    // 创建专业版年度价格
    await createPrice({
      product_id: proProduct.data.id,
      description: '专业版 - 年付',
      amount: 30000, // 300.00 EUR
      currency: 'EUR',
      billing_cycle: {
        interval: 'year',
        frequency: 1
      }
    });

    // 创建企业版产品
    const enterpriseProduct = await createProduct({
      name: '企业版',
      description: '适合大型企业的定制化发票解决方案',
      tax_category: 'saas'
    });

    // 创建企业版月度价格
    await createPrice({
      product_id: enterpriseProduct.data.id,
      description: '企业版 - 月付',
      amount: 30000, // 300.00 EUR
      currency: 'EUR',
      billing_cycle: {
        interval: 'month',
        frequency: 1
      }
    });

    // 创建企业版年度价格
    await createPrice({
      product_id: enterpriseProduct.data.id,
      description: '企业版 - 年付',
      amount: 300000, // 3000.00 EUR
      currency: 'EUR',
      billing_cycle: {
        interval: 'year',
        frequency: 1
      }
    });

    console.log('All products and prices created successfully!');
  } catch (error) {
    console.error('Error creating products and prices:', error);
  }
}

// 如果直接运行此脚本，则创建产品和价格
if (require.main === module) {
  createInvoiceSoftwareProducts();
}

module.exports = {
  createProduct,
  createPrice,
  createInvoiceSoftwareProducts
};