const { getDatabase } = require('../config/dbFactory');
const { Invoice, Client, Payment } = require('../models');

class ReportController {
  /**
   * 获取报表数据
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getReportData(req, res) {
    try {
      const userId = req.user.id; // 获取用户ID
      
      // 获取KPI数据
      const kpiData = await this.getKPIData(userId);
      
      // 获取图表数据
      const chartData = await this.getChartData(userId);
      
      // 获取表格数据
      const tableData = await this.getTableData(userId);
      
      return res.json({
        kpiData,
        chartData,
        tableData
      });
    } catch (error) {
      console.error('Error in getReportData:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误',
        error: error.message
      });
    }
  }
  
  /**
   * 获取KPI数据
   * @param {string} userId - 用户ID
   */
  async getKPIData(userId) {
    try {
      const db = getDatabase();
      
      if (db.type === 'memory') {
        // 内存模式
        const invoices = db.invoices || [];
        const userInvoices = invoices.filter(invoice => invoice.userId === userId);
        
        const totalInvoices = userInvoices.length;
        const totalRevenue = userInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total || 0), 0);
        const pendingPayments = userInvoices.filter(invoice => invoice.status === 'pending').length;
        const overdueInvoices = userInvoices.filter(invoice => invoice.status === 'overdue').length;
        
        return {
          totalInvoices,
          totalRevenue,
          pendingPayments,
          overdueInvoices
        };
      } else {
        // 数据库模式
        const totalInvoices = await Invoice.count({ where: { userId } });
        
        const invoices = await Invoice.findAll({
          where: { userId },
          attributes: ['total']
        });
        const totalRevenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total || 0), 0);
        
        const pendingPayments = await Invoice.count({
          where: { userId, status: 'pending' }
        });
        
        const overdueInvoices = await Invoice.count({
          where: { userId, status: 'overdue' }
        });
        
        return {
          totalInvoices,
          totalRevenue,
          pendingPayments,
          overdueInvoices
        };
      }
    } catch (error) {
      console.error('Error in getKPIData:', error);
      return {
        totalInvoices: 0,
        totalRevenue: 0,
        pendingPayments: 0,
        overdueInvoices: 0
      };
    }
  }
  
  /**
   * 获取图表数据
   * @param {string} userId - 用户ID
   */
  async getChartData(userId) {
    try {
      // 获取销售趋势数据
      const salesTrend = await this.getSalesTrendData(userId);
      
      // 获取收入分布数据
      const revenueDistribution = await this.getRevenueDistributionData(userId);
      
      // 获取客户分析数据
      const customerAnalysis = await this.getCustomerAnalysisData(userId);
      
      // 获取税务分析数据
      const taxAnalysis = await this.getTaxAnalysisData(userId);
      
      return {
        salesTrend,
        revenueDistribution,
        customerAnalysis,
        taxAnalysis
      };
    } catch (error) {
      console.error('Error in getChartData:', error);
      return {
        salesTrend: [],
        revenueDistribution: [],
        customerAnalysis: [],
        taxAnalysis: []
      };
    }
  }
  
  /**
   * 获取销售趋势数据
   * @param {Object} db - 数据库实例
   */
  async getSalesTrendData(db) {
    try {
      // 这里应该根据实际业务逻辑获取销售趋势数据
      // 目前返回空数组，因为没有足够的数据
      return [];
    } catch (error) {
      console.error('Error in getSalesTrendData:', error);
      return [];
    }
  }
  
  /**
   * 获取收入分布数据
   * @param {Object} db - 数据库实例
   */
  async getRevenueDistributionData(db) {
    try {
      // 这里应该根据实际业务逻辑获取收入分布数据
      // 目前返回空数组，因为没有足够的数据
      return [];
    } catch (error) {
      console.error('Error in getRevenueDistributionData:', error);
      return [];
    }
  }
  
  /**
   * 获取客户分析数据
   * @param {Object} db - 数据库实例
   */
  async getCustomerAnalysisData(db) {
    try {
      // 这里应该根据实际业务逻辑获取客户分析数据
      // 目前返回空数组，因为没有足够的数据
      return [];
    } catch (error) {
      console.error('Error in getCustomerAnalysisData:', error);
      return [];
    }
  }
  
  /**
   * 获取税务分析数据
   * @param {Object} db - 数据库实例
   */
  async getTaxAnalysisData(db) {
    try {
      // 这里应该根据实际业务逻辑获取税务分析数据
      // 目前返回空数组，因为没有足够的数据
      return [];
    } catch (error) {
      console.error('Error in getTaxAnalysisData:', error);
      return [];
    }
  }
  
  /**
   * 获取表格数据
   * @param {string} userId - 用户ID
   */
  async getTableData(userId) {
    try {
      // 获取销售报表数据
      const sales = await this.getSalesTableData(userId);
      
      // 获取税务报表数据
      const tax = await this.getTaxTableData(userId);
      
      // 获取客户报表数据
      const customer = await this.getCustomerTableData(userId);
      
      return {
        sales,
        tax,
        customer
      };
    } catch (error) {
      console.error('Error in getTableData:', error);
      return {
        sales: [],
        tax: [],
        customer: []
      };
    }
  }
  
  /**
   * 获取销售表格数据
   * @param {string} userId - 用户ID
   */
  async getSalesTableData(userId) {
    try {
      const db = getDatabase();
      
      if (db.type === 'memory') {
        // 内存模式
        const invoices = db.invoices || [];
        const userInvoices = invoices.filter(invoice => invoice.userId === userId);
        
        return userInvoices.slice(0, 50).map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName || 'Unknown',
          amount: invoice.total,
          status: invoice.status,
          date: invoice.createdAt
        }));
      } else {
        // 数据库模式
        const invoices = await Invoice.findAll({
          where: { userId },
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['name']
            }
          ],
          order: [['createdAt', 'DESC']],
          limit: 50
        });
        
        return invoices.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          client: invoice.client ? invoice.client.name : '未知客户',
          date: invoice.createdAt.toISOString().split('T')[0],
          amount: parseFloat(invoice.total || 0),
          status: invoice.status || 'pending'
        }));
      }
    } catch (error) {
      console.error('Error in getSalesTableData:', error);
      return [];
    }
  }
  
  /**
   * 获取税务表格数据
   * @param {string} userId - 用户ID
   */
  async getTaxTableData(userId) {
    try {
      // 这里应该根据实际业务逻辑获取税务报表数据
      // 目前返回空数组，因为没有足够的数据
      return [];
    } catch (error) {
      console.error('Error in getTaxTableData:', error);
      return [];
    }
  }

  /**
   * 获取客户表格数据
   * @param {string} userId - 用户ID
   */
  async getCustomerTableData(userId) {
    try {
      const db = getDatabase();
      
      if (db.type === 'memory') {
        // 内存模式
        const clients = db.clients || [];
        const invoices = db.invoices || [];
        const userClients = clients.filter(client => client.userId === userId);
        
        return userClients.map(client => {
          const clientInvoices = invoices.filter(invoice => 
            invoice.clientId === client.id && invoice.userId === userId
          );
          
          const totalInvoices = clientInvoices.length;
          const totalAmount = clientInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total || 0), 0);
          const paidInvoices = clientInvoices.filter(invoice => invoice.status === 'paid');
          const paidAmount = paidInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total || 0), 0);
          const overdueAmount = totalAmount - paidAmount;
          
          const lastPaymentDate = paidInvoices.length > 0 
            ? paidInvoices.reduce((latest, invoice) => {
                const invoiceDate = new Date(invoice.createdAt);
                return invoiceDate > latest ? invoiceDate : latest;
              }, new Date(0)).toISOString().split('T')[0]
            : null;
          
          return {
            id: client.id,
            name: client.name,
            totalInvoices,
            totalAmount,
            paidAmount,
            overdueAmount,
            lastPaymentDate
          };
        });
      } else {
        // 数据库模式
        const clients = await Client.findAll({
          where: { userId },
          include: [
            {
              model: Invoice,
              as: 'invoices',
              attributes: ['total', 'status', 'createdAt']
            }
          ]
         });
        
        return clients.map(client => {
          const invoices = client.invoices || [];
          const totalInvoices = invoices.length;
          const totalAmount = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total || 0), 0);
          const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
          const paidAmount = paidInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total || 0), 0);
          const overdueAmount = totalAmount - paidAmount;
          
          // 获取最后付款日期
          const lastPaymentDate = paidInvoices.length > 0 
            ? paidInvoices.reduce((latest, invoice) => {
                const invoiceDate = new Date(invoice.createdAt);
                return invoiceDate > latest ? invoiceDate : latest;
              }, new Date(0)).toISOString().split('T')[0]
            : null;
          
          return {
            id: client.id,
            name: client.name,
            totalInvoices,
            totalAmount,
            paidAmount,
            overdueAmount,
            lastPaymentDate
          };
        });
      }
    } catch (error) {
      console.error('Error in getCustomerTableData:', error);
      return [];
    }
  }
}

// 创建控制器实例
const reportController = new ReportController();

module.exports = reportController;