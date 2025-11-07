const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add columns to User table
    await queryInterface.addColumn('users', 'city', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'postalCode', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'country', {
      type: DataTypes.STRING,
      defaultValue: 'US'
    });
    
    
    
    await queryInterface.addColumn('users', 'autoSendToPFU', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });
    
    await queryInterface.addColumn('users', 'defaultVATRate', {
      type: DataTypes.FLOAT,
      defaultValue: 0.20
    });
    
    // Add columns to Client table
    await queryInterface.addColumn('clients', 'city', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('clients', 'postalCode', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('clients', 'country', {
      type: DataTypes.STRING,
      defaultValue: 'FR'
    });
    
    
    
    // Add columns to Invoice table
    await queryInterface.addColumn('invoices', 'invoiceDate', {
      type: DataTypes.DATEONLY,
      allowNull: false
    });
    
    await queryInterface.addColumn('invoices', 'totalAmount', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('invoices', 'currency', {
      type: DataTypes.STRING,
      defaultValue: 'EUR'
    });
    
    await queryInterface.addColumn('invoices', 'pfuStatus', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('invoices', 'pfuReference', {
      type: DataTypes.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('invoices', 'pfuSentAt', {
      type: DataTypes.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('invoices', 'pfuUpdatedAt', {
      type: DataTypes.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('invoices', 'pfuError', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('invoices', 'facturXPath', {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns from User table
    await queryInterface.removeColumn('users', 'city');
    await queryInterface.removeColumn('users', 'postalCode');
    await queryInterface.removeColumn('users', 'country');
    await queryInterface.removeColumn('users', 'autoSendToPFU');
    await queryInterface.removeColumn('users', 'defaultVATRate');
    
    // Remove columns from Client table
    await queryInterface.removeColumn('clients', 'city');
    await queryInterface.removeColumn('clients', 'postalCode');
    await queryInterface.removeColumn('clients', 'country');
    
    // Remove columns from Invoice table
    await queryInterface.removeColumn('invoices', 'invoiceDate');
    await queryInterface.removeColumn('invoices', 'totalAmount');
    await queryInterface.removeColumn('invoices', 'currency');
    await queryInterface.removeColumn('invoices', 'pfuStatus');
    await queryInterface.removeColumn('invoices', 'pfuReference');
    await queryInterface.removeColumn('invoices', 'pfuSentAt');
    await queryInterface.removeColumn('invoices', 'pfuUpdatedAt');
    await queryInterface.removeColumn('invoices', 'pfuError');
    await queryInterface.removeColumn('invoices', 'facturXPath');
  }
};