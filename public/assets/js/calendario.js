let editMode = true;
const weekMap = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

let currentYear = 2025;
let currentMonth = new Date().getMonth();
let optionCache = { lugares: [], interpretes: [] };

// --- FUNCIÓN CENTRAL PARA COMUNICACIÓN CON EL BACKEND ---
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `../api/${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      let errorMessage = `Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) { /* No hacer nada si no hay JSON */ }
      throw new Error(errorMessage);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error en apiRequest a '${url}':`, error);
    alert(error.message);
    throw error;
  }
}

// --- GENERACIÓN DEL CALENDARIO (SIN CAMBIOS) ---
function createCalendarDays(calendarGrid, year, month) {
  calendarGrid.innerHTML = "";
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startingDay = firstDay.getDay();
  startingDay = (startingDay === 0) ? 6 : startingDay - 1;

  for (let i = 0; i < startingDay; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "day empty";
    calendarGrid.appendChild(emptyDay);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dayElement = document.createElement("div");
    dayElement.className = "day";
    dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dayOfWeek = new Date(year, month, day).getDay();
    const dayName = weekMap[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

    const dayWeekLabel = document.createElement("div");
    dayWeekLabel.className = "day-week-label";
    dayWeekLabel.textContent = dayName;

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = day;

    const addEventBlock = document.createElement("div");
    addEventBlock.className = "event add-event";
    addEventBlock.textContent = "+ Agregar Evento";
    addEventBlock.addEventListener("click", () => promptNewEvent(dayElement));

    dayElement.appendChild(dayWeekLabel);
    dayElement.appendChild(dayNumber);
    dayElement.appendChild(addEventBlock);
    calendarGrid.appendChild(dayElement);
  }
}

// --- CONTROL DEL CALENDARIO ---
function setMonth(monthIndex) {
  currentMonth = monthIndex;
  const calendarGrid = document.getElementById("calendar-grid");
  const monthTitle = document.getElementById("month-title");
  
  monthTitle.textContent = `${monthNames[monthIndex]} ${currentYear}`;
  createCalendarDays(calendarGrid, currentYear, monthIndex);
  loadEvents(currentYear, monthIndex);
}

async function loadEvents(year, month) {
  try {
    const data = await apiRequest(`getEvents.php?year=${year}&month=${month + 1}`);
    if (data.success) {
      displayEvents(data.events);
    } else {
      console.error("Error devuelto por la API:", data.message);
      alert(`Error al cargar eventos: ${data.message}`);
    }
  } catch (error) { /* El error ya se maneja en apiRequest */ }
}

/**
 * Muestra los eventos en el calendario, adaptado al nuevo diseño "Noche de Milonga".
 * @param {Array} events - La lista de eventos a mostrar.
 */
function displayEvents(events) {
  // Limpiamos solo los eventos anteriores para no reconstruir toda la rejilla
  document.querySelectorAll('.day .event:not(.add-event)').forEach(el => el.remove());

  events.forEach((record) => {
    const { id, fields } = record;
    const { fecha, hora, lugar, interprete } = fields;

    if (!fecha) return;
    const dayElement = document.querySelector(`.day[data-date="${fecha}"]`);
    if (!dayElement) return;

    // --- Estructura HTML del Evento (MODIFICADA) ---
    const eventElement = document.createElement("div");
    eventElement.className = "event";
    eventElement.dataset.eventId = id;

    // Contenedor para la información del evento
    const infoContainer = document.createElement('div');
    infoContainer.className = 'event-info';
    infoContainer.innerHTML = `
      <div class="lugar">${lugar || 'Sin lugar'}</div>
      <div class="hora">${hora || ''}</div>
      <div class="interprete">${interprete || 'Sin intérprete'}</div>
    `;

    // Contenedor para los botones de acción
    const actionContainer = document.createElement('div');
    actionContainer.className = 'event-actions';

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-event";
    deleteButton.innerHTML = "❌";
    deleteButton.onclick = async (e) => {
        e.stopPropagation();
        if (confirm("¿Estás seguro de que deseas eliminar este evento?")) {
            await deleteEvent(id);
            eventElement.remove();
        }
    };

    const editButton = document.createElement("button");
    editButton.className = "edit-event";
    editButton.innerHTML = "✏️";
    editButton.onclick = (e) => {
        e.stopPropagation();
        const interpreteArray = typeof interprete === 'string' ? interprete.split(',').map(i => i.trim()) : [];
        editEvent(id, { fecha, hora, lugar, interprete: interpreteArray });
    };

    // Los botones ahora se manejan mejor con CSS, no es necesario cambiar el 'display' aquí
    
    // Añadimos los elementos al contenedor del evento
    eventElement.appendChild(infoContainer);
    // Añadimos los botones directamente al elemento del evento para posicionarlos con CSS
    eventElement.appendChild(editButton);
    eventElement.appendChild(deleteButton);

    // Aplicar estilos dinámicos (como el color del borde)
    aplicarEstilos(eventElement, lugar);

    const addBlock = dayElement.querySelector(".add-event");
    if (addBlock) {
      dayElement.insertBefore(eventElement, addBlock);
    } else {
      dayElement.appendChild(eventElement);
    }
  });
}

function aplicarEstilos(eventElement, lugar) {
  const lugarTexto = lugar?.trim().toLowerCase() || '';
  let borderColor = 'var(--accent-gold)'; // Color dorado por defecto

  switch (lugarTexto) {
    case 'cruceros': borderColor = '#3498db'; break;
    case 'casa malbec': borderColor = '#9b59b6'; break;
    case 'meliá': borderColor = '#f1c40f'; break;
    case 'ensayo': case 'clases': borderColor = '#2ecc71'; break;
    case 'cruceros nocturno': borderColor = '#34495e'; break;
    default: borderColor = 'var(--accent-gold)';
  }
  
  eventElement.style.borderLeftColor = borderColor;
}

/**
 * Aplica estilos dinámicos a un elemento de evento.
 * @param {HTMLElement} eventElement - El elemento del evento en el DOM.
 * @param {string} lugar - El nombre del lugar para decidir el color.
 */
function aplicarEstilos(eventElement, lugar) {
  const lugarTexto = lugar?.trim().toLowerCase() || '';
  let borderColor = 'var(--accent-gold)'; // Color dorado por defecto

  switch (lugarTexto) {
    case 'cruceros': borderColor = '#3498db'; break;
    case 'casa malbec': borderColor = '#9b59b6'; break;
    case 'meliá': borderColor = '#f1c40f'; break;
    case 'ensayo':
    case 'clases': borderColor = '#2ecc71'; break;
    case 'cruceros nocturno': borderColor = '#34495e'; break;
    default: borderColor = 'var(--accent-gold)';
  }
  
  eventElement.style.borderLeftColor = borderColor;
}


// --- FUNCIONES DE API (sin cambios) ---
async function saveEvent(eventData) {
  return await apiRequest('saveEvent.php', 'POST', eventData);
}

async function deleteEvent(eventId) {
  return await apiRequest('deleteEvent.php', 'POST', { id: eventId });
}

async function getOptions() {
  if (optionCache.lugares.length === 0 || optionCache.interpretes.length === 0) {
    const response = await apiRequest('getOptions.php');
    if (response.success) {
      optionCache = response.data;
    }
  }
  return optionCache;
}


// --- MODAL Y LÓGICA DE EDICIÓN (sin cambios) ---
async function openEventModal(config) {
  const { title, eventData, onSave } = config;
  
  const { lugares, interpretes } = await getOptions();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal-content";

  modal.innerHTML = `
      <h3>${title}</h3>
      <label for="lugar-select">Lugar:</label>
      <select id="lugar-select" size="5"></select>
      <label for="interprete-select">Intérprete(s):</label>
      <select id="interprete-select" multiple size="5"></select>
      <div class="modal-buttons">
          <button id="guardar-btn">Guardar</button>
          <button id="cancelar-btn">Cancelar</button>
      </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const { container: horaContainer, getHoraFinal } = crearBotonesHora(eventData.hora);
  const lugarLabel = modal.querySelector('label[for="lugar-select"]');
  modal.insertBefore(horaContainer, lugarLabel);

  const lugarSelect = modal.querySelector("#lugar-select");
  const interpreteSelect = modal.querySelector("#interprete-select");

  lugares.forEach(l => {
    const option = new Option(l, l);
    if (l === eventData.lugar) option.selected = true;
    lugarSelect.appendChild(option);
  });

  interpretes.forEach(i => {
    const option = new Option(i, i);
    if (eventData.interprete && eventData.interprete.includes(i)) option.selected = true;
    interpreteSelect.appendChild(option);
  });

  modal.querySelector("#guardar-btn").onclick = async () => {
    const lugarValue = lugarSelect.value;
    const interpretesSeleccionados = Array.from(interpreteSelect.selectedOptions).map(opt => opt.value);

    if (!lugarValue || interpretesSeleccionados.length === 0) {
      alert("Debe seleccionar un lugar y al menos un intérprete.");
      return;
    }

    const finalEventData = {
      ...eventData,
      hora: getHoraFinal(),
      lugar: lugarValue,
      interprete: interpretesSeleccionados,
    };
    
    try {
      await onSave(finalEventData);
      document.body.removeChild(overlay);
      await setMonth(currentMonth); // Recargar calendario
    } catch (error) {
       // El error ya se muestra en apiRequest
    }
  };

  modal.querySelector("#cancelar-btn").onclick = () => {
    document.body.removeChild(overlay);
  };
}

