"use client";

import { ReactNode } from "react";

interface AdminModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
}: AdminModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="admin-surface my-4 w-full max-w-2xl rounded-3xl">
          <div className="flex items-start justify-between gap-4 border-b border-[#efe6d8] px-4 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <h2 className="break-words font-poppins text-lg font-semibold text-slate-950 sm:text-xl">
                {title}
              </h2>
              {description ? (
                <p className="admin-muted mt-1 text-sm leading-6">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="admin-secondary rounded-full p-2 text-slate-500"
              aria-label="Cerrar"
            >
              x
            </button>
          </div>
          <div className="px-4 py-4 sm:px-6 sm:py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
