import { useRef } from "react";

export function Swipeable({ children, onSwipeLeft, onSwipeRight, onDoubleTap, onLongPress, className = "" }) {
  const gesture = useRef({ x: 0, y: 0, at: 0, timer: null });
  const start = (event) => {
    const point = event.touches?.[0] || event;
    gesture.current.x = point.clientX;
    gesture.current.y = point.clientY;
    gesture.current.timer = window.setTimeout(() => onLongPress?.(), 550);
  };
  const end = (event) => {
    window.clearTimeout(gesture.current.timer);
    const point = event.changedTouches?.[0] || event;
    const x = point.clientX - gesture.current.x;
    const y = point.clientY - gesture.current.y;
    if (Math.abs(x) > 65 && Math.abs(x) > Math.abs(y) * 1.4) (x > 0 ? onSwipeRight : onSwipeLeft)?.();
    const now = Date.now();
    if (Math.abs(x) < 10 && Math.abs(y) < 10 && now - gesture.current.at < 330) onDoubleTap?.();
    gesture.current.at = now;
  };
  return <div className={`swipeable ${className}`} onTouchStart={start} onTouchEnd={end} onPointerDown={(event) => event.pointerType !== "touch" && start(event)} onPointerUp={(event) => event.pointerType !== "touch" && end(event)}>{children}</div>;
}
