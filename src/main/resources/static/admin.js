const API = "/api";

let pitches = [];
let reservations = [];
let selectedReservation = null;
let editingReservationId = null;

let calendarDate = new Date();
let selectedCalendarDate = new Date();


// ======================================================
// INIT
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    setToday();

    await loadPitches();

    await loadDashboard();

    renderCalendar();

    await loadCalendar();

});


// ======================================================
// HELPERS
// ======================================================

function formatDate(date) {

    return date.toISOString().split("T")[0];

}


function formatDateBG(date) {

    return date.toLocaleDateString("bg-BG", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

}


function formatTime(time) {

    if (!time) {
        return "";
    }

    return time.substring(0, 5);

}


function calculateEndTime(startTime, duration) {

    const [hours, minutes] =
        startTime.split(":").map(Number);

    const total =
        hours * 60 +
        minutes +
        Number(duration);

    const endHours =
        Math.floor(total / 60);

    const endMinutes =
        total % 60;

    return String(endHours).padStart(2, "0")
        + ":"
        + String(endMinutes).padStart(2, "0");
}


function showError(error) {

    console.error(error);

    alert(
        error.message ||
        "Възникна грешка."
    );

}


async function apiFetch(url, options = {}) {

    const response =
        await fetch(API + url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        });

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

    return response.json();
}


// ======================================================
// TODAY
// ======================================================

function setToday() {

    const today =
        new Date();

    document.getElementById(
        "todayDate"
    ).textContent =
        formatDateBG(today);

}


// ======================================================
// PITCHES
// ======================================================

async function loadPitches() {

    try {

        pitches =
            await apiFetch(
                "/pitches/admin"
            );

        renderPitches();

        fillPitchSelects();

    } catch (error) {

        showError(error);

    }

}


