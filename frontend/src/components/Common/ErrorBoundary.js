import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 这里可以添加错误报告服务
    // reportErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ isRetrying: true });
    
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        isRetrying: false
      });
    }, 1000);
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            isRetrying={this.state.isRetrying}
          />
        );
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <FiAlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  出现了一些问题
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  抱歉，应用程序遇到了意外错误。请尝试刷新页面或返回首页。
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-left">
                    <h3 className="text-sm font-medium text-red-800 mb-2">错误详情：</h3>
                    <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleRetry}
                    disabled={this.state.isRetrying}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {this.state.isRetrying ? (
                      <>
                        <FiRefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        重试中...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="-ml-1 mr-2 h-4 w-4" />
                        重试
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiHome className="-ml-1 mr-2 h-4 w-4" />
                    返回首页
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 简化的错误回退组件
export const SimpleErrorFallback = ({ error, onRetry, isRetrying }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
    <div className="flex items-center">
      <FiAlertTriangle className="h-5 w-5 text-red-500 mr-2" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">
          加载失败
        </h3>
        <p className="text-sm text-red-700 mt-1">
          {error?.message || '发生了未知错误'}
        </p>
      </div>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="ml-3 text-sm text-red-800 hover:text-red-900 font-medium disabled:opacity-50"
      >
        {isRetrying ? '重试中...' : '重试'}
      </button>
    </div>
  </div>
);

export default ErrorBoundary;