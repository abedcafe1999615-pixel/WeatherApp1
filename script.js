
const apiKey = "a21aa4590ddae363b4ff24483dfa6a2a";

window.onload = function() {
  getWeather("الرياض"); // مدينتك تظهر تلقائيًا عند فتح الموقع
  setInterval(() => getWeather("الرياض"), 600000); // تحديث كل 10 دقائق
};

async function getWeather(city) {
  const input = document.getElementById("cityInput");
  if (city === undefined) city = input.value || "الرياض";

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ar`);
    const data = await response.json();

    if (data.cod === "404") {
      alert("❌ لم يتم العثور على المدينة");
      return;
    }

    document.getElementById("cityName").innerText = `📍 ${data.name}`;
    document.getElementById("temperature").innerText = `🌡️ ${Math.round(data.main.temp)}°C`;
    document.getElementById("description").innerText = `☁️ ${data.weather[0].description}`;

    // أيقونات جديدة
    const weatherIcon = document.getElementById("weatherIcon");
    const icons = {
      "Clear": "icons/sunny.png",
      "Clouds": "icons/cloudy.png",
      "Rain": "icons/rain.png",
      "Snow": "icons/snow.png",
      "Thunderstorm": "icons/thunder.png",
      "Drizzle": "icons/drizzle.png",
      "Mist": "icons/mist.png"
    };
    weatherIcon.src = icons[data.weather[0].main] || "icons/sunny.png";
    weatherIcon.alt = data.weather[0].description;

    // الطقس الأسبوعي
    const lat = data.coord.lat;
    const lon = data.coord.lon;
    getWeeklyWeather(lat, lon);

  } catch (error) {
    alert("حدث خطأ أثناء جلب البيانات ⚠️");
  }
}

async function getWeeklyWeather(lat, lon) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${apiKey}&units=metric&lang=ar`);
    const data = await response.json();

    const weeklyDiv = document.getElementById("weeklyForecast");
    weeklyDiv.innerHTML = "";

    data.daily.slice(0,7).forEach(day => {
      const date = new Date(day.dt * 1000);
      const dayName = date.toLocaleDateString('ar', { weekday: 'short' });
      const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
      const temp = Math.round(day.temp.day);

      const card = document.createElement("div");
      card.className = "daily-card";
      card.innerHTML = `
        <p>${dayName}</p>
        <img src="${iconUrl}" alt="${day.weather[0].description}" width="40" />
        <p>${temp}°C</p>
      `;
      weeklyDiv.appendChild(card);
    });

  } catch (error) {
    console.log("خطأ في جلب الطقس الأسبوعي", error);
  }
}
