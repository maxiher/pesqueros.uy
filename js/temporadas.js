const Temporadas = (() => {
  const zonaHoraria = 'America/Montevideo';
  const calendario = new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria, year: 'numeric', month: '2-digit', day: '2-digit'
  });

  function fechaUruguay(fecha = new Date()) {
    const partes = Object.fromEntries(calendario.formatToParts(fecha).map(p => [p.type, p.value]));
    return `${partes.year}-${partes.month}-${partes.day}`;
  }

  function estacion(fecha = new Date()) {
    const mes = Number(fechaUruguay(fecha).slice(5, 7));
    if (mes === 12 || mes <= 2) return 'Verano';
    if (mes <= 5) return 'Otoño';
    if (mes <= 8) return 'Invierno';
    return 'Primavera';
  }

  const valores = temporada => (Array.isArray(temporada) ? temporada : [temporada])
    .filter(valor => typeof valor === 'string').map(valor => valor.trim());

  function enTemporada(temporada, fecha = new Date()) {
    return valores(temporada).some(valor =>
      valor.toLocaleLowerCase('es') === 'todo el año' ||
      valor.toLocaleLowerCase('es') === estacion(fecha).toLocaleLowerCase('es'));
  }

  function texto(temporada) {
    return new Intl.ListFormat('es-UY', { type: 'conjunction' }).format(valores(temporada)) || 'Sin información';
  }

  return { zonaHoraria, fechaUruguay, estacion, enTemporada, texto };
})();
