// Chatbot Application
class ChatBot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.themeToggle = document.getElementById('themeToggle');
        this.clearChat = document.getElementById('clearChat');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.suggestionChips = document.getElementById('suggestionChips');
        this.charCount = document.getElementById('charCount');
        this.messageSound = document.getElementById('messageSound');
        this.botStatus = document.getElementById('botStatus');
        
        this.chatHistory = [];
        this.isTyping = false;
        this.currentTheme = this.getSystemTheme();
        
        this.initializeResponses();
        this.initializeEventListeners();
        this.initializeWelcome();
        this.updateThemeToggle();
    }

    initializeResponses() {
        this.responses = {
            greetings: [
                "Hello! How can I help you today?",
                "Hi there! What's on your mind?",
                "Hey! Nice to meet you!",
                "Good day! How are you doing?"
            ],
            about_bot: [
                "I'm ChatBot, your friendly AI assistant! I'm here to chat and help answer questions.",
                "I'm a simple chatbot created to demonstrate conversational AI. What would you like to know?",
                "I'm ChatBot! I can help with basic questions and have friendly conversations."
            ],
            how_are_you: [
                "I'm doing great, thanks for asking! How about you?",
                "I'm functioning perfectly! How's your day going?",
                "I'm fantastic! Thanks for checking in."
            ],
            help: [
                "I can help with basic questions, have conversations, tell jokes, or share interesting facts. Just type anything!",
                "You can ask me questions, request jokes, or just chat casually. I'm here to help!",
                "I'm here to chat! Try asking me about myself, request a joke, or just say hello."
            ],
            jokes: [
                "Why don't scientists trust atoms? Because they make up everything!",
                "I told my computer a joke about UDP... I don't know if it got it.",
                "Why do programmers prefer dark mode? Because light attracts bugs!",
                "How do you comfort a JavaScript bug? You console it!"
            ],
            facts: [
                "Did you know? Octopuses have three hearts and blue blood!",
                "Fun fact: A group of flamingos is called a 'flamboyance'!",
                "Interesting: Honey never spoils - archaeologists have found edible honey in ancient Egyptian tombs!",
                "Amazing: A single cloud can weigh more than a million pounds!"
            ],
            goodbye: [
                "Goodbye! It was nice chatting with you!",
                "See you later! Have a great day!",
                "Bye! Feel free to come back anytime!"
            ],
            default: [
                "That's interesting! Tell me more.",
                "I'm not sure I understand completely, but I'm listening!",
                "Could you elaborate on that?",
                "Hmm, that's a good point. What else is on your mind?",
                "I see! What would you like to talk about next?"
            ]
        };

        this.patterns = {
            greetings: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings"],
            about_bot: ["who are you", "what are you", "tell me about yourself", "your name"],
            how_are_you: ["how are you", "how's it going", "what's up", "how do you feel"],
            help: ["help", "what can you do", "how do you work", "instructions"],
            jokes: ["joke", "funny", "make me laugh", "humor", "tell me a joke"],
            facts: ["fact", "interesting", "tell me something", "surprise me", "fun fact"],
            goodbye: ["bye", "goodbye", "see you", "farewell", "exit", "quit"]
        };
    }

    initializeEventListeners() {
        // Send message events
        this.sendButton.addEventListener('click', () => this.handleSendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });

        // Character count
        this.messageInput.addEventListener('input', () => this.updateCharCount());

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Clear chat
        this.clearChat.addEventListener('click', () => this.clearChatHistory());

        // Suggestion chips
        this.suggestionChips.addEventListener('click', (e) => {
            if (e.target.classList.contains('chip')) {
                const suggestion = e.target.getAttribute('data-suggestion');
                this.messageInput.value = suggestion;
                this.handleSendMessage();
            }
        });

        // Auto-resize input
        this.messageInput.addEventListener('input', () => this.autoResizeInput());

        // Prevent empty message submission
        this.messageInput.addEventListener('input', () => this.toggleSendButton());
    }

    initializeWelcome() {
        const welcomeTime = document.getElementById('welcomeTime');
        if (welcomeTime) {
            welcomeTime.textContent = this.getCurrentTime();
        }
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeToggle();
    }

    updateThemeToggle() {
        const themeIcon = this.themeToggle.querySelector('.theme-icon');
        themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 450) {
            this.charCount.style.color = 'var(--color-warning)';
        } else if (count > 400) {
            this.charCount.style.color = 'var(--color-error)';
        } else {
            this.charCount.style.color = 'var(--color-text-secondary)';
        }
    }

    toggleSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isTyping;
    }

    autoResizeInput() {
        // This could be enhanced to resize the input height for multiline
        // For now, we'll just ensure proper button state
        this.toggleSendButton();
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || this.isTyping) return;

        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.updateCharCount();
        this.toggleSendButton();
        
        // Hide suggestion chips after first message
        if (this.suggestionChips && this.chatHistory.length === 1) {
            this.suggestionChips.style.display = 'none';
        }

        // Show typing indicator and generate response
        await this.showTypingIndicator();
        const response = this.generateResponse(message);
        await this.hideTypingIndicator();
        
        // Add bot response
        this.addMessage(response, 'bot');
        this.playNotificationSound();
    }

    addMessage(text, sender) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `message ${sender}-message`;
        
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        
        const messageText = document.createElement('p');
        messageText.textContent = text;
        
        const messageTime = document.createElement('span');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();
        
        messageBubble.appendChild(messageText);
        messageBubble.appendChild(messageTime);
        messageContainer.appendChild(messageBubble);
        
        this.chatMessages.appendChild(messageContainer);
        this.scrollToBottom();
        
        // Store in chat history
        this.chatHistory.push({
            text: text,
            sender: sender,
            timestamp: new Date().toISOString()
        });
    }

    async showTypingIndicator() {
        this.isTyping = true;
        this.toggleSendButton();
        this.updateBotStatus('Typing...');
        this.typingIndicator.style.display = 'block';
        this.scrollToBottom();
        
        // Random typing delay between 1-3 seconds for realism
        const delay = 1000 + Math.random() * 2000;
        await this.sleep(delay);
    }

    async hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
        this.isTyping = false;
        this.toggleSendButton();
        this.updateBotStatus('Online');
    }

    updateBotStatus(status) {
        this.botStatus.textContent = status;
    }

    generateResponse(message) {
        const lowercaseMessage = message.toLowerCase();
        
        // Check each pattern category
        for (const [category, patterns] of Object.entries(this.patterns)) {
            for (const pattern of patterns) {
                if (lowercaseMessage.includes(pattern)) {
                    const responses = this.responses[category];
                    return responses[Math.floor(Math.random() * responses.length)];
                }
            }
        }
        
        // Default response if no pattern matches
        const defaultResponses = this.responses.default;
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    scrollToBottom() {
        // Use setTimeout to ensure DOM is updated before scrolling
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    playNotificationSound() {
        try {
            if (this.messageSound) {
                this.messageSound.currentTime = 0;
                this.messageSound.play().catch(() => {
                    // Ignore audio play errors (common in browsers with autoplay restrictions)
                });
            }
        } catch (error) {
            // Silently handle audio errors
        }
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            // Remove all messages except welcome message
            const messages = this.chatMessages.querySelectorAll('.message:not(.welcome-message .message)');
            messages.forEach(message => message.remove());
            
            // Show suggestion chips again
            if (this.suggestionChips) {
                this.suggestionChips.style.display = 'flex';
            }
            
            // Clear chat history array
            this.chatHistory = [];
            
            // Focus on input
            this.messageInput.focus();
        }
    }

    exportChatHistory() {
        if (this.chatHistory.length === 0) {
            alert('No chat history to export!');
            return;
        }

        let exportText = 'ChatBot Conversation Export\n';
        exportText += '================================\n\n';
        
        this.chatHistory.forEach((message, index) => {
            const sender = message.sender === 'user' ? 'You' : 'ChatBot';
            const time = new Date(message.timestamp).toLocaleString();
            exportText += `${sender} (${time}): ${message.text}\n\n`;
        });
        
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatbot-conversation-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new ChatBot();
    
    // Make chatbot globally available for debugging/testing
    window.chatbot = chatbot;
    
    // Handle system theme changes
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!document.documentElement.hasAttribute('data-theme')) {
                chatbot.currentTheme = e.matches ? 'dark' : 'light';
                chatbot.updateThemeToggle();
            }
        });
    }
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            chatbot.messageInput.focus();
        }
        
        // Escape to clear input
        if (e.key === 'Escape') {
            chatbot.messageInput.value = '';
            chatbot.updateCharCount();
            chatbot.toggleSendButton();
        }
    });
    
    // Handle window visibility changes
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Reset bot status when user returns to tab
            if (!chatbot.isTyping) {
                chatbot.updateBotStatus('Online');
            }
        }
    });

    // Add export functionality (could be triggered by a button or key combination)
    // Ctrl/Cmd + E to export chat
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            chatbot.exportChatHistory();
        }
    });
});