// ======================================================
// WORKING HOURS
// ======================================================

let workingHoursCache = [];


// ======================================================
// LOAD ALL WORKING HOURS
// ======================================================

async function loadWorkingHours() {

    try {

        workingHoursCache =
            await window.apiFetch("/working-hours");

        return workingHoursCache;

    } catch (error) {

        console.error(
            "Error loading working hours:",
            error
        );

        throw error;
    }
}


// ======================================================
// GET WORKING HOURS FOR DATE
// ======================================================

async function getWorkingHoursForDate(date) {

    if (!date) {
        return null;
    }

    const dayOfWeek =
        window.getDayOfWeek(date);

    // Първо проверяваме cache-а
    const cached =
        workingHoursCache.find(
            hours =>
                hours.dayOfWeek === dayOfWeek
        );

    if (cached) {
        return cached;
    }

    // Ако cache-ът е празен, зареждаме всички
    await loadWorkingHours();

    return (
        workingHoursCache.find(
            hours =>
                hours.dayOfWeek === dayOfWeek
        ) || null
    );
}


// ======================================================
// GET WORKING HOURS
// ======================================================

async function getWorkingHoursTimes(date) {

    const workingHours =
        await getWorkingHoursForDate(date);

    if (!workingHours) {

        return {
            closed: true,
            openingTime: null,
            closingTime: null
        };
    }

    return {
        closed: workingHours.closed === true,

        openingTime:
            workingHours.openingTime
                ? window.formatTime(
                    workingHours.openingTime
                )
                : null,

        closingTime:
            workingHours.closingTime
                ? window.formatTime(
                    workingHours.closingTime
                )
                : null
    };
}


// ======================================================
// GENERATE HOURLY SLOTS
// ======================================================

async function generateTimeSlots(date) {

    const hours =
        await getWorkingHoursTimes(date);

    if (
        hours.closed ||
        !hours.openingTime ||
        !hours.closingTime
    ) {
        return [];
    }

    const openingMinutes =
        window.timeToMinutes(
            hours.openingTime
        );

    const closingMinutes =
        window.timeToMinutes(
            hours.closingTime
        );

    const slots = [];

    for (
        let minutes = openingMinutes;
        minutes < closingMinutes;
        minutes += 60
    ) {

        const endMinutes =
            minutes + 60;

        // Не показваме час, който излиза
        // извън работното време.
        if (endMinutes > closingMinutes) {
            break;
        }

        slots.push({
            startTime:
                window.minutesToTime(minutes),

            endTime:
                window.minutesToTime(endMinutes)
        });
    }

    return slots;
}


// ======================================================
// WORKING DAY CHECK
// ======================================================

async function isWorkingDay(date) {

    const hours =
        await getWorkingHoursTimes(date);

    return !hours.closed;
}


// ======================================================
// WORKING HOURS MESSAGE
// ======================================================

async function getWorkingHoursMessage(date) {

    const hours =
        await getWorkingHoursTimes(date);

    if (hours.closed) {

        return "Обектът не работи този ден.";
    }

    return (
        `Работно време: ` +
        `${hours.openingTime} – ${hours.closingTime}`
    );
}


// ======================================================
// EXPORT
// ======================================================

window.workingHoursCache =
    workingHoursCache;

window.loadWorkingHours =
    loadWorkingHours;

window.getWorkingHoursForDate =
    getWorkingHoursForDate;

window.getWorkingHoursTimes =
    getWorkingHoursTimes;

window.generateTimeSlots =
    generateTimeSlots;

window.isWorkingDay =
    isWorkingDay;

window.getWorkingHoursMessage =
    getWorkingHoursMessage;