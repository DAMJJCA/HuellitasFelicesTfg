import { Cita, EstadoCita } from '../service/cita';

export type FiltroFechaAgenda = 'todas' | 'hoy' | 'manana' | 'semana';

export function isoLocal(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

export function fechaHoraCita(cita: Pick<Cita, 'fecha' | 'hora'>): string {
  return `${cita.fecha}T${cita.hora || '00:00'}`;
}

export function normalizarEstadoCita(estado: string): EstadoCita {
  const normalizado = (estado || 'programada').trim().toLowerCase().replace(/[- ]/g, '_') as EstadoCita;
  const permitidos: EstadoCita[] = ['programada', 'confirmada', 'en_consulta', 'realizada', 'cancelada'];
  return permitidos.includes(normalizado) ? normalizado : 'programada';
}

export function coincideFiltroFecha(fecha: string, filtro: FiltroFechaAgenda): boolean {
  if (filtro === 'todas') return true;

  const hoy = new Date();
  const fechaObjetivo = new Date(`${fecha}T00:00:00`);
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  if (filtro === 'hoy') return isoLocal(fechaObjetivo) === isoLocal(inicioHoy);

  const manana = new Date(inicioHoy);
  manana.setDate(inicioHoy.getDate() + 1);
  if (filtro === 'manana') return isoLocal(fechaObjetivo) === isoLocal(manana);

  const finSemana = new Date(inicioHoy);
  finSemana.setDate(inicioHoy.getDate() + 7);
  return fechaObjetivo >= inicioHoy && fechaObjetivo <= finSemana;
}
