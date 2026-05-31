// src/hooks/useInventoryReservation.js
// Creates a single stock reservation when the checkout page mounts.
// Manages the countdown timer and releases the reservation on unmount
// (unless markPaid() was called, which marks the reservation as consumed).
import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";

function getSessionId() {
  let sid = sessionStorage.getItem("_alesteb_sid");
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("_alesteb_sid", sid);
  }
  return sid;
}

/**
 * @param {Array} cartItems  — cart array from CartContext
 * @returns {{
 *   reservationId: string|null,
 *   secondsLeft:   number|null,
 *   expired:       boolean,
 *   reserving:     boolean,
 *   error:         string|null,
 *   is409:         boolean,
 *   markPaid:      () => void
 * }}
 */
export function useInventoryReservation(cartItems) {
  const [reservationId, setReservationId] = useState(null);
  const [expiresAt,     setExpiresAt]     = useState(null);
  const [secondsLeft,   setSecondsLeft]   = useState(null);
  const [expired,       setExpired]       = useState(false);
  const [reserving,     setReserving]     = useState(false);
  const [error,         setError]         = useState(null);
  const [is409,         setIs409]         = useState(false);

  // Survives re-renders; read inside cleanup without stale-closure issues
  const paidRef = useRef(false);
  const idRef   = useRef(null);

  const markPaid = useCallback(() => { paidRef.current = true; }, []);

  // ── Create reservation on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!cartItems?.length) return;

    let alive = true;
    setReserving(true);

    api.post("/inventory/reservations", {
      sessionId: getSessionId(),
      items: cartItems.map(i => ({
        productId: i.id,
        variantId: i.variantId ?? null,
        quantity:  i.quantity || 1,
      })),
    })
      .then(({ data }) => {
        if (!alive) return;
        const id  = data?.data?.reservationId ?? null;
        const exp = data?.data?.expiresAt ? new Date(data.data.expiresAt) : null;
        if (id) { setReservationId(id); idRef.current = id; }
        if (exp) setExpiresAt(exp);
      })
      .catch(err => {
        if (!alive) return;
        if (err.response?.status === 409) {
          setIs409(true);
          setError(
            err.response?.data?.message ||
            "Uno o más productos ya no tienen stock suficiente."
          );
        }
        // 404 / network / other: fail silently — checkout proceeds without reservation
      })
      .finally(() => { if (alive) setReserving(false); });

    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1_000));
      setSecondsLeft(left);
      if (left <= 0) setExpired(true);
    };

    tick();
    const timer = setInterval(tick, 1_000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // ── Release on unmount (if not paid) ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (!paidRef.current && idRef.current) {
        api.delete(`/inventory/reservations/${idRef.current}`).catch(() => {});
      }
    };
  }, []);

  return { reservationId, secondsLeft, expired, reserving, error, is409, markPaid };
}
