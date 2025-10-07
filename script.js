const apiKey = "a21aa4590ddae363b4ff24483dfa6a2a"; // مفتاح API الخاص بك

async function getWeather() {
  const city = document.getElementById("cityInput").value;
  if (city === "") {
    alert("من فضلك أدخل اسم المدينة 🌍");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ar`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod === "404") {
      alert("❌ لم يتم العثور على المدينة");
      return;
    }

    document.getElementById("cityName").innerText = `📍 ${data.name}`;
    document.getElementById("temperature").innerText = `🌡️ ${data.main.temp}°C`;
    document.getElementById("description").innerText = `☁️ ${data.weather[0].description}`;
  } catch (error) {
    alert("حدث خطأ أثناء جلب البيانات ⚠️");
  }
}
