"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row } from "react-bootstrap";
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
    <Container fluid className="py-4 px-4 bg-light min-vh-100">
      <Row className="justify-content-center">
        <Col xxl={10} xl={11}>

          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                <div>
                  <h1 className="h3 mb-2">Управление файлами</h1>
                  <p className="text-secondary mb-0">
                    Загрузка файлов, просмотр статусов обработки и ленты алертов.
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" onClick={() => { void files.load(); void alerts.load(); }}>
                    Обновить
                  </Button>
                  <Button variant="primary" onClick={() => setShowModal(true)}>
                    Добавить файл
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {globalError && (
            <Alert variant="danger" className="shadow-sm">{globalError}</Alert>
          )}

          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Файлы</h2>
                <Badge bg="secondary">{files.data?.total ?? 0}</Badge>
              </div>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <FilesTable
                data={files.data}
                isLoading={files.isLoading}
                page={files.page}
                pageSize={files.pageSize}
                onPageChange={(p) => void files.load(p)}
              />
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Header className="bg-white border-0 pt-4 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="h5 mb-0">Алерты</h2>
                <Badge bg="secondary">{alerts.data?.total ?? 0}</Badge>
              </div>
            </Card.Header>
            <Card.Body className="px-4 pb-4">
              <AlertsTable
                data={alerts.data}
                isLoading={alerts.isLoading}
                page={alerts.page}
                pageSize={alerts.pageSize}
                onPageChange={(p) => void alerts.load(p)}
              />
            </Card.Body>
          </Card>

        </Col>
      </Row>

      <UploadModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onUploaded={handleUploaded}
      />
    </Container>
  );
}
