document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#reservaForm'); // Asegurate que el ID coincide con tu formulario

    async function submitBooking(formData) {
        try {
            const response = await fetch('/includes/send_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Error en la red');

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Error desconocido');
            }

            return result;

        } catch (error) {
            console.error('Error en reserva:', error);
            throw error;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            date: form.date.value,
            showType: form.showType.value,
            comments: form.comments.value.trim()
        };

        try {
            const result = await submitBooking(formData);
            showSuccessMessage(result.message);
            form.reset();
        } catch (error) {
            showErrorMessage(error.message);
        }
    });
});
