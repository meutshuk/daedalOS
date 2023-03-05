import { useProcesses } from "contexts/process";
import type { MotionProps, Variant } from "framer-motion";
import { useEffect, useLayoutEffect, useState } from "react";
import { TASKBAR_HEIGHT, TRANSITIONS_IN_SECONDS } from "utils/constants";
import { viewHeight, viewWidth } from "utils/functions";

const active = {
  height: "inherit",
  opacity: 1,
  scale: 1,
  width: "inherit",
};

const initial = {
  height: "inherit",
  opacity: 0,
  scale: 0.95,
  width: "inherit",
};

const baseMaximize = {
  opacity: 1,
  scale: 1,
};

const baseMinimize = {
  opacity: 0,
  scale: 0.7,
};

const getMaxDimensions = (): Partial<Variant> => ({
  height: viewHeight() - TASKBAR_HEIGHT,
  width: viewWidth(),
});

const useWindowTransitions = (
  id: string,
  noInitialScaling = false
): MotionProps => {
  const { processes: { [id]: process } = {} } = useProcesses();
  const { closing, componentWindow, maximized, minimized, taskbarEntry } =
    process || {};
  const [maximize, setMaximize] = useState<Variant>(
    Object.create(null) as Variant
  );
  const [minimize, setMinimize] = useState<Variant>(
    Object.create(null) as Variant
  );

  useLayoutEffect(() => {
    if (!componentWindow || closing) return;

    const { x: windowX = 0, y: windowY = 0 } =
      componentWindow.getBoundingClientRect();

    setMaximize({
      ...baseMaximize,
      ...getMaxDimensions(),
      x: 0 - windowX,
      y: 0 - windowY,
    });
  }, [closing, componentWindow, maximized]);

  useLayoutEffect(() => {
    if (!taskbarEntry || !componentWindow || closing) return;

    const {
      height: taskbarHeight = 0,
      width: taskbarWidth = 0,
      x: taskbarX = 0,
      y: taskbarY = 0,
    } = taskbarEntry.getBoundingClientRect();
    const {
      height: windowHeight = 0,
      width: windowWidth = 0,
      x: windowX = 0,
      y: windowY = 0,
    } = componentWindow.getBoundingClientRect();

    const x = Math.round(
      taskbarX - windowX - windowWidth / 2 + taskbarWidth / 2
    );
    const y = Math.round(
      taskbarY - windowY - windowHeight / 2 + taskbarHeight / 2
    );

    if (!(x === 0 && y === 0)) {
      setMinimize({ ...baseMinimize, x, y });
    }
  }, [closing, componentWindow, minimized, taskbarEntry]);

  useEffect(() => {
    const monitorViewportResize = (): void => {
      if (maximized) {
        setMaximize((currentMaximize: Variant) => ({
          ...currentMaximize,
          ...getMaxDimensions(),
        }));
      }
    };

    window.addEventListener("resize", monitorViewportResize, { passive: true });

    return () => window.removeEventListener("resize", monitorViewportResize);
  }, [maximized]);

  return {
    animate:
      (minimized ? "minimize" : "") ||
      (!closing && maximized ? "maximize" : "") ||
      "active",
    exit: "initial",
    initial: "initial",
    transition: {
      duration: TRANSITIONS_IN_SECONDS.WINDOW,
    },
    variants: {
      active,
      initial: noInitialScaling ? { ...initial, scale: 1 } : initial,
      maximize,
      minimize,
    },
  };
};

export default useWindowTransitions;
