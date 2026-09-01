document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    const categorySelect = document.getElementById('category');
    const evidenceInput = document.getElementById('evidence');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');

    function validateForm() {
        const hasCategory = categorySelect.value !== "";
        const file = evidenceInput.files[0];
        // Valida estrictamente que el archivo exista y su tipo MIME comience con "image/"
        const isValidImage = file && file.type.startsWith('image/');
        
        if (hasCategory && isValidImage) {
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
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            // Limpia el input y la vista previa si se selecciona un archivo no válido (como PDF)
            evidenceInput.value = '';
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            alert('Formato no válido. Por favor, selecciona un archivo de imagen.');
        }
        validateForm();
    });

    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedCategory = categorySelect.value;
        const evidenceFile = evidenceInput.files[0];

        if (!selectedCategory || !evidenceFile || !evidenceFile.type.startsWith('image/')) {
            alert('Error: Debe seleccionar una categoría y una imagen válida antes de enviar.');
            return;
        }

        console.log("Reporte válido procesado con éxito:");
        console.log("- Categoría:", selectedCategory);
        console.log("- Archivo de evidencia:", evidenceFile.name);
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker registrado con éxito.'))
            .catch((err) => console.error('Error al registrar Service Worker:', err));
    }
});