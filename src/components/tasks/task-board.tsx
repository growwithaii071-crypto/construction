"use client";

import { useState } from "react";
import { TaskStatus, TaskPriority } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CreateTaskDialog } from "./create-task-dialog";
import { updateTaskStatusAction } from "@/actions/tasks";

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: TaskStatus.TODO, label: "To Do", color: "bg-gray-100 text-gray-600" },
  { status: TaskStatus.IN_PROGRESS, label: "In Progress", color: "bg-blue-100 text-blue-600" },
  { status: TaskStatus.REVIEW, label: "Review", color: "bg-purple-100 text-purple-600" },
  { status: TaskStatus.COMPLETED, label: "Done", color: "bg-green-100 text-green-600" },
];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-500",
  MEDIUM: "bg-yellow-100 text-yellow-600",
  HIGH: "bg-orange-100 text-orange-600",
  CRITICAL: "bg-red-100 text-red-600",
};

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date | null;
  assignee?: { name: string | null } | null;
  description?: string | null;
}

interface TaskBoardProps {
  projectId: string;
  tasks: Task[];
}

export function TaskBoard({ projectId, tasks: initialTasks }: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>(TaskStatus.TODO);

  function getTasksByStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status);
  }

  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    await updateTaskStatusAction(taskId, newStatus);
  }

  function handleTaskCreated(task: Task) {
    setTasks((prev) => [...prev, task]);
    setCreateOpen(false);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{tasks.length} total tasks</p>
        <Button
          size="sm"
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => {
            setCreateStatus(TaskStatus.TODO);
            setCreateOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = getTasksByStatus(col.status);
          return (
            <div key={col.status} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", col.color)}>
                    {col.label}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{colTasks.length}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6"
                  onClick={() => {
                    setCreateStatus(col.status);
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Tasks */}
              <div className="space-y-2 min-h-[120px]">
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0",
                          PRIORITY_COLORS[task.priority]
                        )}
                      >
                        {task.priority.charAt(0)}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      {task.assignee ? (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <User className="w-3 h-3" />
                          {task.assignee.name}
                        </div>
                      ) : (
                        <span />
                      )}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.dueDate), "dd MMM")}
                        </div>
                      )}
                    </div>
                    {/* Quick status change */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {COLUMNS.filter((c) => c.status !== task.status).map((c) => (
                        <button
                          key={c.status}
                          onClick={() => handleStatusChange(task.id, c.status)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={projectId}
        defaultStatus={createStatus}
        onCreated={handleTaskCreated}
      />
    </div>
  );
}
