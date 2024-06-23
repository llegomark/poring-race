import confetti from 'canvas-confetti';

const players = [];
const svgNS = "http://www.w3.org/2000/svg";
let aspectRatio = 2;
let raceTrackWidth = 1000;
let raceTrackHeight = 500;
let poringWidth = 40;
let poringHeight = 40;
let finishLine = raceTrackWidth - poringWidth - 10;
let raceInProgress = false;
let raceFinished = false;
let lastTimestamp = 0;
let animationFrameId = null;
const usedColors = new Set();

const poringSounds = [
    document.getElementById('poringSound1'),
    document.getElementById('poringSound2'),
    document.getElementById('poringSound3'),
    document.getElementById('poringSound4')
];
const levelUpSound = document.getElementById('levelUpSound');

const buffSounds = [
    document.getElementById('healSound'),
    document.getElementById('aspersioSound'),
    document.getElementById('gloriaSound'),
    document.getElementById('magnificatSound'),
    document.getElementById('suffragiumSound'),
    document.getElementById('blessingSound')
];

const backgroundMusic = document.getElementById('backgroundMusic');

let soundInterval;

const defaultNames = "xRhy, Anceaus, Seruel, Roa.Autumn, xMugwort, Ryleigh, Sayonarah, WBB.Panda, Serizawa, Rurouni, YUJIROH, Zed, Abomination, Alacrity, Churvie, Jyuuviole, Trex, Darthvad3r, SUGARCOOK13, LithiumIon, Zvyesdana, WBB.IceBear, Suzy, RAIN, IYOTTERRORIST, Jabee, St. Bombay, LARASHINE, BlackMingming, SweatyPalm, Krizteta, Qlementine, xLemon, JPWiz, EMBER, Scheneizel, Scheherazade, Joce16, Amity, eren, mnchaos, Gab, xLire, Zhashi, KentDan, Heatless, Freya, Ghost, Antheus, black.label, Xiaz, ArthmaelXVII, Teekaz, Trixie, GReed, MAXCIIM, RapidStrike, arbielog, MErton, xZyve, Cyrax, Brynhildr, ShaneAmber, Tatoy, Leitsac, WBB.GRizzly, Phoebe, closetoyou, Rolfe, John1989, Dale.Reki, caisquared, jini, Aurora, Real05, Kyasurin, DocMel, Reusamtel, Jashobeam, BoyBawang, AlleahRose, Dnex, Foundy, GravyMaster, Koleena, NOTTINGHILL, Dane-kun, JethzZ, dailydally, The25th, Horrhei, Athan28, NICE, Mondz, BossKeo, Oji, DrrN, 123Punch, Azh, Storm";

function loadSavedNames() {
    const savedNames = localStorage.getItem('playerNames');
    const namesInput = document.getElementById('namesInput');
    namesInput.value = savedNames || defaultNames;
}

function saveNames() {
    const namesInput = document.getElementById('namesInput');
    localStorage.setItem('playerNames', namesInput.value);
}

function generateRandomColor() {
    let color;
    do {
        color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    } while (usedColors.has(color));
    usedColors.add(color);
    return color;
}

function sanitizeInput(input) {
    return input.replace(/[<>&'"]/g, function (c) {
        return {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            "'": '&#39;',
            '"': '&quot;'
        }[c];
    });
}

function addPlayers() {
    const namesInput = document.getElementById('namesInput');
    const names = namesInput.value.split(',').map(name => sanitizeInput(name.trim())).filter(name => name);

    if (names.length > 0 && names.length <= 100) {
        players.length = 0;
        usedColors.clear();
        names.forEach(name => {
            const hasHair = Math.random() < 0.6; // 60% chance of having hair
            const hairstyle = hasHair ? getRandomHairstyle() : 'bald';
            players.push({
                name: name,
                position: 0,
                color: generateRandomColor(),
                hairstyle: hairstyle
            });
        });
        saveNames();
        drawRaceTrack();
        showNotification(`${names.length} players added successfully!`);
    } else {
        showNotification("Please enter between 1 and 100 valid names.");
    }
}

