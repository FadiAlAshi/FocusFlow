// ========== FocusFlow - Contact Form Validation ==========
(function () {
    'use strict';
    const form    = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    if (!form) return;

    function showError(input, message) {
        const small = input.closest('.form-group').querySelector('.error-msg');
        if (small) small.textContent = message;
        input.style.borderColor = message ? 'var(--danger)' : '';
    }

    function validateEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        success.hidden = true;
        let valid = true;

        const name    = form.cName;
        const email   = form.cEmail;
        const message = form.cMessage;
        const agree   = form.cAgree;

        // Reset errors
        [name, email, message].forEach(i => showError(i, ''));

        if (name.value.trim().length < 2) {
            showError(name, 'Please enter at least 2 characters.');
            valid = false;
        }
        if (!validateEmail(email.value.trim())) {
            showError(email, 'Please enter a valid email.');
            valid = false;
        }
        if (message.value.trim().length < 10) {
            showError(message, 'Message must be at least 10 characters.');
            valid = false;
        }
        if (!agree.checked) {
            window.showToast && window.showToast('Please accept the terms first.');
            valid = false;
        }

        if (!valid) return;

        // Simulate submission (locally — no backend)
        success.hidden = false;
        form.reset();
        window.showToast && window.showToast('📬 Message sent!');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Live clearing of errors as user types
    form.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => showError(input, ''));
    });
})();
