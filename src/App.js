import { useState, useEffect, useRef } from 'react'
import './App.css';

// Add your openai API key here
const API_KEY = "sk-...";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const mic = new SpeechRecognition()

let synth = window.speechSynthesis;
const msg = new SpeechSynthesisUtterance()
msg.text = "Hello, I'm ChatGPT AI language model created by OpenAI. Ask me anything."
msg.lang = 'en-GB'

mic.continuous = true
mic.interimResults = true
mic.lang = 'en-US'

const systemMessage = {
  "role": "system", "content": `Use less than 200 characters limit for answers.
    Explain things like you're talking to a software professional with 3 years of experience and practice in english with him.`
}

function App() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [note, setNote] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm ChatGPT AI language model created by OpenAI. Ask me anything.",
      sentTime: "just now",
      sender: "ChatGPT"
    }
  ])
  const boxRef = useRef(null)

  const handleListen = () => {
    setIsSpeaking(false)
    if (isListening) {
      mic.start()
      mic.onend = () => {
        console.log('continue..')
        mic.start()
      }
    } else {
      mic.stop()
      mic.onend = () => {
        console.log('Stopped Mic on Click')
      }
    }

    mic.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('')
      setNote(transcript)
      mic.onerror = event => {
        console.log(event.error)
      }
    }
  }

  const handleSendNote = () => {
    handleSend(note)
    setNote('')
  }

  const handleStopAllProcess = () => {
    setIsSpeaking(false)
    setIsTyping(false)
    setNote('')
  }

  const handleSend = async (message) => {
    const newMessage = {
      message,
      isOutDirection: true,
      sender: "user"
    }

    const newMessages = [...messages, newMessage]
    
    setMessages(newMessages)

    setIsTyping(true)
    await processMessageToChatGPT(newMessages)
  };

  async function processMessageToChatGPT(chatMessages) {
    let apiMessages = chatMessages.map((messageObject) => {
      let role = ""
      if (messageObject.sender === "ChatGPT") {
        role = "assistant"
      } else {
        role = "user"
      }
      return { role: role, content: messageObject.message}
    })
 
    const apiRequestBody = {
      "model": "gpt-3.5-turbo",
      "messages": [
        systemMessage,
        ...apiMessages
      ]
    }

    await fetch("https://api.openai.com/v1/chat/completions", 
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      return data.json()
    }).then((data) => {
      setMessages([...chatMessages, {
        message: data.choices[0].message.content,
        isOutDirection: false,
        sender: "ChatGPT"
      }])
      msg.text = data.choices[0].message.content
      setIsTyping(false)
      setIsSpeaking(true)
      setHasError(false)
    }).catch((e) => {
      console.warn(e)
      setHasError(true)
    })
  }

  const scrollToBottom = () => {
    boxRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const speakIntervalId = setInterval(() => synth.resume(), 5000)

  useEffect(() => {
    synth.resume()
    if (isSpeaking) {
      synth.speak(msg)
    }
    scrollToBottom()
  }, [isSpeaking])

  useEffect(() => {
    synth.pause()
    handleListen()
    return () => clearInterval(speakIntervalId)
    // eslint-disable-next-line
  }, [isListening])

  return (
    <div className="container">
      <div className="box" ref={boxRef}>
        <h2>Notes</h2>
        {messages.map(n => (
          <div key={n.message} className={n.isOutDirection ? 'message' : ''}>{n.message}</div>
        ))}
        {isTyping && <p className="typing">ChatGPT is typing...</p>}
        {hasError && <p className="error">Something went wrong...</p>}
      </div>
      <div className="control-box">
        <h2>Current Note</h2>
        {isListening ? <span>rec🛑🎙️</span> : <span>🎙️</span>}
        <button onClick={handleSendNote} disabled={!note}>
          Send
        </button>
        <button onClick={() => setIsListening(prevState => !prevState)}>
          {isListening ? "Stop" : "Start"} rec
        </button>
        <button onClick={() => setIsSpeaking(prevState => !prevState)}>
          {isSpeaking ? "Stop" : "Restart"} GPT speak
        </button>
        <button onClick={handleStopAllProcess} disabled={!isSpeaking && !isListening && !note}>
          Reset
        </button>
        <p>{note}</p>
      </div>
    </div>
  );
}

export default App;
