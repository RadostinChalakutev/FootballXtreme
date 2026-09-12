const API =
    window.location.protocol === "file:"
        ? "http://localhost:8080"
        : `${window.location.origin}`;

let clientConfig = null;

/* =========================
   STATE
   ========================= */

let pitches = [];
let reservations = [];
let blockedTimes = [];

let selectedPitchId = null;
let selectedDate = null;
let selectedDuration = 60;
let selectedStartTime = null;


/* =========================
   INITIALIZATION
   ========================= */

document.addEventListener("DOMContentLoaded", async () => {

    setMinimumDate();

    await loadClientConfig();
    await loadPitches();

    setupEventListeners();
});


/* =========================
   CLIENT CONFIG
   ========================= */

async function loadClientConfig() {

    try {

        const response =
            await fetch(`${API}/api/config`);

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        clientConfig =
            await response.json();

        console.log(
            "Client configuration loaded:",
            clientConfig
        );

        applyClientConfig();

    } catch (error) {

        console.error(
            "Client configuration error:",
            error
        );

        showMessage(
            "Неуспешно зареждане на конфигурацията.",
            "error"
        );
    }
}


/* =========================
   APPLY CLIENT CONFIG
   ========================= */

function applyClientConfig() {

    if (!clientConfig) {
        return;
    }

    /*
     * Browser title
     */
    document.title =
        `${clientConfig.name} - Резервация`;


    /*
     * Logo
     */
    const logo =
        document.querySelector(".logo");

    if (logo && clientConfig.name) {

        logo.textContent =
            clientConfig.name;
    }


    /*
     * Phone
     */
    const phoneElements =
        document.querySelectorAll(
            "[data-client-phone]"
        );

    phoneElements.forEach(element => {

        element.textContent =
            clientConfig.phone || "";

    });


    /*
     * Email
     */
    const emailElements =
        document.querySelectorAll(
            "[data-client-email]"
        );

    emailElements.forEach(element => {

        element.textContent =
            clientConfig.email || "";

    });


    /*
     * Address
     */
    const addressElements =
        document.querySelectorAll(
            "[data-client-address]"
        );

    addressElements.forEach(element => {

        element.textContent =
            clientConfig.address || "";

    });
}


/* =========================
   EVENT LISTENERS
   ========================= */

function setupEventListeners() {

    const pitch =
        document.getElementById("pitch");

    const date =
        document.getElementById("date");

    const duration =
        document.getElementById("duration");


    pitch.addEventListener(
        "change",
        async () => {

            selectedPitchId =
                pitch.value
                    ? Number(pitch.value)
                    : null;

            selectedStartTime = null;

            hideCustomerForm();

            await loadAvailability();
        }
    );


    date.addEventListener(
        "change",
        async () => {

            selectedDate =
                date.value;

            selectedStartTime = null;

            hideCustomerForm();

            await loadAvailability();
        }
    );


    duration.addEventListener(
        "change",
        async () => {

            selectedDuration =
                Number(duration.value);

            selectedStartTime = null;

            hideCustomerForm();

            await loadAvailability();
        }
    );

}


/* =========================
   MINIMUM DATE
   ========================= */

function setMinimumDate() {

    const dateInput =
        document.getElementById("date");


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


/* =========================
   LOAD PITCHES
   ========================= */

async function loadPitches() {

    const pitchSelect =
        document.getElementById("pitch");


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
            '<option value="">Избери игрище</option>';


        pitches.forEach(pitch => {

            const option =
                document.createElement("option");


            option.value =
                pitch.id;


            option.textContent =
                pitch.name;


            pitchSelect.appendChild(
                option
            );

        });


    } catch (error) {

        pitchSelect.innerHTML =
            '<option value="">Грешка при зареждане</option>';


        showMessage(
            `Неуспешно зареждане на игрищата: ${error.message}`,
            "error"
        );

    }

}


/* =========================
   LOAD RESERVATIONS
   ========================= */

