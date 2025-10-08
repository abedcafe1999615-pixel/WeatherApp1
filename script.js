// المفتاح الخاص بك من OpenWeatherMap
const API_KEY = "a21aa4590ddae363b4ff24483dfa6a2a";

// المتغيرات العامة
let currentWeatherData = null;
let currentCity = "جدة";

// عناصر DOM
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const refreshBtn = document.getElementById('refreshBtn');
const weatherContent = document.getElementById('weatherContent');

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const savedCity = localStorage.getItem('lastCity');
    if (savedCity) currentCity = savedCity;

    fetchWeatherData(currentCity);
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleLocation);
    refreshBtn.addEventListener('click', handleRefresh);
    searchInput.addEventListener('keypress', e => e.key === 'Enter' && handleSearch());
});

// عند البحث اليدوي
function handleSearch() {
    const city = searchInput.value.trim();
    if (!city) return showError('يرجى إدخال اسم المدينة');
    currentCity = city;
    fetchWeatherData(city);
    searchInput.value = '';
}

// تحديد الموقع الجغرافي
function handleLocation() {
    if (!navigator.geolocation) return showError('المتصفح لا يدعم تحديد الموقع');
    showLoading();
    navigator.geolocation.getCurrentPosition(async pos => {
        const { latitude, longitude } = pos.coords;
        await fetchWeatherByCoords(latitude, longitude);
    }, () => showError('تعذر الحصول على موقعك'));
}

// تحديث البيانات
function handleRefresh() {
    refreshBtn.classList.add('loading');
    fetchWeatherData(currentCity);
    setTimeout(() => refreshBtn.classList.remove('loading'), 1500);
}

// جلب الطقس بالاسم
async function fetchWeatherData(city) {
    showLoading();
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ar`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('فشل الاتصال');
        const data = await res.json();
        currentWeatherData = transformWeatherData(data);
        localStorage.setItem('lastCity', city);
        renderWeatherData();
    } catch (err) {
        showError('حدث خطأ أثناء جلب بيانات الطقس');
        console.error(err);
    }
}

// جلب الطقس بالإحداثيات
async function fetchWeatherByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ar`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('خطأ بالاتصال');
        const data = await res.json();
        currentCity = data.city.name;
        currentWeatherData = transformWeatherData(data);
        localStorage.setItem('lastCity', currentCity);
        renderWeatherData();
    } catch {
        showError('فشل جلب الطقس من موقعك');
    }
}

// تحويل بيانات OpenWeatherMap
function transformWeatherData(data) {
    const current = {
        location: `${data.city.name}, ${data.city.country}`,
        date: getCurrentDate(),
        temperature: Math.round(data.list[0].main.temp),
        description: data.list[0].weather[0].description,
        icon: mapWeatherIcon(data.list[0].weather[0].icon),
        feelsLike: Math.round(data.list[0].main.feels_like),
        humidity: data.list[0].main.humidity,
        windSpeed: data.list[0].wind.speed,
        pressure: data.list[0].main.pressure,
        sunrise: new Date(data.city.sunrise * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        sunset: new Date(data.city.sunset * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        cloudiness: data.list[0].clouds.all
    };

    const hourly = data.list.slice(0, 8).map(i => ({
        time: new Date(i.dt * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        temp: Math.round(i.main.temp),
        icon: mapWeatherIcon(i.weather[0].icon)
    }));

    const dailyMap = {};
    data.list.forEach(i => {
        const date = new Date(i.dt * 1000).toLocaleDateString('ar-SA');
        if (!dailyMap[date]) dailyMap[date] = [];
        dailyMap[date].push(i.main.temp);
    });

    const weekly = Object.keys(dailyMap).slice(0, 7).map((date, idx) => ({
        day: ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][idx % 7],
        high: Math.round(Math.max(...dailyMap[date])),
        low: Math.round(Math.min(...dailyMap[date])),
        icon: 'sunny'
    }));

    return { current, hourly, weekly };
}

// تحويل رمز الأيقونة
function mapWeatherIcon(code) {
    const map = {
        '01d': 'sunny', '01n': 'clear-night',
        '02d': 'partly-cloudy', '02n': 'partly-cloudy',
        '03d': 'cloudy', '03n': 'cloudy',
        '04d': 'cloudy', '04n': 'cloudy',
        '09d': 'rainy', '09n': 'rainy',
        '10d': 'rainy', '10n': 'rainy',
        '11d': 'rainy', '11n': 'rainy'
    };
    return map[code] || 'sunny';
}

// عرض البيانات على الصفحة
function renderWeatherData() {
    const { current, hourly, weekly } = currentWeatherData;
    weatherContent.innerHTML = `
        <div class="current-weather">
            <h1>${current.location}</h1>
            <p>${current.date}</p>
            <h2>${current.temperature}°</h2>
            <p>${current.description}</p>
            <p>الرطوبة: ${current.humidity}% | الرياح: ${current.windSpeed} كم/س</p>
        </div>
        <hr>
        <div class="hourly-forecast">
            ${hourly.map(h => `<div>${h.time} - ${h.temp}°</div>`).join('')}
        </div>
        <hr>
        <div class="weekly-forecast">
            ${weekly.map(d => `<div>${d.day}: ${d.high}° / ${d.low}°</div>`).join('')}
        </div>
    `;
}

// إظهار حالة التحميل
function showLoading() {
    weatherContent.innerHTML = "<p>جاري تحميل البيانات...</p>";
}

// إظهار الخطأ
function showError(msg) {
    weatherContent.innerHTML = `<p style="color:red;">${msg}</p>`;
}

// التاريخ الحالي
function getCurrentDate() {
    const now = new Date();
    return now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });
}
