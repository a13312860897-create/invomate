import React, { useRef, useEffect, useState } from 'react';

// 触摸手势Hook
export const useTouchGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onDoubleTap,
  onPinch,
  swipeThreshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
  pinchThreshold = 10
} = {}) => {
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(null);
  const tapCountRef = useRef(0);
  const initialDistanceRef = useRef(0);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // 计算两点间距离
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 处理触摸开始
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // 多点触控处理（捏合手势）
    if (e.touches.length === 2 && onPinch) {
      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
    }

    // 长按处理
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress(e);
      }, longPressDelay);
    }

    // 双击处理
    if (onDoubleTap) {
      const now = Date.now();
      if (lastTapRef.current && now - lastTapRef.current < doubleTapDelay) {
        tapCountRef.current += 1;
        if (tapCountRef.current === 2) {
          onDoubleTap(e);
          tapCountRef.current = 0;
          lastTapRef.current = null;
        }
      } else {
        tapCountRef.current = 1;
        lastTapRef.current = now;
        setTimeout(() => {
          if (tapCountRef.current === 1) {
            tapCountRef.current = 0;
            lastTapRef.current = null;
          }
        }, doubleTapDelay);
      }
    }
  };

  // 处理触摸移动
  const handleTouchMove = (e) => {
    // 如果正在长按，取消长按
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // 捏合手势处理
    if (e.touches.length === 2 && onPinch && initialDistanceRef.current) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistanceRef.current;
      
      if (Math.abs(scale - 1) > pinchThreshold / 100) {
        onPinch({
          scale,
          center: {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
          }
        });
      }
    }
  };

  // 处理触摸结束
  const handleTouchEnd = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    setIsLongPressing(false);

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;

    // 检查是否为有效滑动（速度和距离）
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    if (distance > swipeThreshold && velocity > 0.1) {
      // 判断滑动方向
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight({ deltaX, deltaY, velocity, distance });
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft({ deltaX, deltaY, velocity, distance });
        }
      } else {
        // 垂直滑动
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown({ deltaX, deltaY, velocity, distance });
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp({ deltaX, deltaY, velocity, distance });
        }
      }
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
    initialDistanceRef.current = 0;
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isLongPressing
  };
};

// 滑动操作组件
export const SwipeableItem = ({ 
  children, 
  leftActions = [], 
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  className = ''
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedSide, setRevealedSide] = useState(null);
  const containerRef = useRef(null);

  const gestures = useTouchGestures({
    onSwipeLeft: ({ deltaX, velocity }) => {
      if (Math.abs(deltaX) > threshold) {
        setSwipeOffset(-Math.min(Math.abs(deltaX), 120));
        setIsRevealed(true);
        setRevealedSide('right');
        onSwipeLeft && onSwipeLeft();
      }
    },
    onSwipeRight: ({ deltaX, velocity }) => {
      if (Math.abs(deltaX) > threshold) {
        setSwipeOffset(Math.min(Math.abs(deltaX), 120));
        setIsRevealed(true);
        setRevealedSide('left');
        onSwipeRight && onSwipeRight();
      }
    },
    swipeThreshold: 20
  });

  // 重置滑动状态
  const resetSwipe = () => {
    setSwipeOffset(0);
    setIsRevealed(false);
    setRevealedSide(null);
  };

  // 点击外部区域重置
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        resetSwipe();
      }
    };

    if (isRevealed) {
      document.addEventListener('touchstart', handleClickOutside);
      return () => document.removeEventListener('touchstart', handleClickOutside);
    }
  }, [isRevealed]);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      {...gestures}
    >
      {/* 左侧操作按钮 */}
      {leftActions.length > 0 && (
        <div className="absolute left-0 top-0 h-full flex items-center">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                resetSwipe();
              }}
              className={`h-full px-4 flex items-center justify-center text-white font-medium ${
                action.color || 'bg-blue-500'
              }`}
              style={{ minWidth: '80px' }}
            >
              {action.icon && <action.icon className="w-5 h-5 mr-1" />}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* 右侧操作按钮 */}
      {rightActions.length > 0 && (
        <div className="absolute right-0 top-0 h-full flex items-center">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                resetSwipe();
              }}
              className={`h-full px-4 flex items-center justify-center text-white font-medium ${
                action.color || 'bg-red-500'
              }`}
              style={{ minWidth: '80px' }}
            >
              {action.icon && <action.icon className="w-5 h-5 mr-1" />}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* 主要内容 */}
      <div
        className="transition-transform duration-200 ease-out bg-white"
        style={{
          transform: `translateX(${swipeOffset}px)`
        }}
        onClick={isRevealed ? resetSwipe : undefined}
      >
        {children}
      </div>
    </div>
  );
};

// 长按菜单组件
export const LongPressMenu = ({ 
  children, 
  menuItems = [], 
  onLongPress,
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const gestures = useTouchGestures({
    onLongPress: (e) => {
      const touch = e.touches[0];
      setMenuPosition({
        x: touch.clientX,
        y: touch.clientY
      });
      setShowMenu(true);
      onLongPress && onLongPress(e);
    }
  });

  const handleMenuItemClick = (item) => {
    item.onClick();
    setShowMenu(false);
  };

  return (
    <>
      <div className={className} {...gestures}>
        {children}
      </div>

      {/* 长按菜单 */}
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-50"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-32"
            style={{
              left: Math.min(menuPosition.x, window.innerWidth - 150),
              top: Math.min(menuPosition.y, window.innerHeight - menuItems.length * 40 - 20)
            }}
          >
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              >
                {item.icon && <item.icon className="w-4 h-4 mr-2" />}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
};

// 下拉刷新组件
export const PullToRefresh = ({ 
  children, 
  onRefresh, 
  refreshing = false,
  threshold = 60,
  className = ''
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef(null);

  const gestures = useTouchGestures({
    onSwipeDown: ({ deltaY, velocity }) => {
      if (containerRef.current && containerRef.current.scrollTop === 0) {
        const distance = Math.min(deltaY, 100);
        setPullDistance(distance);
        setCanRefresh(distance > threshold);
      }
    }
  });

  const handleTouchEnd = () => {
    if (canRefresh && !refreshing) {
      onRefresh();
    }
    setPullDistance(0);
    setCanRefresh(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      {...gestures}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉刷新指示器 */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center py-2 bg-blue-50 transition-all duration-200"
          style={{ 
            transform: `translateY(${Math.min(pullDistance - threshold, 20)}px)`,
            opacity: pullDistance / threshold
          }}
        >
          <div className={`w-5 h-5 border-2 border-blue-600 rounded-full mr-2 ${
            refreshing ? 'animate-spin border-t-transparent' : ''
          }`} />
          <span className="text-sm text-blue-600">
            {refreshing ? '正在刷新...' : canRefresh ? '释放刷新' : '下拉刷新'}
          </span>
        </div>
      )}

      {children}
    </div>
  );
};

export default {
  useTouchGestures,
  SwipeableItem,
  LongPressMenu,
  PullToRefresh
};