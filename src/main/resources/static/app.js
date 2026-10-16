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

    const todayString = venueNow().date;

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
            await secureFetch(
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

let availabilityRequest = 0;
let workingHours = null;
let availabilityReady = false;
function venueNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Sofia',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
    const values = Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return {date: values.year+'-'+values.month+'-'+values.day, minutes:Number(values.hour)*60+Number(values.minute)};
}
async function loadAvailability() {
    const request = ++availabilityRequest;
    const pitchId = selectedPitchId, date = selectedDate;
    const container = document.getElementById('hours');
    availabilityReady = false;
    if (!container) return;
    if (!pitchId || !date) { container.textContent = 'Избери игрище и дата.'; return; }
    try {
        const day = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][new Date(date+'T12:00:00').getDay()];
        const urls = ['/api/reservations/pitch/'+pitchId+'?date='+date, '/api/blocked-times/pitch/'+pitchId+'?date='+date, '/api/working-hours/'+day];
        const data = await Promise.all(urls.map(async url=> {
            const response=await secureFetch(API+url,{cache:'no-store'});
            if(!response.ok) throw new Error('Графикът не може да бъде зареден. Опитайте отново.');
            return response.json();
        }));
        if (request !== availabilityRequest) return;
        [reservations, blockedTimes, workingHours] = data;
        availabilityReady = true;
        if (selectedStartTime && getHourStatus(selectedStartTime) !== 'available') {
            selectedStartTime=null; hideCustomerForm(); updateBookingSummary();
            showMessage('Избраният час вече не е свободен. Изберете друг.','error');
        }
        renderHours();
    } catch(error) {
        if (request !== availabilityRequest) return;
        reservations=[]; blockedTimes=[]; workingHours=null;
        selectedStartTime=null; hideCustomerForm(); updateBookingSummary();
        container.textContent=error.message;
    }
}
function generateHours() {
    if (!availabilityReady || !workingHours || workingHours.closed) return [];
    const hours=[];
    for(let minutes=Math.ceil(timeToMinutes(workingHours.openingTime)/30)*30;
        minutes+selectedDuration<=timeToMinutes(workingHours.closingTime); minutes+=30) {
        hours.push(String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0'));
    }
    return hours;
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

function getHourStatus(startTime) {
    if (!availabilityReady || !workingHours || workingHours.closed) return 'blocked';
    const start=timeToMinutes(startTime), end=start+selectedDuration;
    const now=venueNow();
    if(selectedDate<now.date || (selectedDate===now.date && start<=now.minutes)) return 'past';
    if(start<timeToMinutes(workingHours.openingTime) || end>timeToMinutes(workingHours.closingTime)) return 'blocked';
    if(reservations.some(r=>start<timeToMinutes(r.startTime)+r.durationMinutes && end>timeToMinutes(r.startTime))) return 'busy';
    if(blockedTimes.some(r=>start<timeToMinutes(r.endTime) && end>timeToMinutes(r.startTime))) return 'blocked';
    return 'available';
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
    Избран час
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

    let bookingInFlight = false;
    async function createReservation() {
        if (bookingInFlight) return;
        if (!availabilityReady || getHourStatus(selectedStartTime) !== 'available') {
            showMessage('Изберете свободен час от актуалния график.','error'); return;
        }

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

    bookingInFlight = true;
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
    await secureFetch(
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
    (() => { try { return JSON.parse(text).detail || `HTTP ${response.status}`; } catch { return `HTTP ${response.status}`; } })()
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
    bookingInFlight = false;

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