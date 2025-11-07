/**
 * 数据一致性测试框架 - 数据验证器
 * 负责验证数据结构、一致性和计算准确性
 */

class DataValidator {
  constructor(config = {}) {
    this.config = {
      tolerance: 0.01, // 数值比较容差
      strictMode: true, // 严格模式
      ...config
    };
  }

  /**
   * 验证数据结构是否符合预期模式
   * @param {*} data - 要验证的数据
   * @param {Object} schema - 数据模式
   * @returns {Object} 验证结果
   */
  validateDataStructure(data, schema) {
    const result = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      this._validateObject(data, schema, '', result);
    } catch (error) {
      result.valid = false;
      result.errors.push(`验证过程中发生错误: ${error.message}`);
    }

    return result;
  }

  /**
   * 验证两个数据源的一致性
   * @param {*} source1 - 数据源1
   * @param {*} source2 - 数据源2
   * @param {Array} fields - 要比较的字段列表
   * @param {Object} options - 比较选项
   * @returns {Object} 一致性验证结果
   */
  validateDataConsistency(source1, source2, fields, options = {}) {
    const result = {
      consistent: true,
      inconsistencies: [],
      summary: {
        totalFields: fields.length,
        consistentFields: 0,
        inconsistentFields: 0
      }
    };

    for (const field of fields) {
      const value1 = this._getNestedValue(source1, field);
      const value2 = this._getNestedValue(source2, field);
      
      const fieldResult = this._compareValues(value1, value2, field, options);
      
      if (fieldResult.consistent) {
        result.summary.consistentFields++;
      } else {
        result.consistent = false;
        result.summary.inconsistentFields++;
        result.inconsistencies.push(fieldResult);
      }
    }

    return result;
  }

  /**
   * 验证计算结果的准确性
   * @param {number} actual - 实际值
   * @param {number} expected - 期望值
   * @param {number} tolerance - 容差
   * @returns {Object} 验证结果
   */
  validateCalculation(actual, expected, tolerance = this.config.tolerance) {
    const result = {
      accurate: false,
      actualValue: actual,
      expectedValue: expected,
      difference: 0,
      percentageDifference: 0,
      tolerance: tolerance
    };

    if (typeof actual !== 'number' || typeof expected !== 'number') {
      result.error = '实际值和期望值必须是数字';
      return result;
    }

    result.difference = Math.abs(actual - expected);
    
    if (expected !== 0) {
      result.percentageDifference = (result.difference / Math.abs(expected)) * 100;
    }

    result.accurate = result.difference <= tolerance;

    return result;
  }

  /**
   * 验证数组数据的一致性
   * @param {Array} array1 - 数组1
   * @param {Array} array2 - 数组2
   * @param {string} keyField - 用于匹配的键字段
   * @param {Array} compareFields - 要比较的字段
   * @returns {Object} 验证结果
   */
  validateArrayConsistency(array1, array2, keyField, compareFields) {
    const result = {
      consistent: true,
      missingInArray1: [],
      missingInArray2: [],
      inconsistentItems: [],
      summary: {
        array1Count: array1.length,
        array2Count: array2.length,
        matchedItems: 0,
        inconsistentItems: 0
      }
    };

    // 创建映射以便快速查找
    const map1 = new Map();
    const map2 = new Map();

    array1.forEach(item => {
      const key = this._getNestedValue(item, keyField);
      map1.set(key, item);
    });

    array2.forEach(item => {
      const key = this._getNestedValue(item, keyField);
      map2.set(key, item);
    });

    // 检查array1中的项目
    for (const [key, item1] of map1) {
      if (!map2.has(key)) {
        result.missingInArray2.push({ key, item: item1 });
        result.consistent = false;
      } else {
        const item2 = map2.get(key);
        const itemConsistency = this.validateDataConsistency(item1, item2, compareFields);
        
        if (itemConsistency.consistent) {
          result.summary.matchedItems++;
        } else {
          result.consistent = false;
          result.summary.inconsistentItems++;
          result.inconsistentItems.push({
            key,
            inconsistencies: itemConsistency.inconsistencies
          });
        }
      }
    }

    // 检查array2中array1没有的项目
    for (const [key, item2] of map2) {
      if (!map1.has(key)) {
        result.missingInArray1.push({ key, item: item2 });
        result.consistent = false;
      }
    }

    return result;
  }

  /**
   * 验证数据完整性
   * @param {*} data - 要验证的数据
   * @param {Array} requiredFields - 必需字段列表
   * @returns {Object} 验证结果
   */
  validateDataCompleteness(data, requiredFields) {
    const result = {
      complete: true,
      missingFields: [],
      emptyFields: [],
      nullFields: []
    };

    for (const field of requiredFields) {
      const value = this._getNestedValue(data, field);
      
      if (value === undefined) {
        result.complete = false;
        result.missingFields.push(field);
      } else if (value === null) {
        result.complete = false;
        result.nullFields.push(field);
      } else if (this._isEmpty(value)) {
        result.complete = false;
        result.emptyFields.push(field);
      }
    }

    return result;
  }

  /**
   * 验证数据类型
   * @param {*} data - 要验证的数据
   * @param {Object} typeSchema - 类型模式
   * @returns {Object} 验证结果
   */
  validateDataTypes(data, typeSchema) {
    const result = {
      valid: true,
      typeErrors: []
    };

    for (const [field, expectedType] of Object.entries(typeSchema)) {
      const value = this._getNestedValue(data, field);
      const actualType = this._getValueType(value);
      
      if (!this._isTypeMatch(actualType, expectedType)) {
        result.valid = false;
        result.typeErrors.push({
          field,
          expectedType,
          actualType,
          value
        });
      }
    }

    return result;
  }

  /**
   * 验证数值范围
   * @param {*} data - 要验证的数据
   * @param {Object} rangeSchema - 范围模式
   * @returns {Object} 验证结果
   */
  validateDataRanges(data, rangeSchema) {
    const result = {
      valid: true,
      rangeErrors: []
    };

    for (const [field, range] of Object.entries(rangeSchema)) {
      const value = this._getNestedValue(data, field);
      
      if (typeof value === 'number') {
        if (range.min !== undefined && value < range.min) {
          result.valid = false;
          result.rangeErrors.push({
            field,
            value,
            error: `值 ${value} 小于最小值 ${range.min}`
          });
        }
        
        if (range.max !== undefined && value > range.max) {
          result.valid = false;
          result.rangeErrors.push({
            field,
            value,
            error: `值 ${value} 大于最大值 ${range.max}`
          });
        }
      }
    }

    return result;
  }

  // 私有方法

  /**
   * 验证对象结构
   * @private
   */
  _validateObject(data, schema, path, result) {
    if (schema.type && !this._isTypeMatch(this._getValueType(data), schema.type)) {
      result.valid = false;
      result.errors.push(`${path || 'root'}: 期望类型 ${schema.type}, 实际类型 ${this._getValueType(data)}`);
      return;
    }

    if (schema.required && (data === undefined || data === null)) {
      result.valid = false;
      result.errors.push(`${path || 'root'}: 必需字段缺失`);
      return;
    }

    if (schema.properties && typeof data === 'object' && data !== null) {
      for (const [key, subSchema] of Object.entries(schema.properties)) {
        const newPath = path ? `${path}.${key}` : key;
        this._validateObject(data[key], subSchema, newPath, result);
      }
    }

    if (schema.items && Array.isArray(data)) {
      data.forEach((item, index) => {
        const newPath = path ? `${path}[${index}]` : `[${index}]`;
        this._validateObject(item, schema.items, newPath, result);
      });
    }
  }

  /**
   * 比较两个值
   * @private
   */
  _compareValues(value1, value2, field, options) {
    const result = {
      field,
      consistent: false,
      value1,
      value2,
      difference: null
    };

    // 处理null和undefined
    if (value1 === null && value2 === null) {
      result.consistent = true;
      return result;
    }

    if (value1 === undefined && value2 === undefined) {
      result.consistent = true;
      return result;
    }

    if ((value1 === null || value1 === undefined) !== (value2 === null || value2 === undefined)) {
      result.error = '一个值为null/undefined，另一个不是';
      return result;
    }

    // 数值比较
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      const tolerance = options.tolerance || this.config.tolerance;
      result.difference = Math.abs(value1 - value2);
      result.consistent = result.difference <= tolerance;
      return result;
    }

    // 字符串比较
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      result.consistent = value1 === value2;
      return result;
    }

    // 布尔值比较
    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
      result.consistent = value1 === value2;
      return result;
    }

    // 数组比较
    if (Array.isArray(value1) && Array.isArray(value2)) {
      result.consistent = JSON.stringify(value1) === JSON.stringify(value2);
      return result;
    }

    // 对象比较
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      result.consistent = JSON.stringify(value1) === JSON.stringify(value2);
      return result;
    }

    // 类型不匹配
    result.error = `类型不匹配: ${typeof value1} vs ${typeof value2}`;
    return result;
  }

  /**
   * 获取嵌套值
   * @private
   */
  _getNestedValue(obj, path) {
    if (!path) return obj;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }

  /**
   * 获取值的类型
   * @private
   */
  _getValueType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * 检查类型是否匹配
   * @private
   */
  _isTypeMatch(actualType, expectedType) {
    if (expectedType === 'any') return true;
    if (Array.isArray(expectedType)) {
      return expectedType.includes(actualType);
    }
    return actualType === expectedType;
  }

  /**
   * 检查值是否为空
   * @private
   */
  _isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * 创建断言方法
   */
  static createAssertions() {
    return {
      /**
       * 断言两个值相等
       */
      assertEqual: (actual, expected, message) => {
        if (actual !== expected) {
          throw new Error(message || `断言失败: 期望 ${expected}, 实际 ${actual}`);
        }
      },

      /**
       * 断言数值近似相等
       */
      assertNearlyEqual: (actual, expected, tolerance = 0.01, message) => {
        const diff = Math.abs(actual - expected);
        if (diff > tolerance) {
          throw new Error(message || `断言失败: 期望 ${expected} (±${tolerance}), 实际 ${actual}, 差异 ${diff}`);
        }
      },

      /**
       * 断言值为真
       */
      assertTrue: (value, message) => {
        if (!value) {
          throw new Error(message || `断言失败: 期望为真, 实际为 ${value}`);
        }
      },

      /**
       * 断言值为假
       */
      assertFalse: (value, message) => {
        if (value) {
          throw new Error(message || `断言失败: 期望为假, 实际为 ${value}`);
        }
      },

      /**
       * 断言数组包含元素
       */
      assertContains: (array, element, message) => {
        if (!Array.isArray(array) || !array.includes(element)) {
          throw new Error(message || `断言失败: 数组不包含元素 ${element}`);
        }
      },

      /**
       * 断言对象有属性
       */
      assertHasProperty: (obj, property, message) => {
        if (!obj || !obj.hasOwnProperty(property)) {
          throw new Error(message || `断言失败: 对象没有属性 ${property}`);
        }
      }
    };
  }
}

module.exports = DataValidator;