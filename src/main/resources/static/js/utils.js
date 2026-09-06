// ======================================================
// UTILS
// ======================================================

const API_BASE = "/api";


// ======================================================
// API
// ======================================================

async function apiFetch(url, options = {}) {

    const response = await fetch(
        API_BASE + url,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    if (!response.ok) {

        let message = `HTTP ${response.status}`;

        try {
            const data = await response.json();

            if (data.message) {
                message = data.message;
            } else if (data.error) {
                message = data.error;
            }

        } catch {
            // Няма JSON response
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}


// ======================================================
// ERROR
// ======================================================

function showError(error) {

    console.error(error);

    const message =
        error?.message ||
        "Възникна неизвестна грешка.";

    alert(message);
}


// ======================================================
// DATE
// ======================================================

function formatDate(date) {

    if (!date) {
        return "";
    }

    const d = new Date(date + "T00:00:00");

    return d.toLocaleDateString(
        "bg-BG",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


function formatDateLong(date) {

    if (!date) {
        return "";
    }

    const d = new Date(date + "T00:00:00");

    return d.toLocaleDateString(
        "bg-BG",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


// ======================================================
// TIME
// ======================================================

function formatTime(time) {

    if (!time) {
        return "";
    }

    return time.substring(0, 5);
}


function calculateEndTime(startTime, durationMinutes) {

    if (!startTime || !durationMinutes) {
        return "";
    }

    const [hours, minutes] =
        startTime
            .substring(0, 5)
            .split(":")
            .map(Number);

    const totalMinutes =
        hours * 60 +
        minutes +
        Number(durationMinutes);

    const endHours =
        Math.floor(totalMinutes / 60) % 24;

    const endMinutes =
        totalMinutes % 60;

    return (
        String(endHours).padStart(2, "0") +
        ":" +
        String(endMinutes).padStart(2, "0")
    );
}


// ======================================================
// TIME → MINUTES
// ======================================================

function timeToMinutes(time) {

    if (!time) {
        return 0;
    }

    const [hours, minutes] =
        time
            .substring(0, 5)
            .split(":")
            .map(Number);

    return hours * 60 + minutes;
}


function minutesToTime(totalMinutes) {

    const hours =
        Math.floor(totalMinutes / 60);

    const minutes =
        totalMinutes % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0")
    );
}


// ======================================================
// DAY OF WEEK
// ======================================================

function getDayOfWeek(dateString) {

    const date =
        new Date(dateString + "T00:00:00");

    const days = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY"
    ];

    return days[date.getDay()];
}


// ======================================================
// HTML SAFETY
// ======================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================================
// DOM
// ======================================================

function getElement(id) {
    return document.getElementById(id);
}


// ======================================================
// GLOBALS
// ======================================================
//
// Оставяме функциите достъпни глобално,
// защото съществуващият admin HTML използва
// onclick="..." за някои действия.
//

window.apiFetch = apiFetch;

window.showError = showError;

window.formatDate = formatDate;
window.formatDateLong = formatDateLong;

window.formatTime = formatTime;
window.calculateEndTime = calculateEndTime;

window.timeToMinutes = timeToMinutes;
window.minutesToTime = minutesToTime;

window.getDayOfWeek = getDayOfWeek;

window.escapeHtml = escapeHtml;

window.getElement = getElement;