function getRandomHairstyle() {
    const styles = ['spiky', 'bowl', 'mohawk', 'curly'];
    return styles[Math.floor(Math.random() * styles.length)];
}

function drawPoring(group, poringWidth, poringHeight, color, hairstyle) {
    const poring = document.createElementNS(svgNS, "g");
    poring.setAttribute("class", "poring");

    // Main body (slightly elliptical)
    const body = document.createElementNS(svgNS, "ellipse");
    body.setAttribute("cx", 0);
    body.setAttribute("cy", 0);
    body.setAttribute("rx", poringWidth / 2);
    body.setAttribute("ry", poringHeight / 2.1);
    body.setAttribute("fill", color);

    // Pointed top of head
    const pointedTop = document.createElementNS(svgNS, "path");
    pointedTop.setAttribute("d", `M${-poringWidth * 0.3},${-poringHeight * 0.4} Q0,${-poringHeight * 0.55} ${poringWidth * 0.3},${-poringHeight * 0.4}`);
    pointedTop.setAttribute("fill", color);

    // Small circle above head
    const topCircle = document.createElementNS(svgNS, "circle");
    topCircle.setAttribute("cx", 0);
    topCircle.setAttribute("cy", -poringHeight * 0.65);
    topCircle.setAttribute("r", poringWidth * 0.1);
    topCircle.setAttribute("fill", color);

    // Highlight
    const highlight = document.createElementNS(svgNS, "ellipse");
    highlight.setAttribute("cx", -poringWidth * 0.2);
    highlight.setAttribute("cy", -poringHeight * 0.2);
    highlight.setAttribute("rx", poringWidth * 0.2);
    highlight.setAttribute("ry", poringHeight * 0.15);
    highlight.setAttribute("fill", "white");
    highlight.setAttribute("opacity", "0.5");

    // Eyes (facing right)
    const leftEye = document.createElementNS(svgNS, "g");
    const leftEyeOuter = document.createElementNS(svgNS, "ellipse");
    leftEyeOuter.setAttribute("cx", poringWidth * 0.125);
    leftEyeOuter.setAttribute("cy", -poringHeight * 0.125);
    leftEyeOuter.setAttribute("rx", poringWidth * 0.125);
    leftEyeOuter.setAttribute("ry", poringHeight * 0.15);
    leftEyeOuter.setAttribute("fill", "white");
    const leftEyeInner = document.createElementNS(svgNS, "circle");
    leftEyeInner.setAttribute("cx", poringWidth * 0.2);
    leftEyeInner.setAttribute("cy", -poringHeight * 0.125);
    leftEyeInner.setAttribute("r", poringWidth * 0.05);
    leftEyeInner.setAttribute("fill", "black");
    leftEye.appendChild(leftEyeOuter);
    leftEye.appendChild(leftEyeInner);

    const rightEye = document.createElementNS(svgNS, "g");
    const rightEyeOuter = document.createElementNS(svgNS, "ellipse");
    rightEyeOuter.setAttribute("cx", poringWidth * 0.375);
    rightEyeOuter.setAttribute("cy", -poringHeight * 0.125);
    rightEyeOuter.setAttribute("rx", poringWidth * 0.125);
    rightEyeOuter.setAttribute("ry", poringHeight * 0.15);
    rightEyeOuter.setAttribute("fill", "white");
    const rightEyeInner = document.createElementNS(svgNS, "circle");
    rightEyeInner.setAttribute("cx", poringWidth * 0.45);
    rightEyeInner.setAttribute("cy", -poringHeight * 0.125);
    rightEyeInner.setAttribute("r", poringWidth * 0.05);
    rightEyeInner.setAttribute("fill", "black");
    rightEye.appendChild(rightEyeOuter);
    rightEye.appendChild(rightEyeInner);

    // Mouth expressions
    const mouthExpressions = [
        // Smile
        `M${poringWidth * 0.125},${poringHeight * 0.2} Q${poringWidth * 0.25},${poringHeight * 0.3} ${poringWidth * 0.375},${poringHeight * 0.2}`,
        // Happy (wide smile)
        `M${poringWidth * 0.1},${poringHeight * 0.2} Q${poringWidth * 0.25},${poringHeight * 0.35} ${poringWidth * 0.4},${poringHeight * 0.2}`,
        // Sad
        `M${poringWidth * 0.125},${poringHeight * 0.25} Q${poringWidth * 0.25},${poringHeight * 0.15} ${poringWidth * 0.375},${poringHeight * 0.25}`,
        // Neutral
        `M${poringWidth * 0.125},${poringHeight * 0.25} L${poringWidth * 0.375},${poringHeight * 0.25}`,
        // Surprised (small 'o' shape)
        `M${poringWidth * 0.25},${poringHeight * 0.2} A${poringWidth * 0.075},${poringHeight * 0.075} 0 1,0 ${poringWidth * 0.25},${poringHeight * 0.35} A${poringWidth * 0.075},${poringHeight * 0.075} 0 1,0 ${poringWidth * 0.25},${poringHeight * 0.2}`,
        // Showing teeth (zig-zag line)
        `M${poringWidth * 0.125},${poringHeight * 0.25} L${poringWidth * 0.175},${poringHeight * 0.2} L${poringWidth * 0.225},${poringHeight * 0.25} L${poringWidth * 0.275},${poringHeight * 0.2} L${poringWidth * 0.325},${poringHeight * 0.25} L${poringWidth * 0.375},${poringHeight * 0.2}`,
    ];

    const mouth = document.createElementNS(svgNS, "path");
    mouth.setAttribute("d", mouthExpressions[Math.floor(Math.random() * mouthExpressions.length)]);
    mouth.setAttribute("stroke", "black");
    mouth.setAttribute("stroke-width", "2");
    mouth.setAttribute("fill", "none");

    // For the "showing teeth" expression, fill the mouth white
    if (mouth.getAttribute("d") === mouthExpressions[5]) {
        mouth.setAttribute("fill", "white");
    }

    // Angry eyebrows (only show sometimes)
    if (Math.random() < 0.2) {
        const leftEyebrow = document.createElementNS(svgNS, "path");
        leftEyebrow.setAttribute("d", `M${poringWidth * 0.05},${-poringHeight * 0.25} L${poringWidth * 0.2},${-poringHeight * 0.2}`);
        leftEyebrow.setAttribute("stroke", "black");
        leftEyebrow.setAttribute("stroke-width", "2");
        leftEyebrow.setAttribute("fill", "none");

        const rightEyebrow = document.createElementNS(svgNS, "path");
        rightEyebrow.setAttribute("d", `M${poringWidth * 0.3},${-poringHeight * 0.2} L${poringWidth * 0.45},${-poringHeight * 0.25}`);
        rightEyebrow.setAttribute("stroke", "black");
        rightEyebrow.setAttribute("stroke-width", "2");
        rightEyebrow.setAttribute("fill", "none");

        poring.appendChild(leftEyebrow);
        poring.appendChild(rightEyebrow);
    }

    // Add hair if not bald
    if (hairstyle !== 'bald') {
        const hair = document.createElementNS(svgNS, "path");
        let hairPath;
        switch (hairstyle) {
            case 'spiky':
                hairPath = `M${-poringWidth * 0.4},${-poringHeight * 0.4} L${-poringWidth * 0.2},${-poringHeight * 0.6} L0,${-poringHeight * 0.4} L${poringWidth * 0.2},${-poringHeight * 0.6} L${poringWidth * 0.4},${-poringHeight * 0.4}`;
                break;
            case 'bowl':
                hairPath = `M${-poringWidth * 0.4},${-poringHeight * 0.2} Q0,${-poringHeight * 0.6} ${poringWidth * 0.4},${-poringHeight * 0.2}`;
                break;
            case 'mohawk':
                hairPath = `M${-poringWidth * 0.1},${-poringHeight * 0.4} L0,${-poringHeight * 0.7} L${poringWidth * 0.1},${-poringHeight * 0.4}`;
                break;
            case 'curly':
                hairPath = `M${-poringWidth * 0.4},${-poringHeight * 0.3} Q${-poringWidth * 0.2},${-poringHeight * 0.6} 0,${-poringHeight * 0.3} Q${poringWidth * 0.2},${-poringHeight * 0.6} ${poringWidth * 0.4},${-poringHeight * 0.3}`;
                break;
        }
        hair.setAttribute("d", hairPath);
        hair.setAttribute("fill", "none");
        hair.setAttribute("stroke", "black");
        hair.setAttribute("stroke-width", "2");
        poring.appendChild(hair);
    }

    poring.appendChild(body);
    poring.appendChild(pointedTop);
    poring.appendChild(topCircle);
    poring.appendChild(highlight);
    poring.appendChild(leftEye);
    poring.appendChild(rightEye);
    poring.appendChild(mouth);

    // Bouncing animation
    const animateY = document.createElementNS(svgNS, "animate");
    animateY.setAttribute("attributeName", "transform");
    animateY.setAttribute("dur", "0.5s");
    animateY.setAttribute("repeatCount", "indefinite");
    animateY.setAttribute("values", `translate(0,0); translate(0,-${poringHeight * 0.1}); translate(0,0)`);
    animateY.setAttribute("keyTimes", "0;0.5;1");
    poring.appendChild(animateY);

    group.appendChild(poring);
}

