"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createContractorAction, updateContractorAction } from "@/actions/contractors";
import { Loader2 } from "lucide-react";

interface Contractor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  specialization?: string | null;
  gst?: string | null;
  pan?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  notes?: string | null;
}

export function ContractorForm({ contractor }: { contractor?: Contractor }) {
  const action = contractor
    ? updateContractorAction.bind(null, contractor.id)
    : createContractorAction;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={contractor?.name}
                  placeholder="Contractor name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  name="specialization"
                  defaultValue={contractor?.specialization ?? ""}
                  placeholder="e.g. Civil, Electrical, Plumbing"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  defaultValue={contractor?.company ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={contractor?.email ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={contractor?.phone ?? ""}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Address</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={contractor?.address ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={contractor?.city ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={contractor?.state ?? ""}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rating">Rating (1-5)</Label>
                <Input
                  id="rating"
                  name="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  defaultValue={contractor?.rating ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gst">GST Number</Label>
                <Input id="gst" name="gst" defaultValue={contractor?.gst ?? ""} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="pan">PAN Number</Label>
                <Input id="pan" name="pan" defaultValue={contractor?.pan ?? ""} className="mt-1" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="notes"
                defaultValue={contractor?.notes ?? ""}
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {contractor ? "Save Changes" : "Add Contractor"}
          </Button>
        </div>
      </div>
    </form>
  );
}
