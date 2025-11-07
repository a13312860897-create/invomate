'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('invoices', 'invoiceMode', {
      type: Sequelize.ENUM('fr', 'intl'),
      defaultValue: 'intl',
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('invoices', 'invoiceMode');
  }
};