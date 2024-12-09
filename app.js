window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const startRecordBtn = document.getElementById('start-record-btn');
const textOutput = document.getElementById('text-output');
let submitBtn = document.getElementById('submit');
const messageHistoryField = document.getElementById('message-history');
const toggleConversationModeBtn = document.getElementById('toggle-conversation-mode');
const pauseBtn = document.querySelector('.pause-btn');

let messageHistory = [];
let finalTranscript = '';  // Den här ska alltid hållas tom när vi startar taligenkänning
let isRecording = false;
let recognition = null;
let conversationMode = false;
let silenceTimeout = null;
let isListening = false;  // Flagga för att hålla reda på om mikrofonen är aktiv
let isSpeaking = false;
let synth = window.speechSynthesis;
let currentUtterance = null;  // Håller reda på den aktuella uppläsningen
let isPaused = false;  // Håller reda på om rösten är pausad

function setup_recognition() {
  const recognition = new SpeechRecognition();
  recognition.lang = 'sv-SE';
  recognition.interimResults = true;
  recognition.continuous = true;  // Håll mikrofonen öppen för att lyssna hela tiden
  return recognition;
}

function startConversation() {
  if (conversationMode && !isListening) {
    recognition.start();
    isListening = true;  // Sätt flaggan på true när mikrofonen har startats
  } else if (!conversationMode && isListening) {
    recognition.stop();
    isListening = false;  // Sätt flaggan på false när mikrofonen stängs av
  }
}

try {
  recognition = setup_recognition();

  recognition.addEventListener('result', (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript = event.results[i][0].transcript + ' ';  // Ersätt hela texten varje gång vi får ett slutgiltigt meddelande
        // Sätt timer för att skicka meddelande om ingen ljudregistrering
        clearTimeout(silenceTimeout);
        silenceTimeout = setTimeout(() => {
          if (conversationMode) {
            submitBtn.click();  // Simulera ett klick på skicka-knappen efter 2 sekunder tystnad
          }
        }, 1000); // Vänta 2 sekunder för att se om det blir tyst
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    textOutput.value = finalTranscript + interimTranscript;  // Visa vad som just nu har hörts i realtid
  });

  recognition.addEventListener('end', () => {
    if (conversationMode && isListening) {
      recognition.start(); // Starta mikrofonen igen om vi är i konversationsläge
    }
  });
} catch (e) {
  console.log(e);
}

function pauseSpeaking(audio) {
    if (isPaused) return; // Om ljudet redan är pausat, gör inget
    audio.pause(); // Pausa ljudet
    isPaused = true;

    // Uppdatera knappen tillbaka till "Skicka"
    resetSubmitButton();
    isSpeaking = false;
}

function resetSubmitButton() {
    // Ta bort gamla eventlisteners
    const newButton = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newButton, submitBtn);
    submitBtn = newButton; // Uppdatera referensen till submitBtn

    // Återställ knappen
    submitBtn.classList.remove("pause-btn");
    console.log("Knappen återställd:", submitBtn.className); // Logga klasserna för att verifiera
    submitBtn.textContent = "Skicka";
    submitBtn.disabled = false;

    // Lägg till standardfunktionen för "Skicka"
    submitBtn.addEventListener('click', () => {
        let newMessage = textOutput.value.trim();
        if (newMessage && !isSpeaking) { // Kontrollera om meddelandet redan är skickat
            sendMessage(newMessage);
        }
    });
}

function speak(text) {
    // Om en uppläsning pågår, pausa den
    if (currentUtterance && synth.speaking) {
        synth.pause();  
        isPaused = true; // Sätt flaggan på pausad
    }

    // Skapa ett nytt SpeechSynthesisUtterance-objekt
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = 'sv-SE';  // Sätt språket till svenska
    currentUtterance.onend = function() {
        // När uppläsningen är klar, återställ tillståndet
        isPaused = false;
        pauseBtn.textContent = 'Pausa';
        pauseBtn.style.backgroundColor = '#e53935'; // Sätt tillbaka färgen
    };

    // Börja läsa upp texten
    synth.speak(currentUtterance);
}

