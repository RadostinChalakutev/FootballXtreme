const API = "/api";

let pitches = [];
let allReservations = [];
let selectedReservation = null;

let calendarDate = new Date();
let selectedCalendarDate = new Date();

let selectedBlockContext = {
    pitchId: null,
    date: null,
    startTime: null,
    endTime: null
};

const DAY_NAMES = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY"
];

document.addEventListener("DOMContentLoaded", init);

async function init() {
    setToday();
    bindEvents();
    setDefaultBlockedDate();

    await loadPitches();
    await loadAllReservations();

    renderCalendar();
    await loadCalendar();
    await loadDashboard();
}

function bindEvents() {
    document.getElementById("previousMonth")
        ?.addEventListener("click", previousMonth);

    document.getElementById("nextMonth")
        ?.addEventListener("click", nextMonth);

    document.getElementById("refreshDashboardButton")
        ?.addEventListener("click", async () => {
            await loadAllReservations();
            await loadDashboard();
        });

    document.getElementById("calendarPitch")
        ?.addEventListener("change", async () => {
            renderCalendar();
            await loadCalendar();
        });

    document.getElementById("blockedPitch")
        ?.addEventListener("change", loadBlockedTimeGrid);

    document.getElementById("blockedDate")
        ?.addEventListener("change", loadBlockedTimeGrid);

    document.getElementById("calendarBlockButton")
        ?.addEventListener("click", () => openBlockModal());

    document.getElementById("directBlockButton")
        ?.addEventListener("click", () => openBlockModal());

    document.getElementById("addPitchButton")
        ?.addEventListener("click", addPitch);

    document.getElementById("closeReservationModal")
        ?.addEventListener("click", closeReservationModal);

    document.getElementById("closeReservationModalBottom")
        ?.addEventListener("click", closeReservationModal);

    document.getElementById("cancelReservationButton")
        ?.addEventListener("click", cancelReservation);

    document.getElementById("closeBlockTimeModal")
        ?.addEventListener("click", closeBlockModal);

    document.getElementById("closeBlockTimeModalBottom")
        ?.addEventListener("click", closeBlockModal);

    document.getElementById("blockTimeButton")
        ?.addEventListener("click", createBlock);

    document.getElementById("reservationModal")
        ?.addEventListener("click", event => {
            if (event.target.id === "reservationModal") {
                closeReservationModal();
            }
        });

    document.getElementById("blockTimeModal")
        ?.addEventListener("click", event => {
            if (event.target.id === "blockTimeModal") {
                closeBlockModal();
            }
        });
}

