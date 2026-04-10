"use client";

import { FormEvent, useState, useRef, DragEvent } from "react";
import { Modal } from "react-bootstrap";
import { uploadFile } from "@/api/files";

type Props = {
  show: boolean;
  onHide: () => void;
  onUploaded: () => void;
};

export function UploadModal({ show, onHide, onUploaded }: Props) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleHide() {
    setTitle("");
    setFile(null);
    setError(null);
    setDragging(false);
    onHide();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !file) {
      setError("Укажите название и выберите файл");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await uploadFile(title.trim(), file);
      handleHide();
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = title.trim().length > 0 && file !== null && !isSubmitting;

  return (
    <Modal show={show} onHide={handleHide} centered dialogClassName="upload-modal-dialog">
      <form onSubmit={handleSubmit}>

        {/* ── Gradient header ── */}
        <div className="um-header">
          <div className="um-header-icon">↑</div>
          <div>
            <div className="um-header-title">Загрузить файл</div>
            <div className="um-header-sub">Файл будет проверен на угрозы автоматически</div>
          </div>
          <button type="button" className="um-close" onClick={handleHide}>✕</button>
        </div>

        {/* ── Body ── */}
        <div className="um-body">

          {error && (
            <div className="um-error">
              <span>⚠</span> {error}
            </div>
          )}

          {/* Title field */}
          <div className="um-field">
            <label className="um-label">Название</label>
            <input
              className="um-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, Договор с подрядчиком"
              autoFocus
            />
          </div>

          {/* Drop zone */}
          <div className="um-field">
            <label className="um-label">Файл</label>
            <div
              className={`um-dropzone${dragging ? " um-dropzone--active" : ""}${file ? " um-dropzone--filled" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="um-file-info">
                  <span className="um-file-icon">{getFileIcon(file.type)}</span>
                  <div>
                    <div className="um-file-name">{file.name}</div>
                    <div className="um-file-size">{formatSize(file.size)}</div>
                  </div>
                  <button
                    type="button"
                    className="um-file-remove"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  >✕</button>
                </div>
              ) : (
                <div className="um-dropzone-hint">
                  <div className="um-dropzone-icon">☁</div>
                  <div className="um-dropzone-text">
                    Перетащите файл сюда или <span className="um-dropzone-link">выберите</span>
                  </div>
                  <div className="um-dropzone-sub">Любой формат, до 10 МБ</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="um-footer">
          <button type="button" className="um-btn-cancel" onClick={handleHide}>
            Отмена
          </button>
          <button type="submit" className="um-btn-submit" disabled={!canSubmit}>
            {isSubmitting ? (
              <span className="um-spinner" />
            ) : (
              <>↑ Загрузить</>
            )}
          </button>
        </div>

      </form>
    </Modal>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return "🖼";
  if (mime === "application/pdf") return "📄";
  if (mime.startsWith("text/")) return "📝";
  if (mime.includes("zip") || mime.includes("archive")) return "🗜";
  return "📎";
}
