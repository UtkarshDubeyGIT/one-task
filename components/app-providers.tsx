"use client";

import * as React from "react";

import { TaskDialog } from "./task-dialog";

interface TaskDialogContextValue {
  openCreate: () => void;
  openEdit: (taskId: string) => void;
}

const TaskDialogContext = React.createContext<TaskDialogContextValue | null>(
  null,
);

export function useTaskDialog(): TaskDialogContextValue {
  const ctx = React.useContext(TaskDialogContext);
  if (!ctx) {
    throw new Error("useTaskDialog must be used within <TaskDialogProvider>");
  }
  return ctx;
}

export function TaskDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [taskId, setTaskId] = React.useState<string | null>(null);

  const openCreate = React.useCallback(() => {
    setTaskId(null);
    setOpen(true);
  }, []);
  const openEdit = React.useCallback((id: string) => {
    setTaskId(id);
    setOpen(true);
  }, []);

  const value = React.useMemo(
    () => ({ openCreate, openEdit }),
    [openCreate, openEdit],
  );

  return (
    <TaskDialogContext.Provider value={value}>
      {children}
      <TaskDialog open={open} onOpenChange={setOpen} taskId={taskId} />
    </TaskDialogContext.Provider>
  );
}
