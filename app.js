// Check if the browser supports the Web Speech API
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.lang = 'sv-SE';  // Set language to Swedish
recognition.interimResults = true;  // Display words as the user speaks
recognition.continuous = false;  // We're manually restarting recognition for continuous effect

const startRecordBtn = document.getElementById('start-record-btn');
const stopRecordBtn = document.getElementById('stop-record-btn');
const saveTextBtn = document.getElementById('save-text-btn');
const copyTextBtn = document.getElementById('copy-text-btn');
const textOutput = document.getElementById('text-output');
const savedTexts = document.getElementById('saved-texts');
const submitBtn = document.getElementById('submit');
let messageHistory = "";

let finalTranscript = '';
let isRecording = false;  // To track if the user wants to stop or continue

// Start speech recognition
startRecordBtn.addEventListener('click', () => {
    isRecording = true;  // User intends to keep recording
    recognition.start();
    startRecordBtn.disabled = true;
    stopRecordBtn.disabled = false;
    saveTextBtn.disabled = false;
    copyTextBtn.disabled = false;
    finalTranscript = '';  // Clear previous transcription
    textOutput.value = ''; // Clear text area
});

// Stop speech recognition
stopRecordBtn.addEventListener('click', () => {
    isRecording = false;  // User clicked stop, we won't restart recognition
    recognition.stop();
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
});

// Capture speech recognition results
recognition.addEventListener('result', (event) => {
    let interimTranscript = '';

    // Loop through the recognized speech segments
    for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';  // Add final sentence with space
        } else {
            interimTranscript += event.results[i][0].transcript;
        }
    }

    // Update the text area with interim and final results
    textOutput.value = finalTranscript + interimTranscript;
});

// Save the transcribed text to the right panel
saveTextBtn.addEventListener('click', () => {
    if (finalTranscript.trim()) {
        const newSavedText = document.createElement('div');
        newSavedText.classList.add('saved-text');
        newSavedText.textContent = finalTranscript;
        savedTexts.appendChild(newSavedText);
        finalTranscript = '';  // Clear the final transcript after saving
        textOutput.value = ''; // Clear the text area after saving
    }
});

// Copy text to the clipboard
copyTextBtn.addEventListener('click', () => {
    textOutput.select();
    document.execCommand('copy');
    alert('Text kopierad till urklipp!');
});

// Restart recognition when it ends, unless stopped manually
recognition.addEventListener('end', () => {
    if (isRecording) {
        recognition.start();  // Restart recognition if not manually stopped
    }
});

submitBtn.addEventListener('click', () => {
   let newMessage = textOutput.value; 
   fetch('/api/v0/get_response', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "message": newMessage, "chat_messages": messageHistory })
})
   .then(response => response.json())
   .then(response => console.log(JSON.stringify(response)))
});
