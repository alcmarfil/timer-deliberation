const panelsData = {
    'OM-Panel': [
        { title: "Part 1: Introduce OM Panel", duration: 15 },
        { title: "Part 2: Address the Panel", duration: 75 },
        { title: "Part 3: Preamble, Vision, and Mission", duration: 180 },
        { title: "Part 4: Org Logo and Facts About YSES", duration: 120 },
        { title: "Part 5: One-on-One Interviews & BINGO", duration: 90 },
        { title: "Part 6: Resume Placement", duration: 60 },
        { title: "Part 7: Closing/Grace Period", duration: 15 }
    ],
    'L-Panel': [
        { title: "Part 1: Welcoming", duration: 30 },
        { title: "Part 2: Address the Panel", duration: 90 },
        { title: "Part 3: Practical Challenge", duration: 120 },
        { title: "Part 4: Leadership Definition", duration: 120 },
        { title: "Part 5: Leadership Dilemma", duration: 90 },
        { title: "Part 6: Reflection", duration: 90 },
        { title: "Part 7: Closing", duration: 15 }
    ],
    'P-Panel': [
        { title: "Part 1: Introduce P Panel/Rules", duration: 30 },
        { title: "Part 2: Address the panel", duration: 120 },
        { title: "Part 3: Professionalism Q&A", duration: 150 },
        { title: "Part 4: Give/Take Criticisms", duration: 150 },
        { title: "Part 5: Reflection", duration: 60 },
        { title: "Part 6: Closing/Grace period", duration: 30 }
    ]
};

const panelStates = {
    'L-Panel': { isPlaying: false, elapsedTime: 0, savedElapsedTime: 0, startTime: null },
    'P-Panel': { isPlaying: false, elapsedTime: 0, savedElapsedTime: 0, startTime: null },
    'OM-Panel': { isPlaying: false, elapsedTime: 0, savedElapsedTime: 0, startTime: null }
};

let currentPanel = 'L-Panel';
const GLOBAL_TOTAL_TIME = 600;
let stepsWithTimes = [];

const globalTimerEl = document.getElementById('globalTimer');
const sectionPromptEl = document.getElementById('sectionPrompt');
const scriptTimelineEl = document.getElementById('scriptTimeline');
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const navBtns = document.querySelectorAll('.nav-btn');

function formatTime(seconds) {
    const isNeg = seconds < 0;
    const abs = Math.abs(seconds);
    const m = Math.floor(abs / 60).toString().padStart(2, '0');
    const s = (abs % 60).toString().padStart(2, '0');
    return `${isNeg ? '-' : ''}${m}:${s}`;
}

function computeSteps() {
    let acc = 0;
    stepsWithTimes = panelsData[currentPanel].map(step => {
        const obj = { ...step, start: acc, end: acc + step.duration };
        acc += step.duration;
        return obj;
    });
}

function updatePlayButton() {
    const icon = playPauseBtn.querySelector('i');
    if (panelStates[currentPanel].isPlaying) {
        icon.className = 'fas fa-pause';
    } else {
        icon.className = 'fas fa-play';
    }
}

function updateUI() {
    const state = panelStates[currentPanel];
    
    const remainingGlobal = GLOBAL_TOTAL_TIME - state.elapsedTime;
    globalTimerEl.textContent = formatTime(remainingGlobal);
    if (remainingGlobal <= 0) {
        globalTimerEl.classList.add('danger');
    } else {
        globalTimerEl.classList.remove('danger');
    }

    let currentIndex = stepsWithTimes.findIndex(s => state.elapsedTime >= s.start && state.elapsedTime < s.end);
    
    if (currentIndex === -1 && state.elapsedTime >= stepsWithTimes[stepsWithTimes.length - 1].end) {
        currentIndex = stepsWithTimes.length - 1; 
    }
    if (currentIndex === -1) currentIndex = 0;

    let html = '';
    const renderStep = (idx, cls) => {
        const s = stepsWithTimes[idx];
        const timeText = s.duration >= 60 
            ? (s.duration % 60 === 0 ? `${s.duration / 60} minutes` : `${Math.floor(s.duration / 60)}m ${s.duration % 60}s`)
            : `${s.duration} seconds`;

        return `
            <div class="script-item ${cls}">
                <div class="script-title">${s.title} (${timeText})</div>
            </div>
        `;
    };

    html += renderStep(currentIndex, 'curr');
    if (currentIndex < stepsWithTimes.length - 1) {
        html += renderStep(currentIndex + 1, 'next');
    }

    scriptTimelineEl.innerHTML = html;

    const currStep = stepsWithTimes[currentIndex];
    const secLeft = currStep.end - state.elapsedTime;

    sectionPromptEl.className = 'section-prompt';
    
    if (state.elapsedTime >= stepsWithTimes[stepsWithTimes.length - 1].end) {
        sectionPromptEl.textContent = "Panel script completed";
    } else {
        const timeText = secLeft >= 60 
            ? (secLeft % 60 === 0 ? `${secLeft / 60}m` : `${Math.floor(secLeft / 60)}m ${secLeft % 60}s`)
            : `${secLeft} secs`;
            
        sectionPromptEl.textContent = `${timeText} left for this part`;
        
        if (secLeft <= 10) {
            sectionPromptEl.classList.add('danger');
        } else if (secLeft <= 30) {
            sectionPromptEl.classList.add('warning');
        }
    }

    const progress = Math.min(1, state.elapsedTime / GLOBAL_TOTAL_TIME);
    const r = Math.round(15 + (69 - 15) * progress);
    const g = Math.round(23 + (10 - 23) * progress);
    const b = Math.round(42 + (10 - 42) * progress);
    
    document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

function togglePlay() {
    const state = panelStates[currentPanel];
    state.isPlaying = !state.isPlaying;
    
    if (state.isPlaying) {
        state.startTime = Date.now();
    } else {
        state.savedElapsedTime = state.elapsedTime;
    }
    updatePlayButton();
    updateUI();
}

function resetTimer() {
    if (confirm(`Are you sure you want to completely reset the timer for ${currentPanel}?`)) {
        const state = panelStates[currentPanel];
        state.isPlaying = false;
        state.elapsedTime = 0;
        state.savedElapsedTime = 0;
        state.startTime = null;
        
        updatePlayButton();
        updateUI();
    }
}

setInterval(() => {
    const now = Date.now();
    let requiresUIUpdate = false;
    
    for (const key in panelStates) {
        const state = panelStates[key];
        if (state.isPlaying) {
            state.elapsedTime = state.savedElapsedTime + Math.floor((now - state.startTime) / 1000);
            if (key === currentPanel) {
                requiresUIUpdate = true;
            }
        }
    }
    
    if (requiresUIUpdate) {
        updateUI();
    }
}, 200);

playPauseBtn.addEventListener('click', togglePlay);
stopBtn.addEventListener('click', resetTimer);

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPanel = btn.getAttribute('data-panel');
        
        computeSteps();
        updatePlayButton();
        updateUI(); 
    });
});

// Spacebar Keybind for Play/Pause
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Prevent default page scrolling when pressing space
        togglePlay();
    }
});

const activeBtn = document.querySelector('.nav-btn.active');
if (activeBtn) {
    currentPanel = activeBtn.getAttribute('data-panel');
}
computeSteps();
updatePlayButton();
updateUI();
