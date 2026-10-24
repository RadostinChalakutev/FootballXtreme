const API = window.location.protocol === "file:" ? "http://localhost:8080" : "";

let pitches = [];
let reservations = [];
let blockedTimes = [];
let workingHours = null;
let availabilityReady = false;
let availabilityRequest = 0;
let selectedPitchId = null;
let selectedDate = null;
let selectedDuration = 60;
let selectedStartTime = null;
let latestConfirmation = null;

let venue = {
    name: "FootballXtreme",
    shortName: "FootballXtreme",
    phone: "",
    email: "",
    address: "",
    currency: "BGN"
};

const DAY_NAMES = [
    "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
];

document.addEventListener("DOMContentLoaded", init);

async function init() {
    setMinimumDate();
    bindEvents();
    setText("footerYear", String(new Date().getFullYear()));

    await Promise.allSettled([loadVenueConfig(), loadPitches()]);
    updateBookingSummary();
}

function byId(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = byId(id);
    if (element) {
        element.textContent = value;
    }
}

function bindEvents() {
    byId("date")?.addEventListener("change", async event => {
        selectedDate = event.target.value;
        clearSelectedTime();
        updateBookingSummary();
        await loadAvailability();
    });

    document.querySelectorAll?.("[data-duration]").forEach(button => {
        button.addEventListener("click", async () => {
            selectedDuration = Number(button.dataset.duration);
            document.querySelectorAll("[data-duration]").forEach(option => {
                option.classList.toggle("is-active", option === button);
            });
            clearSelectedTime();
            updateBookingSummary();
            await loadAvailability();
        });
    });

    byId("customerForm")?.addEventListener("submit", event => {
        event.preventDefault();
        createReservation();
    });

    document.querySelectorAll?.("[data-open-dialog]").forEach(button => {
        button.addEventListener("click", () => openDialog(button.dataset.openDialog));
    });

    document.querySelectorAll?.("[data-close-dialog]").forEach(button => {
        button.addEventListener("click", () => byId(button.dataset.closeDialog)?.close());
    });

    byId("closeSuccessButton")?.addEventListener("click", () => byId("successDialog")?.close());
    byId("calendarButton")?.addEventListener("click", downloadCalendarInvite);
}

function setMinimumDate() {
    const input = byId("date");
    if (!input) {
        return;
    }

    const today = venueNow().date;
    input.min = today;
    input.value = today;
    selectedDate = today;
}

async function loadVenueConfig() {
    try {
        const response = await request("/api/config", {cache: "no-store"});
        if (!response.ok) {
            throw new Error("Неуспешно зареждане на конфигурацията.");
        }

        const configuration = await response.json();
        venue = {...venue, ...Object.fromEntries(
            Object.entries(configuration || {}).filter(([, value]) => value !== null && value !== "")
        )};
        updateVenueContent();
    } catch (error) {
        console.warn("Venue configuration unavailable:", error);
    }
}

function updateVenueContent() {
    const title = venue.shortName || venue.name || "FootballXtreme";
    document.querySelectorAll?.("[data-venue-name]").forEach(element => {
        element.textContent = title;
    });

    const contact = byId("venueContact");
    const phone = byId("venuePhone");
    const email = byId("venueEmail");
    const address = byId("venueAddress");
    const hasContact = Boolean(venue.phone || venue.email || venue.address);

    if (contact) {
        contact.hidden = !hasContact;
    }
    if (phone) {
        phone.textContent = venue.phone || "";
        phone.href = venue.phone ? `tel:${venue.phone.replace(/[^+0-9]/g, "")}` : "#";
    }
    if (email) {
        email.textContent = venue.email || "";
        email.href = venue.email ? `mailto:${venue.email}` : "#";
    }
    if (address) {
        address.textContent = venue.address || "";
    }
}

