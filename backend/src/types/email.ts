// RODZAJ MAILA WYSYLANEGO PO ZMIANIE STATUSU WNIOSKU ADOPCYJNEGO
export type AdoptionStatusEmailKind =
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'cancelled_after_meeting'
  | 'cancelled_other_accepted'
  | 'expired_no_visit';
