// المتغيرات العامة
let currentWeatherData = null;
let currentCity = "جدة";

// عناصر DOM
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const refreshBtn = document.getElementById('refreshBtn');
const weatherContent = document.getElementById('weatherContent');
const backgroundEffects = document.getElementById('backgroundEffects');
const body = document.body;

// مفتاح API الحقيقي
const apiKey = "a21aa4590ddae363b4ff24483dfa6a2a";

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    const savedCity = localStorage.getItem('lastCity');
    if (savedCity) currentCity = savedCity;
    fetchWeatherData(currentCity);

    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleLocation);
    refreshBtn.addEventListener('click', handleRefresh);
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSearch();
    });
    setInterval(handleRefresh, 30 * 60 * 1000);
});

// معالجة البحث
function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        currentCity = city;
        fetchWeatherData(city);
        searchInput.value = '';
    }
}

// معالجة تحديد الموقع
function handleLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
            err => showError('تعذر الحصول على موقعك. يرجى البحث يدويًا.')
        );
    } else {
        showError('المتصفح لا يدعم تحديد الموقع. يرجى البحث يدويًا.');
    }
}

// معالجة التحديث
function handleRefresh() {
    refreshBtn.classList.add('loading');
    fetchWeatherData(currentCity);
    setTimeout(() => refreshBtn.classList.remove('loading'), 2000);
}

// 🔹 جلب بيانات الطقس حسب اسم المدينة من OpenWeatherMap
async function fetchWeatherData(city) {
    showLoading();
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=ar`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب البيانات');
        const data = await response.json();

        const current = data.list[0];
        const currentData = {
            location: `${data.city.name}, ${data.city.country}`,
            date: getCurrentDate(),
            temperature: Math.round(current.main.temp),
            description: current.weather[0].description,
            icon: getWeatherIcon(current.weather[0].main),
            feelsLike: Math.round(current.main.feels_like),
            humidity: current.main.humidity,
            windSpeed: current.wind.speed,
            pressure: current.main.pressure,
            sunrise: new Date(data.city.sunrise * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            sunset: new Date(data.city.sunset * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            uvIndex: Math.floor(Math.random() * 10),
            cloudiness: current.clouds.all
        };

        const hourlyData = data.list.slice(0, 8).map(item => ({
            time: new Date(item.dt * 1000).toLocaleTimeString('ar-SA', { hour: '2-digit', hour12: true }),
            temp: Math.round(item.main.temp),
            icon: getWeatherIcon(item.weather[0].main)
        }));

        const weeklyData = [];
        const addedDays = new Set();
        for (let item of data.list) {
            const date = new Date(item.dt * 1000);
            const dayName = date.toLocaleDateString('ar-SA', { weekday: 'long' });
            if (!addedDays.has(dayName)) {
                weeklyData.push({
                    day: dayName,
                    high: Math.round(item.main.temp_max),
                    low: Math.round(item.main.temp_min),
                    icon: getWeatherIcon(item.weather[0].main)
                });
                addedDays.add(dayName);
            }
            if (weeklyData.length >= 7) break;
        }

        currentWeatherData = { current: currentData, hourly: hourlyData, weekly: weeklyData };
        localStorage.setItem('lastCity', city);
        renderWeatherData();
        updateBackground(currentData.icon);
    } catch (error) {
        showError('فشل في تحميل بيانات الطقس. تحقق من الاتصال بالإنترنت أو اسم المدينة.');
        console.error(error);
    }
}

// 🔹 جلب الطقس حسب الإحداثيات
async function fetchWeatherByCoords(lat, lon) {
    showLoading();
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ar`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل في جلب البيانات');
        const data = await response.json();
        currentCity = data.city.name;
        fetchWeatherData(currentCity);
    } catch (error) {
        showError('فشل في تحديد الموقع أو تحميل الطقس.');
    }
}

// 🔹 تحويل أسماء الحالات إلى رموز الأيقونات المستخدمة
function getWeatherIcon(main) {
    main = main.toLowerCase();
    if (main.includes('clear')) return 'sunny';
    if (main.includes('cloud')) return 'cloudy';
    if (main.includes('rain')) return 'rainy';
    if (main.includes('storm') || main.includes('thunder')) return 'stormy';
    if (main.includes('snow')) return 'partly-cloudy';
    return 'sunny';
}

// باقي الدوال كما هي 👇 (renderWeatherData، loadWeatherIcons، updateBackground، إلخ)