async function loadPitches() {
    const container = byId("pitchCards");
    if (!container) {
        return;
    }

    try {
        const response = await request("/api/pitches", {cache: "no-store"});
        if (!response.ok) {
            throw new Error("Неуспешно зареждане на игрищата.");
        }

        pitches = await response.json();
        renderPitchCards();
    } catch (error) {
        console.error("Pitch loading error:", error);
        container.innerHTML = `
            <div class="loading-card">Неуспешно зареждане на игрищата. Презареди страницата или опитай отново по-късно.</div>
        `;
    }
}

function renderPitchCards() {
    const container = byId("pitchCards");
    if (!container) {
        return;
    }

    if (!pitches.length) {
        container.innerHTML = `
            <div class="loading-card">Все още няма публикувани игрища. Влез в операторския панел, за да добавиш първия терен.</div>
        `;
        return;
    }

    container.innerHTML = pitches.map(pitch => {
        const amenities = getAmenities(pitch).slice(0, 3);
        const selected = Number(pitch.id) === Number(selectedPitchId);
        const visualTitle = pitch.format || "5v5";
        const lighting = pitch.hasLighting ? "Осветление" : "Дневен терен";

        return `
            <article class="pitch-card ${selected ? "is-selected" : ""}" data-accent="${escapeAttribute(pitch.accent || "lime")}">
                <div class="pitch-visual"><i></i><span class="pitch-badge">${escapeHtml(visualTitle)}</span><span class="pitch-status">${pitch.active ? "Свободни слотове" : "Временно неактивен"}</span></div>
                <div class="pitch-content">
                    <h3>${escapeHtml(pitch.name)}</h3>
                    <p>${escapeHtml(pitch.description || "Футболен терен с удобен онлайн график и бърза резервация.")}</p>
                    <div class="pitch-meta">
                        <span>${escapeHtml(pitch.surface || "Изкуствена трева")}</span>
                        <span>${escapeHtml(lighting)}</span>
                        ${amenities.map(item => `<span>${escapeHtml(item)}</span>`).join("")}
                    </div>
                    <div class="pitch-bottom">
                        <div class="pitch-price"><small>Цена за 60 мин.</small><b>${formatMoney(pitch.hourlyRate)}</b></div>
                        <button class="select-pitch" type="button" data-pitch-id="${Number(pitch.id)}">${selected ? "Избран" : "Избери"}</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");

    container.querySelectorAll("[data-pitch-id]").forEach(button => {
        button.addEventListener("click", async () => {
            await selectPitch(Number(button.dataset.pitchId), true);
        });
    });
}

async function selectPitch(pitchId, scrollToBooking = false) {
    if (!pitches.some(pitch => Number(pitch.id) === Number(pitchId))) {
        return;
    }

    selectedPitchId = pitchId;
    clearSelectedTime();
    renderPitchCards();
    updateBookingSummary();
    await loadAvailability();

    if (scrollToBooking) {
        byId("booking")?.scrollIntoView({behavior: "smooth", block: "start"});
    }
}

function clearSelectedTime() {
    selectedStartTime = null;
    hideCustomerForm();
}

function venueNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Sofia",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

    return {
        date: `${values.year}-${values.month}-${values.day}`,
        minutes: Number(values.hour) * 60 + Number(values.minute)
    };
}

async function loadAvailability() {
    const requestId = ++availabilityRequest;
    const pitchId = selectedPitchId;
    const date = selectedDate;
    const container = byId("hours");

    availabilityReady = false;
    if (!container) {
        return;
    }

    if (!pitchId || !date) {
        container.innerHTML = "<div class=\"availability-empty\">Избери терен, за да видиш свободните часове.</div>";
        setText("availabilityDate", "Избери терен");
        return;
    }

    container.innerHTML = "<div class=\"availability-empty\"><span class=\"loading-mark\"></span> Проверяваме наличността…</div>";
    setText("availabilityDate", formatDateLong(date));

    try {
        const day = DAY_NAMES[new Date(`${date}T12:00:00`).getDay()];
        const [reservationData, blockData, hoursData] = await Promise.all([
            getJson(`/api/reservations/pitch/${pitchId}?date=${encodeURIComponent(date)}`),
            getJson(`/api/blocked-times/pitch/${pitchId}?date=${encodeURIComponent(date)}`),
            getJson(`/api/working-hours/${day}`)
        ]);

        if (requestId !== availabilityRequest) {
            return;
        }

        reservations = reservationData;
        blockedTimes = blockData;
        workingHours = hoursData;
        availabilityReady = true;

        if (selectedStartTime && getHourStatus(selectedStartTime) !== "available") {
            clearSelectedTime();
            showMessage("Избраният час вече не е свободен. Избери друг слот.", "error");
        }

        renderHours();
        updateBookingSummary();
    } catch (error) {
        if (requestId !== availabilityRequest) {
            return;
        }

        reservations = [];
        blockedTimes = [];
        workingHours = null;
        availabilityReady = false;
        clearSelectedTime();
        updateBookingSummary();
        container.textContent = error.message || "Графикът не може да бъде зареден. Опитай отново.";
    }
}

async function getJson(path) {
    const response = await request(path, {cache: "no-store"});
    if (!response.ok) {
        throw new Error("Графикът не може да бъде зареден. Опитай отново.");
    }
    return response.json();
}

function generateHours() {
    if (!availabilityReady || !workingHours || workingHours.closed) {
        return [];
    }

    const hours = [];
    const opening = timeToMinutes(workingHours.openingTime);
    const closing = timeToMinutes(workingHours.closingTime);

    for (let minutes = Math.ceil(opening / 30) * 30; minutes + selectedDuration <= closing; minutes += 30) {
        hours.push(minutesToTime(minutes));
    }

    return hours;
}

function renderHours() {
    const container = byId("hours");
    if (!container) {
        return;
    }

    const hours = generateHours();
    container.innerHTML = "";

    if (!hours.length) {
        const message = workingHours?.closed
            ? "Комплексът не работи на избраната дата."
            : "За избраната дата няма свободни начала.";
        container.innerHTML = `<div class="availability-empty">${message}</div>`;
        return;
    }

    hours.forEach(startTime => {
        const status = getHourStatus(startTime);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `hour-button ${status}`;
        button.disabled = status !== "available";
        button.innerHTML = `<strong>${startTime}</strong><small>${status === "available" ? "Свободно" : slotLabel(status)}</small>`;

        if (selectedStartTime === startTime) {
            button.classList.add("selected");
            button.disabled = false;
        }

        if (status === "available") {
            button.addEventListener("click", () => selectHour(startTime));
        }
        container.appendChild(button);
    });
}

function slotLabel(status) {
    if (status === "busy") return "Заето";
    if (status === "past") return "Минал час";
    return "Недостъпно";
}

function getHourStatus(startTime) {
    if (!availabilityReady || !workingHours || workingHours.closed || !selectedDate) {
        return "blocked";
    }

    const start = timeToMinutes(startTime);
    const end = start + selectedDuration;
    const now = venueNow();

    if (selectedDate < now.date || (selectedDate === now.date && start <= now.minutes)) {
        return "past";
    }
    if (start < timeToMinutes(workingHours.openingTime) || end > timeToMinutes(workingHours.closingTime)) {
        return "blocked";
    }
    if (reservations.some(reservation => {
        const reservationStart = timeToMinutes(reservation.startTime);
        return start < reservationStart + Number(reservation.durationMinutes) && end > reservationStart;
    })) {
        return "busy";
    }
    if (blockedTimes.some(block => start < timeToMinutes(block.endTime) && end > timeToMinutes(block.startTime))) {
        return "blocked";
    }
    return "available";
}

function selectHour(startTime) {
    if (getHourStatus(startTime) !== "available") {
        return;
    }

    selectedStartTime = startTime;
    renderHours();
    updateBookingSummary();
    showCustomerForm();
}

function updateBookingSummary() {
    const empty = byId("summaryEmpty");
    const details = byId("summaryDetails");
    const pitch = getSelectedPitch();
    const ready = Boolean(pitch && selectedDate && selectedStartTime);

    setText("selectedPitchLabel", pitch ? pitch.name : "Избери терен горе");
    if (!empty || !details) {
        return;
    }

    empty.classList.toggle("hidden", ready);
    details.classList.toggle("hidden", !ready);
    if (!ready) {
        return;
    }

    const endTime = addMinutesToTime(selectedStartTime, selectedDuration);
    setText("summaryPitchName", pitch.name);
    setText("summaryPitchMeta", `${pitch.format || "5v5"} · ${pitch.surface || "Изкуствена трева"}`);
    setText("summaryPitchArt", (pitch.format || "FX").replace("v", "×"));
    setText("summaryDate", formatDateLong(selectedDate));
    setText("summaryTime", `${selectedStartTime} – ${endTime}`);
    setText("summaryDuration", `${selectedDuration} минути`);
    setText("summaryPrice", formatMoney(calculateTotal(pitch)));
}

function showCustomerForm() {
    const form = byId("customerForm");
    if (!form) {
        return;
    }

    form.classList.remove("hidden");
    window.setTimeout(() => form.scrollIntoView({behavior: "smooth", block: "nearest"}), 100);
}

function hideCustomerForm() {
    byId("customerForm")?.classList.add("hidden");
    showMessage("");
}

async function createReservation() {
    const form = byId("customerForm");
    const reserveButton = byId("reserveButton");
    const pitch = getSelectedPitch();

    if (!form || !pitch || !selectedDate || !selectedStartTime) {
        showMessage("Избери терен, дата и свободен час преди потвърждение.", "error");
        return;
    }
    if (!availabilityReady || getHourStatus(selectedStartTime) !== "available") {
        showMessage("Часът вече не е свободен. Избери друг слот.", "error");
        await loadAvailability();
        return;
    }
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        pitchId: Number(selectedPitchId),
        date: selectedDate,
        startTime: selectedStartTime,
        durationMinutes: selectedDuration,
        customerName: byId("customerName")?.value.trim(),
        customerPhone: byId("customerPhone")?.value.trim(),
        customerEmail: byId("customerEmail")?.value.trim(),
        termsAccepted: byId("termsAccepted")?.checked === true
    };

    reserveButton.disabled = true;
    reserveButton.textContent = "Потвърждаваме…";
    showMessage("Проверяваме избрания слот…");

    try {
        const response = await request("/api/reservations", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(await responseMessage(response));
        }

        latestConfirmation = await response.json();
        showMessage("");
        showSuccess(latestConfirmation);
        form.reset();
        clearSelectedTime();
        updateBookingSummary();
        await loadAvailability();
    } catch (error) {
        console.error("Booking failed:", error);
        showMessage(error.message || "Неуспешна резервация. Опитай отново.", "error");
        if (error.message?.includes("вече не е свободен")) {
            await loadAvailability();
        }
    } finally {
        reserveButton.disabled = false;
        reserveButton.innerHTML = "Потвърди резервацията <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\"><path d=\"M4 10h11M11 5l5 5-5 5\"/></svg>";
    }
}

function showSuccess(confirmation) {
    setText("confirmationReference", confirmation.reference || "—");
    const when = `${formatDateLong(confirmation.date)} · ${formatTime(confirmation.startTime)} – ${formatTime(confirmation.endTime)}`;
    setText("successDescription", `${confirmation.pitchName} · ${when}. ${formatMoney(confirmation.totalPrice, confirmation.currency)} — плащане на място.`);
    openDialog("successDialog");
}

function openDialog(id) {
    const dialog = byId(id);
    if (!dialog) {
        return;
    }
    if (typeof dialog.showModal === "function") {
        dialog.showModal();
    } else {
        dialog.setAttribute("open", "open");
    }
}

function downloadCalendarInvite() {
    if (!latestConfirmation || !window.Blob || !window.URL?.createObjectURL) {
        return;
    }

    const confirmation = latestConfirmation;
    const start = calendarDateTime(confirmation.date, confirmation.startTime);
    const end = calendarDateTime(confirmation.date, confirmation.endTime);
    const location = venue.address || "FootballXtreme";
    const content = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//FootballXtreme//Venue OS//BG",
        "BEGIN:VEVENT",
        `UID:${escapeIcs(confirmation.reference || `fx-${Date.now()}`)}@footballxtreme`,
        `DTSTAMP:${calendarTimestamp(new Date())}`,
        `DTSTART;TZID=Europe/Sofia:${start}`,
        `DTEND;TZID=Europe/Sofia:${end}`,
        `SUMMARY:${escapeIcs(`Футбол · ${confirmation.pitchName}`)}`,
        `LOCATION:${escapeIcs(location)}`,
        `DESCRIPTION:${escapeIcs(`Резервация ${confirmation.reference || ""}`)}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([content], {type: "text/calendar;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `footballxtreme-${confirmation.reference || "booking"}.ics`;
    link.click();
    URL.revokeObjectURL(url);
}

function showMessage(message, type = "") {
    const target = byId("bookingMessage");
    if (!target) {
        return;
    }
    target.textContent = message;
    target.className = `booking-message ${type}`;
}

function getSelectedPitch() {
    return pitches.find(pitch => Number(pitch.id) === Number(selectedPitchId));
}

function calculateTotal(pitch) {
    const hourlyRate = Number(pitch?.hourlyRate || 0);
    return hourlyRate * (selectedDuration / 60);
}

function getAmenities(pitch) {
    return String(pitch?.amenities || "")
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}

function formatMoney(value, currency = venue.currency) {
    const normalizedCurrency = String(currency || "BGN").toUpperCase();
    const numericValue = Number(value || 0);
    try {
        return new Intl.NumberFormat("bg-BG", {
            style: "currency",
            currency: normalizedCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(numericValue);
    } catch (_) {
        return `${numericValue.toFixed(2)} ${normalizedCurrency}`;
    }
}

function formatDateLong(date) {
    if (!date) {
        return "—";
    }
    return new Intl.DateTimeFormat("bg-BG", {day: "numeric", month: "long", year: "numeric"})
        .format(new Date(`${date}T12:00:00`));
}

function formatTime(value) {
    return String(value || "").slice(0, 5);
}

function timeToMinutes(value) {
    const [hours, minutes] = String(value || "00:00").slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function addMinutesToTime(value, minutes) {
    return minutesToTime(timeToMinutes(value) + Number(minutes || 0));
}

async function request(path, options = {}) {
    const fetcher = typeof secureFetch === "function" ? secureFetch : fetch;
    return fetcher(`${API}${path}`, options);
}

async function responseMessage(response) {
    try {
        const contentType = response.headers?.get?.("content-type") || "";
        if (contentType.includes("application/json")) {
            const body = await response.json();
            return body.detail || body.message || "Неуспешна резервация.";
        }
        const text = await response.text();
        return text || "Неуспешна резервация.";
    } catch (_) {
        return "Неуспешна резервация.";
    }
}

function calendarDateTime(date, time) {
    return `${String(date).replaceAll("-", "") }T${String(time).slice(0, 5).replace(":", "")}00`;
}

function calendarTimestamp(date) {
    return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}${String(date.getUTCMinutes()).padStart(2, "0")}${String(date.getUTCSeconds()).padStart(2, "0")}Z`;
}

function escapeIcs(value) {
    return String(value || "").replaceAll("\\", "\\\\").replaceAll(";", "\\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
    return escapeHtml(value).replaceAll(" ", "-").replaceAll(/[^a-zA-Z0-9_-]/g, "");
}
