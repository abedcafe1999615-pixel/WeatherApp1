const apiKey = "a21aa4590ddae363b4ff24483dfa6a2a";

// أيقونات Font Awesome حسب الطقس
const weatherIcons = {
  "Clear": "fa-sun sunny",
  "Clouds": "fa-cloud cloudy", 
  "Rain": "fa-tint rain",
  "Snow": "fa-snowflake-o snow",
  "Thunderstorm": "fa-bolt thunder",
  "Drizzle": "fa-tint rain",
  "Mist": "fa-smog mist",
  "Fog": "fa-smog mist"
};

window.onload = function() {
  getLocationWeather();
  setInterval(getLocationWeather, 600000); // تحديث كل 10 دقائق
};

// دعم زر الإدخال عند الضغط على Enter
document.getElementById("cityInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = document.getElementById("cityInput").value;
    if (city) getWeather(city);
  }
});

document.getElementById("searchBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value;
  if (city) getWeather(city);
});

async function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        getWeatherByCoords(lat, lon);
      },
      () => { 
        getWeather("حلب"); // مدينتك الافتراضية
      }
    );
  } else {
    getWeather("حلب");
  }
}

async function getWeather(city) {
  try {
    showLoading(true);
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ar`);
    
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("المدينة غير موجودة. يرجى التحقق من الاسم.");
      } else {
        throw new Error("فشل في جلب بيانات الطقس");
      }
    }
    
    const data = await res.json();
    displayCurrentWeather(data);
    getWeeklyWeather(data.coord.lat, data.coord.lon);
  } catch (e) {
    alert(e.message || "حدث خطأ في جلب البيانات ⚠️");
  } finally {
    showLoading(false);
  }
}

async function getWeatherByCoords(lat, lon) {
  try {
    showLoading(true);
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ar`);
    const data = await res.json();
    displayCurrentWeather(data);
    getWeeklyWeather(lat, lon);
  } catch (e) {
    alert("حدث خطأ في جلب البيانات ⚠️");
  } finally {
    showLoading(false);
  }
}

async function getWeeklyWeather(lat, lon) {
  try {
    // استخدام One Call API 3.0 - النقطة المهمة!
    const res = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&appid=${apiKey}&units=metric&lang=ar`);
    const data = await res.json();
    const weeklyDiv = document.getElementById("weeklyForecast");
    weeklyDiv.innerHTML = "";

    data.daily.slice(0, 7).forEach(day => {
      const date = new Date(day.dt * 1000);
      const dayName = date.toLocaleDateString('ar', { weekday: 'short' });
      const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
      const temp = Math.round(day.temp.day);

      const card = document.createElement("div");
      card.className = "daily-card";
      card.innerHTML = `
        <p>${dayName}</p>
        <img src="${iconUrl}" alt="${day.weather[0].description}" width="40">
        <p>${temp}°C</p>
      `;
      weeklyDiv.appendChild(card);
    });

  } catch (e) {
    console.log("خطأ في جلب الطقس الأسبوعي", e);
    document.getElementById("weeklyForecast").innerHTML = "<p>غير متوفر</p>";
  }
}

function displayCurrentWeather(data) {
  document.getElementById("cityName").innerText = data.name;
  document.getElementById("temperature").innerText = `${Math.round(data.main.temp)}°C`;
  document.getElementById("description").innerText = data.weather[0].description;
  document.getElementById("humidity").innerText = data.main.humidity + "%";
  document.getElementById("wind").innerText = data.wind.speed + " م/ث";
  document.getElementById("pressure").innerText = data.main.pressure + " hPa";

  const iconEl = document.getElementById("weatherIcon");
  const main = data.weather[0].main;
  iconEl.className = "fa " + (weatherIcons[main] || "fa-sun sunny");

  // تغيير لون الخلفية حسب الطقس
  const card = document.getElementById("currentWeather");
  card.className = "weather-card " + (main.toLowerCase() || "sunny");
}

function showLoading(show) {
  // إضافة مؤشر تحميل بسيط
  const button = document.getElementById("searchBtn");
  button.textContent = show ? "جاري البحث..." : "بحث";
  button.disabled = show;
}
