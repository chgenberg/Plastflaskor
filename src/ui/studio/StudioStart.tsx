"use client";

import type { StudioDraft } from "./engine/types";

export function StudioStart({
  draft,
  onDropLabel,
  onLogo,
  onContinue,
}: {
  draft: StudioDraft | null;
  onDropLabel: (file: File) => void;
  onLogo: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="av-studio-start">
      <div className="av-studio-start-card">
        <h1>Designa etiketten</h1>
        <p>Släpp en fil eller börja med logotypen. Du ser den på arket direkt.</p>
        <div className="av-studio-start-actions">
          <label
            className="av-studio-start-drop"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) onDropLabel(file);
            }}
          >
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp,.pdf,.ai"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onDropLabel(file);
              }}
            />
            <span>Släpp färdig etikett</span>
            <span className="text-[var(--av-text-muted)]">PNG, JPG, SVG, PDF</span>
          </label>
          <button type="button" onClick={onLogo}>
            <span>Bara logotyp</span>
            <span className="text-[var(--av-text-muted)]">Placera på arket</span>
          </button>
          {draft ? (
            <button type="button" onClick={onContinue}>
              <span>Fortsätt utkast</span>
              <span className="text-[var(--av-text-muted)]">{draft.projectName}</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
