INSERT IGNORE INTO professors (id, first_name, last_name, email) VALUES
  ('f71e63a3-f5b8-4d20-99f8-4efbb6148011', 'Laura', 'Medina', 'laura.medina@aisapereaude.com'),
  ('12ba569f-8d5c-452c-a2fe-75f10631bbab', 'Daniel', 'Ramos', 'daniel.ramos@aisapereaude.com'),
  ('77880cc8-e82e-4a5c-9f3e-83352ab68c4c', 'Marta', 'Santos', 'marta.santos@aisapereaude.com');

INSERT IGNORE INTO companies (id, name, website) VALUES
  ('d6df2312-b286-4729-9b5f-0b0edfe61e5c', 'Northwind Iberia', 'https://northwind.example');

INSERT IGNORE INTO proposals (id, company_id, title, consultation_type, presentation_url, current_status, total_cost, currency, start_date, end_date) VALUES
  ('a2b9a94a-7996-41d0-875d-5faab1e558fa', 'd6df2312-b286-4729-9b5f-0b0edfe61e5c', 'Programa ejecutivo IA generativa', 'Formacion', 'https://docs.example.com/presentacion-ai', 'PENDING', 12500.00, 'EUR', '2026-06-10', '2026-06-12');

INSERT IGNORE INTO budget_versions (id, proposal_id, version_number, total_cost, currency, reason, created_by) VALUES
  ('9d9fb49c-4d08-4fd0-99fd-73dc6cd6567b', 'a2b9a94a-7996-41d0-875d-5faab1e558fa', 1, 12500.00, 'EUR', 'Alta inicial', 'AI Sapere Aude');

INSERT IGNORE INTO budget_items (id, budget_version_id, service_name, description, quantity, persons, unit_price, subtotal) VALUES
  ('f9d6ffcf-0ad7-4e8b-beb4-eec0f996b38f', '9d9fb49c-4d08-4fd0-99fd-73dc6cd6567b', 'Diagnostico de madurez IA', 'Sesiones de descubrimiento y mapa de oportunidades.', 1, 1, 3500.00, 3500.00),
  ('b3ea698a-4e36-4b05-86b8-d9165dcac795', '9d9fb49c-4d08-4fd0-99fd-73dc6cd6567b', 'Talleres ejecutivos', 'Tres jornadas presenciales con materiales.', 3, 1, 3000.00, 9000.00);

INSERT IGNORE INTO proposal_professor_assignments (id, proposal_id, professor_id, class_title, professor_name, session_date, start_time, end_time, hours, class_status, notes) VALUES
  ('2a1a56ff-5278-401d-8efb-ef20b0c1d24f', 'a2b9a94a-7996-41d0-875d-5faab1e558fa', 'f71e63a3-f5b8-4d20-99f8-4efbb6148011', 'Kickoff y estrategia IA', 'Laura Medina', '2026-06-10', '09:00:00', '15:00:00', 6.00, 'PRESENTATION_OK', 'Kickoff y estrategia'),
  ('50c191dd-cbce-4471-bcc6-e0ed157e3f42', 'a2b9a94a-7996-41d0-875d-5faab1e558fa', '12ba569f-8d5c-452c-a2fe-75f10631bbab', 'Casos de uso y automatizacion', 'Daniel Ramos', '2026-06-11', '09:00:00', '15:00:00', 6.00, 'PENDING_PRESENTATION_REVIEW', 'Casos de uso y automatizacion'),
  ('31cf364a-9c78-450c-a85d-33a0cd5091e0', 'a2b9a94a-7996-41d0-875d-5faab1e558fa', '77880cc8-e82e-4a5c-9f3e-83352ab68c4c', 'Gobierno y adopcion', 'Marta Santos', '2026-06-12', '09:00:00', '14:00:00', 5.00, 'PENDING_CONFIRMATION', 'Gobierno y adopcion');

INSERT IGNORE INTO proposal_status_history (id, proposal_id, from_status, to_status, note, changed_by) VALUES
  ('9b1d7174-1003-42ef-bcd0-b5f7dd780070', 'a2b9a94a-7996-41d0-875d-5faab1e558fa', NULL, 'PENDING', 'Oferta cargada para aprobacion.', 'Sergio Boluda Fernandes');

INSERT IGNORE INTO proposal_comments (id, proposal_id, author_name, category, body) VALUES
  ('d44fa154-e0e4-469e-a356-b2899e3f6212', 'a2b9a94a-7996-41d0-875d-5faab1e558fa', 'Sergio Boluda Fernandes', 'BUDGET', 'Revisar si se agrupa el diagnostico con los talleres para facilitar aprobacion interna.');
