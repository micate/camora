import { KeyboardSensor, PointerSensor } from '@dnd-kit/core';
import type { KeyboardSensorProps, PointerSensorProps } from '@dnd-kit/core';

type PointerSensorInternals = {
  handleCancel: () => void;
};

function replaceResizeCancellation(
  sensor: PointerSensorInternals,
  sensorWindow: Window,
  abortController: AbortController,
) {
  const { handleCancel } = sensor;
  sensorWindow.removeEventListener('resize', handleCancel);

  let previousWidth = sensorWindow.innerWidth;
  let previousHeight = sensorWindow.innerHeight;

  sensorWindow.addEventListener('resize', () => {
    const width = sensorWindow.innerWidth;
    const height = sensorWindow.innerHeight;

    if (width === previousWidth && height === previousHeight) {
      return;
    }

    previousWidth = width;
    previousHeight = height;
    handleCancel();
  }, { signal: abortController.signal });
}

/**
 * Chromium extension windows may emit resize events even when their viewport
 * dimensions have not changed. dnd-kit cancels on every resize event, which
 * makes a drag end immediately in that environment.
 *
 * Preserve dnd-kit's cancellation behavior for real viewport changes while
 * ignoring those no-op resize events.
 */
export class MeaningfulResizePointerSensor extends PointerSensor {
  constructor(props: PointerSensorProps) {
    const eventTarget = props.event.target as Node | null;
    const sensorWindow = eventTarget?.ownerDocument?.defaultView || window;
    const abortController = new AbortController();
    const cleanup = () => abortController.abort();

    super({
      ...props,
      onAbort: (id) => {
        cleanup();
        props.onAbort(id);
      },
      onCancel: () => {
        cleanup();
        props.onCancel();
      },
      onEnd: () => {
        cleanup();
        props.onEnd();
      },
    });

    replaceResizeCancellation(
      this as unknown as PointerSensorInternals,
      sensorWindow,
      abortController,
    );
  }
}

export class MeaningfulResizeKeyboardSensor extends KeyboardSensor {
  constructor(props: KeyboardSensorProps) {
    const eventTarget = props.event.target as Node | null;
    const sensorWindow = eventTarget?.ownerDocument?.defaultView || window;
    const abortController = new AbortController();
    const cleanup = () => abortController.abort();

    super({
      ...props,
      onAbort: (id) => {
        cleanup();
        props.onAbort(id);
      },
      onCancel: () => {
        cleanup();
        props.onCancel();
      },
      onEnd: () => {
        cleanup();
        props.onEnd();
      },
    });

    replaceResizeCancellation(
      this as unknown as PointerSensorInternals,
      sensorWindow,
      abortController,
    );
  }
}
