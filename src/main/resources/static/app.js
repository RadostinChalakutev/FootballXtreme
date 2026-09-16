const API =
    window.location.protocol === "file:"
        ? "http://localhost:8080"
        : "";


/* =========================================================
   STATE
   ========================================================= */

let pitches = [];
let reservations = [];
let blockedTimes = [];

let selectedPitchId = null;
let selectedDate = null;
let selectedDuration = 60;
let selectedStartTime = null;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setMinimumDate();

        setupEventListeners();

        await loadPitches();

        updateBookingSummary();
    }
);


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEventListeners() {

    const pitch =
        document.getElementById("pitch");

    const date =
        document.getElementById("date");

    const duration =
        document.getElementById("duration");

    const reserveButton =
        document.getElementById("reserveButton");

    if (pitch) {

        pitch.addEventListener(
            "change",
            async () => {

                selectedPitchId =
                    pitch.value
                        ? Number(pitch.value)
                        : null;

                selectedStartTime = null;

                hideCustomerForm();

                updateBookingSummary();

                await loadAvailability();
            }
        );
    }


    if (date) {

        date.addEventListener(
            "change",
            async () => {

                selectedDate =
                    date.value;

                selectedStartTime = null;

                hideCustomerForm();

                updateBookingSummary();

                await loadAvailability();
            }
        );
    }


    if (duration) {

        duration.addEventListener(
            "change",
            async () => {

                selectedDuration =
                    Number(duration.value);

                selectedStartTime = null;

                hideCustomerForm();

                updateBookingSummary();

                await loadAvailability();
            }
        );
    }


    if (reserveButton) {

        reserveButton.addEventListener(
            "click",
            createReservation
        );
    }
}


/* =========================================================
   MINIMUM DATE
   ========================================================= */

function setMinimumDate() {

    const dateInput =
        document.getElementById("date");

    if (!dateInput) {
        return;
    }

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    const todayString =
        `${year}-${month}-${day}`;

    dateInput.min =
        todayString;

    dateInput.value =
        todayString;

    selectedDate =
        todayString;
}


/* =========================================================
   LOAD PITCHES
   ========================================================= */