function setDefaultBlockedDate() {
    const input = document.getElementById("blockedDate");

    if (input) {
        input.value = formatDate(new Date());
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDateBG(value) {
    const date = value instanceof Date
        ? value
        : new Date(value + "T00:00:00");

    return date.toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function formatTime(time) {
    return time ? String(time).substring(0, 5) : "";
}

function timeToMinutes(time) {
    if (!time) return 0;

    const [hours, minutes] = String(time)
        .substring(0, 5)
        .split(":")
        .map(Number);

    return hours * 60 + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function calculateEndTime(startTime, duration) {
    return minutesToTime(
        timeToMinutes(startTime) + Number(duration || 0)
    );
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showError(error) {
    console.error(error);

    alert(
        error?.message ||
        "Възникна грешка."
    );
}

async function apiFetch(url, options = {}) {
    const response = await fetch(
        API + url,
        {
            ...options,

            headers: {
                ...(options.body !== undefined
                    ? {
                        "Content-Type":
                            "application/json"
                    }
                    : {}),

                ...(options.headers || {})
            }
        }
    );

    if (!response.ok) {
        let message =
            `HTTP ${response.status}`;

        try {
            const text =
                await response.text();

            if (text) {
                message = text;
            }
        } catch (_) {
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    const contentType =
        response.headers.get("content-type") ||
        "";

    if (!contentType.includes("application/json")) {
        return null;
    }

    return response.json();
}

/* ======================================================
   TODAY
   ====================================================== */

function setToday() {
    const element =
        document.getElementById("todayDate");

    if (!element) {
        return;
    }

    element.textContent =
        formatDateBG(new Date());
}

/* ======================================================
   WORKING HOURS
   ====================================================== */

async function getWorkingHoursForDate(dateString) {
    const date =
        new Date(
            dateString + "T00:00:00"
        );

    const dayOfWeek =
        DAY_NAMES[date.getDay()];

    return apiFetch(
        `/working-hours/${dayOfWeek}`
    );
}

/* ======================================================
   PITCHES
   ====================================================== */

async function loadPitches() {
    try {
        pitches =
            await apiFetch(
                "/pitches/admin"
            ) || [];

        renderPitches();
        fillPitchSelects();

    } catch (error) {
        showError(error);
    }
}

function renderPitches() {
    const container =
        document.getElementById(
            "pitchList"
        );

    if (!container) {
        return;
    }

    if (!pitches.length) {
        container.innerHTML = `
            <div class="loading">
                Няма добавени игрища.
            </div>
        `;

        return;
    }

    container.innerHTML =
        pitches.map(pitch => {

            const active =
                pitch.active === true;

            return `
                <div class="pitch-card">

                    <div>
                        <div class="pitch-name">
                            ⚽
                            ${escapeHtml(pitch.name)}
                        </div>

                        <div class="pitch-status">
                            ${
                active
                    ? "🟢 Активно"
                    : "🔴 Неактивно"
            }
                        </div>
                    </div>

                    <div class="pitch-actions">

                        <button
                            class="secondary-btn"
                            type="button"
                            data-edit-pitch="${pitch.id}">
                            ✏️ Преименувай
                        </button>

                        ${
                active
                    ? `
                                    <button
                                        class="danger-btn"
                                        type="button"
                                        data-deactivate-pitch="${pitch.id}">
                                        🔴 Деактивирай
                                    </button>
                                  `
                    : `
                                    <span class="status closed">
                                        Неактивно
                                    </span>
                                  `
            }

                    </div>

                </div>
            `;
        }).join("");

    container
        .querySelectorAll(
            "[data-edit-pitch]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {
                    editPitch(
                        Number(
                            button.dataset.editPitch
                        )
                    );
                }
            );
        });

    container
        .querySelectorAll(
            "[data-deactivate-pitch]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {
                    deactivatePitch(
                        Number(
                            button.dataset.deactivatePitch
                        )
                    );
                }
            );
        });
}

function fillPitchSelects() {
    const selectIds = [
        "calendarPitch",
        "blockedPitch"
    ];

    selectIds.forEach(id => {

        const select =
            document.getElementById(id);

        if (!select) {
            return;
        }

        const current =
            select.value;

        if (id === "calendarPitch") {

            select.innerHTML =
                `<option value="">
                    Всички игрища
                 </option>`;

        } else {

            select.innerHTML =
                `<option value="">
                    Изберете игрище
                 </option>`;
        }

        pitches
            .filter(
                pitch => pitch.active
            )
            .forEach(pitch => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    pitch.id;

                option.textContent =
                    pitch.name;

                select.appendChild(
                    option
                );
            });

        if (
            current &&
            [...select.options]
                .some(
                    option =>
                        option.value ===
                        String(current)
                )
        ) {
            select.value =
                current;
        }
    });
}

async function addPitch() {
    const input =
        document.getElementById(
            "newPitchName"
        );

    const name =
        input?.value?.trim();

    if (!name) {
        alert(
            "Въведете име на игрището."
        );

        return;
    }

    try {

        await apiFetch(
            "/pitches",
            {
                method: "POST",

                body: JSON.stringify({
                    name
                })
            }
        );

        input.value = "";

        await loadPitches();
        await loadAllReservations();

        renderCalendar();
        await loadCalendar();
        await loadDashboard();

        alert(
            "Игрището е добавено."
        );

    } catch (error) {
        showError(error);
    }
}

async function editPitch(id) {
    const pitch =
        pitches.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!pitch) {
        return;
    }

    const newName =
        prompt(
            "Ново име на игрището:",
            pitch.name
        );

    if (newName === null) {
        return;
    }

    const name =
        newName.trim();

    if (!name) {
        alert(
            "Името не може да е празно."
        );

        return;
    }

    try {

        await apiFetch(
            `/pitches/${id}?name=${encodeURIComponent(name)}`,
            {
                method: "PUT"
            }
        );

        await loadPitches();

        renderCalendar();
        await loadCalendar();
        await loadDashboard();

        alert(
            "Името е променено."
        );

    } catch (error) {
        showError(error);
    }
}

