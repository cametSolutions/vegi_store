import { useState, useRef, useEffect } from "react"

const MalayalamKeyboard = ({ value, onChange }) => {
  const [listening, setListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechSupported(false)
      return
    }

    setSpeechSupported(true)
    const recognition = new SpeechRecognition()
    recognition.lang = "ml-IN"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      let finalTranscript = ""

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result && result.isFinal) {
          finalTranscript += result[0].transcript
        }
      }

      if (finalTranscript.trim()) {
        onChange(finalTranscript + " ")
      }
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    recognition.onstart = () => {
      setListening(true)
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      }, 8000)
    }

    recognitionRef.current = recognition

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [value, onChange])

  const handleKeyPress = (button) => {
    if (button === "{bksp}") {
      onChange(value.slice(0, -1))
    } else if (button === "{space}") {
      onChange(value + " ")
    } else if (button === "{clear}") {
      onChange("")
    } else {
      onChange(value + button)
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current || !speechSupported) {
      return
    }

    if (!listening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("Error starting speech recognition:", error)
        setListening(false)
      }
    } else {
      recognitionRef.current.stop()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setListening(false)
    }
  }

  const KeyboardButton = ({
    children,
    onPress,
    style = {},
    isWide = false
  }) => (
    <button
      onClick={onPress}
      style={{
        margin: "1px",
        padding: "0",
        border: "1px solid #d0d0d0",
        borderRadius: "6px",
        background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
        cursor: "pointer",
        fontSize: "18px",
        height: "44px",
        width: isWide ? "auto" : "calc(10% - 2px)",
        fontWeight: "400",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        transition: "all 0.1s ease",
        ...style
      }}
      onMouseDown={(e) => e.preventDefault()}
      onTouchStart={(e) => {
        e.currentTarget.style.transform = "scale(0.95)"
        e.currentTarget.style.backgroundColor = "#e0e0e0"
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.transform = "scale(1)"
        e.currentTarget.style.backgroundColor = ""
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f5f5f5"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = ""
      }}
    >
      {children}
    </button>
  )

  return (
    <div
      style={{
        padding: "8px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        maxWidth: "100%",
        userSelect: "none"
      }}
    >
      {/* Control buttons */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "8px",
          justifyContent: "center",
          flexWrap: "wrap"
        }}
      >
        {speechSupported && (
          <button
            onClick={toggleListening}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              color: "white",
              fontSize: "13px",
              fontWeight: "500",
              border: "none",
              cursor: "pointer",
              backgroundColor: listening ? "#ef4444" : "#22c55e",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            {listening ? "🎙 Listening..." : "🎤 Voice"}
          </button>
        )}

        <button
          onClick={() => handleKeyPress("{clear}")}
          style={{
            padding: "8px 12px",
            backgroundColor: "#f97316",
            color: "white",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "500",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >
          Clear All
        </button>
      </div>

      {/* Keyboard layout */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "8px",
          borderRadius: "6px"
        }}
      >
        {/* Rows of keys */}
        {[
          ["൧", "൨", "൩", "൪", "൫", "൬", "൭", "൮", "൯", "൦"],
          ["അ", "ആ", "ഇ", "ഈ", "ഉ", "ഊ", "എ", "ഏ", "ഐ", "ഒ"],
          ["ഓ", "ഔ", "ൃ", "ൠ", "ാ", "ി", "ീ", "ു", "ൂ", "െ"],
          ["ക", "ഖ", "ഗ", "ഘ", "ങ", "ച", "ഛ", "ജ", "ഝ", "ഞ"],
          ["ട", "ഠ", "ഡ", "ഢ", "ണ", "ത", "ഥ", "ദ", "ധ", "ന"],
          ["പ", "ഫ", "ബ", "ഭ", "മ", "യ", "ര", "ല", "വ", "ശ"],
          ["ഷ", "സ", "ഹ", "ള", "ഴ", "റ", "േ", "ൈ", "ൊ", "ോ"],
          ["ൗ", "്", "ം", "ഃ", "ൽ", "ൻ", "ൾ", "ൺ", "ർ", "ൿ"]
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", marginBottom: "2px" }}>
            {row.map((key) => (
              <KeyboardButton key={key} onPress={() => handleKeyPress(key)}>
                {key}
              </KeyboardButton>
            ))}
          </div>
        ))}

        {/* Space + Backspace */}
        <div style={{ display: "flex", marginTop: "6px", gap: "2px" }}>
          <KeyboardButton
            onPress={() => handleKeyPress("{space}")}
            style={{
              flex: "1",
              backgroundColor: "#e9ecef",
              fontSize: "14px"
            }}
            isWide={true}
          >
            Space
          </KeyboardButton>
          <KeyboardButton
            onPress={() => handleKeyPress("{bksp}")}
            style={{
              width: "60px",
              backgroundColor: "#ffeaa7",
              fontSize: "16px"
            }}
            isWide={true}
          >
            ⌫
          </KeyboardButton>
        </div>
      </div>

      {/* Listening indicator */}
      {listening && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            marginTop: "8px",
            color: "#dc2626",
            fontSize: "12px"
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              backgroundColor: "#ef4444",
              borderRadius: "50%",
              animation: "pulse 1s infinite"
            }}
          ></div>
          <span>Listening...</span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default MalayalamKeyboard