function drawRaceTrack() {
    const gameArea = document.getElementById('gameArea');
    gameArea.innerHTML = '';

    const gameAreaRect = gameArea.getBoundingClientRect();

    if (window.innerWidth <= 640) {
        aspectRatio = 1;
    } else {
        aspectRatio = 2;
    }

    if (gameAreaRect.width / gameAreaRect.height > aspectRatio) {
        raceTrackHeight = gameAreaRect.height;
        raceTrackWidth = raceTrackHeight * aspectRatio;
    } else {
        raceTrackWidth = gameAreaRect.width;
        raceTrackHeight = raceTrackWidth / aspectRatio;
    }

    poringWidth = Math.max(raceTrackWidth * 0.04, 20);
    poringHeight = poringWidth;
    finishLine = raceTrackWidth - poringWidth - 10;

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${raceTrackWidth} ${raceTrackHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    gameArea.appendChild(svg);

    const track = document.createElementNS(svgNS, "rect");
    track.setAttribute("width", raceTrackWidth);
    track.setAttribute("height", raceTrackHeight);
    track.setAttribute("fill", "#90EE90");
    track.setAttribute("stroke", "#228B22");
    track.setAttribute("stroke-width", "10");
    svg.appendChild(track);

    const laneHeight = raceTrackHeight / Math.max(players.length, 1);
    for (let i = 1; i < players.length; i++) {
        const lane = document.createElementNS(svgNS, "line");
        lane.setAttribute("x1", 0);
        lane.setAttribute("y1", i * laneHeight);
        lane.setAttribute("x2", raceTrackWidth);
        lane.setAttribute("y2", i * laneHeight);
        lane.setAttribute("stroke", "rgba(255, 255, 255, 0.3)");
        lane.setAttribute("stroke-width", 1);
        svg.appendChild(lane);
    }

    const finishLineGroup = document.createElementNS(svgNS, "g");
    const finishLineRect = document.createElementNS(svgNS, "rect");
    finishLineRect.setAttribute("x", finishLine);
    finishLineRect.setAttribute("y", 0);
    finishLineRect.setAttribute("width", poringWidth + 10);
    finishLineRect.setAttribute("height", raceTrackHeight);
    finishLineRect.setAttribute("fill", "url(#finishLinePattern)");
    finishLineGroup.appendChild(finishLineRect);

    const pattern = document.createElementNS(svgNS, "pattern");
    pattern.setAttribute("id", "finishLinePattern");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute("width", "20");
    pattern.setAttribute("height", "20");

    const patternRect1 = document.createElementNS(svgNS, "rect");
    patternRect1.setAttribute("width", "10");
    patternRect1.setAttribute("height", "10");
    patternRect1.setAttribute("fill", "white");

    const patternRect2 = document.createElementNS(svgNS, "rect");
    patternRect2.setAttribute("x", "10");
    patternRect2.setAttribute("y", "0");
    patternRect2.setAttribute("width", "10");
    patternRect2.setAttribute("height", "10");
    patternRect2.setAttribute("fill", "black");

    const patternRect3 = document.createElementNS(svgNS, "rect");
    patternRect3.setAttribute("x", "0");
    patternRect3.setAttribute("y", "10");
    patternRect3.setAttribute("width", "10");
    patternRect3.setAttribute("height", "10");
    patternRect3.setAttribute("fill", "black");

    const patternRect4 = document.createElementNS(svgNS, "rect");
    patternRect4.setAttribute("x", "10");
    patternRect4.setAttribute("y", "10");
    patternRect4.setAttribute("width", "10");
    patternRect4.setAttribute("height", "10");
    patternRect4.setAttribute("fill", "white");

    pattern.appendChild(patternRect1);
    pattern.appendChild(patternRect2);
    pattern.appendChild(patternRect3);
    pattern.appendChild(patternRect4);
    svg.appendChild(pattern);

    svg.appendChild(finishLineGroup);

    players.forEach((player, index) => {
        const group = document.createElementNS(svgNS, "g");
        group.setAttribute("transform", `translate(${player.position}, ${index * laneHeight + laneHeight * 0.5})`);

        drawPoring(group, poringWidth, poringHeight, player.color, player.hairstyle);

        const nameText = document.createElementNS(svgNS, "text");
        nameText.setAttribute("x", 0);
        nameText.setAttribute("y", -poringHeight * 0.75);
        nameText.setAttribute("text-anchor", "middle");
        nameText.setAttribute("font-size", `${Math.min(poringWidth * 0.3, 10)}px`);
        nameText.setAttribute("fill", "#ffffff");
        nameText.setAttribute("stroke", "black");
        nameText.setAttribute("stroke-width", "0.5");
        nameText.textContent = player.name;

        group.appendChild(nameText);
        svg.appendChild(group);
    });
}

function playRandomSound() {
    const allSounds = [...poringSounds, ...buffSounds];
    const randomSound = allSounds[Math.floor(Math.random() * allSounds.length)];
    randomSound.currentTime = 0;
    randomSound.play().catch(e => console.log("Audio play interrupted:", e));
}

function startRandomSounds() {
    soundInterval = setInterval(() => {
        if (Math.random() < 0.15) {
            playRandomSound();
        }
    }, 50);
}

function startBackgroundMusic() {
    backgroundMusic.volume = 0.5;
    backgroundMusic.play().catch(e => console.log("Background music play interrupted:", e));
}

function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

function stopAllSounds() {
    clearInterval(soundInterval);
    [...poringSounds, ...buffSounds, levelUpSound].forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
    });
    stopBackgroundMusic();
}

