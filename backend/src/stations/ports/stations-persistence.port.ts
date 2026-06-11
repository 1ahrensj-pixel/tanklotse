/**
 * PR #24 §6.2 — Hexagonal-Pilot fuer `stations`.
 *
 * Port-Interface fuer die Persistenz-Schicht: alles, was `StationsService`
 * vom Datenbank-Layer verlangt, steht hier als abstrakte Methode. Die
 * konkrete Prisma-Implementierung sitzt im Adapter-Verzeichnis. So kann
 * die Service-Logik gegen ein In-Memory-Repo getestet werden, ohne
 * Prisma + Postgres hochzufahren.
 *
 * Wichtig: das Port-Interface kennt KEINE Prisma-Typen. Es nutzt nur
 * primitive Felder, damit der Service nicht implizit von Prisma abhaengt.
 */
export interface StationPersistenceRecord {
  id: string;
  name: string;
  brand: string;
  street: string;
  houseNumber: string | null;
  postCode: string;
  place: string;
  lat: number;
  lng: number;
}

export interface ComplaintPersistenceInput {
  userId: string | null;
  stationId: string;
  complaintType: 'WRONG_PRICE' | 'CLOSED' | 'WRONG_BRAND' | 'OTHER' | string;
  correction?: string;
  status: 'PENDING' | 'FORWARDED' | string;
  forwardedAt: Date | null;
}

export const STATIONS_PERSISTENCE_PORT = Symbol('STATIONS_PERSISTENCE_PORT');

export interface StationsPersistencePort {
  /** Liefert die Station mit der gegebenen ID oder `null`, wenn nicht in DB. */
  findStationById(id: string): Promise<StationPersistenceRecord | null>;

  /** Idempotent: legt eine Station an, wenn sie noch nicht existiert. */
  upsertStation(record: StationPersistenceRecord): Promise<void>;

  /** Schreibt eine neue Beschwerde. */
  createComplaint(input: ComplaintPersistenceInput): Promise<void>;
}
