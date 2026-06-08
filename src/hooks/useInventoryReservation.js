// src/hooks/useInventoryReservation.js
// Creates an inventory reservation on checkout mount; manages countdown;
// releases all reservation IDs on unmount unless markPaid() was called.
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
 *   reservationIds: number[],
 *   secondsLeft:    number|null,
 *   expired:        boolean,
 *   reserving:      boolean,
 *   error:          string|null,
 *   is409:          boolean,
 *   markPaid:       () => void
 * }}
 */
export function useInventoryReservation(cartItems) {
  const [reservationIds, setReservationIds] = useState([]);
  const [expiresAt,      setExpiresAt]      = useState(null);
  const [secondsLeft,    setSecondsLeft]    = useState(null);
  const [expired,        setExpired]        = useState(false);
  const [reserving,      setReserving]      = useState(false);
  const [error,          setError]          = useState(null);
  const [is409,          setIs409]          = useState(false);

  // Refs survive re-renders and are readable in cleanup closures
  const paidRef = useRef(false);
  const idsRef  = useRef([]);

  const markPaid = useCallback(() => { paidRef.current = true; }, []);

  // ── Create reservation on mount ───────────────────────────────────────────
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
        // Backend returns { data: { reservationIds: number[], expiresAt: string } }
        const ids = data?.data?.reservationIds ?? [];
        const exp = data?.data?.expiresAt ? new Date(data.data.expiresAt) : null;
        if (ids.length) { setReservationIds(ids); idsRef.current = ids; }
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
        // For 404/network/other: fail silently — checkout still works without reservation
      })
      .finally(() => { if (alive) setReserving(false); });

    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentionally runs once

  // ── Countdown ticker ──────────────────────────────────────────────────────
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

  // ── Release ALL reservation IDs on unmount (if not yet paid) ─────────────
  useEffect(() => {
    return () => {
      if (!paidRef.current && idsRef.current.length) {
        idsRef.current.forEach(id => {
          api.delete(`/inventory/reservations/${id}`).catch(() => {});
        });
      }
    };
  }, []);

  return { reservationIds, reservationId: reservationIds[0] ?? null, secondsLeft, expired, reserving, error, is409, markPaid };
}
