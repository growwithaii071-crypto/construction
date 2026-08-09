"use client";

import { useState } from "react";
import { Users, Plus, Mail, Phone, Shield, Pencil, Trash2, X, Tag, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ROLES = [
  "Site Supervisor", "Civil Engineer", "Electrician", "Plumber",
  "Mason", "Carpenter", "Painter", "Helper", "Foreman", "Welder",
  "Project Manager", "Safety Officer",
];

const DEMO_TEAM = [
  { id: "1", name: "Ramesh Kumar", role: "Site Supervisor", phone: "+91 98765 43210", email: "ramesh@example.com", status: "active", avatar: "RK" },
  { id: "2", name: "Suresh Verma", role: "Electrician", phone: "+91 87654 32109", email: "suresh@example.com", status: "active", avatar: "SV" },
  { id: "3", name: "Priya Sharma", role: "Civil Engineer", phone: "+91 76543 21098", email: "priya@example.com", status: "on_leave", avatar: "PS" },
  { id: "4", name: "Mohan Das", role: "Plumber", phone: "+91 65432 10987", email: "mohan@example.com", status: "active", avatar: "MD" },
];

type TeamMember = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: string;
  avatar: string;
};

type ModalType = "member" | "roles" | null;

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(DEMO_TEAM);
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
  const [modal, setModal] = useState<ModalType>(null);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: "", role: DEFAULT_ROLES[0], phone: "", email: "" });

  // Role management state
  const [newRole, setNewRole] = useState("");
  const [editingRole, setEditingRole] = useState<{ index: number; value: string } | null>(null);

  function openAdd() {
    setEditMember(null);
    setForm({ name: "", role: roles[0] ?? "", phone: "", email: "" });
    setModal("member");
  }

  function openEdit(m: TeamMember) {
    setEditMember(m);
    setForm({ name: m.name, role: m.role, phone: m.phone, email: m.email });
    setModal("member");
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const initials = form.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    if (editMember) {
      setTeam((prev) => prev.map((m) => m.id === editMember.id ? { ...m, ...form, avatar: initials } : m));
    } else {
      setTeam((prev) => [...prev, { id: String(Date.now()), ...form, status: "active", avatar: initials }]);
    }
    setModal(null);
  }

  function handleDelete(id: string) {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleStatus(id: string) {
    setTeam((prev) => prev.map((m) => m.id === id ? { ...m, status: m.status === "active" ? "on_leave" : "active" } : m));
  }

  // Role CRUD
  function addRole() {
    const trimmed = newRole.trim();
    if (!trimmed || roles.includes(trimmed)) return;
    setRoles((prev) => [...prev, trimmed]);
    setNewRole("");
  }

  function deleteRole(role: string) {
    // Don't delete if any team member uses this role
    const inUse = team.some((m) => m.role === role);
    if (inUse) return;
    setRoles((prev) => prev.filter((r) => r !== role));
  }

  function saveEditRole() {
    if (!editingRole) return;
    const trimmed = editingRole.value.trim();
    if (!trimmed) return;
    const oldRole = roles[editingRole.index];
    setRoles((prev) => prev.map((r, i) => i === editingRole.index ? trimmed : r));
    // Update team members with old role
    setTeam((prev) => prev.map((m) => m.role === oldRole ? { ...m, role: trimmed } : m));
    setEditingRole(null);
  }

  const active = team.filter((m) => m.status === "active").length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your workers and team members</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal("roles")}
            className="inline-flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" /> Manage Roles
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-gray-900">{team.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Members</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-green-600">{active}</p>
          <p className="text-xs text-gray-400 mt-1">Active</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-center">
          <p className="text-3xl font-extrabold text-amber-500">{team.length - active}</p>
          <p className="text-xs text-gray-400 mt-1">On Leave</p>
        </div>
      </div>

      {/* Roles quick overview */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">Available Roles ({roles.length})</h2>
          <button onClick={() => setModal("roles")} className="text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors">
            + Add New Role
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => {
            const inUse = team.some((m) => m.role === r);
            return (
              <span key={r} className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border",
                inUse ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-gray-50 text-gray-600 border-gray-200"
              )}>
                <Tag className="w-3 h-3" />
                {r}
                {inUse && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
              </span>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 mt-3">
          <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 bg-orange-400 rounded-full inline-block" /> Orange dot</span> = role currently in use
        </p>
      </div>

      {/* Team grid */}
      {team.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-16 flex flex-col items-center text-center">
          <Users className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="font-semibold text-gray-600 text-lg">No team members</h3>
          <p className="text-sm text-gray-400 mt-1">Add your first team member to get started</p>
          <button onClick={openAdd} className="mt-4 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
            + Add Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((m) => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold text-sm">
                    {m.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{m.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Shield className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">{m.role}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleStatus(m.id)}
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors cursor-pointer",
                    m.status === "active"
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  )}
                >
                  {m.status === "active" ? "Active" : "On Leave"}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{m.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{m.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <button onClick={() => openEdit(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 py-1.5 rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(m.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 py-1.5 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Member Modal ── */}
      {modal === "member" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">{editMember ? "Edit Member" : "Add Team Member"}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600">Role</label>
                  <button type="button" onClick={() => setModal("roles")}
                    className="text-[11px] text-orange-500 font-semibold hover:text-orange-600 transition-colors">
                    + Manage Roles
                  </button>
                </div>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition bg-white">
                  {roles.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@email.com" type="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm">
                {editMember ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Roles Modal ── */}
      {modal === "roles" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Manage Roles</h3>
                <p className="text-xs text-gray-400 mt-0.5">Add, edit or remove team roles</p>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add new role */}
            <div className="px-6 py-4 border-b border-gray-100 shrink-0">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Add New Role</label>
              <div className="flex gap-2">
                <input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRole()}
                  placeholder="e.g. Structural Engineer"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                />
                <button
                  onClick={addRole}
                  disabled={!newRole.trim() || roles.includes(newRole.trim())}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  Add
                </button>
              </div>
              {newRole.trim() && roles.includes(newRole.trim()) && (
                <p className="text-xs text-red-500 mt-1.5">This role already exists</p>
              )}
            </div>

            {/* Roles list */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">All Roles ({roles.length})</p>
              {roles.map((r, i) => {
                const inUse = team.some((m) => m.role === r);
                const isEditing = editingRole?.index === i;
                return (
                  <div key={r} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 group">
                    <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingRole.value}
                        onChange={(e) => setEditingRole({ index: i, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEditRole(); if (e.key === "Escape") setEditingRole(null); }}
                        className="flex-1 border border-orange-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    ) : (
                      <span className="flex-1 text-sm font-medium text-gray-800">{r}</span>
                    )}
                    {inUse && !isEditing && (
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">In Use</span>
                    )}
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button onClick={saveEditRole} className="text-xs font-bold text-green-600 hover:text-green-700 px-2 py-1 hover:bg-green-50 rounded-lg transition-colors">Save</button>
                        <button onClick={() => setEditingRole(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingRole({ index: i, value: r })} title="Edit role"
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteRole(r)}
                          disabled={inUse}
                          title={inUse ? "Cannot delete — role is in use" : "Delete role"}
                          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <button onClick={() => setModal(null)}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
