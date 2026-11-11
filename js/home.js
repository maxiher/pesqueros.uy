// Fecha de Uruguay, independiente del huso horario del navegador.
document.getElementById("fecha").textContent = new Intl.DateTimeFormat('es-UY', {
  timeZone: Temporadas.zonaHoraria,
  weekday: 'long', day: 'numeric', month: 'long'
}).format(new Date());


// TEMPORAL
// Fase lunar aproximada; no determina el instante exacto de cada fase.
function getMoonPhase(date = new Date()) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();

  let c = 0;
  let e = 0;
  let jd = 0;
  let b = 0;

  if (month < 3) {
    year--;
    month += 12;
  }

  month++;

  c = 365.25 * year;
  e = 30.6 * month;
  jd = c + e + day - 694039.09; // referencia lunar
  jd = jd / 29.5305882; // ciclo lunar
  b = jd - Math.floor(jd); // parte fraccional

  let phase = Math.floor(b * 8 + 0.5);
  phase = phase % 8;

  return phase;
}

//Convertir numeros en iconos en Fase Lunar
function getMoonPhaseName(phase) {
  const phases = [
    "🌑 Luna nueva",
    "🌒 Creciente",
    "🌓 Cuarto creciente",
    "🌔 Gibosa creciente",
    "🌕 Luna llena",
    "🌖 Gibosa menguante",
    "🌗 Cuarto menguante",
    "🌘 Menguante"
  ];

  return phases[phase];
}

const faseLunar = document.getElementById("fase-lunar");
const moonIcon = document.getElementById("moon-icon");

const phase = getMoonPhase();
const phaseString = getMoonPhaseName(phase)
const phaseToArray = phaseString.split(" ");

faseLunar.textContent = phaseToArray.slice(1).join(" ");

moonIcon.textContent = `${phaseToArray[0]}`


// Datos de un punto costero representativo por departamento.
async function getWeather(departamento) {
  const zona = Meteorologia.zonas[departamento];
  if (!zona) throw new Error('Zona costera desconocida');
  const data = await Meteorologia.consultar(zona.lat, zona.lng);
  return {
    temp: data.current.temperature_2m,
    wind: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    code: data.current.weather_code
  };
}

function getWindDirection(degrees) {
    const directions = [
        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SO",
        "O",
        "NO"
    ];

    const index = Math.round(degrees / 45) % 8;

    return directions[index];
}

function getWeatherCondition(code) {
  if (code === 0) {
    return {
      icon: "☀️",
      text: "Despejado"
    };
  }

  if (code === 1 || code === 2) {
    return {
      icon: "🌤️",
      text: "Parcialmente nublado"
    };
  }

  if (code === 3) {
    return {
      icon: "☁️",
      text: "Nublado"
    };
  }

  if (code === 45 || code === 48) {
    return {
      icon: "🌫️",
      text: "Niebla"
    };
  }

  if (code >= 51 && code <= 57) {
    return {
      icon: "🌦️",
      text: "Llovizna"
    };
  }

  if (code >= 61 && code <= 67) {
    return {
      icon: "🌧️",
      text: "Lluvia"
    };
  }

  if (code >= 80 && code <= 82) {
    return {
      icon: "🌦️",
      text: "Chubascos"
    };
  }

  if (code >= 95) {
    return {
      icon: "⛈️",
      text: "Tormenta"
    };
  }

  return {
    icon: "🌤️",
    text: "Variable"
  };
}

function renderWeather(data) {
  const weatherIcon = document.getElementById("weather-icon");
  const weatherCondition = document.getElementById("weather-condition");
  const temperature = document.getElementById("temperature");

  const windSpeed = document.getElementById("wind-speed");
  const windDirection = document.getElementById("wind-direction");
  const windArrow = document.getElementById("wind-arrow");

  // CLIMA
  const condition = getWeatherCondition(data.code);

  weatherIcon.textContent = condition.icon;
  weatherCondition.textContent = condition.text;
  temperature.textContent = `${data.temp}°C`;

  // VIENTO
  const direction = getWindDirection(data.windDirection);

  // Open-Meteo indica de dónde viene el viento.
  // La flecha indica hacia dónde sopla.
  const arrowDirection = (data.windDirection + 180) % 360;

  windDirection.textContent = direction;
  windSpeed.textContent = Math.round(data.wind);

  windArrow.style.transform =
    `rotate(${arrowDirection}deg)`;
}

const selectorClima = document.getElementById('zona-clima');
const contenidosClima = document.querySelectorAll('.weather-content, .wind-content');
let consultaClima = 0;

async function actualizarZonaClima() {
  const consulta = ++consultaClima;
  const departamento = selectorClima.value;
  const zona = Meteorologia.zonas[departamento];
  document.getElementById('referencia-clima').textContent =
    `Referencia costera: ${zona.nombre}. No representa todo el departamento.`;
  contenidosClima.forEach(contenido => {
    contenido.hidden = true;
    contenido.setAttribute('aria-busy', 'true');
  });
  mostrarEstadoDatos(`Cargando clima y viento de ${departamento}...`, null, null,
    'carga', 'estado-meteorologia');
  try {
    const datos = await getWeather(departamento);
    // Una respuesta anterior nunca debe reemplazar la zona recién elegida.
    if (consulta !== consultaClima) return;
    renderWeather(datos);
    mostrarEstadoDatos('', null, null, 'vacio', 'estado-meteorologia');
    contenidosClima.forEach(contenido => { contenido.hidden = false; });
  } catch {
    if (consulta !== consultaClima) return;
    mostrarEstadoDatos(`No pudimos consultar el clima y el viento de ${departamento}. Intentá nuevamente.`,
      actualizarZonaClima, null, 'error', 'estado-meteorologia');
  } finally {
    if (consulta === consultaClima) {
      contenidosClima.forEach(contenido => contenido.setAttribute('aria-busy', 'false'));
    }
  }
}

selectorClima.addEventListener('change', actualizarZonaClima);
actualizarZonaClima();


// Efecto de desplazamiento del Hero

const hero = document.querySelector(".hero");
const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

if (hero && !reduceMotion.matches) {
    let ticking = false;

    function updateHeroScroll() {
        const rect = hero.getBoundingClientRect();

        const progress = Math.min(
            1,
            Math.max(0, -rect.top / rect.height)
        );

        hero.style.setProperty(
            "--hero-video-y",
            `${progress * 25}px`
        );

        hero.style.setProperty(
            "--hero-text-opacity",
            1 - progress
        );

        hero.style.setProperty(
            "--hero-text-y",
            `${progress * 25}px`
        );

        ticking = false;
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            requestAnimationFrame(updateHeroScroll);
            ticking = true;
        }
    }, { passive: true });

    updateHeroScroll();
}




// DEPARTAMENTOS

const departamentos =
  [
    {
      nombre: "Montevideo",
      cantidad: 7
    },
    {
      nombre: "Canelones",
      cantidad: 11
    },
    {
      nombre: "Maldonado",
      cantidad: 11
    },
    {
      nombre: "Rocha",
      cantidad: 6
    }
  ];


