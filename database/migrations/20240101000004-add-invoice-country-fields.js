'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 添加新字段到invoices表
    // 所有国际特定字段已被删除
  },

  down: async (queryInterface, Sequelize) => {
    // 删除添加的字段
    // 所有国际特定字段已被删除
  }
};