function toggleButtons(disabled) {
    const buttons = {
        addPlayers: document.querySelector('button[onclick="addPlayers()"]'),
        startRace: document.querySelector('button[onclick="startRace()"]'),
        resetGame: document.querySelector('button[onclick="resetGame()"]'),
        showWinners: document.querySelector('button[onclick="showWinners()"]'),
        restartRace: document.querySelector('button[onclick="restartRace()"]')
    };

    Object.keys(buttons).forEach(key => {
        if (buttons[key]) {
            if (key === 'restartRace') {
                buttons[key].disabled = !raceInProgress;
            } else {
                buttons[key].disabled = disabled;
            }
            
            if (buttons[key].disabled) {
                buttons[key].classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                buttons[key].classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }
    });
}

function startRace() {
    if (players.length < 2) {
        showNotification("Add at least two players to start the race!");
        return;
    }

    raceInProgress = true;
    toggleButtons(true);

    players.forEach(player => player.position = 0);
    raceFinished = false;
    document.getElementById('winnerDisplay').classList.add('hidden');
    drawRaceTrack();

    startBackgroundMusic();
    startRandomSounds();

    showNotification("The race has started!");

    lastTimestamp = performance.now();
    animationFrameId = requestAnimationFrame(updateRace);
}

function updateRace(timestamp) {
    if (!raceFinished) {
        const elapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        let winningPlayer = null;
        players.forEach(player => {
            player.position += Math.random() * (raceTrackWidth * 0.005) * (elapsed / 16.67); // Adjust for 60 FPS
            if (player.position >= finishLine && !winningPlayer) {
                winningPlayer = player;
            }
        });

        if (winningPlayer) {
            raceFinished = true;
            announceWinner(winningPlayer);
            toggleButtons(false);
        } else {
            drawRaceTrack();
            animationFrameId = requestAnimationFrame(updateRace);
        }
    }
}

function saveWinner(winner) {
    try {
        const winners = JSON.parse(localStorage.getItem('winners') || '[]');
        winners.push({
            name: winner.name,
            date: new Date().toLocaleString()
        });
        localStorage.setItem('winners', JSON.stringify(winners));
    } catch (error) {
        console.error("Error saving winner:", error);
        showNotification("Failed to save winner. Please try again.");
    }
}

function announceWinner(winner) {
    raceInProgress = false;
    stopAllSounds();
    levelUpSound.currentTime = 0;
    levelUpSound.play().catch(e => console.log("Level up sound play interrupted:", e));

    let volume = backgroundMusic.volume;
    const fadeOutInterval = setInterval(() => {
        if (volume > 0.05) {
            volume -= 0.05;
            backgroundMusic.volume = volume;
        } else {
            clearInterval(fadeOutInterval);
            stopBackgroundMusic();
        }
    }, 100);

    const winnerDisplay = document.getElementById('winnerDisplay');
    winnerDisplay.innerHTML = `
    <div class="text-center">
        <div class="text-6xl mb-4">🏆</div>
        <div class="text-4xl font-bold">${winner.name}</div>
        <div class="text-2xl mt-2">wins the race!</div>
    </div>
    `;
    winnerDisplay.classList.remove('hidden');

    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });

    saveWinner(winner);

    setTimeout(() => {
        winnerDisplay.classList.add('hidden');
    }, 5000);

    toggleButtons(false);
}

