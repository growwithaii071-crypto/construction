"use client";

import { useActionState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectStatus } from "@/generated/prisma";
import { createProjectAction, updateProjectAction } from "@/actions/projects";
import { Loader2 } from "lucide-react";

const PROJECT_TYPES = [
  "Residential",
  "Commercial",
  "Industrial",
  "Infrastructure",
  "Renovation",
  "Road & Highway",
  "Other",
];

const PROJECT_STATUSES: Record<string, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

interface ProjectFormProps {
  clients: { id: string; name: string }[];
  managers: { id: string; name: string | null }[];
  project?: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    type?: string | null;
    status: ProjectStatus;
    clientId: string;
    managerId?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    budgetAmount?: number | null;
    contractValue?: number | null;
    location?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
  };
}

export function ProjectForm({ clients, managers, project }: ProjectFormProps) {
  const action = project ? updateProjectAction.bind(null, project.id) : createProjectAction;

  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={project?.name}
                  placeholder="e.g. Sunrise Apartments Phase 1"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="code">Project Code *</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={project?.code}
                  placeholder="e.g. CONS-001"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="type">Project Type</Label>
                <Select name="type" defaultValue={project?.type ?? "Residential"}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={project?.description ?? ""}
                  placeholder="Project overview..."
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="location">Address</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={project?.location ?? ""}
                  placeholder="Street address"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={project?.city ?? ""}
                  placeholder="City"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={project?.state ?? ""}
                  placeholder="State"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  defaultValue={project?.pincode ?? ""}
                  placeholder="Pincode"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={project?.location ?? "India"}
                  placeholder="Country"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget (₹)</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  defaultValue={project?.budgetAmount ?? ""}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contractValue">Contract Value (₹)</Label>
                <Input
                  id="contractValue"
                  name="contractValue"
                  type="number"
                  defaultValue={project?.contractValue ?? ""}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={project?.status ?? ProjectStatus.PLANNING}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROJECT_STATUSES).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="clientId">Client *</Label>
                <Select name="clientId" defaultValue={project?.clientId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="managerId">Project Manager</Label>
                <Select name="managerId" defaultValue={project?.managerId ?? ""}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={
                    project?.startDate
                      ? new Date(project.startDate).toISOString().split("T")[0]
                      : ""
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={
                    project?.endDate ? new Date(project.endDate).toISOString().split("T")[0] : ""
                  }
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {project ? "Save Changes" : "Create Project"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