function renderPitches() {

    const container =
        document.getElementById(
            "pitches"
        );

    if (!pitches.length) {

        container.innerHTML =
            `<div class="loading">
                Няма добавени игрища.
             </div>`;

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
                            ⚽ ${escapeHtml(pitch.name)}
                        </div>

                        <div class="pitch-status">
                            ${active
                ? "🟢 Активно"
                : "🔴 Неактивно"}
                        </div>

                    </div>


                    <div class="pitch-actions">

                        <button
                            class="secondary-btn"
                            onclick="editPitch(${pitch.id})">

                            ✏️ Редактирай

                        </button>


                        ${
                active

                    ?

                    `<button
                                class="danger-btn"
                                onclick="deactivatePitch(${pitch.id})">

                                🔴 Деактивирай

                             </button>`

                    :

                    `<button
                                class="primary-btn"
                                onclick="activatePitch(${pitch.id})">

                                🟢 Активирай

                             </button>`
            }

                    </div>

                </div>
            `;

        }).join("");

}


function fillPitchSelects() {

    const selects = [
        "calendarPitch",
        "editPitch",
        "blockPitch"
    ];

    selects.forEach(id => {

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

            select.innerHTML = "";

        }


        pitches
            .filter(p => p.active)
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


        if (current) {
            select.value = current;
        }

    });

}


function openPitchModal(
    pitchId = null
) {

    document.getElementById(
        "pitchModal"
    ).classList.add("show");

    const title =
        document.getElementById(
            "pitchModalTitle"
        );

    if (pitchId) {

        const pitch =
            pitches.find(
                p => p.id === pitchId
            );

        editingPitchId =
            pitchId;

        title.textContent =
            "✏️ Редактиране на игрище";

        document.getElementById(
            "pitchName"
        ).value =
            pitch.name;

    } else {

        editingPitchId = null;

        title.textContent =
            "➕ Добави игрище";

        document.getElementById(
            "pitchName"
        ).value = "";

    }

}


let editingPitchId = null;


function closePitchModal() {

    document.getElementById(
        "pitchModal"
    ).classList.remove("show");

}


function editPitch(id) {

    openPitchModal(id);

}


async function savePitch() {

    const name =
        document.getElementById(
            "pitchName"
        ).value.trim();

    if (!name) {

        alert(
            "Въведи име на игрището."
        );

        return;
    }


    try {

        if (editingPitchId) {

            await apiFetch(
                `/pitches/${editingPitchId}?name=${encodeURIComponent(name)}`,
                {
                    method: "PUT"
                }
            );

        } else {

            await apiFetch(
                "/pitches",
                {
                    method: "POST",
                    body: JSON.stringify({
                        name: name
                    })
                }
            );

        }


        closePitchModal();

        await loadPitches();

        await loadDashboard();

        renderCalendar();

        await loadCalendar();

    } catch (error) {

        showError(error);

    }

}


async function activatePitch(id) {

    try {

        await apiFetch(
            `/pitches/${id}/activate`,
            {
                method: "PUT"
            }
        );

        await loadPitches();

        await loadDashboard();

    } catch (error) {

        showError(error);

    }

}


async function deactivatePitch(id) {

    if (
        !confirm(
            "Сигурен ли си, че искаш да деактивираш това игрище?"
        )
    ) {

        return;

    }


    try {

        await apiFetch(
            `/pitches/${id}/deactivate`,
            {
                method: "PUT"
            }
        );

        await loadPitches();

        await loadDashboard();

    } catch (error) {

        showError(error);

    }

}


// ======================================================
// DASHBOARD
// ======================================================

async function loadDashboard() {

    const container =
        document.getElementById(
            "dashboard"
        );

    const today =
        formatDate(
            new Date()
        );

    container.innerHTML =
        `<div class="loading">
            Зареждане...
         </div>`;


    try {

        const dateReservations =
            await apiFetch(
                `/reservations/date/${today}`
            );


        const cards =
            pitches
                .filter(p => p.active)
                .map(pitch => {

                    const pitchReservations =
                        dateReservations
                            .filter(
                                r =>
                                    r.pitch &&
                                    r.pitch.id === pitch.id
                            );


                    return renderDailyPitch(
                        pitch,
                        pitchReservations
                    );

                });


        container.innerHTML =
            cards.join("");


    } catch (error) {

        container.innerHTML =
            `<div class="loading">
                Неуспешно зареждане на графика.
             </div>`;

        console.error(error);

    }

}


function renderDailyPitch(
    pitch,
    pitchReservations
) {

    const blocks = [];

    const openingMinutes = 9 * 60;
    const closingMinutes = 23 * 60;


    pitchReservations
        .sort(
            (a, b) =>
                a.startTime.localeCompare(
                    b.startTime
                )
        );


    let current =
        openingMinutes;


    pitchReservations.forEach(
        reservation => {

            const [hours, minutes] =
                reservation.startTime
                    .split(":")
                    .map(Number);

            const start =
                hours * 60 + minutes;

            const end =
                start +
                reservation.durationMinutes;


            if (start > current) {

                blocks.push(
                    createTimeRow(
                        minutesToTime(current),
                        minutesToTime(start),
                        "free",
                        "Свободно"
                    )
                );

            }


            blocks.push(
                createTimeRow(
                    reservation.startTime,
                    minutesToTime(end),
                    "busy",
                    "Заето"
                )
            );


            current =
                Math.max(
                    current,
                    end
                );

        }
    );


    if (current < closingMinutes) {

        blocks.push(
            createTimeRow(
                minutesToTime(current),
                minutesToTime(closingMinutes),
                "free",
                "Свободно"
            )
        );

    }


    return `
        <div class="pitch-day-card">

            <h3>
                ⚽ ${escapeHtml(pitch.name)}
            </h3>

            ${blocks.join("")}

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


function minutesToTime(
    totalMinutes
) {

    const hours =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        totalMinutes % 60;

    return String(hours)
            .padStart(2, "0")
        + ":"
        + String(minutes)
            .padStart(2, "0");

}


// ======================================================
// CALENDAR
// ======================================================

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

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    document.getElementById(
        "calendarTitle"
    ).textContent =
        calendarDate.toLocaleDateString(
            "bg-BG",
            {
                month: "long",
                year: "numeric"
            }
        );


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    let mondayFirst =
        firstDay === 0
            ? 6
            : firstDay - 1;


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const dayNames = [
        "Пн",
        "Вт",
        "Ср",
        "Чт",
        "Пт",
        "Сб",
        "Нд"
    ];


    let html =
        dayNames.map(
            day =>
                `<div class="calendar-day-name">
                    ${day}
                 </div>`
        ).join("");


    for (
        let i = 0;
        i < mondayFirst;
        i++
    ) {

        html +=
            `<div class="calendar-day empty">
             </div>`;

    }


    const today =
        formatDate(
            new Date()
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


        const isToday =
            dateString === today;


        const isSelected =
            formatDate(
                selectedCalendarDate
            ) === dateString;


        html += `
            <div
                class="calendar-day
                    ${isToday ? "today" : ""}
                    ${isSelected ? "selected" : ""}"
                onclick="selectCalendarDate('${dateString}')">

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

}


async function loadCalendar() {

    const pitchId =
        document.getElementById(
            "calendarPitch"
        ).value;


    const selectedDate =
        formatDate(
            selectedCalendarDate
        );


    try {

        let data;


        if (pitchId) {

            data =
                await apiFetch(
                    `/reservations/pitch/${pitchId}?date=${selectedDate}`
                );

        } else {

            data =
                await apiFetch(
                    `/reservations/date/${selectedDate}`
                );

        }


        reservations =
            data;


        renderCalendarReservations();

    } catch (error) {

        showError(error);

    }

}


async function selectCalendarDate(
    dateString
) {

    selectedCalendarDate =
        new Date(
            dateString + "T00:00:00"
        );


    renderCalendar();

    await loadCalendar();

}


function renderCalendarReservations() {

    const container =
        document.getElementById(
            "calendarReservations"
        );


    if (!reservations.length) {

        container.innerHTML =
            `<div class="loading">
                Няма резервации за избраната дата.
             </div>`;

        return;

    }


    container.innerHTML =
        `
        <h3>
            Резервации за
            ${formatDateBG(selectedCalendarDate)}
        </h3>

        ${
            reservations
                .sort(
                    (a, b) =>
                        a.startTime
                            .localeCompare(
                                b.startTime
                            )
                )
                .map(
                    reservation =>
                        renderReservationCard(
                            reservation
                        )
                )
                .join("")
        }
        `;

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
            onclick="openReservation(${reservation.id})">

            <div class="reservation-main">

                <div>

                    <div class="reservation-time">
                        ${formatTime(
        reservation.startTime
    )}
                        –
                        ${end}
                    </div>

                    <div class="reservation-name">
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


// ======================================================
// RESERVATION DETAILS
// ======================================================

async function openReservation(id) {

    try {

        selectedReservation =
            await apiFetch(
                `/reservations/${id}`
            );

    } catch (error) {

        /*
         * Ако все още нямаме GET /{id},
         * взимаме резервацията от текущия списък.
         */

        selectedReservation =
            reservations.find(
                r => r.id === id
            );

    }


    if (!selectedReservation) {

        alert(
            "Резервацията не е намерена."
        );

        return;
    }


    const reservation =
        selectedReservation;


    const end =
        calculateEndTime(
            reservation.startTime,
            reservation.durationMinutes
        );


    document.getElementById(
        "reservationDetails"
    ).innerHTML = `

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
                ${reservation.date}
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

    `;


    document.getElementById(
        "reservationModal"
    ).classList.add("show");

}


function closeReservationModal() {

    document.getElementById(
        "reservationModal"
    ).classList.remove("show");

}


function editReservation() {

    if (!selectedReservation) {
        return;
    }


    const r =
        selectedReservation;


    editingReservationId =
        r.id;


    document.getElementById(
        "editPitch"
    ).value =
        r.pitch.id;


    document.getElementById(
        "editDate"
    ).value =
        r.date;


    document.getElementById(
        "editStartTime"
    ).value =
        formatTime(
            r.startTime
        );


    document.getElementById(
        "editDuration"
    ).value =
        r.durationMinutes;


    document.getElementById(
        "editName"
    ).value =
        r.customerName;


    document.getElementById(
        "editEmail"
    ).value =
        r.customerEmail;


    document.getElementById(
        "editPhone"
    ).value =
        r.customerPhone;


    closeReservationModal();


    document.getElementById(
        "editReservationModal"
    ).classList.add("show");

}


function closeEditReservationModal() {

    document.getElementById(
        "editReservationModal"
    ).classList.remove("show");

}


async function saveReservationChanges() {

    if (!editingReservationId) {
        return;
    }


    const body = {

        pitchId: Number(
            document.getElementById(
                "editPitch"
            ).value
        ),

        date:
        document.getElementById(
            "editDate"
        ).value,

        startTime:
            document.getElementById(
                "editStartTime"
            ).value + ":00",

        durationMinutes:
            Number(
                document.getElementById(
                    "editDuration"
                ).value
            ),

        customerName:
        document.getElementById(
            "editName"
        ).value,

        customerEmail:
        document.getElementById(
            "editEmail"
        ).value,

        customerPhone:
        document.getElementById(
            "editPhone"
        ).value

    };


    try {

        await apiFetch(
            `/reservations/${editingReservationId}`,
            {
                method: "PUT",
                body: JSON.stringify(body)
            }
        );


        closeEditReservationModal();


        await loadDashboard();

        await loadCalendar();

        alert(
            "Резервацията е редактирана успешно."
        );

    } catch (error) {

        showError(error);

    }

}


async function cancelReservation() {

    if (!selectedReservation) {
        return;
    }


    if (
        !confirm(
            "Сигурен ли си, че искаш да отмениш резервацията?"
        )
    ) {

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

        await loadDashboard();

        await loadCalendar();

        alert(
            "Резервацията е отменена."
        );

    } catch (error) {

        showError(error);

    }

}


async function deleteReservation() {

    if (!selectedReservation) {
        return;
    }


    if (
        !confirm(
            "Това ще изтрие резервацията окончателно. Продължаваме ли?"
        )
    ) {

        return;

    }


    try {

        await apiFetch(
            `/reservations/${selectedReservation.id}`,
            {
                method: "DELETE"
            }
        );


        closeReservationModal();

        await loadDashboard();

        await loadCalendar();

        alert(
            "Резервацията е изтрита."
        );

    } catch (error) {

        showError(error);

    }

}


// ======================================================
// BLOCKING
// ======================================================

function openBlockModal() {

    document.getElementById(
        "blockDate"
    ).value =
        formatDate(
            selectedCalendarDate
        );


    document.getElementById(
        "blockModal"
    ).classList.add("show");

}


function closeBlockModal() {

    document.getElementById(
        "blockModal"
    ).classList.remove("show");

}


async function createBlock() {

    const pitchId =
        document.getElementById(
            "blockPitch"
        ).value;

    const date =
        document.getElementById(
            "blockDate"
        ).value;

    const startTime =
        document.getElementById(
            "blockStartTime"
        ).value;

    const endTime =
        document.getElementById(
            "blockEndTime"
        ).value;

    const reason =
        document.getElementById(
            "blockReason"
        ).value;


    if (
        !pitchId ||
        !date ||
        !startTime ||
        !endTime
    ) {

        alert(
            "Попълни всички задължителни полета."
        );

        return;
    }


    if (
        startTime >= endTime
    ) {

        alert(
            "Крайният час трябва да е след началния."
        );

        return;
    }


    try {

        const params =
            new URLSearchParams({

                pitchId: pitchId,
                date: date,
                startTime: startTime + ":00",
                endTime: endTime + ":00"

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


        closeBlockModal();


        await loadDashboard();

        await loadCalendar();

        alert(
            "Периодът е блокиран успешно."
        );

    } catch (error) {

        showError(error);

    }

}


// ======================================================
// AVAILABLE PITCHES
// ======================================================

async function searchAvailablePitches() {

    const date =
        document.getElementById(
            "searchDate"
        ).value;

    const startTime =
        document.getElementById(
            "searchStartTime"
        ).value;

    const duration =
        Number(
            document.getElementById(
                "searchDuration"
            ).value
        );


    if (
        !date ||
        !startTime
    ) {

        alert(
            "Избери дата и час."
        );

        return;
    }


    const endTime =
        calculateEndTime(
            startTime,
            duration
        );


    const container =
        document.getElementById(
            "availablePitches"
        );


    container.innerHTML =
        `<div class="loading">
            Проверка...
         </div>`;


    try {

        const dateReservations =
            await apiFetch(
                `/reservations/date/${date}`
            );


        const results =
            pitches
                .filter(
                    p => p.active
                )
                .map(
                    pitch => {

                        const pitchReservations =
                            dateReservations
                                .filter(
                                    r =>
                                        r.pitch &&
                                        r.pitch.id === pitch.id
                                );


                        const conflict =
                            pitchReservations.some(
                                r => {

                                    const existingStart =
                                        r.startTime;

                                    const existingEnd =
                                        calculateEndTime(
                                            r.startTime,
                                            r.durationMinutes
                                        );


                                    return (
                                        startTime <
                                        existingEnd
                                        &&
                                        endTime >
                                        existingStart
                                    );

                                }
                            );


                        return {

                            pitch,
                            free: !conflict

                        };

                    }
                );


        container.innerHTML =
            results
                .map(
                    result => `

                        <div
                            class="available-pitch
                                ${
                        result.free
                            ? "free"
                            : "busy"
                    }">

                            <strong>
                                ⚽
                                ${escapeHtml(
                        result.pitch.name
                    )}
                            </strong>

                            <div>
                                ${
                        result.free
                            ? "🟢 Свободно"
                            : "🔴 Заето"
                    }
                            </div>

                        </div>

                    `
                )
                .join("");


    } catch (error) {

        showError(error);

    }

}


// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}