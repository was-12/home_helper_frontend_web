import { useState, useEffect, useRef } from 'react'
import './ChatbotModal.css'

const ChatbotModal = ({ onClose, userName }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: `Hi ${userName || 'there'}! 👋 I'm your Home Helper assistant. How can I help you today?`,
            timestamp: new Date(),
        },
    ])
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    const handleOptionClick = (option) => {
        // Add user message
        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: option.label,
            timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMsg])

        // Simulate bot typing
        setIsTyping(true)

        setTimeout(() => {
            const botMsg = {
                id: Date.now() + 1,
                sender: 'bot',
                text: option.response,
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, botMsg])
            setIsTyping(false)
        }, 1000)
    }

    const options = [
        {
            label: 'Where is my booking?',
            response: 'You can track your bookings in the "Track Requests" section of your dashboard. If a provider has accepted, you will see their details there.',
        },
        {
            label: 'How do I pay?',
            response: 'Once a provider completes the job, you will see a "Pay Now" button on the booking card. We accept credit cards and cash on delivery.',
        },
        {
            label: 'Cancel a booking',
            response: 'To cancel a booking, go to "Recent Bookings", find the booking you want to cancel, and click the "Cancel" button. Note that cancellation fees may apply if the provider is already on their way.',
        },
        {
            label: 'Contact Support',
            response: 'You can reach our human support team at support@homehelper.com or call us at +92-300-1234567.',
        },
    ]

    return (
        <div className="chatbot-overlay" onClick={onClose}>
            <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
                <div className="chatbot-header">
                    <div className="chatbot-header-info">
                        <div className="bot-avatar">🤖</div>
                        <div>
                            <h3>Home Helper Assistant</h3>
                            <span className="online-status">● Online</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="chatbot-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.sender}`}>
                            {msg.sender === 'bot' && <div className="message-avatar">🤖</div>}
                            <div className="message-bubble">
                                {msg.text}
                                <div className="message-time">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="message bot">
                            <div className="message-avatar">🤖</div>
                            <div className="message-bubble typing">
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chatbot-options">
                    <p>Choose an option:</p>
                    <div className="options-grid">
                        {options.map((option, index) => (
                            <button
                                key={index}
                                className="option-btn"
                                onClick={() => handleOptionClick(option)}
                                disabled={isTyping}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatbotModal
