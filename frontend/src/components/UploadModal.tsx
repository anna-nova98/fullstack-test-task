"use client";

import { FormEvent, useState } from "react";
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

  function handleHide() {
    setTitle("");
    setFile(null);
    setError(null);
    onHide();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Произошла ошибка");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal show={show} onHide={handleHide} centered>
      <form onSubmit={handleSubmit}>
        <div className="modal-header">
          <span className="modal-title">Добавить файл</span>
          <button type="button" onClick={handleHide} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
        </div>
        <div className="modal-body">
          {error && (
            <div className="pill pill-danger" style={{ marginBottom: 16, borderRadius: 8, padding: "10px 14px", fontSize: ".85rem", display: "block" }}>
              {error}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: ".875rem", fontWeight: 500, marginBottom: 6 }}>Название</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, Договор с подрядчиком"
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: ".875rem", fontWeight: 500, marginBottom: 6 }}>Файл</label>
            <input
              className="form-control"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ width: "100%" }}
            />
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: "flex-end", gap: 10 }}>
          <button type="button" className="btn-modal-cancel" onClick={handleHide}>Отмена</button>
          <button type="submit" className="btn-modal-submit" disabled={isSubmitting}>
            {isSubmitting ? "Загрузка..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
