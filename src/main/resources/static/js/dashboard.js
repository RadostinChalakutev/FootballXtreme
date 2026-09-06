// ======================================================
// DASHBOARD
// ======================================================

async function loadDashboard() {

    const container =
        document.getElementById("dashboard");

    if (!container) {
        console.warn("Dashboard container not found.");
        return;
    }

    container.innerHTML = `
        <div class="loading">
            Зареждане...
        </div>
    `;

    try {

        const today =
            new Date();

        const date =
            today.toISOString()
                .split("T")[0];

        const reservations =
            await window.apiFetch(
                `/reservations/date/${date}`
            );

        const activeReservations =
            reservations.filter(
                reservation =>
                    reservation.status === "CONFIRMED"
            );

        if (activeReservations.length === 0) {

            container.innerHTML = `
                <div class="loading">
                    Няма резервации за днес.
                </div>
            `;

            return;
        }

        // Групираме по игрище
        const grouped = {};

        activeReservations.forEach(
            reservation => {

                const pitchId =
                    reservation.pitch?.id;

                if (!pitchId) {
                    return;
                }

                if (!grouped[pitchId]) {
                    grouped[pitchId] = {
                        pitch:
                        reservation.pitch,
                        reservations: []
                    };
                }

                grouped[pitchId]
                    .reservations
                    .push(reservation);
            }
        );

        let html = "";

        Object.values(grouped).forEach(
            group => {

                const pitch =
                    group.pitch;

                const reservations =
                    group.reservations
                        .sort(
                            (a, b) =>
                                a.startTime
                                    .localeCompare(
                                        b.startTime
                                    )
                        );

                html += `
                    <div class="pitch-day-card">

                        <h3>
                            ${window.escapeHtml(
                    pitch.name
                )}
                        </h3>

                        ${reservations
                    .map(
                        reservation => {

                            const start =
                                window.formatTime(
                                    reservation.startTime
                                );

                            const end =
                                window.calculateEndTime(
                                    reservation.startTime,
                                    reservation.durationMinutes
                                );

                            return `
                                        <div class="time-row">

                                            <span class="time">
                                                ${start} – ${end}
                                            </span>

                                            <span class="status busy">
                                                Заето
                                            </span>

                                        </div>
                                    `;
                        }
                    )
                    .join("")}

                    </div>
                `;
            }
        );

        container.innerHTML = `
            <div class="dashboard-grid">
                ${html}
            </div>
        `;

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        container.innerHTML = `
            <div class="loading">
                Неуспешно зареждане на Dashboard.
            </div>
        `;

        window.showError(error);
    }
}


// ======================================================
// REFRESH
// ======================================================

async function refreshDashboard() {
    await loadDashboard();
}


// ======================================================
// EXPORT
// ======================================================

window.loadDashboard =
    loadDashboard;

window.refreshDashboard =
    refreshDashboard;