function sendMessage(newMessage) {
    const messageHistoryField = document.getElementById('message-history');
    if (!newMessage || isSpeaking) return;
    isSpeaking = true;

    const userMessage = document.createElement('div');
    userMessage.classList.add('chat-bubble', 'user');
    userMessage.textContent = newMessage;  // Här använd 'newMessage'
    messageHistoryField.appendChild(userMessage);


    // Ändra knappen till "Pausa"
    submitBtn.classList.add("pause-btn");
    void submitBtn.offsetWidth; // Tvingar ommålning
    submitBtn.textContent = "Pausa";
    
    submitBtn.disabled = false;

    // Skapa användarens meddelandebubbla
    let userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user";
    userBubble.textContent = newMessage;
    messageHistoryField.appendChild(userBubble);
    messageHistoryField.scrollTop = messageHistoryField.scrollHeight;

  fetch('/api/v0/get_response', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: newMessage, chat_messages: messageHistory })
  })
    .then(response => response.json())
    .then(resp => {
      let sound_id = resp["id"];
      messageHistory = resp["chat_messages"];

      let ai_box = document.createElement("div");
      ai_box.style.display = "flex"
      ai_box.style.alignItems = "center"

      let aiBubble = document.createElement("div");
      aiBubble.className = "chat-bubble ai";
      aiBubble.textContent = resp.chat_messages[resp.chat_messages.length - 1].content;

      // add bubble to box
      ai_box.appendChild(aiBubble);

      const audio = new Audio("/api/v0/get_sound/" + sound_id);
      audio.play();

      let replay_button = document.createElement("button");
      let button_image = document.createElement("img");
      replay_button.style.backgroundColor = "white"
      button_image.src = "https://cdn.iconscout.com/icon/free/png-256/free-speaker-icon-download-in-svg-png-gif-file-formats--audio-volume-advertising-annoucement-user-interface-vol-1-pack-icons-2202518.png?f=webp&w=256"
      button_image.width = 20;
      button_image.height = 20;

      replay_button.onclick = () => {
        if (!isSpeaking) {
          recognition.stop();
          isListening = false;  // Sätt flaggan på false när mikrofonen stängs av
          audio.play();
          isSpeaking = true;
        }
      }

      // add button to box
      replay_button.appendChild(button_image);

      ai_box.appendChild(replay_button);


      // add box
      messageHistoryField.appendChild(ai_box)
      messageHistoryField.scrollTop = messageHistoryField.scrollHeight;

            // När AI:n har pratat klart, avvakta och sätt på mikrofonen igen
            submitBtn.onclick = () => {
                pauseSpeaking(audio); // Koppla pausknappen till att pausa ljudet
            };
            audio.onended = () => {
                if (conversationMode) {
                    if (!isListening) {
                        recognition.start(); // Starta mikrofonen när AI:n har slutat prata
                      }
                    isListening = true;  // Sätt flaggan på true när mikrofonen är på      
                }
                isSpeaking = false;
            };
        });

  // Töm textoutput-fältet automatiskt efter att meddelandet skickats
  textOutput.value = "";

  // Stäng av mikrofonen efter att meddelandet skickats
  recognition.stop();
  isListening = false;  // Sätt flaggan på false när mikrofonen stängs av
}


// Lägg till en eventlistener för konversationsläget
toggleConversationModeBtn.addEventListener('click', () => {
  conversationMode = !conversationMode;
  if (conversationMode) {
    toggleConversationModeBtn.textContent = 'Byt till normalt läge';
    
    requestAnimationFrame(() => {
      document.getElementById("normal-mode-buttons").style.display = "none"; 
     });
    startConversation(); // Starta mikrofonen automatiskt när vi går in i konversationsläge
  } else {
    toggleConversationModeBtn.textContent = 'Aktivera konversationsläge';

     // Batch visibility updates for the submit and microphone buttons
    requestAnimationFrame(() => {
      document.getElementById("normal-mode-buttons").style.display = "flex";
    });
    
     recognition.stop(); // Stoppa mikrofonen om vi går tillbaka till normalt läge
    isListening = false;  // Sätt flaggan på false när mikrofonen stängs av
  }
});

// Automatisk knappklickning för "Skicka"-knappen
submitBtn.addEventListener('click', () => {
    let newMessage = textOutput.value.trim();
    textOutput.value = "";
    finalTranscript = "";
    if (newMessage && !isSpeaking) { 
        sendMessage(newMessage);
      }
});

// Lägg till eventlistener för mikrofonknappen i normalt läge
startRecordBtn.addEventListener('click', () => {
  if (conversationMode) {
    return; // Om vi är i konversationsläge, ska mikrofonen inte kunna startas manuellt
  }
  if (isListening) {
    recognition.stop();
    isListening = false;  // Stoppa mikrofonen om den är på
  } else {
    recognition.start();
    isListening = true;  // Starta mikrofonen om den är avstängd
  }
});

pauseBtn.addEventListener('click', function () {
    if (isPaused) {
        // Återuppta uppläsning om den är pausad
        synth.resume();
        pauseBtn.textContent = 'Pausa';
        pauseBtn.style.backgroundColor = '#e53935';
    } else {
        // Pausa uppläsning om den är igång
        synth.pause();
        pauseBtn.textContent = 'Återuppta';
        pauseBtn.style.backgroundColor = '#ff5722';
    }

    isPaused = !isPaused;  // Växla mellan pausad och icke-pausad
});