async function promptNewEvent(dayElement) {
    const fecha = dayElement.dataset.date;
    await openEventModal({
        title: 'Nuevo Evento',
        eventData: { fecha, hora: '08:00', lugar: '', interprete: [] },
        onSave: (data) => saveEvent(data)
    });
}

async function editEvent(recordId, currentData) {
    await openEventModal({
        title: 'Editar Evento',
        eventData: { id: recordId, ...currentData },
        onSave: (data) => saveEvent(data)
    });
}


// --- BOTONES DE HORA (sin cambios, pero se beneficiará del nuevo CSS en el modal) ---
function crearBotonesHora(horaInicial = "08:00") {
  const container = document.createElement("div");

  const title = document.createElement("h4");
  title.textContent = "Seleccionar Hora:";
  // Estilos en línea se pueden quitar si se definen en el CSS principal del modal
  title.style.margin = "4px 0";
  title.style.color = "#fff"; 
  container.appendChild(title);

  const horasDiv = document.createElement("div");
  horasDiv.style.display = "flex";
  horasDiv.style.flexWrap = "wrap";
  horasDiv.style.gap = "4px";

  const [horaInicialStr, minInicialStr] = horaInicial.split(":");
  let horaSeleccionada = horaInicialStr || "08";
  let minSeleccionado = minInicialStr || "00";

  for (let h = 8; h <= 23; h++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = h.toString().padStart(2, "0");
    btn.className = 'time-btn';
    if (h.toString().padStart(2, "0") === horaSeleccionada) {
      btn.classList.add('active');
    }
    btn.addEventListener("click", () => {
      horaSeleccionada = h.toString().padStart(2, "0");
      actualizarEstilosBotones(horasDiv, btn);
    });
    horasDiv.appendChild(btn);
  }
  container.appendChild(horasDiv);

  const minsDiv = document.createElement("div");
  minsDiv.style.display = "flex";
  minsDiv.style.flexWrap = "wrap";
  minsDiv.style.gap = "4px";
  minsDiv.style.marginTop = "8px";

  const minutosPosibles = ["00", "15", "30", "45"];
  minutosPosibles.forEach((m) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = m;
    btn.className = 'time-btn';
    if (m === minSeleccionado) {
      btn.classList.add('active');
    }
    btn.addEventListener("click", () => {
      minSeleccionado = m;
      actualizarEstilosBotones(minsDiv, btn);
    });
    minsDiv.appendChild(btn);
  });
  container.appendChild(minsDiv);

  function actualizarEstilosBotones(containerDiv, activoBtn) {
    containerDiv.querySelectorAll("button").forEach(b => b.classList.remove('active'));
    activoBtn.classList.add('active');
  }

  function getHoraFinal() {
    return `${horaSeleccionada}:${minSeleccionado}`;
  }

  return { container, getHoraFinal };
}


// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  const monthsList = document.getElementById("months-list");

  monthsList.addEventListener("click", (e) => {
    if (e.target.tagName === 'LI') {
      monthsList.querySelector('.active')?.classList.remove('active');
      e.target.classList.add('active');
      const monthIndex = parseInt(e.target.dataset.month, 10);
      setMonth(monthIndex);
    }
  });

  const currentDate = new Date();
  currentMonth = currentDate.getMonth(); 
  
  const activeMonthElement = document.querySelector(`#months-list li[data-month='${currentMonth}']`);
  if (activeMonthElement) {
    activeMonthElement.classList.add("active");
  }
  
  setMonth(currentMonth);
});