// import React, { useState, useRef, useEffect } from "react"

// // Type declarations for Speech Recognition API
// declare global {
//   interface Window {
//     SpeechRecognition: any
//     webkitSpeechRecognition: any
//   }
// }

// interface SpeechRecognitionEvent {
//   resultIndex: number
//   results: {
//     length: number
//     [index: number]: {
//       isFinal: boolean
//       [index: number]: {
//         transcript: string
//       }
//     }
//   }
// }

// interface SpeechRecognitionErrorEvent {
//   error: string
// }

// type MalayalamKeyboardProps = {
//   value: string
//   onChange: (value: string) => void
// }

// const MalayalamKeyboard = ({
//   value,
//   onChange
// }) => {
//   const [listening, setListening] = useState(false)
//   const [speechSupported, setSpeechSupported] = useState(false)
//   const recognitionRef = useRef(null)
//   const timeoutRef = useRef(null)

//   useEffect(() => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition

//     if (!SpeechRecognition) {
//       setSpeechSupported(false)
//       return
//     }

//     setSpeechSupported(true)
//     const recognition = new SpeechRecognition()
//     recognition.lang = "ml-IN"
//     recognition.continuous = false
//     recognition.interimResults = false

//     recognition.onresult = (event: SpeechRecognitionEvent) => {
//       let finalTranscript = ""

//       for (let i = 0; i < event.results.length; i++) {
//         const result = event.results.item(i)
//         if (result && result.isFinal) {
//           finalTranscript += result[0].transcript
//         }
//       }

//       if (finalTranscript.trim()) {
//         onChange(finalTranscript + " ")
//       }
//     }

//     recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
//       console.error("Speech recognition error:", event.error)
//       setListening(false)
//     }

//     recognition.onend = () => {
//       setListening(false)
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current)
//         timeoutRef.current = null
//       }
//     }

//     recognition.onstart = () => {
//       setListening(true)
//       timeoutRef.current = setTimeout(() => {
//         if (recognitionRef.current) {
//           recognitionRef.current.stop()
//         }
//       }, 8000)
//     }

//     recognitionRef.current = recognition

//     return () => {
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current)
//         timeoutRef.current = null
//       }
//       if (recognitionRef.current) {
//         recognitionRef.current.stop()
//         recognitionRef.current = null
//       }
//     }
//   }, [value, onChange])

//   const handleKeyPress = (button: string) => {
//     if (button === "{bksp}") {
//       onChange(value.slice(0, -1))
//     } else if (button === "{space}") {
//       onChange(value + " ")
//     } else if (button === "{clear}") {
//       onChange("")
//     } else {
//       onChange(value + button)
//     }
//   }

//   const toggleListening = () => {
//     if (!recognitionRef.current || !speechSupported) {
//       return
//     }