function showWinners() {
    const allWinners = JSON.parse(localStorage.getItem('winners') || '[]');
    const lastTenWinners = allWinners.slice(-10).reverse();
    const winnersList = lastTenWinners.map(w => `<li class="mb-2">${w.name} - ${w.date}</li>`).join('');

    const popup = document.createElement('div');
    popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    popup.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 class="text-2xl font-bold mb-4">Last 10 Winners</h2>
            <ul class="list-disc pl-5 mb-4 max-h-60 overflow-y-auto">
                ${winnersList || '<li>No winners yet</li>'}
            </ul>
            <button id="closePopup" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Close
            </button>
        </div>
    `;

    document.body.appendChild(popup);

    popup.addEventListener('click', (e) => {
        if (e.target === popup || e.target.id === 'closePopup') {
            document.body.removeChild(popup);
        }
    });
}

function restartRace() {
    if (!raceInProgress) {
        showNotification("Please start a race before restarting.");
        return;
    }

    stopAllSounds();
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    players.forEach(player => player.position = 0);
    raceFinished = false;
    drawRaceTrack();
    document.getElementById('winnerDisplay').classList.add('hidden');

    toggleButtons(true);
    startRace();
}


function resetGame() {
    raceInProgress = false;
    players.length = 0;
    usedColors.clear();

    loadSavedNames();

    stopAllSounds();

    document.getElementById('winnerDisplay').classList.add('hidden');

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    raceFinished = false;

    drawRaceTrack();

    toggleButtons(false);

    showNotification("The game has been reset.");
}


function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');

    notificationMessage.textContent = message;
    notification.classList.remove('hidden');
    notification.classList.add('translate-y-0');

    setTimeout(() => {
        hideNotification();
    }, duration);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.add('translate-y-full');
    setTimeout(() => {
        notification.classList.add('hidden');
        notification.classList.remove('translate-y-full');
    }, 300);
}

// Initialize the game
loadSavedNames();
drawRaceTrack();
window.addEventListener('resize', drawRaceTrack);

// Event listener for closing notification
document.getElementById('closeNotification').addEventListener('click', hideNotification);

// Expose necessary functions to the global scope
window.addPlayers = addPlayers;
window.startRace = startRace;
window.restartRace = restartRace;
window.resetGame = resetGame;
window.showWinners = showWinners;

