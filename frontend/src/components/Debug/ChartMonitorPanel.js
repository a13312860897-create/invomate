import React, { useState, useEffect } from 'react';
import { getMonitorReport, clearMonitorLogs } from '../../utils/chartMonitor';
import { FiRefreshCw, FiTrash2, FiBarChart, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const ChartMonitorPanel = () => {
  const [report, setReport] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const refreshReport = () => {
    const newReport = getMonitorReport();
    setReport(newReport);
  };

  const clearLogs = () => {
    clearMonitorLogs();
    refreshReport();
  };

  useEffect(() => {
    refreshReport();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshReport, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="图表监控面板"
      >
        <FiBarChart className="w-5 h-5" />
      </button>

      {/* 监控面板 */}
      {isVisible && (
        <div className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-hidden">
          {/* 头部 */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">图表监控面板</h3>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-3 h-3"
                  />
                  自动刷新
                </label>
                <button
                  onClick={refreshReport}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  title="刷新"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={clearLogs}
                  className="p-1 text-gray-500 hover:text-red-600"
                  title="清空日志"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-4 overflow-y-auto max-h-80">
            {report ? (
              <div className="space-y-4">
                {/* 统计概览 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium">API请求</div>
                    <div className="text-lg font-bold text-blue-900">{report.apiRequests.length}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-xs text-green-600 font-medium">图表渲染</div>
                    <div className="text-lg font-bold text-green-900">{report.chartRenders.length}</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-xs text-yellow-600 font-medium">数据转换</div>
                    <div className="text-lg font-bold text-yellow-900">{report.dataTransforms.length}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-xs text-red-600 font-medium">错误</div>
                    <div className="text-lg font-bold text-red-900">{report.errors.length}</div>
                  </div>
                </div>

                {/* 错误列表 */}
                {report.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                      <FiAlertTriangle className="w-4 h-4" />
                      错误日志
                    </h4>
                    <div className="space-y-2">
                      {report.errors.slice(-3).map((error, index) => (
                        <div key={index} className="bg-red-50 p-2 rounded text-xs">
                          <div className="font-medium text-red-800">{error.component}</div>
                          <div className="text-red-600">{error.error}</div>
                          <div className="text-red-500 text-xs">{new Date(error.timestamp).toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 最近活动 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <FiCheckCircle className="w-4 h-4" />
                    最近活动
                  </h4>
                  <div className="space-y-1">
                    {report.timeline.slice(-5).map((log, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${getLogTypeColor(log.type)}`}></div>
                        <div className="flex-1 truncate">
                          <span className="font-medium">{log.type}</span>
                          {log.component && <span className="text-gray-500"> - {log.component}</span>}
                        </div>
                        <div className="text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API响应状态 */}
                {report.apiResponses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">API状态</h4>
                    <div className="space-y-1">
                      {report.apiResponses.slice(-3).map((response, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className={`flex items-center gap-1 ${response.success ? 'text-green-600' : 'text-red-600'}`}>
                            {response.success ? <FiCheckCircle className="w-3 h-3" /> : <FiAlertTriangle className="w-3 h-3" />}
                            {response.success ? '成功' : '失败'}
                          </div>
                          <div className="text-gray-500">
                            {response.dataSize ? `${Math.round(response.dataSize / 1024)}KB` : '0KB'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FiBarChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div>暂无监控数据</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getLogTypeColor = (type) => {
  switch (type) {
    case 'API_REQUEST':
      return 'bg-blue-400';
    case 'API_RESPONSE':
      return 'bg-green-400';
    case 'DATA_TRANSFORM':
      return 'bg-yellow-400';
    case 'CHART_RENDER':
      return 'bg-purple-400';
    case 'ERROR':
      return 'bg-red-400';
    default:
      return 'bg-gray-400';
  }
};

export default ChartMonitorPanel;