//     if (!listening) {
//       try {
//         recognitionRef.current.start()
//       } catch (error) {
//         console.error("Error starting speech recognition:", error)
//         setListening(false)
//       }
//     } else {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop()
//       }
//       if (timeoutRef.current) {
//         clearTimeout(timeoutRef.current)
//         timeoutRef.current = null
//       }
//       setListening(false)
//     }
//   }

//   const KeyboardButton = ({
//     children,
//     onPress,
//     style = {},
//     isWide = false
//   }: {
//     children: React.ReactNode
//     onPress: () => void
//     style?: React.CSSProperties
//     isWide?: boolean
//   }) => (
//     <button
//       onClick={onPress}
//       style={{
//         margin: "1px",
//         padding: "0",
//         border: "1px solid #d0d0d0",
//         borderRadius: "6px",
//         background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
//         cursor: "pointer",
//         fontSize: "18px",
//         height: "44px",
//         width: isWide ? "auto" : "calc(10% - 2px)",
//         fontWeight: "400",
//         userSelect: "none",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
//         transition: "all 0.1s ease",
//         ...style
//       }}
//       onMouseDown={(e) => e.preventDefault()}
//       onTouchStart={(e) => {
//         e.currentTarget.style.transform = "scale(0.95)"
//         e.currentTarget.style.backgroundColor = "#e0e0e0"
//       }}
//       onTouchEnd={(e) => {
//         e.currentTarget.style.transform = "scale(1)"
//         e.currentTarget.style.backgroundColor = ""
//       }}
//       onMouseEnter={(e) => {
//         e.currentTarget.style.backgroundColor = "#f5f5f5"
//       }}
//       onMouseLeave={(e) => {
//         e.currentTarget.style.backgroundColor = ""
//       }}
//     >
//       {children}
//     </button>
//   )

//   return (
//     <div
//       style={{
//         padding: "8px",
//         backgroundColor: "#f8f9fa",
//         borderRadius: "8px",
//         boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
//         maxWidth: "100%",
//         userSelect: "none"
//       }}
//     >
//       {/* Control buttons */}
//       <div
//         style={{
//           display: "flex",
//           gap: "6px",
//           marginBottom: "8px",
//           justifyContent: "center",
//           flexWrap: "wrap"
//         }}
//       >
//         {speechSupported && (
//           <button
//             onClick={toggleListening}
//             style={{
//               padding: "8px 12px",
//               borderRadius: "6px",
//               color: "white",
//               fontSize: "13px",
//               fontWeight: "500",
//               border: "none",
//               cursor: "pointer",
//               backgroundColor: listening ? "#ef4444" : "#22c55e",
//               boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
//             }}
//           >
//             {listening ? "🎙 Listening..." : "🎤 Voice"}
//           </button>
//         )}

//         <button
//           onClick={() => handleKeyPress("{clear}")}
//           style={{
//             padding: "8px 12px",
//             backgroundColor: "#f97316",
//             color: "white",
//             borderRadius: "6px",
//             fontSize: "13px",
//             fontWeight: "500",
//             border: "none",
//             cursor: "pointer",
//             boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
//           }}
//         >
//           Clear All
//         </button>
//       </div>

//       {/* Keyboard layout like mobile */}
//       <div
//         style={{
//           backgroundColor: "#ffffff",
//           padding: "8px",
//           borderRadius: "6px"
//         }}
//       >
//         {/* Row 1 - Numbers and symbols */}
//         <div style={{ display: "flex", marginBottom: "2px" }}>
//           {["൧", "൨", "൩", "൪", "൫", "൬", "൭", "൮", "൯", "൦"].map((key) => (
//             <KeyboardButton key={key} onPress={() => handleKeyPress(key)}>
//               {key}
//             </KeyboardButton>
//           ))}
//         </div>

//         {/* Row 2 - Main vowels */}
//         <div style={{ display: "flex", marginBottom: "2px" }}>
//           {["അ", "ആ", "ഇ", "ഈ", "ഉ", "ഊ", "എ", "ഏ", "ഐ", "ഒ"].map((key) => (
//             <KeyboardButton key={key} onPress={() => handleKeyPress(key)}>
//               {key}
//             </KeyboardButton>
//           ))}
//         </div>

