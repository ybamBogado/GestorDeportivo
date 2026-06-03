// ─── Algoritmo de Luhn para validación de tarjetas ────────────────────────────
export function luhnCheck(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i], 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
}

// ─── Validación de BIN (primeros 6 dígitos) ───────────────────────────────────
export function detectCardBrand(cardNumber) {
    const n = cardNumber.replace(/\D/g, '');
    if (/^4/.test(n))                return 'Visa';
    if (/^5[1-5]/.test(n))           return 'Mastercard';
    if (/^3[47]/.test(n))            return 'Amex';
    if (/^6(?:011|5)/.test(n))       return 'Discover';
    if (/^(?:2131|1800|35\d{3})/.test(n)) return 'JCB';
    return 'Desconocida';
}

// ─── Validación de fecha de vencimiento ───────────────────────────────────────
export function isCardExpired(expiry) {
    const match = expiry.match(/^(\d{2})\/(\d{2,4})$/);
    if (!match) return true;

    const month = parseInt(match[1], 10);
    const year  = parseInt(match[2].length === 2 ? `20${match[2]}` : match[2], 10);

    if (month < 1 || month > 12) return true;

    const now        = new Date();
    const expiryDate = new Date(year, month, 1);
    return expiryDate <= now;
}

// ─── Validación de CVV ────────────────────────────────────────────────────────
export function isValidCvv(cvv, brand) {
    const len = brand === 'Amex' ? 4 : 3;
    return new RegExp(`^\\d{${len}}$`).test(cvv);
}

// ─── Validación completa de tarjeta ──────────────────────────────────────────
export function validateCard({ number, expiry, cvv, holder }) {
    const errors = {};

    if (!number) {
        errors.number = 'El número de tarjeta es requerido';
    } else if (!luhnCheck(number)) {
        errors.number = 'Número de tarjeta inválido';
    }

    if (!expiry) {
        errors.expiry = 'La fecha de vencimiento es requerida';
    } else if (isCardExpired(expiry)) {
        errors.expiry = 'La tarjeta está vencida';
    }

    const brand = detectCardBrand(number || '');
    if (!cvv) {
        errors.cvv = 'El CVV es requerido';
    } else if (!isValidCvv(cvv, brand)) {
        errors.cvv = `CVV inválido para ${brand}`;
    }

    if (!holder || holder.trim().length < 3) {
        errors.holder = 'Ingresá el nombre del titular';
    }

    return errors;
}

// ─── Validación de email ──────────────────────────────────────────────────────
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Validación de contraseña ─────────────────────────────────────────────────
export function validatePassword(password) {
    const errors = [];
    if (password.length < 6)            errors.push('mínimo 6 caracteres');
    return errors;
}

// ─── Sanitización básica contra XSS ──────────────────────────────────────────
export function sanitize(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
