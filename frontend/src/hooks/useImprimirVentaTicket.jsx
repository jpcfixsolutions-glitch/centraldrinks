import { useRef, useEffect, useState } from 'react';
import { TicketCobro, imprimirTicket } from '../components/TicketCobro.jsx';
import { ventaATicketProps } from '../lib/ticket.js';

export function useImprimirVentaTicket(metodosPago) {
  const ticketRef = useRef(null);
  const [ventaImprimiendo, setVentaImprimiendo] = useState(null);

  useEffect(() => {
    if (ventaImprimiendo && ticketRef.current) {
      imprimirTicket(ticketRef.current);
      setVentaImprimiendo(null);
    }
  }, [ventaImprimiendo]);

  const imprimirVenta = (venta) => setVentaImprimiendo(venta);

  const TicketOculto = () =>
    ventaImprimiendo ? (
      <div className="hidden" aria-hidden="true">
        <div ref={ticketRef}>
          <TicketCobro {...ventaATicketProps(ventaImprimiendo)} metodosPago={metodosPago} />
        </div>
      </div>
    ) : null;

  return { imprimirVenta, TicketOculto };
}