//         {/* Row 3 - More vowels */}
//         <div style={{ display: "flex", marginBottom: "2px" }}>
//           {["ഓ", "ഔ", "ൃ", "ൠ", "ാ", "ി", "ീ", "ു", "ൂ", "െ"].map((key) => (
//             <KeyboardButton key={key} onPress={() => handleKeyPress(key)}>
//               {key}
//             </KeyboardButton>
//           ))}
//         </div>

//         {/* Row 4 - Consonants 1 */}
//         <div style={{ display: "flex", marginBottom: "2px" }}>
//           {["ക", "ഖ", "ഗ", "ഘ", "ങ", "ച", "ഛ", "ജ", "ഝ", "ഞ"].map((key) => (
//             <KeyboardButton key={key} onPress={() => handleKeyPress(key)}>
//               {key}
//             </KeyboardButton>
//           ))}
//         </div>

//         {/* Row 5 - Consonants 2 */}
//         <div style={{ display: "flex", marginBottom: "2px" }}>
//           {["ട", "ഠ", "ഡ", "ഢ", "ണ", "ത", "ഥ", "ദ", "ധ", "ന"].map((key) => (
//             <KeyboardButton key={key} onPress={() => handleKeyPress(key)}>
//               {key}
//             </KeyboardButton>
//           ))}
//         </div>

//         {/* Row 6 - Consonants 3 */}
//         <div style={{ display: "flex", marginBottom: "2px" }}>
//           {["പ", "ഫ", "ബ", "ഭ", "മ", "യ", "ര", "ല", "വ", "ശ"].map((key) => (
//             <KeyboardButton key={key} onPress={() => handleKeyPress(key)}>
//               {key}
//             </KeyboardButton>
//           ))}
//         </div>

//         {/* Row 7 - More consonants */}
//         <div style={{ display: "flex", marginBottom: "2px" }}>
//           {["ഷ", "സ", "ഹ", "ള", "ഴ", "റ", "േ", "ൈ", "ൊ", "ോ"].map((key) => (
//             <KeyboardButton key={key} onPress={() => handleKeyPress(key)}>
//               {key}
//             </KeyboardButton>
//           ))}
//         </div>

//         {/* Row 8 - Chillus and signs */}
//         <div style={{ display: "flex", marginBottom: "2px" }}>
//           {["ൗ", "്", "ം", "ഃ", "ൽ", "ൻ", "ൾ", "ൺ", "ർ", "ൿ"].map((key) => (
//             <KeyboardButton key={key} onPress={() => handleKeyPress(key)}>
//               {key}
//             </KeyboardButton>
//           ))}
//         </div>

//         {/* Bottom row - Space and Backspace */}
//         <div style={{ display: "flex", marginTop: "6px", gap: "2px" }}>
//           <KeyboardButton
//             onPress={() => handleKeyPress("{space}")}
//             style={{
//               flex: "1",
//               backgroundColor: "#e9ecef",
//               fontSize: "14px"
//             }}
//             isWide={true}
//           >
//             Space
//           </KeyboardButton>
//           <KeyboardButton
//             onPress={() => handleKeyPress("{bksp}")}
//             style={{
//               width: "60px",
//               backgroundColor: "#ffeaa7",
//               fontSize: "16px"
//             }}
//             isWide={true}
//           >
//             ⌫
//           </KeyboardButton>
//         </div>
//       </div>

//       {/* Listening indicator */}
//       {listening && (
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             gap: "6px",
//             marginTop: "8px",
//             color: "#dc2626",
//             fontSize: "12px"
//           }}
//         >
//           <div
//             style={{
//               width: "8px",
//               height: "8px",
//               backgroundColor: "#ef4444",
//               borderRadius: "50%",
//               animation: "pulse 1s infinite"
//             }}
//           ></div>
//           <span>Listening...</span>
//         </div>
//       )}

//       <style>{`
//         @keyframes pulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.5; }
//         }
//       `}</style>
//     </div>
//   )
// }

// export default MalayalamKeyboard
