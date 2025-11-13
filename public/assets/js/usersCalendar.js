// Variables globales
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let events = [];

// Elementos del DOM
const calendarGrid = document.getElementById('calendar-grid');
const currentMonthDisplay = document.getElementById('current-month-display');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const loadingIndicator = document.getElementById('loading-indicator');

// Constantes
const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const weekDaysShort = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Función para mostrar/ocultar loading
function showLoading(show) {
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? 'block' : 'none';
  }
}

// Función para obtener estilos según el lugar
function getLugarStyle(lugar) {
  const styles = {
    'Cruceros': { backgroundColor: '#1976d2', borderLeftColor: '#0d47a1' },
    'Cruceros Nocturno': { backgroundColor: '#3949ab', borderLeftColor: '#1a237e' },
    'Casa Malbec': { backgroundColor: '#7b1fa2', borderLeftColor: '#4a148c' },
    'Meliá': { backgroundColor: '#00897b', borderLeftColor: '#004d40' },
    'Clases': { backgroundColor: '#43a047', borderLeftColor: '#1b5e20' }
  };
  return styles[lugar] || { backgroundColor: '#666', borderLeftColor: '#333' };
}

// Función para cargar eventos - SIN BASE_URL (usando ruta relativa)
async function loadEvents() {
  showLoading(true);
  try {
    // La ruta es relativa a la página que carga este script.
    // Si tu página está en /undertango/ y la api en /undertango/api/, la ruta es 'api/...'
    const url = `api/getEvents.php?year=${currentYear}&month=${currentMonth + 1}`;
    console.log("Cargando eventos desde (ruta relativa):", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      // Si recibes un 404 aquí, la ruta relativa 'api/getEvents.php' es incorrecta.
      // Podrías necesitar '../api/getEvents.php' si el calendario está en una subcarpeta.
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error("El servidor respondió con success: false. Revisa el debug en la respuesta.");
    }
    
    // El resto de tu código es correcto. Se deja igual.
    events = data.events.map((record) => ({
      id: record.id,
      ...record.fields,
      fecha: record.fields.fecha.trim(),
    }));
    
    console.log("Eventos procesados:", events);
    renderCalendar();
  } catch (error) {
    console.error("Error loading events:", error);
    calendarGrid.innerHTML = `<div class="loading">Error al cargar eventos: ${error.message}</div>`;
  } finally {
    showLoading(false);
  }
}

// Función para renderizar el calendario
function renderCalendar() {
  calendarGrid.innerHTML = "";
  
  // Actualizar título del mes
  currentMonthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
  
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // Calcular día de inicio (lunes = 0)
  let startingDay = firstDay.getDay() - 1;
  if (startingDay === -1) startingDay = 6;
  
  // Agregar días vacíos al inicio
  for (let i = 0; i < startingDay; i++) {
    const emptyDay = document.createElement("div");
    emptyDay.className = "day empty";
    calendarGrid.appendChild(emptyDay);
  }
  
  // Agregar días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = events.filter((event) => event.fecha === dateStr);
    
    console.log(`Buscando eventos para ${dateStr}:`, dayEvents);
    
    const dayElement = document.createElement("div");
    dayElement.className = `day ${dayEvents.length > 0 ? "has-events" : ""}`;
    
    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const dayWeekLabel = document.createElement("div");
    dayWeekLabel.className = "day-week-label";
    dayWeekLabel.textContent = weekDaysShort[adjustedDayOfWeek];
    dayElement.appendChild(dayWeekLabel);
    
    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // Agregar eventos del día
    dayEvents.forEach((event) => {
      const eventElement = document.createElement("div");
      eventElement.className = "event";
      
      const style = getLugarStyle(event.lugar);
      Object.assign(eventElement.style, {
        ...style,
        marginTop: "4px",
        padding: "4px",
        borderLeft: `4px solid ${style.borderLeftColor}`,
        borderRadius: "4px",
        color: "#fff",
        fontSize: "0.75rem",
      });
      
      if (event.nombre) {
        const eventTitle = document.createElement("div");
        eventTitle.className = "event-title";
        eventTitle.textContent = event.nombre;
        eventElement.appendChild(eventTitle);
      }
      
      if (event.hora) {
        const eventTime = document.createElement("div");
        eventTime.className = "event-time";
        eventTime.innerHTML = `<i class="fas fa-clock icon"></i> ${event.hora}`;
        eventElement.appendChild(eventTime);
      }
      
      if (event.lugar) {
        const eventLocation = document.createElement("div");
        eventLocation.className = "event-location";
        eventLocation.innerHTML = `<i class="fas fa-map-marker-alt icon"></i> ${event.lugar}`;
        eventElement.appendChild(eventLocation);
      }
      
      dayElement.appendChild(eventElement);
    });
    
    calendarGrid.appendChild(dayElement);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Cargar eventos inicial
  loadEvents();
  
  // Navegación de meses
  prevMonthBtn.addEventListener('click', function() {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    loadEvents();
  });
  
  nextMonthBtn.addEventListener('click', function() {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    loadEvents();
  });
});