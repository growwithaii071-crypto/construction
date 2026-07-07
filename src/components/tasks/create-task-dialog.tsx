"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatus, TaskPriority } from "@/generated/prisma";
import { createTaskAction } from "@/actions/tasks";
import { Loader2 } from "lucide-react";

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  defaultStatus: TaskStatus;
  onCreated: (task: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: Date | null;
    assignee?: { name: string | null } | null;
    description?: string | null;
  }) => void;
}

export function CreateTaskDialog({
  open,
  onClose,
  projectId,
  defaultStatus,
  onCreated,
}: CreateTaskDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const task = await createTaskAction({
        projectId,
        title: fd.get("title") as string,
        description: fd.get("description") as string,
        status: (fd.get("status") as TaskStatus) ?? defaultStatus,
        priority: (fd.get("priority") as TaskPriority) ?? TaskPriority.MEDIUM,
        dueDate: fd.get("dueDate") as string,
      });
      onCreated(task);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input name="title" placeholder="Task title" required className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              name="description"
              placeholder="Task details..."
              rows={3}
              className="mt-1 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select name="status" defaultValue={defaultStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="COMPLETED">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select name="priority" defaultValue={TaskPriority.MEDIUM}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Due Date</Label>
            <Input name="dueDate" type="date" className="mt-1" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
