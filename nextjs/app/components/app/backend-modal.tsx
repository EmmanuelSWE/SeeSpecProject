"use client";

import type { ReactNode } from "react";

export function BackendModal({
    title,
    description,
    children,
    onClose
}: {
    title: string;
    description: string;
    children: ReactNode;
    onClose: () => void;
}) {
    return (
        <div className="backend-modal-layer" role="presentation">
            <button type="button" className="backend-modal-backdrop" aria-label="Close dialog" onClick={onClose} />
            <div className="backend-modal-card" role="dialog" aria-modal="true" aria-labelledby="backend-modal-title">
                <div className="backend-modal-header">
                    <div>
                        <span className="requirements-eyebrow">Workspace Form</span>
                        <h2 id="backend-modal-title">{title}</h2>
                        <p>{description}</p>
                    </div>
                    <button type="button" className="backend-modal-close" onClick={onClose} aria-label="Close dialog">
                        ×
                    </button>
                </div>
                <div className="backend-modal-body">{children}</div>
            </div>
        </div>
    );
}
