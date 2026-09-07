document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    const categorySelect = document.getElementById('category');
    const evidenceInput = document.getElementById('evidence');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    const badgeCount = document.getElementById('badgeCount');
    const pointCount = document.getElementById('pointCount');
    const coordsContainer = document.getElementById('coordsContainer');
    const latText = document.getElementById('latText');
    const lngText = document.getElementById('lngText');

    let base64Evidence = null;

    // Feature 3: Inicialización de Gamificación Local
    let userPoints = parseInt(localStorage.getItem('urbanPoints')) || 0;
    
    function updateGamification() {
        pointCount.textContent = userPoints;
        // 1 insignia por cada 5 reportes (50 puntos)
        badgeCount.textContent = Math.floor(userPoints / 50); 
    }
    updateGamification();

    function showStatus(message, type) {
        statusMessage.textContent = message; // Uso seguro con textContent para prevenir XSS
        statusMessage.className = `status-message status-${type}`;
    }

    function validateForm() {
        const hasCategory = categorySelect.value !== "";
        const file = evidenceInput.files[0];
        const isValidImage = file && file.type.startsWith('image/');
        
        if (hasCategory && isValidImage && base64Evidence) {
            submitBtn.removeAttribute('disabled');
        } else {
            submitBtn.setAttribute('disabled', 'true');
        }
    }

    categorySelect.addEventListener('change', validateForm);

    evidenceInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                base64Evidence = e.target.result;
                imagePreview.src = base64Evidence;
                imagePreview.style.display = 'block';
                showStatus('', ''); // Limpiar errores previos
                validateForm();
            };
            reader.readAsDataURL(file);
        } else {
            evidenceInput.value = '';
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            base64Evidence = null;
            showStatus('Formato no válido. Por favor, selecciona una imagen.', 'error');
            validateForm();
        }
    });

    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!navigator.geolocation) {
            showStatus('Tu navegador no soporta geolocalización.', 'error');
            return;
        }

        submitBtn.setAttribute('disabled', 'true');
        showStatus('Obteniendo ubicación GPS...', 'loading');

        // Feature 1: Captura de Geolocalización
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Renderizado dinámico de coordenadas en el DOM
                latText.textContent = lat.toFixed(6);
                lngText.textContent = lng.toFixed(6);
                if (coordsContainer) {
                    coordsContainer.style.display = 'block';
                }

                // Feature 2: ID Anónimo y Persistencia Offline
                const reportId = crypto.randomUUID();
                const reportData = {
                    id: reportId,
                    category: categorySelect.value,
                    evidence: base64Evidence,
                    lat: lat,
                    lng: lng,
                    timestamp: new Date().toISOString()
                };

                let reports = JSON.parse(localStorage.getItem('urbanReports')) || [];
                reports.push(reportData);
                
                try {
                    localStorage.setItem('urbanReports', JSON.stringify(reports));
                    
                    // Feature 3: Sumar puntos por reporte válido (+10 puntos)
                    userPoints += 10;
                    localStorage.setItem('urbanPoints', userPoints);
                    updateGamification();

                    showStatus(`¡Éxito! Reporte anónimo guardado localmente. Folio: ${reportId.split('-')[0]}`, 'success');
                    
                    // Resetear formulario manteniendo visibles las coordenadas registradas
                    reportForm.reset();
                    imagePreview.style.display = 'none';
                    base64Evidence = null;
                    validateForm();
                } catch (error) {
                    showStatus('Error de almacenamiento. Memoria local llena.', 'error');
                    submitBtn.removeAttribute('disabled');
                }
            },
            (error) => {
                showStatus('Error: Debes conceder permisos de GPS para reportar.', 'error');
                submitBtn.removeAttribute('disabled');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .catch((err) => console.error('Error al registrar Service Worker:', err));
    }
});