async function deactivatePitch(id) {
    const pitch =
        pitches.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!pitch) {
        return;
    }

    const confirmed =
        confirm(
            `Сигурни ли сте, че искате да деактивирате "${pitch.name}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        await apiFetch(
            `/pitches/${id}`,
            {
                method: "DELETE"
            }
        );

        await loadPitches();

        renderCalendar();
        await loadCalendar();
        await loadDashboard();

        alert(
            "Игрището е деактивирано."
        );

    } catch (error) {
        showError(error);
    }
}

/* ======================================================
   RESERVATIONS
   ====================================================== */

async function loadAllReservations() {
    try {

        allReservations =
            await apiFetch(
                "/reservations"
            ) || [];

    } catch (error) {

        console.error(
            "Reservations error:",
            error
        );

        allReservations = [];
    }
}

function getConfirmedReservationsForDate(
    dateString,
    pitchId = null
) {
    return allReservations.filter(
        reservation => {

            if (
                reservation.date !==
                dateString
            ) {
                return false;
            }

            if (
                reservation.status !==
                "CONFIRMED"
            ) {
                return false;
            }

            if (
                pitchId !== null &&
                pitchId !== ""
            ) {
                return (
                    String(
                        reservation.pitch?.id
                    ) ===
                    String(pitchId)
                );
            }

            return true;
        }
    );
}

/* ======================================================
   DASHBOARD
   ====================================================== */

async function loadDashboard() {
    const container =
        document.getElementById(
            "dashboard"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading">
            Зареждане на дневния график...
        </div>
    `;

    const today =
        formatDate(new Date());

    try {

        const workingHours =
            await getWorkingHoursForDate(
                today
            );

        if (
            !workingHours ||
            workingHours.closed
        ) {

            container.innerHTML = `
                <div class="loading">
                    Обектът не работи днес.
                </div>
            `;

            return;
        }

        const activePitches =
            pitches.filter(
                pitch => pitch.active
            );

        if (!activePitches.length) {

            container.innerHTML = `
                <div class="loading">
                    Няма активни игрища.
                </div>
            `;

            return;
        }

        const dateReservations =
            getConfirmedReservationsForDate(
                today
            );

        const cards = [];

        for (
            const pitch of activePitches
            ) {

            const pitchReservations =
                dateReservations.filter(
                    reservation =>
                        String(
                            reservation.pitch?.id
                        ) ===
                        String(pitch.id)
                );

            const blocks =
                await getBlocks(
                    pitch.id,
                    today
                );

            cards.push(
                renderDailyPitch(
                    pitch,
                    pitchReservations,
                    blocks,
                    workingHours
                )
            );
        }

        container.innerHTML =
            cards.join("");

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="loading">
                Неуспешно зареждане на дневния график.
            </div>
        `;
    }
}

async function getBlocks(
    pitchId,
    dateString
) {
    try {

        return await apiFetch(
            `/blocked-times/pitch/${pitchId}?date=${dateString}`
        ) || [];

    } catch (error) {

        console.error(
            "Blocked times error:",
            error
        );

        return [];
    }
}

function renderDailyPitch(
    pitch,
    reservations,
    blocks,
    workingHours
) {

    const opening =
        timeToMinutes(
            workingHours.openingTime
        );

    const closing =
        timeToMinutes(
            workingHours.closingTime
        );

    const events = [];

    reservations.forEach(
        reservation => {

            const start =
                timeToMinutes(
                    reservation.startTime
                );

            const end =
                start +
                Number(
                    reservation.durationMinutes ||
                    0
                );

            events.push({
                start,
                end,
                type: "busy",
                label: "🔴 Заето"
            });
        }
    );

    blocks.forEach(
        block => {

            events.push({
                start:
                    timeToMinutes(
                        block.startTime
                    ),

                end:
                    timeToMinutes(
                        block.endTime
                    ),

                type: "blocked",

                label:
                    "🟡 Блокирано"
            });
        }
    );

    events.sort(
        (a, b) =>
            a.start - b.start
    );

    const rows = [];

    let current =
        opening;

    events.forEach(
        event => {

            if (
                event.end <= opening ||
                event.start >= closing
            ) {
                return;
            }

            const start =
                Math.max(
                    event.start,
                    opening
                );

            const end =
                Math.min(
                    event.end,
                    closing
                );

            if (
                start > current
            ) {

                rows.push(
                    createTimeRow(
                        minutesToTime(
                            current
                        ),

                        minutesToTime(
                            start
                        ),

                        "free",

                        "🟢 Свободно"
                    )
                );
            }

            if (
                end > current
            ) {

                rows.push(
                    createTimeRow(
                        minutesToTime(
                            start
                        ),

                        minutesToTime(
                            end
                        ),

                        event.type,

                        event.label
                    )
                );

                current =
                    Math.max(
                        current,
                        end
                    );
            }
        }
    );

    if (
        current < closing
    ) {

        rows.push(
            createTimeRow(
                minutesToTime(
                    current
                ),

                minutesToTime(
                    closing
                ),

                "free",

                "🟢 Свободно"
            )
        );
    }

    return `
        <div class="pitch-day-card">

            <h3>
                ⚽
                ${escapeHtml(pitch.name)}
            </h3>

            <div class="work-hours-info">
                Работно време:
                ${formatTime(
        workingHours.openingTime
    )}
                –
                ${formatTime(
        workingHours.closingTime
    )}
            </div>

            <div class="day-schedule">
                ${rows.join("")}
            </div>

        </div>
    `;
}

function createTimeRow(
    start,
    end,
    type,
    text
) {

    return `
        <div class="time-row">

            <span class="time">
                ${start} – ${end}
            </span>

            <span class="status ${type}">
                ${text}
            </span>

        </div>
    `;
}

/* ======================================================
   CALENDAR
   ====================================================== */

function previousMonth() {

    calendarDate =
        new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() - 1,
            1
        );

    renderCalendar();
    loadCalendar();
}

function nextMonth() {

    calendarDate =
        new Date(
            calendarDate.getFullYear(),
            calendarDate.getMonth() + 1,
            1
        );

    renderCalendar();
    loadCalendar();
}

function renderCalendar() {

    const container =
        document.getElementById(
            "calendar"
        );

    const title =
        document.getElementById(
            "calendarMonth"
        );

    if (!container) {
        return;
    }

    if (title) {

        title.textContent =
            calendarDate.toLocaleDateString(
                "bg-BG",
                {
                    month: "long",
                    year: "numeric"
                }
            );
    }

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();

    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();

    const mondayFirst =
        firstDay === 0
            ? 6
            : firstDay - 1;

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    let html = [
        "Пн",
        "Вт",
        "Ср",
        "Чт",
        "Пт",
        "Сб",
        "Нд"
    ]
        .map(
            day => `
                <div class="calendar-day-name">
                    ${day}
                </div>
            `
        )
        .join("");

    for (
        let i = 0;
        i < mondayFirst;
        i++
    ) {

        html += `
            <div class="calendar-day empty">
            </div>
        `;
    }

    const today =
        formatDate(
            new Date()
        );

    const selected =
        formatDate(
            selectedCalendarDate
        );

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );

        const dateString =
            formatDate(date);

        html += `
            <div
                class="calendar-day
                    ${
            dateString === today
                ? "today"
                : ""
        }
                    ${
            dateString === selected
                ? "selected"
                : ""
        }"
                data-date="${dateString}">

                <div class="day-number">
                    ${day}
                </div>

                <div
                    class="day-count"
                    id="count-${dateString}">
                </div>

            </div>
        `;
    }

    container.innerHTML =
        html;

    container
        .querySelectorAll(
            ".calendar-day[data-date]"
        )
        .forEach(
            dayElement => {

                dayElement.addEventListener(
                    "click",
                    async () => {

                        await selectCalendarDate(
                            dayElement.dataset.date
                        );
                    }
                );
            }
        );

    loadCalendarCounts();
}

async function loadCalendarCounts() {

    const pitchId =
        document.getElementById(
            "calendarPitch"
        )?.value || "";

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();

    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateString =
            formatDate(
                new Date(
                    year,
                    month,
                    day
                )
            );

        const element =
            document.getElementById(
                `count-${dateString}`
            );

        if (!element) {
            continue;
        }

        const count =
            getConfirmedReservationsForDate(
                dateString,
                pitchId ||
                null
            ).length;

        element.textContent =
            count
                ? `⚽ ${count}`
                : "";
    }
}

async function selectCalendarDate(
    dateString
) {

    selectedCalendarDate =
        new Date(
            dateString +
            "T00:00:00"
        );

    renderCalendar();

    await loadCalendar();
}

async function loadCalendar() {

    const selectedDate =
        formatDate(
            selectedCalendarDate
        );

    const pitchId =
        document.getElementById(
            "calendarPitch"
        )?.value || "";

    const title =
        document.getElementById(
            "selectedDateTitle"
        );

    if (title) {

        title.textContent =
            `Дата: ${formatDateBG(
                selectedDate
            )}`;
    }

    try {

        await loadAllReservations();

        const visibleReservations =
            getConfirmedReservationsForDate(
                selectedDate,
                pitchId ||
                null
            );

        const blocks = [];

        if (pitchId) {

            const pitchBlocks =
                await getBlocks(
                    Number(pitchId),
                    selectedDate
                );

            pitchBlocks.forEach(
                block => {

                    block.pitch =
                        pitches.find(
                            pitch =>
                                String(
                                    pitch.id
                                ) ===
                                String(
                                    pitchId
                                )
                        );

                    blocks.push(
                        block
                    );
                }
            );

        } else {

            const activePitches =
                pitches.filter(
                    pitch =>
                        pitch.active
                );

            for (
                const pitch of activePitches
                ) {

                const pitchBlocks =
                    await getBlocks(
                        pitch.id,
                        selectedDate
                    );

                pitchBlocks.forEach(
                    block => {

                        block.pitch =
                            pitch;

                        blocks.push(
                            block
                        );
                    }
                );
            }
        }

        renderCalendarReservations(
            visibleReservations,
            blocks,
            selectedDate
        );

    } catch (error) {

        showError(error);
    }
}

function renderCalendarReservations(
    reservations,
    blocks,
    selectedDate
) {

    const container =
        document.getElementById(
            "calendarReservations"
        );

    if (!container) {
        return;
    }

    let html = `
        <div class="calendar-details-header">

            <div>
                <h3>
                    График за
                    ${formatDateBG(
        selectedDate
    )}
                </h3>
            </div>

            <button
                class="primary-btn"
                type="button"
                id="detailsBlockButton">

                🔒 Блокирай период

            </button>

        </div>
    `;

    if (blocks.length) {

        html += `
            <h4>
                🔒 Блокирани периоди
            </h4>
        `;

        html += blocks
            .sort(
                (a, b) =>
                    a.startTime.localeCompare(
                        b.startTime
                    )
            )
            .map(
                block => `
                    <div
                        class="reservation-card blocked-card">

                        <div
                            class="reservation-main">

                            <div>

                                <div
                                    class="reservation-time">

                                    ${formatTime(
                    block.startTime
                )}
                                    –
                                    ${formatTime(
                    block.endTime
                )}

                                </div>

                                <div
                                    class="reservation-name">

                                    🔒
                                    ${escapeHtml(
                    block.reason ||
                    "Блокиран период"
                )}

                                </div>

                            </div>

                            <div>
                                ⚽
                                ${escapeHtml(
                    block.pitch?.name ||
                    "Игрище"
                )}
                            </div>

                        </div>

                    </div>
                `
            )
            .join("");
    }

    if (reservations.length) {

        html += `
            <h4>
                📅 Резервации
            </h4>
        `;

        html += reservations
            .sort(
                (a, b) =>
                    a.startTime.localeCompare(
                        b.startTime
                    )
            )
            .map(
                renderReservationCard
            )
            .join("");

    } else {

        html += `
            <div class="loading">
                Няма потвърдени резервации
                за тази дата.
            </div>
        `;
    }

    container.innerHTML =
        html;

    document
        .getElementById(
            "detailsBlockButton"
        )
        ?.addEventListener(
            "click",
            () => openBlockModal()
        );
}

function renderReservationCard(
    reservation
) {

    const end =
        calculateEndTime(
            reservation.startTime,
            reservation.durationMinutes
        );

    return `
        <div
            class="reservation-card"
            data-reservation-id="${reservation.id}">

            <div class="reservation-main">

                <div>

                    <div
                        class="reservation-time">

                        ${formatTime(
        reservation.startTime
    )}
                        –
                        ${end}

                    </div>

                    <div
                        class="reservation-name">

                        ${escapeHtml(
        reservation.customerName
    )}

                    </div>

                </div>

                <div>
                    ⚽
                    ${escapeHtml(
        reservation.pitch?.name ||
        "Игрище"
    )}
                </div>

            </div>

            <div class="reservation-meta">
                Натисни за подробности
            </div>

        </div>
    `;
}

/* ======================================================
   RESERVATION MODAL
   ====================================================== */

document.addEventListener(
    "click",
    event => {

        const card =
            event.target.closest(
                "[data-reservation-id]"
            );

        if (!card) {
            return;
        }

        const id =
            Number(
                card.dataset.reservationId
            );

        openReservation(id);
    }
);

async function openReservation(id) {

    let reservation =
        allReservations.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!reservation) {

        await loadAllReservations();

        reservation =
            allReservations.find(
                item =>
                    Number(item.id) ===
                    Number(id)
            );
    }

    if (!reservation) {

        alert(
            "Резервацията не е намерена."
        );

        return;
    }

    selectedReservation =
        reservation;

    const end =
        calculateEndTime(
            reservation.startTime,
            reservation.durationMinutes
        );

    const details =
        document.getElementById(
            "reservationDetails"
        );

    details.innerHTML = `

        <div class="detail-row">
            <span class="detail-label">
                Игрище
            </span>

            <span class="detail-value">
                ${escapeHtml(
        reservation.pitch?.name ||
        "Игрище"
    )}
            </span>
        </div>

        <div class="detail-row">
            <span class="detail-label">
                Дата
            </span>

            <span class="detail-value">
                ${escapeHtml(
        reservation.date
    )}
            </span>
        </div>

        <div class="detail-row">
            <span class="detail-label">
                Час
            </span>

            <span class="detail-value">
                ${formatTime(
        reservation.startTime
    )}
                –
                ${end}
            </span>
        </div>

        <div class="detail-row">
            <span class="detail-label">
                Име
            </span>

            <span class="detail-value">
                ${escapeHtml(
        reservation.customerName
    )}
            </span>
        </div>

        <div class="detail-row">
            <span class="detail-label">
                Телефон
            </span>

            <span class="detail-value">
                ${escapeHtml(
        reservation.customerPhone
    )}
            </span>
        </div>

        <div class="detail-row">
            <span class="detail-label">
                Email
            </span>

            <span class="detail-value">
                ${escapeHtml(
        reservation.customerEmail
    )}
            </span>
        </div>

        <div class="detail-row">
            <span class="detail-label">
                Статус
            </span>

            <span class="detail-value">
                ${escapeHtml(
        reservation.status
    )}
            </span>
        </div>
    `;

    document
        .getElementById(
            "reservationModal"
        )
        ?.classList.add("show");
}

function closeReservationModal() {

    document
        .getElementById(
            "reservationModal"
        )
        ?.classList.remove("show");

    selectedReservation =
        null;
}

async function cancelReservation() {

    if (!selectedReservation) {
        return;
    }

    const confirmed =
        confirm(
            "Сигурни ли сте, че искате да отмените резервацията?"
        );

    if (!confirmed) {
        return;
    }

    try {

        await apiFetch(
            `/reservations/${selectedReservation.id}/cancel`,
            {
                method: "PUT"
            }
        );

        closeReservationModal();

        await loadAllReservations();
        await loadDashboard();
        await loadCalendar();

        const blockedPitch =
            document.getElementById(
                "blockedPitch"
            );

        if (
            blockedPitch?.value
        ) {
            await loadBlockedTimeGrid();
        }

        alert(
            "Резервацията е отменена."
        );

    } catch (error) {

        showError(error);
    }
}

/* ======================================================
   BLOCKED TIME GRID
   ====================================================== */

async function loadBlockedTimeGrid() {

    const container =
        document.getElementById(
            "blockedTimeGrid"
        );

    const pitchId =
        document.getElementById(
            "blockedPitch"
        )?.value || "";

    const date =
        document.getElementById(
            "blockedDate"
        )?.value || "";

    if (!container) {
        return;
    }

    if (!pitchId || !date) {

        container.innerHTML = `
            <div class="loading">
                Изберете игрище и дата.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="loading">
            Зареждане на часовете...
        </div>
    `;

    try {

        const workingHours =
            await getWorkingHoursForDate(
                date
            );

        if (
            !workingHours ||
            workingHours.closed
        ) {

            container.innerHTML = `
                <div class="blocked-closed">
                    Обектът е затворен
                    през този ден.
                </div>
            `;

            return;
        }

        const blocks =
            await getBlocks(
                Number(pitchId),
                date
            );

        await loadAllReservations();

        const reservations =
            getConfirmedReservationsForDate(
                date,
                pitchId
            );

        const openingMinutes =
            timeToMinutes(
                workingHours.openingTime
            );

        const closingMinutes =
            timeToMinutes(
                workingHours.closingTime
            );

        const pitch =
            pitches.find(
                item =>
                    String(item.id) ===
                    String(pitchId)
            );

        let html = `
            <div class="blocked-time-header">

                <strong>
                    ⚽
                    ${escapeHtml(
            pitch?.name ||
            "Игрище"
        )}
                </strong>

                <span>
                    Работно време:
                    ${formatTime(
            workingHours.openingTime
        )}
                    –
                    ${formatTime(
            workingHours.closingTime
        )}
                </span>

            </div>

            <div class="blocked-time-slots">
        `;

        for (
            let start = openingMinutes;
            start < closingMinutes;
            start += 60
        ) {

            const end =
                start + 60;

            if (
                end > closingMinutes
            ) {
                break;
            }

            const startTime =
                minutesToTime(start);

            const endTime =
                minutesToTime(end);

            const blocked =
                blocks.find(
                    block =>
                        slotOverlaps(
                            start,
                            end,
                            timeToMinutes(
                                block.startTime
                            ),
                            timeToMinutes(
                                block.endTime
                            )
                        )
                );

            const reservation =
                reservations.find(
                    item =>
                        slotOverlaps(
                            start,
                            end,
                            timeToMinutes(
                                item.startTime
                            ),
                            timeToMinutes(
                                item.startTime
                            ) +
                            Number(
                                item.durationMinutes ||
                                0
                            )
                        )
                );

            if (blocked) {

                html += `
                    <button
                        class="blocked-time-slot blocked"
                        type="button"
                        data-block-id="${blocked.id}">

                        <span class="blocked-slot-left">

                            <span
                                class="blocked-slot-time">

                                ${startTime}
                                –
                                ${endTime}

                            </span>

                            <span
                                class="blocked-slot-reason">

                                ${escapeHtml(
                    blocked.reason ||
                    "Без причина"
                )}

                            </span>

                        </span>

                        <span
                            class="blocked-slot-status">

                            🟡 Блокирано

                            <small>
                                Натисни за отблокиране
                            </small>

                        </span>

                    </button>
                `;

            } else if (reservation) {

                html += `
                    <button
                        class="blocked-time-slot reserved"
                        type="button"
                        disabled>

                        <span
                            class="blocked-slot-left">

                            <span
                                class="blocked-slot-time">

                                ${startTime}
                                –
                                ${endTime}

                            </span>

                        </span>

                        <span
                            class="blocked-slot-status">

                            🔴 Резервирано

                        </span>

                    </button>
                `;

            } else {

                html += `
                    <button
                        class="blocked-time-slot free"
                        type="button"
                        data-start-time="${startTime}"
                        data-end-time="${endTime}">

                        <span
                            class="blocked-slot-left">

                            <span
                                class="blocked-slot-time">

                                ${startTime}
                                –
                                ${endTime}

                            </span>

                        </span>

                        <span
                            class="blocked-slot-status">

                            🟢 Свободно

                            <small>
                                Натисни за блокиране
                            </small>

                        </span>

                    </button>
                `;
            }
        }

        html += `
            </div>

            <div class="blocked-time-help">
                🟢 свободно ·
                🟡 блокирано ·
                🔴 резервирано
            </div>
        `;

        container.innerHTML =
            html;

        container
            .querySelectorAll(
                "[data-block-id]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            await unblockTime(
                                Number(
                                    button.dataset.blockId
                                )
                            );
                        }
                    );
                }
            );

        container
            .querySelectorAll(
                "[data-start-time]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            openBlockModal(
                                Number(pitchId),
                                date,
                                button.dataset.startTime,
                                button.dataset.endTime
                            );
                        }
                    );
                }
            );

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <div class="loading">
                Неуспешно зареждане
                на часовете.
            </div>
        `;
    }
}

