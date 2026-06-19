"use client";

import { ModalPortal } from "@/components/ModalPortal";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { AvatarCropModal } from "@/components/profile/AvatarCropModal";
import { useAuth } from "@/contexts/AuthContext";
import { getUserEmail, getUserLabel, userHasPasswordProvider } from "@/lib/auth-session";
import { saveUserIdentity } from "@/lib/users/firestore";
import { dispatchProfileChange } from "@/lib/users/profileEvents";
import { useEffect, useRef, useState } from "react";

type EditProfileModalProps = {
  open: boolean;
  onClose: () => void;
  initialDisplayName?: string;
  initialAvatarUrl?: string | null;
  onSaved?: (displayName: string, avatarUrl?: string | null) => void;
};

export function EditProfileModal({
  open,
  onClose,
  initialDisplayName,
  initialAvatarUrl,
  onSaved,
}: EditProfileModalProps) {
  const { user, changePassword } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDisplayName(initialDisplayName?.trim() || (user ? getUserLabel(user) : "Founder"));
    setAvatarUrl(initialAvatarUrl ?? null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }, [open, initialDisplayName, initialAvatarUrl, user]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, saving, onClose]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleCropSave(dataUrl: string) {
    setAvatarUrl(dataUrl);
    setCropOpen(false);
    setCropSrc(null);
  }

  async function handleSave() {
    if (!user) return;

    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Display name is required");
      return;
    }

    const canChangePassword = userHasPasswordProvider(user);
    const wantsPasswordChange =
      canChangePassword &&
      (currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0);

    if (wantsPasswordChange) {
      if (!currentPassword) {
        setError("Enter your current password to change it");
        return;
      }
      if (!newPassword) {
        setError("Enter a new password");
        return;
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      if (wantsPasswordChange) {
        await changePassword(currentPassword, newPassword);
      }

      const saved = await saveUserIdentity(user.uid, {
        displayName: trimmed,
        avatarUrl: avatarUrl ?? undefined,
        email: getUserEmail(user),
      });

      dispatchProfileChange({
        displayName: saved.displayName,
        avatarUrl: saved.avatarUrl,
      });

      onSaved?.(saved.displayName ?? trimmed, saved.avatarUrl);
      onClose();
    } catch (saveError) {
      setError(formatProfileSaveError(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <ModalPortal>
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => {
            if (!saving) onClose();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            className="terminal-card modal-panel w-full max-w-md p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <p id="edit-profile-title" className="mono-label">
              Edit profile
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">Your identity</h2>

            <div className="mt-6 flex flex-col items-center gap-3">
              <UserAvatar
                name={displayName}
                avatarUrl={avatarUrl}
                onClick={() => fileInputRef.current?.click()}
              />
              <button
                type="button"
                className="font-mono text-xs uppercase tracking-wider text-lp-subtle hover:text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                Change photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="mt-6">
              <label htmlFor="display-name" className="profile-field-label mb-2 block">
                Display name
              </label>
              <input
                id="display-name"
                className="input-field"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
              />
            </div>

            {user && userHasPasswordProvider(user) && (
              <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                <div>
                  <p className="profile-section-title">Change password</p>
                  <p className="mt-1 text-xs text-lp-muted">Leave blank to keep your current password.</p>
                </div>
                <div>
                  <label htmlFor="current-password" className="profile-field-label mb-2 block">
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    className="input-field"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="profile-field-label mb-2 block">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    className="input-field"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="profile-field-label mb-2 block">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className="input-field"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
            )}

            {error && <p className="mt-4 font-mono text-xs text-red-400">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          open={cropOpen}
          saving={false}
          onCancel={() => {
            if (!saving) {
              setCropOpen(false);
              setCropSrc(null);
            }
          }}
          onSave={handleCropSave}
        />
      )}
    </>
  );
}

function formatProfileSaveError(error: unknown): string {
  if (!(error instanceof Error)) return "Failed to save profile";

  const code = "code" in error ? String((error as { code?: string }).code) : "";

  if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Current password is incorrect.";
  }
  if (code === "auth/weak-password") {
    return "New password must be at least 6 characters.";
  }
  if (code === "auth/requires-recent-login") {
    return "For security, sign out and sign in again before changing your password.";
  }

  return error.message || "Failed to save profile";
}
