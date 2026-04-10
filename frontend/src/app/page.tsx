"use client";

import { useEffect, useState } from "react";
import { useFiles } from "@/hooks/useFiles";
import { useAlerts } from "@/hooks/useAlerts";
import { FilesTable } from "@/components/FilesTable";
import { AlertsTable } from "@/components/AlertsTable";
import { UploadModal } from "@/components/UploadModal";

export default function Page() {
  const files = useFiles();
  const alerts = useAlerts();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    void files.load(0);
    void alerts.load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const globalError = files.error ?? alerts.error;

  function handleUploaded() {
    void files.load(0);
    void alerts.load(0);
  }

  return (
    <div className="page-wrap">

      {/* ── Header ── */}
      <div className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1>Управление файлами</h1>
            <p>Загрузка, сканирование и мониторинг файлов в реальном времени</p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={() => { void files.load(); void alerts.load(); }}>
              ↻ Обновить
            </button>
            <button className="btn-upload" onClick={() => setShowModal(true)}>
              + Загрузить файл
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon stat-icon-files">📁</div>
          <div>
            <div className="stat-value">{files.data?.total ?? "—"}</div>
            <div className="stat-label">Файлов загружено</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon-alerts">🔔</div>
          <div>
            <div className="stat-value">{alerts.data?.total ?? "—"}</div>
            <div className="stat-label">Алертов создано</div>
          </div>
        </div>
      </div>

      {globalError && (
        <div className="error-banner">⚠ {globalError}</div>
      )}

      {/* ── Files ── */}
      <div className="app-card">
        <div className="app-card-header">
          <h2>📁 Файлы</h2>
          <span className="count-badge">{files.data?.total ?? 0} записей</span>
        </div>
        <FilesTable
          data={files.data}
          isLoading={files.isLoading}
          page={files.page}
          pageSize={files.pageSize}
          onPageChange={(p) => void files.load(p)}
        />
      </div>

      {/* ── Alerts ── */}
      <div className="app-card">
        <div className="app-card-header">
          <h2>🔔 Алерты</h2>
          <span className="count-badge">{alerts.data?.total ?? 0} записей</span>
        </div>
        <AlertsTable
          data={alerts.data}
          isLoading={alerts.isLoading}
          page={alerts.page}
          pageSize={alerts.pageSize}
          onPageChange={(p) => void alerts.load(p)}
        />
      </div>

      <UploadModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onUploaded={handleUploaded}
      />
    </div>
  );
}
