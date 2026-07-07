"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const WEATHER_OPTIONS = ["Sunny", "Cloudy", "Rainy", "Windy", "Foggy", "Hot", "Cold"];

async function submitReport(formData: FormData): Promise<{ error?: string }> {
  "use server";
  const { requireAuth } = await import("@/lib/auth-utils");
  const prismaLib = await import("@/lib/prisma");
  const session = await requireAuth();

  try {
    await prismaLib.default.siteReport.create({
      data: {
        projectId: formData.get("projectId") as string,
        reporterId: session.user.id,
        reportDate: new Date(formData.get("reportDate") as string),
        weather: formData.get("weather") as string,
        summary: formData.get("summary") as string,
        workProgress: formData.get("workProgress")
          ? parseInt(formData.get("workProgress") as string)
          : undefined,
        totalWorkers: formData.get("totalWorkers")
          ? parseInt(formData.get("totalWorkers") as string)
          : undefined,
        activities: formData.get("activities") as string,
        issues: formData.get("issues") as string,
        materials: formData.get("materials") as string,
        nextDayPlan: formData.get("nextDayPlan") as string,
      },
    });
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/site-reports");
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to save report" };
  }
}

export default function NewSiteReportPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const result = await submitReport(fd);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else router.push("/site-reports");
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/site-reports">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Daily Site Report</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Project ID *</Label>
                <Input name="projectId" required placeholder="Paste project ID" className="mt-1" />
              </div>
              <div>
                <Label>Report Date *</Label>
                <Input
                  name="reportDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Weather</Label>
                <Select name="weather" defaultValue="Sunny">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_OPTIONS.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Workers Today</Label>
                  <Input name="totalWorkers" type="number" min="0" className="mt-1" />
                </div>
                <div>
                  <Label>Work Progress (%)</Label>
                  <Input name="workProgress" type="number" min="0" max="100" className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Summary *</Label>
                <Textarea
                  name="summary"
                  required
                  rows={3}
                  placeholder="Brief summary of today's work..."
                  className="mt-1 resize-none"
                />
              </div>
              <div>
                <Label>Activities Completed</Label>
                <Textarea
                  name="activities"
                  rows={3}
                  placeholder="List activities..."
                  className="mt-1 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Issues / Problems</Label>
                <Textarea
                  name="issues"
                  rows={3}
                  placeholder="Any issues faced..."
                  className="mt-1 resize-none"
                />
              </div>
              <div>
                <Label>Materials Used</Label>
                <Textarea
                  name="materials"
                  rows={3}
                  placeholder="Materials consumed today..."
                  className="mt-1 resize-none"
                />
              </div>
              <div>
                <Label>Next Day Plan</Label>
                <Textarea
                  name="nextDayPlan"
                  rows={2}
                  placeholder="Tomorrow's plan..."
                  className="mt-1 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start">
            <Button
              type="submit"
              disabled={pending}
              className="bg-orange-500 hover:bg-orange-600 h-12 px-8"
            >
              {pending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Report
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
