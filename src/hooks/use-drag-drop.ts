import { useState, useCallback, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DragItem<T = unknown> {
  id: string;
  data: T;
}

interface UseDragDropOptions<T> {
  onDrop?: (item: DragItem<T>, dropZoneId: string) => void;
}

/**
 * PointerEvent-based drag and drop hook (no external libraries).
 * Works with touch, mouse, and pen inputs.
 */
export function useDragDrop<T = unknown>(options?: UseDragDropOptions<T>) {
  const [dragging, setDragging] = useState<DragItem<T> | null>(null);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const originRef = useRef<Position>({ x: 0, y: 0 });

  const startDrag = useCallback(
    (e: React.PointerEvent, item: DragItem<T>) => {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      setDragging(item);
      setOffset({ x: offsetX, y: offsetY });
      setPosition({ x: e.clientX - offsetX, y: e.clientY - offsetY });
      originRef.current = { x: rect.left, y: rect.top };

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const moveDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    },
    [dragging, offset],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;

      // Find drop zone under pointer
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const dropZone = elements.find((el) => el.hasAttribute('data-drop-zone'));

      if (dropZone) {
        const zoneId = dropZone.getAttribute('data-drop-zone') ?? '';
        options?.onDrop?.(dragging, zoneId);
      }

      setDragging(null);
    },
    [dragging, options],
  );

  const cancelDrag = useCallback(() => {
    setDragging(null);
  }, []);

  return {
    dragging,
    position,
    originPosition: originRef.current,
    startDrag,
    moveDrag,
    endDrag,
    cancelDrag,
    isDragging: dragging !== null,
  };
}
