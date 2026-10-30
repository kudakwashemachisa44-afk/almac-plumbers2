(function () {
    'use strict';

    var WHATSAPP_NUMBER = '263772234089';

    // Footer year
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });

    // Remote sample photos: fall back gracefully if one fails to load
    function handleBroken(img) {
        if (img.dataset.fallback && img.src.indexOf(img.dataset.fallback) === -1) {
            img.src = img.dataset.fallback;
            return;
        }
        var box = img.closest('.gallery-item, .s-media');
        if (box) box.style.display = 'none';
    }
    document.querySelectorAll('img').forEach(function (img) {
        if (img.complete && img.naturalWidth === 0 && img.getAttribute('loading') !== 'lazy') handleBroken(img);
        img.addEventListener('error', function () { handleBroken(img); });
    });

    // Sticky header shadow
    var header = document.querySelector('.site-header');
    if (header) {
        var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 10); };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // Mobile menu
    var toggle = document.querySelector('.nav-toggle');
    if (toggle && header) {
        var setOpen = function (open) {
            header.classList.toggle('nav-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        };
        toggle.addEventListener('click', function () {
            setOpen(!header.classList.contains('nav-open'));
        });
        document.querySelectorAll('.nav-links a').forEach(function (a) {
            a.addEventListener('click', function () { setOpen(false); });
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') setOpen(false);
        });
    }

    // Reveal-on-scroll
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach(function (el) { io.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('visible'); });
    }

    // ---------- Quote form ----------
    var form = document.getElementById('quote-form');
    if (!form) return;

    var status = document.getElementById('form-status');
    var submitBtn = document.getElementById('submit-btn');
    var waBtn = document.getElementById('wa-btn');
    var serviceSelect = document.getElementById('service');
    var dateInput = document.getElementById('visit_date');

    // Pre-select the service when arriving from a "Get a quote" link (quote.html?service=geysers)
    var preset = new URLSearchParams(window.location.search).get('service');
    if (preset && serviceSelect.querySelector('option[value="' + preset + '"]')) {
        serviceSelect.value = preset;
    }

    // No visit dates in the past
    if (dateInput) {
        var today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        dateInput.min = today.toISOString().slice(0, 10);
    }

    function showError(msg) {
        status.textContent = msg;
        status.className = 'form-status error';
    }

    function clearError() {
        status.textContent = '';
        status.className = 'form-status';
    }

    function validate() {
        clearError();
        var invalid = Array.prototype.find.call(form.elements, function (el) {
            return el.willValidate && !el.checkValidity();
        });
        if (invalid) {
            var label = form.querySelector('label[for="' + invalid.id + '"]');
            var name = label ? label.childNodes[0].textContent.trim() : 'this field';
            showError('Please check: ' + name + '.');
            invalid.focus();
            return false;
        }
        return true;
    }

    function selectedText(id) {
        var el = document.getElementById(id);
        return el && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '';
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) return;

        var data = new FormData(form);
        // Send the readable service name rather than the internal value
        data.set('service', selectedText('service'));
        var email = data.get('email');
        if (email) data.set('_replyto', email);

        var original = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';

        fetch(form.action, {
            method: 'POST',
            body: data,
            headers: { 'Accept': 'application/json' }
        }).then(function (res) {
            if (res.ok) {
                window.location.href = 'success.html';
            } else {
                throw new Error('Request failed');
            }
        }).catch(function () {
            submitBtn.disabled = false;
            submitBtn.innerHTML = original;
            showError('Sorry, your request could not be sent. Please try "Send via WhatsApp" or call 077 223 4089.');
        });
    });

    // Build a WhatsApp message from whatever has been filled in
    waBtn.addEventListener('click', function () {
        var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
        var urgency = form.querySelector('input[name="urgency"]:checked');
        var lines = ['Hi ALMAC Contractors, I would like a quote.'];
        if (v('name')) lines.push('Name: ' + v('name'));
        if (v('location')) lines.push('Location: ' + v('location'));
        if (v('service')) lines.push('Service: ' + selectedText('service'));
        lines.push('Property: ' + selectedText('property'));
        if (urgency) lines.push('Urgency: ' + urgency.value);
        if (v('visit_date')) lines.push('Preferred visit: ' + v('visit_date') + ', ' + selectedText('visit_time'));
        if (v('message')) lines.push('', v('message'));
        window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
})();