async function loadPitches() {

    const pitchSelect =
        document.getElementById("pitch");

    if (!pitchSelect) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API}/api/pitches`
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        pitches =
            await response.json();

        pitchSelect.innerHTML =
            `
                <option value="">
                    Избери игрище
                </option>
            `;

        pitches.forEach(
            pitch => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    pitch.id;

                option.textContent =
                    pitch.name;

                pitchSelect.appendChild(
                    option
                );
            }
        );

    } catch (error) {

        console.error(
            "Pitch loading error:",
            error
        );

        pitchSelect.innerHTML =
            `
                <option value="">
                    Грешка при зареждане
                </option>
            `;

        showMessage(
            `Неуспешно зареждане на игрищата: ${error.message}`,
            "error"
        );
    }
}


/* =========================================================
   LOAD RESERVATIONS
   ========================================================= */

async function loadReservations() {

    try {

        const response =
            await fetch(
                `${API}/api/reservations`,{
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        reservations =
            await response.json();

    } catch (error) {

        console.error(
            "Reservation loading error:",
            error
        );

        reservations = [];
    }
}


/* =========================================================
   LOAD BLOCKED TIMES
   ========================================================= */

async function loadBlockedTimes() {

    if (
        !selectedPitchId ||
        !selectedDate
    ) {

        blockedTimes = [];

        return;
    }

    try {

        const response =
            await fetch(
                `${API}/api/blocked-times/pitch/${selectedPitchId}?date=${selectedDate}`
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        blockedTimes =
            await response.json();

    } catch (error) {

        console.error(
            "Blocked times loading error:",
            error
        );

        blockedTimes = [];
    }
}


/* =========================================================
   LOAD AVAILABILITY
   ========================================================= */

async function loadAvailability() {

    const hoursContainer =
        document.getElementById("hours");

    if (!hoursContainer) {
        return;
    }

    if (
        !selectedPitchId ||
        !selectedDate
    ) {

        hoursContainer.innerHTML = `
            <div class="hours-placeholder">

                <div class="placeholder-icon">
                    🕐
                </div>

                <strong>
                    Избери игрище и дата
                </strong>

                <span>
                    Свободните часове ще се покажат тук.
                </span>

            </div>
        `;

        return;
    }


    hoursContainer.innerHTML =
        `
            <div class="hours-placeholder">

                <div class="placeholder-icon">
                    ⏳
                </div>

                <strong>
                    Зареждане...
                </strong>

                <span>
                    Проверяваме свободните часове.
                </span>

            </div>
        `;


    await loadReservations();

    await loadBlockedTimes();

    renderHours();
}


/* =========================================================
   GENERATE HOURS
   ========================================================= */

function generateHours() {

    const hours = [];

    const seen =
        new Set();


    /*
     * Стандартни начални часове:
     *
     * 09:00
     * 10:00
     * 11:00
     * ...
     * 22:00
     */

    for (
        let hour = 9;
        hour < 23;
        hour++
    ) {

        const time =
            `${String(hour).padStart(2, "0")}:00`;

        hours.push(time);

        seen.add(time);
    }


    /*
     * Ако съществува резервация:
     *
     * 19:00 - 20:30
     *
     * добавяме:
     *
     * 20:30
     *
     * без да превръщаме целия график
     * в 30-минутни интервали.
     */

    reservations
        .filter(
            reservation => {

                if (
                    Number(reservation.pitch?.id) !==
                    Number(selectedPitchId)
                ) {
                    return false;
                }

                if (
                    reservation.date !==
                    selectedDate
                ) {
                    return false;
                }

                if (
                    reservation.status !==
                    "CONFIRMED"
                ) {
                    return false;
                }

                return true;
            }
        )
        .forEach(
            reservation => {

                const start =
                    timeToMinutes(
                        reservation.startTime
                    );

                const duration =
                    Number(
                        reservation.durationMinutes ||
                        0
                    );

                const end =
                    start + duration;


                /*
                 * Крайният час трябва
                 * да е вътре в работното време.
                 *
                 * 09:00 <= end < 23:00
                 */

                if (
                    end <= 9 * 60 ||
                    end >= 23 * 60
                ) {
                    return;
                }


                const endTime =
                    addMinutesToTime(
                        reservation.startTime,
                        duration
                    );


                if (
                    !seen.has(endTime)
                ) {

                    hours.push(
                        endTime
                    );

                    seen.add(
                        endTime
                    );
                }
            }
        );


    /*
     * Сортиране по час.
     */

    return hours.sort(
        (
            a,
            b
        ) =>
            timeToMinutes(a) -
            timeToMinutes(b)
    );
}


/* =========================================================
   RENDER HOURS
   ========================================================= */

function renderHours() {

    const container =
        document.getElementById(
            "hours"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";


    const hours =
        generateHours();


    hours.forEach(
        startTime => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "hour-button";

            button.textContent =
                startTime;


            const status =
                getHourStatus(
                    startTime
                );


            /*
             * PAST
             */

            if (
                status ===
                "past"
            ) {

                button.classList.add(
                    "past"
                );

                button.disabled =
                    true;

                button.title =
                    "Този час вече е изминал.";
            }


            /*
             * BUSY
             */

            else if (
                status ===
                "busy"
            ) {

                button.classList.add(
                    "busy"
                );

                button.disabled =
                    true;

                button.title =
                    "Часът е зает.";
            }


            /*
             * BLOCKED
             */

            else if (
                status ===
                "blocked"
            ) {

                button.classList.add(
                    "blocked"
                );

                button.disabled =
                    true;

                button.title =
                    "Часът е блокиран.";
            }


            /*
             * AVAILABLE
             */

            else {

                button.classList.add(
                    "available"
                );

                button.addEventListener(
                    "click",
                    () => {

                        selectHour(
                            startTime
                        );
                    }
                );
            }


            container.appendChild(
                button
            );
        }
    );


    if (
        hours.length === 0
    ) {

        container.innerHTML =
            `
                <div class="hours-placeholder">

                    <div class="placeholder-icon">
                        ⛔
                    </div>

                    <strong>
                        Няма налични часове
                    </strong>

                    <span>
                        За избраната дата няма свободни начала.
                    </span>

                </div>
            `;
    }
}


/* =========================================================
   HOUR STATUS
   ========================================================= */

function getHourStatus(
    startTime
) {

    const start =
        timeToMinutes(
            startTime
        );

    const end =
        start +
        selectedDuration;


    /*
     * =====================================================
     * PAST TIME
     * =====================================================
     */

    const now =
        new Date();

    const currentDate =
        `${now.getFullYear()}-${String(
            now.getMonth() + 1
        ).padStart(2, "0")}-${String(
            now.getDate()
        ).padStart(2, "0")}`;


    if (
        selectedDate ===
        currentDate
    ) {

        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();

        if (
            start <=
            currentMinutes
        ) {

            return "past";
        }
    }


    /*
     * =====================================================
     * RESERVATIONS
     * =====================================================
     */

    const reservationConflict =
        reservations.some(
            reservation => {

                if (
                    Number(
                        reservation.pitch?.id
                    ) !==
                    Number(
                        selectedPitchId
                    )
                ) {

                    return false;
                }


                if (
                    reservation.date !==
                    selectedDate
                ) {

                    return false;
                }


                if (
                    reservation.status !==
                    "CONFIRMED"
                ) {

                    return false;
                }


                const existingStart =
                    timeToMinutes(
                        reservation.startTime
                    );

                const existingEnd =
                    existingStart +
                    Number(
                        reservation.durationMinutes
                    );


                /*
                 * Реално припокриване:
                 *
                 * START < EXISTING END
                 * END   > EXISTING START
                 */

                return (
                    start <
                    existingEnd &&
                    end >
                    existingStart
                );
            }
        );


    if (
        reservationConflict
    ) {

        return "busy";
    }


    /*
     * =====================================================
     * BLOCKED TIMES
     * =====================================================
     */

    const blockedConflict =
        blockedTimes.some(
            blocked => {

                const blockedStart =
                    timeToMinutes(
                        blocked.startTime
                    );

                const blockedEnd =
                    timeToMinutes(
                        blocked.endTime
                    );


                return (
                    start <
                    blockedEnd &&
                    end >
                    blockedStart
                );
            }
        );


    if (
        blockedConflict
    ) {

        return "blocked";
    }


    /*
     * =====================================================
     * WORKING HOURS
     * =====================================================
     */

    if (
        start <
        9 * 60 ||
        end >
        23 * 60
    ) {

        return "blocked";
    }


    return "available";
}


/* =========================================================
   SELECT HOUR
   ========================================================= */

function selectHour(
    startTime
) {

    selectedStartTime =
        startTime;


    const buttons =
        document.querySelectorAll(
            ".hour-button"
        );


    buttons.forEach(
        button => {

            button.classList.remove(
                "selected"
            );
        }
    );


    buttons.forEach(
        button => {

            if (
                button.textContent.trim() ===
                startTime
            ) {

                button.classList.add(
                    "selected"
                );
            }
        }
    );


    updateBookingSummary();

    showCustomerForm();
}


/* =========================================================
   UPDATE BOOKING SUMMARY
   ========================================================= */

function updateBookingSummary() {

    const summary =
        document.querySelector(
            ".summary-card .summary-empty"
        );

    if (!summary) {
        return;
    }


    /*
     * Няма избран час.
     */

    if (
        !selectedPitchId ||
        !selectedDate ||
        !selectedStartTime
    ) {

        summary.classList.remove(
            "summary-selected"
        );

        summary.innerHTML = `
        <div class="summary-empty-icon">
        ⚽
        </div>

            <strong>
                Все още няма избран час
            </strong>

            <span>
                Избери свободен час от графика.
            </span>
        `;

    return;
}


    /*
     * Намираме игрището.
     */

    const pitch =
        pitches.find(
            pitch =>
                Number(
                    pitch.id
                ) ===
                Number(
                    selectedPitchId
                )
        );


    /*
     * Изчисляваме крайния час.
     */

    const endTime =
        addMinutesToTime(
            selectedStartTime,
            selectedDuration
        );


    /*
     * Форматираме датата.
     */

    const date =
        new Date(
            selectedDate +
            "T00:00:00"
        );


    const formattedDate =
        date.toLocaleDateString(
            "bg-BG",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );


    summary.classList.add(
        "summary-selected"
    );


    summary.innerHTML = `

    <div class="summary-check">
    ✓
    </div>

    <div class="summary-selected-title">
    Резервацията е готова
    </div>

    <div class="summary-details">

    <div class="summary-detail">

    <span>
    Игрище
    </span>

    <strong>
    ⚽ ${escapeHtml(
    pitch
    ? pitch.name
    : "Игрище"
    )}
    </strong>

    </div>


    <div class="summary-detail">

    <span>
    Дата
    </span>

    <strong>
    📅 ${escapeHtml(
    formattedDate
    )}
    </strong>

    </div>


    <div class="summary-detail">

    <span>
    Час
    </span>

    <strong
    class="summary-big-time"
    >
    🕐 ${selectedStartTime}
    –
    ${endTime}
    </strong>

    </div>


    <div class="summary-detail">

    <span>
    Продължителност
    </span>

    <strong>
    ⏱ ${selectedDuration} минути
    </strong>

    </div>

    </div>


    <div class="summary-ready">

    ✓ Свободният час е избран

    </div>
    `;
}


/* =========================================================
   SHOW CUSTOMER FORM
   ========================================================= */

function showCustomerForm() {

    const form =
        document.getElementById(
            "customerForm"
        );

    const selectedTime =
        document.getElementById(
            "selectedTime"
        );

    if (
        !form ||
        !selectedTime
    ) {
        return;
    }


    const endTime =
        addMinutesToTime(
            selectedStartTime,
            selectedDuration
        );


    selectedTime.innerHTML = `

    Избран час:

    <strong>
    ${selectedStartTime}
    -
    ${endTime}
    </strong>

    <br>

    Продължителност:

    ${selectedDuration}
    минути
    `;


    form.classList.remove(
    "hidden"
    );


    form.scrollIntoView(
    {
    behavior: "smooth",
    block: "center"
    }
    );
    }


    /* =========================================================
    HIDE CUSTOMER FORM
    ========================================================= */

    function hideCustomerForm() {

    const form =
    document.getElementById(
    "customerForm"
    );

    if (!form) {
    return;
    }

    form.classList.add(
    "hidden"
    );
    }


    /* =========================================================
    CREATE RESERVATION
    ========================================================= */

    async function createReservation() {

        /*
         * Проверка на избора.
         */

    if (
    !selectedPitchId ||
    !selectedDate ||
    !selectedStartTime
    ) {

    showMessage(
    "Моля, избери игрище, дата и час.",
    "error"
    );

    return;
    }


        /*
         * Полета.
         */

    const customerNameInput =
    document.getElementById(
    "customerName"
    );

    const customerPhoneInput =
    document.getElementById(
    "customerPhone"
    );

    const customerEmailInput =
    document.getElementById(
    "customerEmail"
    );


    const customerName =
    customerNameInput
    ? customerNameInput.value.trim()
    : "";


    const customerPhone =
    customerPhoneInput
    ? customerPhoneInput.value.trim()
    : "";


    const customerEmail =
    customerEmailInput
    ? customerEmailInput.value.trim()
    : "";


        /*
         * Validation.
         */

    if (!customerName) {

    showMessage(
    "Моля, въведи име.",
    "error"
    );

    customerNameInput?.focus();

    return;
    }


    if (!customerPhone) {

    showMessage(
    "Моля, въведи телефон.",
    "error"
    );

    customerPhoneInput?.focus();

    return;
    }


    if (!customerEmail) {

    showMessage(
    "Моля, въведи email.",
    "error"
    );

    customerEmailInput?.focus();

    return;
    }


        /*
         * Reservation body.
         */

    const reservationData = {

    pitchId:
    selectedPitchId,

    date:
    selectedDate,

    startTime:
    selectedStartTime,

    durationMinutes:
    selectedDuration,

    customerName:
    customerName,

    customerEmail:
    customerEmail,

    customerPhone:
    customerPhone
    };


    const button =
    document.getElementById(
    "reserveButton"
    );


        /*
         * Loading state.
         */

    if (button) {

    button.disabled =
    true;

    button.innerHTML = `
            <span>⏳</span>
            РЕЗЕРВИРАНЕ...
        `;
    }


    try {

    const response =
    await fetch(
    `${API}/api/reservations`,
    {
    method: "POST",

    headers: {
    "Content-Type":
    "application/json"
    },

    body:
    JSON.stringify(
    reservationData
    )
    }
    );


    if (!response.ok) {

    const text =
    await response.text();

    throw new Error(
    text ||
    `HTTP ${response.status}`
    );
    }


    const reservation =
    await response.json();


        /*
         * Success.
         */

    showMessage(
    `Резервацията е успешна! Номер: #${reservation.id}`,
    "success"
    );


    selectedStartTime =
    null;


    hideCustomerForm();


        /*
         * Clear inputs.
         */

    if (customerNameInput) {
    customerNameInput.value = "";
    }

    if (customerPhoneInput) {
    customerPhoneInput.value = "";
    }

    if (customerEmailInput) {
    customerEmailInput.value = "";
    }


        /*
         * Reload availability.
         */

    await loadAvailability();


        /*
         * Reset summary.
         */

    updateBookingSummary();


    } catch (error) {

    console.error(
        "Reservation error:",
        error
    );

    showMessage(
        `Резервацията не беше направена: ${error.message}`,
        "error"
    );

    } finally {

    if (button) {

    button.disabled =
    false;

    button.innerHTML = `
                <span>⚽</span>
                РЕЗЕРВИРАЙ СЕГА
            `;
    }
    }
    }


    /* =========================================================
    TIME HELPERS
    ========================================================= */

    function timeToMinutes(
    time
    ) {

    if (!time) {
    return 0;
    }


    const parts =
    time
    .substring(0, 5)
    .split(":");


    const hours =
    Number(
    parts[0]
    );


    const minutes =
    Number(
    parts[1]
    );


    return (
    hours * 60 +
    minutes
    );
    }


    function addMinutesToTime(
    time,
    minutes
    ) {

    const total =
    timeToMinutes(
    time
    ) +
    Number(
    minutes
    );


    const hours =
    Math.floor(
    total / 60
    );


    const mins =
    total % 60;


    return `
        ${String(hours).padStart(2, "0")}:
        ${String(mins).padStart(2, "0")}
    `.replace(
    /\s/g,
    ""
    );
    }


    /* =========================================================
    ESCAPE HTML
    ========================================================= */

    function escapeHtml(
    value
    ) {

    if (
    value === null ||
    value === undefined
    ) {

    return "";
    }


    return String(value)
    .replace(
    /&/g,
    "&amp;"
    )
    .replace(
    /</g,
    "&lt;"
    )
    .replace(
    />/g,
    "&gt;"
    )
    .replace(
    /"/g,
    "&quot;"
    )
    .replace(
    /'/g,
    "&#039;"
    );
    }


    /* =========================================================
    MESSAGE
    ========================================================= */

    function showMessage(
    text,
    type
    ) {

    const message =
    document.getElementById(
    "message"
    );

    if (!message) {
    return;
    }


    message.textContent =
    text;


    message.className =
    `message ${type}`;


    message.scrollIntoView(
    {
    behavior: "smooth",
    block: "center"
    }
    );
    }
/* =========================================================
AUTO REFRESH AVAILABILITY
========================================================= */

/* =========================================================
   AUTO REFRESH AVAILABILITY
   ========================================================= */

setInterval(async () => {

    if (!selectedPitchId || !selectedDate) {
        return;
    }

    try {
        await loadAvailability();

    } catch (error) {

        console.error(
            "Auto refresh error:",
            error
        );

    }

}, 5000);