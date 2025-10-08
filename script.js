// مفتاح API الخاص فيك
const API_KEY = "a21aa4590ddae363b4ff24483dfa6a2a";

// عناصر DOM
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locBtn = document.getElementById("locBtn");
const appEl = document.getElementById("app");

const subCity = document.getElementById("subCity");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const iconEl = document.getElementById("mainIcon");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const updatedAtEl = document.getElementById("updatedAt");
const weeklyEl = document.getElementById("weekly");

// أيقونات Font Awesome map لحالة الطقس الرئيسية
const FA_MAP = {
  "Clear": "fa-sun",
  "Clouds": "fa-cloud",
  "Rain": "fa-tint",
  "Drizzle": "fa-umbrella",
  "Thunderstorm": "fa-bolt",
  "Snow": "fa-snowflake-o",
  "Mist": "fa-smog",
  "Fog": "fa-smog"
};

// عند الضغط على بحث
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (!city) return alert("أدخل اسم المدينة");
  fetchByCity(city);
});

// زر الموقع
locBtn.addEventListener("click", () => {
  getLocationAndFetch();
});

// تلقائي عند التحميل: جلب الموقع
window.addEventListener("load", () => {
  getLocationAndFetch();
  // تحديث تلقائي كل 10 دقائق
  setInterval(getLocationAndFetch, 10 * 60 * 1000);
});

function getLocationAndFetch() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fetchByCoords(lat, lon);
      },
      () => {
        // لو رفض المستخدم، استخدم اسم مدينة افتراضي (حلب)
        fetchByCity("حلب");
      },
      { timeout: 8000 }
    );
  } else {
    fetchByCity("حلب");
  }
}

async function fetchByCity(city) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ar`);
    const data = await res.json();
    if (data.cod && data.cod !== 200) { alert("لم يتم العثور على المدينة"); return; }
    const { coord } = data;
    displayCurrent(data);
    fetchWeekly(coord.lat, coord.lon);
  } catch (e) {
    console.error(e);
    alert("خطأ في جلب بيانات الطقس");
  }
}

async function fetchByCoords(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ar`);
    const data = await res.json();
    displayCurrent(data);
    fetchWeekly(lat, lon);
  } catch (e) {
    console.error(e);
    alert("خطأ في جلب بيانات الطقس");
  }
}

function displayCurrent(data) {
  // اسم المدينة تحت العنوان
  subCity.innerText = `${data.name}, ${data.sys.country}`;

  // قيم أساسية
  tempEl.innerText = `${Math.round(data.main.temp)}°C`;
  descEl.innerText = data.weather[0].description;
  humidityEl.innerText = `${data.main.humidity}%`;
  windEl.innerText = `${data.wind.speed} م/ث`;
  pressureEl.innerText = `${data.main.pressure} hPa`;
  updatedAtEl.innerText = new Date().toLocaleTimeString('ar-SA');

  // أيقونة Font Awesome و تغيير لون/خلفية حسب main
  const main = data.weather[0].main;
  const fa = FA_MAP[main] || "fa-sun";
  iconEl.className = `icon fa ${fa}`;

  // تغيير كلاس app للخلفية المناسبة
  const cls = mapMainToClass(main);
  appEl.className = `app ${cls}`;

  // زر البحث يفرغ الإدخال
  // cityInput.value = "";
}

function mapMainToClass(main){
  switch(main){
    case "Clear": return "sunny";
    case "Clouds": return "clouds";
    case "Rain":
    case "Drizzle": return "rain";
    case "Snow": return "snow";
    case "Thunderstorm": return "thunder";
    case "Mist":
    case "Fog": return "mist";
    default: return "sunny";
  }
}

async function fetchWeekly(lat, lon){
  try {
    // One Call API (غير شاملة minutely/hourly لتقليل الاستهلاك)
    const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${API_KEY}&lang=ar`;
    const res = await fetch(url);
    const data = await res.json();

    // افراغ الحاوية
    weeklyEl.innerHTML = "";

    // يوم اليوم + ستة أيام بعده
    data.daily.slice(0,7).forEach(day => {
      const d = new Date(day.dt * 1000);
      const dayName = d.toLocaleDateString('ar-SA', { weekday: 'short' }); // ص، ش، ...
      const icon = day.weather[0].icon; // استخدم أيقونة OpenWeather للأيام
      const desc = day.weather[0].description;
      const min = Math.round(day.temp.min);
      const max = Math.round(day.temp.max);

      const card = document.createElement('div');
      card.className = 'daily';
      card.innerHTML = `
        <div class="day">${dayName}</div>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" />
        <div class="t">${max}° / ${min}°</div>
        <div class="s">${desc}</div>
      `;
      weeklyEl.appendChild(card);
    });

  } catch (e) {
    console.error("weekly error", e);
  }
}
