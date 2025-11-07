const memoryDb = require('./src/config/memoryDatabase');

console.log('=== 为客户端添加交付地址数据 ===');

// 获取所有客户端
const clients = memoryDb.findAllClients();
console.log('当前客户端数量:', clients.length);

// 为每个客户端添加不同的交付地址数据
const deliveryAddressData = [
  {
    deliveryAddress: '456 Boulevard de la Livraison',
    deliveryCity: 'Lyon',
    deliveryPostalCode: '69002',
    deliveryCountry: 'France',
    sameAsAddress: false
  },
  {
    deliveryAddress: '789 Rue de Transport',
    deliveryCity: 'Toulouse',
    deliveryPostalCode: '31000',
    deliveryCountry: 'France',
    sameAsAddress: false
  },
  {
    // 第三个客户端设置为与账单地址相同
    deliveryAddress: null,
    deliveryCity: null,
    deliveryPostalCode: null,
    deliveryCountry: null,
    sameAsAddress: true
  }
];

clients.forEach((client, index) => {
  const deliveryData = deliveryAddressData[index] || deliveryAddressData[0];
  
  console.log(`\n更新客户端 ${index + 1}: ${client.name}`);
  console.log('原账单地址:', `${client.address}, ${client.city} ${client.postalCode}, ${client.country}`);
  
  // 更新客户端数据
  const updatedClient = {
    ...client,
    ...deliveryData
  };
  
  // 使用内存数据库的更新方法
  memoryDb.updateClient(client.id, updatedClient);
  
  if (deliveryData.sameAsAddress) {
    console.log('交付地址: 与账单地址相同');
  } else {
    console.log('新交付地址:', `${deliveryData.deliveryAddress}, ${deliveryData.deliveryCity} ${deliveryData.deliveryPostalCode}, ${deliveryData.deliveryCountry}`);
  }
});

console.log('\n=== 验证更新结果 ===');
const updatedClients = memoryDb.findAllClients();
updatedClients.forEach((client, index) => {
  console.log(`\n客户端 ${index + 1}: ${client.name}`);
  console.log('账单地址:', `${client.address}, ${client.city} ${client.postalCode}, ${client.country}`);
  
  if (client.sameAsAddress) {
    console.log('交付地址: 与账单地址相同');
  } else if (client.deliveryAddress) {
    console.log('交付地址:', `${client.deliveryAddress}, ${client.deliveryCity} ${client.deliveryPostalCode}, ${client.deliveryCountry}`);
  } else {
    console.log('交付地址: 未设置');
  }
});

console.log('\n✅ 交付地址数据添加完成！');