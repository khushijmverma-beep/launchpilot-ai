"use client";

import { useEffect } from "react";

type DeleteProjectDialogProps = {
  projectName: string;
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteProjectDialog({
  projectName,
  open,
  loading,
  onConfirm,
  onCancel,
}: DeleteProjectDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="presentation"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
        className="terminal-card w-full max-w-md p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="mono-label">Delete project</p>
        <h2 id="delete-project-title" className="mt-3 text-xl font-semibold text-white">
          Are you sure?
        </h2>
        <p className="mt-3 text-sm leading-6 text-lp-muted">
          This will permanently delete <span className="text-white">&ldquo;{projectName}&rdquo;</span> from your
          workspace. This cannot be undone.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting…" : "Delete project"}
          </button>
        </div>
      </div>
    </div>
  );
}
