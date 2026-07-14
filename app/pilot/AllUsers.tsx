"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import { BASE_URL } from "@/lib/baseURL";
import { PilotUsersTable, mapApiUserToPilotRow } from "./pilot-users-table";

export default function AllUsers() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/all`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllUsers(data);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredSortedRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = allUsers.filter((u) => {
      if (!q) return true;
      const name = (u.name || u.username || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const user = (u.username || "").toLowerCase();
      return name.includes(q) || email.includes(q) || user.includes(q);
    });
    return [...filtered]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map(mapApiUserToPilotRow);
  }, [allUsers, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedRows.length / usersPerPage));
  const startIndex = (currentPage - 1) * usersPerPage;
  const pageRows = filteredSortedRows.slice(startIndex, startIndex + usersPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-black">
      <div className="flex shrink-0 flex-col gap-4 border-b border-[#1a1a1a] px-8 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">All users</h2>
          <p className="text-xs text-zinc-500">
            Full directory, newest registrations first
            {!loading && allUsers.length > 0 ? (
              <span className="text-zinc-600">
                {" "}
                · <span className="tabular-nums text-zinc-500">{allUsers.length}</span> total
              </span>
            ) : null}
          </p>
        </div>
        <div className="relative w-full shrink-0 sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" strokeWidth={2} />
          <input
            type="search"
            placeholder="Search name, email, username…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-8 py-6">
        <PilotUsersTable
          rows={pageRows}
          loading={loading}
          emptyTitle={searchTerm.trim() ? "No matching users" : "No users yet"}
          emptyDescription={
            searchTerm.trim() ? "Try a different search term." : "Registrations will appear here when users sign up."
          }
        />
      </div>

      {!loading && filteredSortedRows.length > 0 ? (
        <div className="shrink-0 border-t border-[#1a1a1a] bg-black px-8 py-4">
          <div className="flex flex-col gap-3 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing{" "}
              <span className="font-medium tabular-nums text-zinc-300">{startIndex + 1}</span>
              {" – "}
              <span className="font-medium tabular-nums text-zinc-300">
                {Math.min(startIndex + usersPerPage, filteredSortedRows.length)}
              </span>
              {" of "}
              <span className="font-medium tabular-nums text-zinc-300">{filteredSortedRows.length}</span>
              {searchTerm.trim() ? " matching" : " users"}
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[2.25rem] rounded-lg border px-3 py-1.5 text-xs font-medium tabular-nums transition-colors ${
                      currentPage === pageNum
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
