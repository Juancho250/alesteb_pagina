import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Esto "obliga" al navegador a ir a la coordenada 0,0 (arriba a la izquierda)
    window.scrollTo(0, 0);
  }, [pathname]); // Se ejecuta cada vez que la ruta (URL) cambia

  return null;
}