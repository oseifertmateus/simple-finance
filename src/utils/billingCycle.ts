/**
 * Retorna as datas de início e fim do ciclo de fatura ATUAL (em que estamos gastando).
 * Ciclo: do dia (closing_day + 1) do mês passado até closing_day do mês atual.
 * Se já passamos do dia de fechamento neste mês, retorna o PRÓXIMO ciclo (atual).
 */
export function getBillingCycleDates(closingDay: number): { start: string; end: string } {
  const now = new Date();
  const dayOfMonth = now.getDate();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  // Se hoje já passou do closing_day, estamos no PRÓXIMO ciclo (ex: dia 26, closing 10 → ciclo Feb 11 - Mar 10)
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const effectiveClosing = Math.min(closingDay, daysInCurrentMonth);

  if (dayOfMonth > effectiveClosing) {
    // Estamos no próximo ciclo: start = (closing+1) deste mês, end = closing do próximo mês
    const startDate = new Date(year, month, effectiveClosing + 1);
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const endDate = new Date(nextYear, nextMonth, Math.min(closingDay, daysInNextMonth));
    return {
      start: formatDateYYYYMMDD(startDate),
      end: formatDateYYYYMMDD(endDate),
    };
  }

  // Ciclo atual: start = closing+1 do mês passado, end = closing deste mês
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
  const prevClosingDay = Math.min(closingDay, daysInPrevMonth);
  const startDay = prevClosingDay + 1;

  let startDate: Date;
  if (startDay > daysInPrevMonth) {
    startDate = new Date(year, month, 1);
  } else {
    startDate = new Date(prevYear, prevMonth, startDay);
  }

  const endDate = new Date(year, month, Math.min(closingDay, daysInCurrentMonth));

  return {
    start: formatDateYYYYMMDD(startDate),
    end: formatDateYYYYMMDD(endDate),
  };
}

function formatDateYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
