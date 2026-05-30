import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react';

interface VirtualizedListProps<T> {
  items: readonly T[];
  getItemKey: (item: T, index: number) => string;
  getItemHeight: (item: T, index: number) => number;
  renderItem: (item: T, index: number) => ReactNode;
  overscanPx?: number;
  topPadding?: number;
  bottomPadding?: number;
  style?: CSSProperties;
  viewportRef?: Ref<HTMLDivElement>;
}

function findStartIndex(offsets: readonly number[], scrollTop: number): number {
  let low = 0;
  let high = offsets.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    if (offsets[mid] <= scrollTop) low = mid;
    else high = mid - 1;
  }

  return low;
}

export default function VirtualizedList<T>({
  items,
  getItemKey,
  getItemHeight,
  renderItem,
  overscanPx = 320,
  topPadding = 0,
  bottomPadding = 0,
  style,
  viewportRef,
}: VirtualizedListProps<T>) {
  const internalViewportRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    if (!viewportRef) return;
    if (typeof viewportRef === 'function') viewportRef(internalViewportRef.current);
    else viewportRef.current = internalViewportRef.current;
  }, [viewportRef]);

  useEffect(() => {
    const node = internalViewportRef.current;
    if (!node) return;

    const updateViewport = () => {
      setViewportHeight(node.clientHeight);
      setScrollTop(node.scrollTop);
    };

    updateViewport();

    const handleScroll = () => setScrollTop(node.scrollTop);
    const resizeObserver = new ResizeObserver(() => updateViewport());
    resizeObserver.observe(node);
    node.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      node.removeEventListener('scroll', handleScroll);
    };
  }, [items.length]);

  const heights = useMemo(
    () => items.map((item, index) => getItemHeight(item, index)),
    [getItemHeight, items],
  );

  const offsets = useMemo(() => {
    const nextOffsets = new Array<number>(items.length);
    let runningOffset = topPadding;
    for (let index = 0; index < items.length; index += 1) {
      nextOffsets[index] = runningOffset;
      runningOffset += heights[index] ?? 0;
    }
    return nextOffsets;
  }, [heights, items.length, topPadding]);

  const totalHeight = useMemo(
    () => topPadding + heights.reduce((sum, value) => sum + value, 0) + bottomPadding,
    [bottomPadding, heights, topPadding],
  );

  const visibleRange = useMemo(() => {
    if (items.length === 0) return { startIndex: 0, endIndex: -1 };

    const minOffset = Math.max(0, scrollTop - overscanPx);
    const maxOffset = scrollTop + viewportHeight + overscanPx;

    let startIndex = findStartIndex(offsets, minOffset);
    while (startIndex > 0 && offsets[startIndex] > minOffset) startIndex -= 1;

    let endIndex = startIndex;
    while (endIndex < items.length && (offsets[endIndex] + (heights[endIndex] ?? 0)) < maxOffset) {
      endIndex += 1;
    }

    return {
      startIndex,
      endIndex: Math.min(items.length - 1, endIndex),
    };
  }, [heights, items.length, offsets, overscanPx, scrollTop, viewportHeight]);

  return (
    <div
      ref={internalViewportRef}
      style={{
        ...style,
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, sliceIndex) => {
          const index = visibleRange.startIndex + sliceIndex;
          return (
            <div
              key={getItemKey(item, index)}
              style={{
                position: 'absolute',
                top: offsets[index],
                left: 0,
                right: 0,
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}