function slotOverlaps(
    slotStart,
    slotEnd,
    eventStart,
    eventEnd
) {

    return (
        slotStart < eventEnd &&
        slotEnd > eventStart
    );
}

/* ======================================================
   BLOCK MODAL
   ====================================================== */

function getCurrentBlockPitchAndDate() {

    const calendarPitch =
        document.getElementById(
            "calendarPitch"
        )?.value || "";

    const blockedPitch =
        document.getElementById(
            "blockedPitch"
        )?.value || "";

    const blockedDate =
        document.getElementById(
            "blockedDate"
        )?.value || "";

    return {

        pitchId:
            Number(
                blockedPitch ||
                calendarPitch ||
                0
            ),

        date:
            blockedDate ||
            formatDate(
                selectedCalendarDate
            )
    };
}

async function openBlockModal(
    pitchId = null,
    date = null,
    startTime = null,
    endTime = null
) {

    const modal =
        document.getElementById(
            "blockTimeModal"
        );

    if (!modal) {
        return;
    }

    const context =
        getCurrentBlockPitchAndDate();

    const finalPitchId =
        pitchId ||
        context.pitchId;

    const finalDate =
        date ||
        context.date;

    if (
        !finalPitchId ||
        !finalDate
    ) {

        alert(
            "Моля, изберете игрище и дата."
        );

        return;
    }

    selectedBlockContext = {

        pitchId:
        finalPitchId,

        date:
        finalDate,

        startTime,
        endTime
    };

    const startInput =
        document.getElementById(
            "blockStartTime"
        );

    const endInput =
        document.getElementById(
            "blockEndTime"
        );

    const reasonInput =
        document.getElementById(
            "blockReason"
        );

    if (startInput) {

        startInput.value =
            startTime || "";
    }

    if (endInput) {

        endInput.value =
            endTime || "";
    }

    if (
        reasonInput &&
        !startTime &&
        !endTime
    ) {

        reasonInput.value =
            "";
    }

    const pitch =
        pitches.find(
            item =>
                String(item.id) ===
                String(finalPitchId)
        );

    const contextElement =
        document.getElementById(
            "blockContext"
        );

    if (contextElement) {

        contextElement.textContent =
            `⚽ ${pitch?.name || "Игрище"} · ${formatDateBG(finalDate)}`;
    }

    modal.classList.add(
        "show"
    );
}

