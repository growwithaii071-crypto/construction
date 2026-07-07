"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientAction, updateClientAction } from "@/actions/clients";
import { Loader2 } from "lucide-react";

interface ClientFormProps {
  client?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    gst?: string | null;
    pan?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    notes?: string | null;
  };
}

export function ClientForm({ client }: ClientFormProps) {
  const action = client ? updateClientAction.bind(null, client.id) : createClientAction;
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
                  defaultValue={client?.name}
                  placeholder="Client name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={client?.email ?? ""}
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={client?.phone ?? ""}
                  placeholder="+91 9876543210"
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  defaultValue={client?.company ?? ""}
                  placeholder="Company name"
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
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={client?.address ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" defaultValue={client?.city ?? ""} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={client?.state ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  defaultValue={client?.pincode ?? ""}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tax Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="gst">GST Number</Label>
                <Input
                  id="gst"
                  name="gst"
                  defaultValue={client?.gst ?? ""}
                  placeholder="27AAPFU0939F1ZV"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pan">PAN Number</Label>
                <Input
                  id="pan"
                  name="pan"
                  defaultValue={client?.pan ?? ""}
                  placeholder="AAPFU0939F"
                  className="mt-1"
                />
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
                defaultValue={client?.notes ?? ""}
                rows={4}
                placeholder="Additional notes..."
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
            {client ? "Save Changes" : "Create Client"}
          </Button>
        </div>
      </div>
    </form>
  );
}
