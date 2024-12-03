// Check if the browser supports the Web Speech API
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;


const startRecordBtn = document.getElementById('start-record-btn');
const stopRecordBtn = document.getElementById('stop-record-btn');
const copyTextBtn = document.getElementById('copy-text-btn');
const textOutput = document.getElementById('text-output');
const savedTexts = document.getElementById('saved-texts');
const submitBtn = document.getElementById('submit');
const messageHistoryFeild = document.getElementById('message-history')
let messageHistory = [];
let sound_id = "";

let isListening = false;

let finalTranscript = '';
let isRecording = false;  // To track if the user wants to stop or continue

let recognition = null;

console.log(messageHistory)

function setup_recognition() {
  const recognition = new SpeechRecognition();
  recognition.lang = 'sv-SE';  // Set language to Swedish
  recognition.interimResults = true;  // Display words as the user speaks
  recognition.continuous = false;  // We're manually restarting recognition for continuous effect
  return recognition
}

try {
  recognition = setup_recognition();
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
  // Restart recognition when it ends, unless stopped manually
  recognition.addEventListener('end', () => {
    if (isRecording) {
      recognition.start();  // Restart recognition if not manually stopped
    }
  });

} catch (e) {
  console.log(e)
}

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


// Copy text to the clipboard
copyTextBtn.addEventListener('click', () => {
  textOutput.select();
  document.execCommand('copy');
  alert('Text kopierad till urklipp!');
});


submitBtn.addEventListener('click', () => {
  console.log("click")
  isRecording = false;  // User clicked stop, we won't restart recognition
  try {
    recognition.stop();
  } catch (e) {
    console.log(e)
  }
  finalTranscript = ""



  let newMessage = textOutput.value;
  if (newMessage.trim() == "") {
    console.log("empty message");
  } else {
    let nm = document.createElement("p")
    nm.innerHTML = "User: " + newMessage;
    messageHistoryFeild.appendChild(nm)
    textOutput.value = ""
    fetch('/api/v0/get_response', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "message": newMessage, "chat_messages": messageHistory })
    })
      .then(response => response.json()).then(resp => {

        startRecordBtn.disabled = false;
        stopRecordBtn.disabled = true;

        let sound_id = resp["id"]
        messageHistory = resp["chat_messages"]
        messageHistoryFeild.innerHTML = ""
        let mh = messageHistory.slice(1)
        for (mes in mh) {
          let nm = document.createElement("p")
          nm.innerHTML = (mh[mes].role == "user" ? "User: " : "AI: ") + mh[mes].content
          console.log(mh[mes]);
          messageHistoryFeild.appendChild(nm)

        }
        const ctx = new AudioContext();
        const audio = new Audio("/api/v0/get_sound/" + sound_id);
        audio.play();
        isListening = true;
        submitBtn.disabled = true;
        audio.addEventListener("ended", () => {
          submitBtn.disabled = false;
        })
      })
  }
});