function closeBlockModal() {

    document
        .getElementById(
            "blockTimeModal"
        )
        ?.classList.remove(
        "show"
    );

    selectedBlockContext = {

        pitchId: null,
        date: null,
        startTime: null,
        endTime: null
    };
}

async function createBlock() {

    const startTime =
        document.getElementById(
            "blockStartTime"
        )?.value || "";

    const endTime =
        document.getElementById(
            "blockEndTime"
        )?.value || "";

    const reason =
        document.getElementById(
            "blockReason"
        )
            ?.value
            ?.trim() || "";

    const pitchId =
        selectedBlockContext.pitchId;

    const date =
        selectedBlockContext.date;

    if (
        !pitchId ||
        !date
    ) {

        alert(
            "Моля, изберете игрище и дата."
        );

        return;
    }

    if (
        !startTime ||
        !endTime
    ) {

        alert(
            "Моля, изберете начален и краен час."
        );

        return;
    }

    if (
        timeToMinutes(startTime) >=
        timeToMinutes(endTime)
    ) {

        alert(
            "Крайният час трябва да бъде след началния."
        );

        return;
    }

    try {

        const workingHours =
            await getWorkingHoursForDate(
                date
            );

        if (
            !workingHours ||
            workingHours.closed
        ) {

            alert(
                "Обектът е затворен през този ден."
            );

            return;
        }

        const opening =
            timeToMinutes(
                workingHours.openingTime
            );

        const closing =
            timeToMinutes(
                workingHours.closingTime
            );

        const blockStart =
            timeToMinutes(
                startTime
            );

        const blockEnd =
            timeToMinutes(
                endTime
            );

        if (
            blockStart < opening ||
            blockEnd > closing
        ) {

            alert(
                `Периодът трябва да е в работното време: ${formatTime(
                    workingHours.openingTime
                )} – ${formatTime(
                    workingHours.closingTime
                )}.`
            );

            return;
        }

        await loadAllReservations();

        const reservations =
            getConfirmedReservationsForDate(
                date,
                pitchId
            );

        const overlapsReservation =
            reservations.some(
                reservation => {

                    const reservationStart =
                        timeToMinutes(
                            reservation.startTime
                        );

                    const reservationEnd =
                        reservationStart +
                        Number(
                            reservation.durationMinutes ||
                            0
                        );

                    return slotOverlaps(
                        blockStart,
                        blockEnd,
                        reservationStart,
                        reservationEnd
                    );
                }
            );

        if (overlapsReservation) {

            alert(
                "Не може да блокирате период, в който вече има резервация."
            );

            return;
        }

        const existingBlocks =
            await getBlocks(
                pitchId,
                date
            );

        const overlapsBlock =
            existingBlocks.some(
                block =>
                    slotOverlaps(
                        blockStart,
                        blockEnd,
                        timeToMinutes(
                            block.startTime
                        ),
                        timeToMinutes(
                            block.endTime
                        )
                    )
            );

        if (overlapsBlock) {

            alert(
                "Този период вече е блокиран."
            );

            return;
        }

        const params =
            new URLSearchParams({

                pitchId:
                    String(pitchId),

                date,

                startTime:
                    startTime + ":00",

                endTime:
                    endTime + ":00"
            });

        if (reason) {

            params.append(
                "reason",
                reason
            );
        }

        await apiFetch(
            `/blocked-times?${params.toString()}`,
            {
                method: "POST"
            }
        );

        const blockedPitch =
            document.getElementById(
                "blockedPitch"
            );

        if (blockedPitch) {

            blockedPitch.value =
                String(pitchId);
        }

        const blockedDate =
            document.getElementById(
                "blockedDate"
            );

        if (blockedDate) {

            blockedDate.value =
                date;
        }

        closeBlockModal();

        await loadBlockedTimeGrid();
        await loadDashboard();
        await loadCalendar();

        alert(
            "Периодът е блокиран успешно."
        );

    } catch (error) {

        showError(error);
    }
}

