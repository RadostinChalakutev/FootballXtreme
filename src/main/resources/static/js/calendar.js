// ======================================================
// CALENDAR
// ======================================================

let currentCalendarDate = new Date();
let selectedCalendarDate =
    new Date().toISOString().split("T")[0];

let selectedPitchId = null;


// ======================================================
// INIT
// ======================================================

async function initCalendar() {

    await loadCalendarPitches();

    renderCalendar();

    await loadCalendarCounts();
}


// ======================================================
// LOAD PITCHES
// ======================================================

async function loadCalendarPitches() {

    try {

        const pitches =
            await window.apiFetch("/pitches/admin");

        const select =
            document.getElementById("calendarPitch");

        if (!select) {
            return;
        }

        select.innerHTML = `
            <option value="">Всички игрища</option>
        `;

        pitches
            .filter(pitch => pitch.active)
            .forEach(pitch => {

                const option =
                    document.createElement("option");

                option.value = pitch.id;
                option.textContent = pitch.name;

                select.appendChild(option);
            });

        select.addEventListener(
            "change",
            async () => {

                selectedPitchId =
                    select.value
                        ? Number(select.value)
                        : null;

                await loadCalendarCounts();
            }
        );

    } catch (error) {

        console.error(
            "Error loading calendar pitches:",
            error
        );

        window.showError(error);
    }
}


// ======================================================
// RENDER CALENDAR
// ======================================================

function renderCalendar() {

    const calendar =
        document.getElementById("calendar");

    if (!calendar) {
        return;
    }

    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();

    const firstDay =
        new Date(year, month, 1);

    const lastDay =
        new Date(year, month + 1, 0);

    let startDay =
        firstDay.getDay();

    // Български календар:
    // Понеделник = 0
    startDay =
        startDay === 0
            ? 6
            : startDay - 1;

    const daysInMonth =
        lastDay.getDate();

    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    const monthName =
        currentCalendarDate.toLocaleDateString(
            "bg-BG",
            {
                month: "long",
                year: "numeric"
            }
        );

    const title =
        document.getElementById(
            "calendarMonth"
        );

    if (title) {
        title.textContent =
            monthName.charAt(0).toUpperCase() +
            monthName.slice(1);
    }

    const dayNames = [
        "Пон",
        "Вт",
        "Ср",
        "Чет",
        "Пет",
        "Съб",
        "Нед"
    ];

    let html = "";

    dayNames.forEach(day => {

        html += `
            <div class="calendar-day-name">
                ${day}
            </div>
        `;
    });

    for (
        let i = 0;
        i < startDay;
        i++
    ) {

        html += `
            <div class="calendar-day empty"></div>
        `;
    }

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const isToday =
            date === today;

        const isSelected =
            date === selectedCalendarDate;

        html += `
            <div
                class="calendar-day
                    ${isToday ? "today" : ""}
                    ${isSelected ? "selected" : ""}"
                data-date="${date}"
            >

                <div class="day-number">
                    ${day}
                </div>

                <div
                    class="day-count"
                    id="count-${date}"
                >
                    ...
                </div>

            </div>
        `;
    }

    calendar.innerHTML = html;

    document
        .querySelectorAll(
            ".calendar-day[data-date]"
        )
        .forEach(dayElement => {

            dayElement.addEventListener(
                "click",
                async () => {

                    selectedCalendarDate =
                        dayElement.dataset.date;

                    renderCalendar();

                    await loadCalendarCounts();

                    await loadReservationsForSelectedDate();
                }
            );
        });
}


// ======================================================
// LOAD CALENDAR COUNTS
// ======================================================

async function loadCalendarCounts() {

    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();

    const lastDay =
        new Date(
            year,
            month + 1,
            0
        ).getDate();

    for (
        let day = 1;
        day <= lastDay;
        day++
    ) {

        const date =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const countElement =
            document.getElementById(
                `count-${date}`
            );

        if (!countElement) {
            continue;
        }

        try {

            let url =
                `/reservations/date/${date}`;

            if (selectedPitchId) {
                url +=
                    `?pitchId=${selectedPitchId}`;
            }

            const reservations =
                await window.apiFetch(url);

            const activeReservations =
                reservations.filter(
                    reservation =>
                        reservation.status ===
                        "CONFIRMED"
                );

            if (
                activeReservations.length === 0
            ) {

                countElement.textContent =
                    "Няма резервации";

            } else {

                countElement.textContent =
                    `${activeReservations.length} резервации`;
            }

        } catch (error) {

            console.error(
                `Calendar count error for ${date}:`,
                error
            );

            countElement.textContent =
                "—";
        }
    }
}


// ======================================================
// LOAD SELECTED DATE
// ======================================================

async function loadReservationsForSelectedDate() {

    if (
        typeof window
            .loadReservationsForDate ===
        "function"
    ) {

        await window.loadReservationsForDate(
            selectedCalendarDate,
            selectedPitchId
        );
    }
}


// ======================================================
// PREVIOUS MONTH
// ======================================================

async function previousMonth() {

    currentCalendarDate =
        new Date(
            currentCalendarDate.getFullYear(),
            currentCalendarDate.getMonth() - 1,
            1
        );

    renderCalendar();

    await loadCalendarCounts();
}


// ======================================================
// NEXT MONTH
// ======================================================

async function nextMonth() {

    currentCalendarDate =
        new Date(
            currentCalendarDate.getFullYear(),
            currentCalendarDate.getMonth() + 1,
            1
        );

    renderCalendar();

    await loadCalendarCounts();
}


// ======================================================
// TODAY
// ======================================================

async function goToToday() {

    const today =
        new Date();

    currentCalendarDate =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    selectedCalendarDate =
        today.toISOString()
            .split("T")[0];

    renderCalendar();

    await loadCalendarCounts();

    await loadReservationsForSelectedDate();
}


// ======================================================
// EXPORT
// ======================================================

window.currentCalendarDate =
    currentCalendarDate;

window.selectedCalendarDate =
    selectedCalendarDate;

window.selectedPitchId =
    selectedPitchId;

window.initCalendar =
    initCalendar;

window.renderCalendar =
    renderCalendar;

window.loadCalendarPitches =
    loadCalendarPitches;

window.loadCalendarCounts =
    loadCalendarCounts;

window.loadReservationsForSelectedDate =
    loadReservationsForSelectedDate;

window.previousMonth =
    previousMonth;

window.nextMonth =
    nextMonth;

window.goToToday =
    goToToday;