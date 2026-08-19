// FECHA

const fecha = document.getElementById("fecha");

const hoy = new Date();

const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"
];

const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre"
];

fecha.textContent =
`${dias[hoy.getDay()]}, ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;


// TEMPORAL
//Funcion Fase Lunar
function getMoonPhase(date = new Date()) {
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();

  let c = e = jd = b = 0;

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
let phaseToArray = phaseString.split(" ");

faseLunar.textContent = `${phaseToArray[1]}
`;
moonIcon.textContent = `${phaseToArray[0]}
`

//Clima actual
async function getWeather() {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      "?latitude=-34.9011" +
      "&longitude=-56.1645" +
      "&current=temperature_2m,weather_code,wind_speed_10m" +
      "&timezone=auto";

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Error HTTP: " + res.status);
    }

    const data = await res.json();

    const weather = {
      temp: data.current.temperature_2m,
      wind: data.current.wind_speed_10m,
      code: data.current.weather_code
    };

    return weather;

  } catch (error) {
    console.error("Error clima:", error);
  }
}

async function renderWeather() {
  const mostrarClima = document.getElementById("mostrarClima");

  const data = await getWeather();

  mostrarClima.innerHTML = `
    <h3>Clima (Sur de Uruguay)</h3>
    <p>🌡️ ${data.temp}°C</p>
    <p>💨 Viento: ${data.wind} km/h</p>
  `;
}

renderWeather();


// DEPARTAMENTOS

const departamentos = 
[
    {
        nombre:"Montevideo",
        cantidad:7
    },
    {
        nombre:"Canelones",
        cantidad:11
    },
    {
        nombre:"Maldonado",
        cantidad:11
    },
    {
        nombre:"Rocha",
        cantidad:6
    }
];