async function unblockTime(id) {

    const confirmed =
        confirm(
            "Сигурни ли сте, че искате да отблокирате този период?"
        );

    if (!confirmed) {
        return;
    }

    try {

        await apiFetch(
            `/blocked-times/${id}`,
            {
                method: "DELETE"
            }
        );

        await loadBlockedTimeGrid();
        await loadDashboard();
        await loadCalendar();

        alert(
            "Периодът е отблокиран."
        );

    } catch (error) {

        showError(error);
    }
}

/* ======================================================
   GLOBAL FUNCTIONS
   ====================================================== */

window.loadDashboard =
    loadDashboard;

window.previousMonth =
    previousMonth;

window.nextMonth =
    nextMonth;

window.selectCalendarDate =
    selectCalendarDate;

window.openReservation =
    openReservation;

window.cancelReservation =
    cancelReservation;

window.openBlockModal =
    openBlockModal;

window.closeBlockModal =
    closeBlockModal;

window.createBlock =
    createBlock;

window.unblockTime =
    unblockTime;

window.loadBlockedTimeGrid =
    loadBlockedTimeGrid;

window.apiFetch =
    apiFetch;

window.timeToMinutes =
    timeToMinutes;

window.minutesToTime =
    minutesToTime;

window.formatTime =
    formatTime;