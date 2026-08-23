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
      "&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m" +
      "&timezone=auto";

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Error HTTP: " + res.status);
    }

    const data = await res.json();

    const weather = {
      temp: data.current.temperature_2m,
      wind: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      code: data.current.weather_code
    };

    return weather;

  } catch (error) {
    console.error("Error clima:", error);
  }
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

async function renderWeather() {
    const mostrarClima = document.getElementById("mostrarClima");
    const windSpeed = document.getElementById("wind-speed");
    const windDirection = document.getElementById("wind-direction");
    const windArrow = document.getElementById("wind-arrow");

    const data = await getWeather();

    const direction = getWindDirection(data.windDirection);

    // Open-Meteo indica de dónde viene el viento.
    // La flecha muestra hacia dónde sopla.
    const arrowDirection = (data.windDirection + 180) % 360;

    mostrarClima.innerHTML = `
        <p>🌡️ ${data.temp}°C</p>
    `;

    windSpeed.textContent = Math.round(data.wind);

    windDirection.textContent = direction;

    windArrow.style.transform =
        `translateX(-50%) rotate(${arrowDirection}deg)`;
}

renderWeather();


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


