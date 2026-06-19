"use client";

import { ModalPortal } from "@/components/ModalPortal";
import { getCroppedAvatarDataUrl } from "@/lib/users/cropImage";
import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type AvatarCropModalProps = {
  imageSrc: string;
  open: boolean;
  saving?: boolean;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
};

export function AvatarCropModal({ imageSrc, open, saving, onCancel, onSave }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const busy = saving || processing;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, busy, onCancel]);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const dataUrl = await getCroppedAvatarDataUrl(imageSrc, croppedAreaPixels);
      onSave(dataUrl);
    } finally {
      setProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, onSave]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div
        className="modal-overlay z-[80]"
        role="presentation"
        onClick={() => {
          if (!busy) onCancel();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="crop-avatar-title"
          className="terminal-card modal-panel w-full max-w-md p-5"
          onClick={(event) => event.stopPropagation()}
        >
          <p id="crop-avatar-title" className="mono-label">
            Crop avatar
          </p>
          <p className="mt-2 text-xs text-lp-muted">Drag to reposition. Use the slider to zoom.</p>

          <div className="relative mt-4 h-[300px] w-full overflow-hidden bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>

          <label className="mt-4 block font-mono text-[11px] uppercase tracking-wider text-lp-subtle">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full accent-white"
            />
          </label>

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={busy || !croppedAreaPixels}>
              {busy ? "Processing…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
