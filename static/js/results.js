// Retrieve the Base64-encoded data from the query parameter
const urlParams = new URLSearchParams(window.location.search);
const base64Encoded = urlParams.get('d');

// Step 1: Ensure the Base64 string is URL-safe (reverse the encoding)
let base64Decoded = base64Encoded.replace(/-/g, '+').replace(/_/g, '/');

// Step 2: Decode the Base64 string back to a byte array
const decodedString = atob(base64Decoded);

// Step 3: Convert the decoded string back to a UTF-8 byte array
const utf8BytesDecoded = new Uint8Array(decodedString.split('').map(c => c.charCodeAt(0)));

// Step 4: Use TextDecoder to decode the byte array back into a UTF-8 string
const decoder = new TextDecoder();
const decodedDataString = decoder.decode(utf8BytesDecoded);

// Step 5: Parse the decoded string into a JavaScript object
const data = JSON.parse(decodedDataString);

if (document.readyState !== 'loading') {
    dataInit();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        dataInit();
    });
}

const dateFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const today = new Date();

function dataInit() {
    console.log(data);
    document.getElementById("person-0").innerHTML = data.messages_per_participant[0][0];
    document.getElementById("person-1").innerHTML = data.messages_per_participant[1][0];
    document.getElementById("total").innerHTML = data.total;
    document.getElementById("best_day_date").innerHTML = new Date(data.best_day.date).toLocaleDateString("en-UK", dateFormat);
    document.getElementById("best_day_messages").innerHTML = data.best_day.messages;
    document.getElementById("most_active_day").innerHTML = days[data.days[0][0]] + "s";
    dayChart();
    document.getElementById("most_active_month").innerHTML = months[data.months[0][0]];
    monthChart();
    let i = 0;
    let count = 0;
    while (today.getFullYear() - i > 2008 && count < Math.min(5, Object.keys(data.days_per_year).length)) {
        const year = today.getFullYear() - i;
        if (!data.days_per_year[year]) {
            i++;
            continue;
        }

        const message = count === 0 ? "You talked through" : "And";
        const percentage = (data.days_per_year[year] / daysInYear(year) * 100).toFixed(3);

        document.getElementById("page-6").innerHTML += `<h${count + 2}>${message} ${percentage}% of ${year}</h${count + 2}>`;

        i++;
        count++;
    }
    document.getElementById("first_chatter").innerHTML = data.first_chatter[0][0];
    document.getElementById("second_chatter").innerHTML = data.first_chatter[1][0];
    document.getElementById("chatter_gap").innerHTML = ((Math.abs(data.first_chatter[0][1] - data.first_chatter[1][1]) / data.first_chatter[0][1]) * 100).toFixed(3);
    document.getElementById("most_messages").innerHTML = data.messages_per_participant[0][0];
    document.getElementById("most_messages_percentage").innerHTML = ((data.messages_per_participant[0][1] / data.total) * 100).toFixed(3);
    document.getElementById("most_edits").innerHTML = data.messages_edit_per_participant[0][0];
    document.getElementById("edit_ratio").innerHTML = ((data.messages_edit_per_participant[0][1] / ((data.messages_per_participant[0][0] === data.messages_edit_per_participant[0][0])? data.messages_per_participant[0][1]: data.messages_per_participant[1][1])) * 100).toFixed(3);
    document.getElementById("streak-start").innerHTML = new Date(data.streak.startDate).toLocaleDateString("en-UK", dateFormat);
    document.getElementById("streak-end").innerHTML = new Date(data.streak.endDate).toLocaleDateString("en-UK", dateFormat);
    document.getElementById("streak").innerHTML = `${data.streak.streak} day${data.streak.streak === 1? "" : "s"}`;
    document.getElementById("total_emojis").innerHTML = data.top_10_emojis[0][1];
    emojiChart();
}

function dayChart() {
    const ctx = document.getElementById('day-chart');
    const daysData = Object.fromEntries(data.days);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(daysData).map(day => days[Number(day)]),
            datasets: [{
                label: "Messages per day",
                data: Object.values(daysData),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            aspectRatio: 1,
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    display: false,
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
}

function monthChart() {
    const ctx = document.getElementById('month-chart');
    const monthData = Object.fromEntries(data.months);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(monthData).map(day => months[Number(day)].substring(0, 3)),
            datasets: [{
                label: "Messages per month",
                data: Object.values(monthData),
                borderWidth: 3,
                lineTension: 0.5,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 0,
            }]
        },
        options: {
            aspectRatio: 1,
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
}

function wordsChart() {
    const canvas = document.getElementById("words-chart");

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const positions = [];

    function placeWord(word, size) {
        ctx.font = `${size}px Arial`;
        ctx.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
        const metrics = ctx.measureText(word);
        const w = metrics.width;
        const h = size * 0.8; // Approximate height (depends on the font)

        const step = 20;
        let angle = 0;
        let radius = 0;

        while (true) {
            const x = width / 2 + radius * Math.cos(angle) - w / 2;
            const y = height / 2 + radius * Math.sin(angle) - h / 2;

            const overlap = positions.some(pos => {
                return (
                    x < pos.x + pos.w &&
                    x + w > pos.x &&
                    y < pos.y + pos.h &&
                    y + h > pos.y
                );
            });

            if (!overlap) {
                ctx.fillText(word, x + w / 2, y + h / 2); 
                positions.push({ x, y, w, h });
                break;
            }

            angle += step * (Math.PI / 180);
            if (angle >= 2 * Math.PI) {
                angle = 0;
                radius += step;
            }
        }
    }

    data.top_50_words.forEach(word => {
        const size = Math.sqrt(word[1]) / 1.5;
        placeWord(word[0], size);
    });
}

function emojiChart() {
    const ctx = document.getElementById('emoji-chart');
    data.top_10_emojis.shift();
    const emojiData = Object.fromEntries(data.top_10_emojis);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(emojiData),
            datasets: [{
                label: "Times sent",
                data: Object.values(emojiData),
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            aspectRatio: 1,
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    display: false,
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
}

function daysInYear(year) {
    return ((year % 4 === 0 && year % 100 > 0) || year %400 == 0) ? 366 : 365;
}

let pageId = 0;

function nextPage() {
    document.getElementById(`page-${pageId}`).classList.remove("active");
    pageId++;
    document.getElementById(`page-${pageId}`).classList.add("active");

    if (pageId === 12) {
        wordsChart();
    }
}

function loadPage(newPageId) {
    document.getElementById(`page-${pageId}`).classList.remove("active");
    pageId = newPageId;
    document.getElementById(`page-${pageId}`).classList.add("active");
}