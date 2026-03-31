
/**
 * NyxWell NGO Analytics Engine
 * High-fidelity data visualization for the Organizational Hub.
 */

export class NGODashboardAnalytics {
    constructor() {
        this.ctx = document.getElementById('moodTrendsChart');
        this.chart = null;
        
        if (this.ctx) {
            this.init();
        }
    }

    init() {
        if (!this.ctx) return;

        // Custom 'Space Mono' configuration for Chart.js
        const chartFont = {
            family: "'Space Mono', monospace",
            size: 11,
            weight: '700'
        };

        const data = {
            labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
            datasets: [{
                label: 'Community Wellbeing Index',
                data: [3.2, 3.8, 3.5, 4.2, 4.0, 4.5, 4.2],
                borderColor: '#7FA882', // Sage
                borderWidth: 3,
                stepped: true, // Unique Step-Line look
                tension: 0,
                pointRadius: 6,
                pointBackgroundColor: '#2C2112', // Text Dark
                pointBorderColor: '#7FA882',
                fill: false
            }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#2C2112',
                        titleFont: chartFont,
                        bodyFont: chartFont,
                        padding: 12,
                        cornerRadius: 0,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `INDEX: ${context.parsed.y} / 5.0`
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 5,
                        grid: {
                            color: 'rgba(44, 33, 18, 0.1)',
                            borderDash: [5, 5]
                        },
                        ticks: {
                            font: chartFont,
                            stepSize: 1
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: chartFont
                        }
                    }
                }
            }
        };

        this.chart = new Chart(this.ctx, config);
        console.log("NyxWell: NGO Analytics Engine Initialized.");
    }

    updateData(newData) {
        if (this.chart) {
            this.chart.data.datasets[0].data = newData;
            this.chart.update();
        }
    }
}

// Global hook for the App
window.initNGODashboardChart = () => {
    return new NGODashboardAnalytics();
};
