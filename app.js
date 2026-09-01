// 1. Registro del Service Worker para activar capacidades de PWA Offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('PWA Service Worker registrado correctamente:', reg.scope))
            .catch(err => console.error('Error al registrar el Service Worker:', err));
    });
}

// 2. Generación o recuperación de ID Anónimo Local (Protección de identidad)
function getAnonymousId() {
    let anonId = localStorage.getItem('citizen_anon_id');
    if (!anonId) {
        anonId = crypto.randomUUID ? crypto.randomUUID() : 'user-' + Math.random().toString(36).substring(2);
        localStorage.setItem('citizen_anon_id', anonId);
    }
    return anonId;
}

let currentCoords = null;
const getGeoBtn = document.getElementById('getGeoBtn');
const geoStatus = document.getElementById('geoStatus');
const submitBtn = document.getElementById('submitBtn');
const reportForm = document.getElementById('reportForm');
const clearDataBtn = document.getElementById('clearDataBtn');

// 3. Captura de Ubicación GPS con API nativa
getGeoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        geoStatus.textContent = 'La geolocalización no es compatible con este dispositivo.';
        return;
    }

    geoStatus.textContent = 'Obteniendo coordenadas GPS...';
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentCoords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            geoStatus.textContent = `Lat: ${currentCoords.lat.toFixed(4)}, Lng: ${currentCoords.lng.toFixed(4)}`;
            submitBtn.disabled = false;
        },
        (error) => {
            geoStatus.textContent = 'Error al obtener ubicación. Revisa permisos de GPS.';
            console.error(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
});

// 4. Procesamiento de formulario y guardado persistente local
reportForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const category = document.getElementById('category').value;
    const fileInput = document.getElementById('mediaCapture');

    if (!currentCoords) {
        alert('Es obligatorio adjuntar la ubicación GPS para registrar el reporte.');
        return;
    }

    const reader = new FileReader();
    if (fileInput.files && fileInput.files[0]) {
        reader.readAsDataURL(fileInput.files[0]);
        reader.onload = function (event) {
            const imageData = event.target.result;
            
            const newReport = {
                id: 'rep-' + Date.now(),
                authorId: getAnonymousId(),
                category: category,
                image: imageData,
                coordinates: currentCoords,
                status: 'Guardado localmente (Offline)',
                date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
            };

            saveReportLocally(newReport);
            alert('¡Reporte guardado con éxito de forma anónima en tu dispositivo!');
            
            // Restablecer formulario
            reportForm.reset();
            geoStatus.textContent = 'Ubicación no capturada';
            currentCoords = null;
            submitBtn.disabled = true;
            loadLocalReports();
        };
    }
});

// 5. Gestión del almacenamiento local (`localStorage`)
function saveReportLocally(report) {
    let reports = JSON.parse(localStorage.getItem('local_reports')) || [];
    reports.push(report);
    localStorage.setItem('local_reports', JSON.stringify(reports));
}

function loadLocalReports() {
    const reportsList = document.getElementById('reportsList');
    let reports = JSON.parse(localStorage.getItem('local_reports')) || [];
    
    reportsList.innerHTML = '';
    if (reports.length === 0) {
        reportsList.innerHTML = '<p>No hay reportes almacenados en este dispositivo.</p>';
        return;
    }

    reports.reverse().forEach(rep => {
        const div = document.createElement('div');
        div.className = 'report-item';
        div.innerHTML = `
            <strong>Problema:</strong> ${rep.category.toUpperCase()}<br>
            <strong>GPS:</strong> [${rep.coordinates.lat.toFixed(4)}, ${rep.coordinates.lng.toFixed(4)}]<br>
            <strong>Estado:</strong> ${rep.status}<br>
            <strong>Fecha:</strong> ${rep.date}<br>
            <small>ID Anónimo: ${rep.authorId.substring(0, 8)}...</small>
        `;
        reportsList.appendChild(div);
    });
}

// Botón para vaciar la base de datos local
clearDataBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de eliminar todos los reportes almacenados localmente?')) {
        localStorage.removeItem('local_reports');
        loadLocalReports();
        alert('Historial local limpiado.');
    }
});

// Cargar reportes almacenados al abrir la aplicación
window.addEventListener('DOMContentLoaded', loadLocalReports);