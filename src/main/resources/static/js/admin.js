import "./utils.js";
import "./working-hours.js";
import "./dashboard.js";
import "./calendar.js";
import "./reservations.js";
import "./pitches.js";
import "./blocked-times.js";

document.addEventListener("DOMContentLoaded", async () => {

    try {

        // Зареждаме основните данни
        await window.loadPitches();

        // Dashboard за днешния ден
        await window.loadDashboard();

        // Календар
        window.renderCalendar();

        await window.loadCalendarCounts();

    } catch (error) {

        console.error(
            "Admin panel initialization error:",
            error
        );

        if (typeof window.showError === "function") {
            window.showError(error);
        } else {
            alert("Възникна грешка при зареждането на Admin панела.");
        }
    }

});