async function loadReservations() {

    try {

        const response =
            await fetch(
                `${API}/api/reservations`
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


/* =========================
   LOAD BLOCKED TIMES
   ========================= */

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


/* =========================
   LOAD AVAILABILITY
   ========================= */

async function loadAvailability() {

    const hoursContainer =
        document.getElementById("hours");


    if (
        !selectedPitchId ||
        !selectedDate
    ) {

        hoursContainer.innerHTML = `

            <p class="hint">
                Избери игрище и дата.
            </p>

        `;

        return;
    }


    hoursContainer.innerHTML =
        `<p class="hint">Зареждане...</p>`;


    await loadReservations();

    await loadBlockedTimes();

    renderHours();

}


/* =========================
   GENERATE HOURS
   ========================= */

function generateHours() {
    const hours = [];
    const seen = new Set();

    // Стандартни почасови начала: 09:00 - 22:00
    for (let hour = 9; hour < 23; hour++) {
        const time = `${String(hour).padStart(2, "0")}:00`;

        hours.push(time);
        seen.add(time);
    }

    // Добавяме само реалните крайни часове на
    // потвърдените резервации за избраното игрище и дата
    reservations
        .filter(reservation => {
            if (!reservation.pitch?.id) {
                return false;
            }

            if (Number(reservation.pitch.id) !== Number(selectedPitchId)) {
                return false;
            }

            if (reservation.date !== selectedDate) {
                return false;
            }

            if (reservation.status !== "CONFIRMED") {
                return false;
            }

            return true;
        })
        .forEach(reservation => {
            const startMinutes = timeToMinutes(
                reservation.startTime
            );

            const durationMinutes = Number(
                reservation.durationMinutes || 0
            );

            const endMinutes =
                startMinutes + durationMinutes;

            // Краят трябва да е след началото на работния ден
            // и преди 23:00.
            if (endMinutes <= 9 * 60) {
                return;
            }

            if (endMinutes >= 23 * 60) {
                return;
            }

            const endTime = addMinutesToTime(
                reservation.startTime,
                durationMinutes
            );

            // Добавяме само ако този час още не съществува
            if (!seen.has(endTime)) {
                hours.push(endTime);
                seen.add(endTime);
            }
        });

    // Подреждане по час
    hours.sort(
        (a, b) =>
            timeToMinutes(a) -
            timeToMinutes(b)
    );

    return hours;
}


/* =========================
   RENDER HOURS
   ========================= */

function renderHours() {

    const container =
        document.getElementById("hours");


    container.innerHTML = "";


    const hours =
        generateHours();


    hours.forEach(startTime => {

        const button =
            document.createElement("button");


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


        if (status === "busy") {

            button.classList.add(
                "busy"
            );


            button.disabled =
                true;


            button.title =
                "Часът е зает";


        } else if (
            status === "blocked"
        ) {

            button.classList.add(
                "blocked"
            );


            button.disabled =
                true;


            button.title =
                "Часът е блокиран";


        } else {

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

    });


    if (
        hours.length === 0
    ) {

        container.innerHTML =
            "<p>Няма налични часове.</p>";

    }

}


/* =========================
   HOUR STATUS
   ========================= */

function getHourStatus(startTime) {

    const start =
        timeToMinutes(
            startTime
        );


    const end =
        start +
        selectedDuration;


    /*
     * Проверка за резервации
     */

    const reservationConflict =
        reservations.some(
            reservation => {

                if (
                    reservation.pitch?.id !==
                    selectedPitchId
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


                return (
                    start < existingEnd &&
                    end > existingStart
                );

            }
        );


    if (reservationConflict) {

        return "busy";

    }


    /*
     * Проверка за блокировки
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
                    start < blockedEnd &&
                    end > blockedStart
                );

            }
        );


    if (blockedConflict) {

        return "blocked";

    }


    /*
     * Проверка за работното време
     */

    if (
        start < 9 * 60 ||
        end > 23 * 60
    ) {

        return "blocked";

    }


    return "available";

}


/* =========================
   SELECT HOUR
   ========================= */

function selectHour(startTime) {

    selectedStartTime =
        startTime;


    const buttons =
        document.querySelectorAll(
            ".hour-button"
        );


    buttons.forEach(button => {

        button.classList.remove(
            "selected"
        );

    });


    buttons.forEach(button => {

        if (
            button.textContent ===
            startTime
        ) {

            button.classList.add(
                "selected"
            );

        }

    });


    showCustomerForm();

}


/* =========================
   SHOW CUSTOMER FORM
   ========================= */

function showCustomerForm() {

    const form =
        document.getElementById(
            "customerForm"
        );


    const selectedTime =
        document.getElementById(
            "selectedTime"
        );


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
        ${selectedDuration} минути

    `;


    form.classList.remove(
        "hidden"
    );


    form.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================
   HIDE CUSTOMER FORM
   ========================= */

function hideCustomerForm() {

    const form =
        document.getElementById(
            "customerForm"
        );


    form.classList.add(
        "hidden"
    );

}


/* =========================
   CREATE RESERVATION
   ========================= */

async function createReservation() {

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


    const customerName =
        document.getElementById(
            "customerName"
        ).value.trim();


    const customerPhone =
        document.getElementById(
            "customerPhone"
        ).value.trim();


    const customerEmail =
        document.getElementById(
            "customerEmail"
        ).value.trim();


    if (!customerName) {

        showMessage(
            "Моля, въведи име.",
            "error"
        );

        return;

    }


    if (!customerPhone) {

        showMessage(
            "Моля, въведи телефон.",
            "error"
        );

        return;

    }


    if (!customerEmail) {

        showMessage(
            "Моля, въведи email.",
            "error"
        );

        return;

    }


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


    button.disabled =
        true;


    button.textContent =
        "Резервиране...";


    try {

        const response =
            await fetch(
                `${API}/api/reservations`,
                {

                    method:
                        "POST",

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


        showMessage(
            `Резервацията е успешна! Номер: #${reservation.id}`,
            "success"
        );


        selectedStartTime =
            null;


        hideCustomerForm();


        await loadAvailability();


        document.getElementById(
            "customerName"
        ).value = "";


        document.getElementById(
            "customerPhone"
        ).value = "";


        document.getElementById(
            "customerEmail"
        ).value = "";


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

        button.disabled =
            false;


        button.textContent =
            "⚽ РЕЗЕРВИРАЙ";

    }

}


/* =========================
   TIME HELPERS
   ========================= */

function timeToMinutes(time) {

    if (!time) {

        return 0;

    }


    const parts =
        time
            .substring(0, 5)
            .split(":");


    const hours =
        Number(parts[0]);


    const minutes =
        Number(parts[1]);


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
        timeToMinutes(time) +
        Number(minutes);


    const hours =
        Math.floor(
            total / 60
        );


    const mins =
        total % 60;


    return `
        ${String(hours).padStart(2, "0")}:
        ${String(mins).padStart(2, "0")}
    `.replace(/\s/g, "");

}


/* =========================
   MESSAGE
   ========================= */

function showMessage(
    text,
    type
) {

    const message =
        document.getElementById(
            "message"
        );


    message.textContent =
        text;


    message.className =
        `message ${type}`;


    message.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}