let score = 0;
let gameInterval;
let selectedMode = '';
let timerInterval;
let isVideoPlaying = false;
let fixedAge = null;

const emotionsMap = {
    neutral: "😐",
    happy: "😄",
    sad: "😢",
    angry: "😠",
    fearful: "😱",
    disgusted: "🤢",
    surprised: "😲"
};

const genderMap = {
    male: "👨",
    female: "👩"
};

async function loadModels() {
    console.log("Loading models...");
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/tiny_face_detector_model-weights_manifest.json');
    await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/face_expression_model-weights_manifest.json');
    await faceapi.nets.ageGenderNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights/age_gender_model-weights_manifest.json');
    console.log("Models loaded successfully!");
}

function selectMode(mode) {
    selectedMode = mode;
    document.getElementById('modeSelection').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    document.getElementById('targetEmotion').style.display = mode === 'challenge' ? 'block' : 'none';
    document.getElementById('scoreDisplay').style.display = mode === 'challenge' ? 'block' : 'none';
    document.getElementById('ageGenderDisplay').style.display = mode === 'ageGenderDetection' ? 'block' : 'none';
}

function goBack() {
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    selectedMode = '';
    isVideoPlaying = false;
    fixedAge = null;

    const video = document.getElementById('video');
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }

    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('modeSelection').style.display = 'block';
    document.getElementById('emojiDisplay').textContent = '';
    document.getElementById('emotion').textContent = 'N/A';
}

async function startGame() {
    await loadModels();
    const video = document.getElementById('video');

    if (isVideoPlaying) {
        video.pause();
        video.srcObject = null;
    }

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(stream => {
            video.srcObject = stream;
            video.play();
            isVideoPlaying = true;
        })
        .catch(err => console.error("Error accessing webcam:", err));

    if (selectedMode === 'liveDetection') startLiveDetectionLogic(video);
    else if (selectedMode === 'challenge') startChallengeLogic(video);
    else if (selectedMode === 'ageGenderDetection') startAgeGenderDetectionLogic(video);
}

function showEmoji(emoji) {
    document.getElementById('emojiDisplay').textContent = emoji;
}

function startLiveDetectionLogic(video) {
    video.addEventListener('playing', () => {
        gameInterval = setInterval(async () => {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
            if (detections) {
                const expressions = detections.expressions.asSortedArray();
                const detectedEmotion = expressions[0].expression;
                document.getElementById('emotion').textContent = `${detectedEmotion} (${(expressions[0].probability * 100).toFixed(2)}%)`;
                showEmoji(emotionsMap[detectedEmotion]);
            }
        }, 2000);
    });
}

function startChallengeLogic(video) {
    video.addEventListener('playing', () => {
        let targetEmotion = Object.keys(emotionsMap)[Math.floor(Math.random() * Object.keys(emotionsMap).length)];
        document.getElementById('targetEmotion').textContent = targetEmotion;
        score = 0;

        gameInterval = setInterval(async () => {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
            if (detections) {
                const expressions = detections.expressions.asSortedArray();
                const detectedEmotion = expressions[0].expression;
                document.getElementById('emotion').textContent = `${detectedEmotion} (${(expressions[0].probability * 100).toFixed(2)}%)`;

                showEmoji(emotionsMap[detectedEmotion]);

                if (detectedEmotion === targetEmotion) {
                    score++;
                    targetEmotion = Object.keys(emotionsMap)[Math.floor(Math.random() * Object.keys(emotionsMap).length)];
                    document.getElementById('targetEmotion').textContent = targetEmotion;
                    document.getElementById('score').textContent = score;
                }
            }
        }, 2000);
    });
}

let ageSum = 0;
let ageCount = 0;

function startAgeGenderDetectionLogic(video) {
    video.addEventListener('playing', () => {
        gameInterval = setInterval(async () => {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withAgeAndGender().withFaceExpressions();
            if (detections) {
                const { age, gender } = detections;
                const expressions = detections.expressions.asSortedArray();
                const detectedEmotion = expressions[0].expression;

                document.getElementById('emotion').textContent = `${detectedEmotion} (${(expressions[0].probability * 100).toFixed(2)}%)`;

                // Aggregate age results
                ageSum += age;
                ageCount++;
                const averageAge = (ageSum / ageCount).toFixed(0);

                document.getElementById('age').textContent = averageAge;
                document.getElementById('gender').textContent = gender;
                showEmoji(`${emotionsMap[detectedEmotion]} ${genderMap[gender]}`);
            }
        }, 2000);
    });
}

let inactivityTimeout;

function resetInactivityTimeout() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        location.reload();
    }, 4 * 60 * 1000); // 4 minutes
}

document.addEventListener('mousemove', resetInactivityTimeout);
document.addEventListener('keydown', resetInactivityTimeout);
document.addEventListener('click', resetInactivityTimeout);
document.addEventListener('scroll', resetInactivityTimeout);

// Initialize the inactivity timeout when the page loads
resetInactivityTimeout();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
