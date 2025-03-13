'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './consultation.module.css'

type Message = {
  type: 'system' | 'question' | 'user' | 'advice'
  content: string
  isTyping?: boolean
}

export default function Consultation() {
  const [messages, setMessages] = useState<Message[]>([])
  const [symptom, setSymptom] = useState('')
  const [userInput, setUserInput] = useState('')
  const [started, setStarted] = useState(false)
  const [consultationComplete, setConsultationComplete] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startConsultation = () => {
    if (!symptom) return

    const sessionId = Date.now().toString()
    socketRef.current = new WebSocket(`ws://123.57.95.134:8000/ws/health-consultation/${sessionId}`)

    socketRef.current.onopen = () => {
      setStarted(true)
      socketRef.current?.send(JSON.stringify({ symptom }))
      setMessages(prev => [...prev, {
        type: 'system',
        content: `症状：${symptom}`
      }])
    }

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.isTyping) {
        // 更新或添加正在输入的消息
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1]
          // 如果最后一条消息是同类型且正在输入，则更新它
          if (lastMessage && lastMessage.type === data.type && lastMessage.isTyping) {
            const newMessages = [...prev]
            newMessages[prev.length - 1] = {
              ...lastMessage,
              content: data.content,
              isTyping: true
            }
            return newMessages
          } else {
            // 否则添加新消息
            return [...prev, {
              type: data.type,
              content: data.content,
              isTyping: true
            }]
          }
        })
      } else {
        // 消息输入完成
        setMessages(prev => {
          const newMessages = [...prev]
          if (newMessages[newMessages.length - 1]?.type === data.type) {
            // 更新最后一条消息为完成状态
            newMessages[newMessages.length - 1] = {
              type: data.type,
              content: data.content,
              isTyping: false
            }
            return newMessages
          }
          return [...prev, {
            type: data.type,
            content: data.content,
            isTyping: false
          }]
        })

        if (data.type === 'advice') {
          setConsultationComplete(true)
        }
      }
    }

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setMessages(prev => [...prev, {
        type: 'system',
        content: '连接错误，请刷新页面重试'
      }])
    }
  }

  const sendResponse = () => {
    if (!userInput || !socketRef.current) return

    socketRef.current.send(JSON.stringify({ answer: userInput }))
    setMessages(prev => [...prev, {
      type: 'user',
      content: userInput
    }])
    setUserInput('')
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>AI 健康咨询</h1>
      
      <div className={styles.chatContainer}>
        <div className={styles.chatMessages}>
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${styles[message.type]}`}
            >
              {message.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          {!started ? (
            <div className={styles.startForm}>
              <input
                type="text"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                placeholder="请输入您的症状"
                className={styles.input}
              />
              <button 
                onClick={startConsultation}
                className={styles.button}
              >
                开始咨询
              </button>
            </div>
          ) : !consultationComplete ? (
            <div className={styles.responseForm}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendResponse()}
                placeholder="请输入您的回答"
                className={styles.input}
              />
              <button 
                onClick={sendResponse}
                className={styles.button}
              >
                发送
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}