const chatBox = document.getElementById('chatBox');
        const userInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendBtn');

        // Function to add a message to the chat
        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.classList.add(sender);
            messageDiv.textContent = text;
            chatBox.appendChild(messageDiv);
            
            // Auto-scroll to the bottom
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // Handle sending messages
        function handleSend() {
            const text = userInput.value.trim();
            if (text !== '') {
                // Add user message
                addMessage(text, 'user');
                userInput.value = '';

                // Simulate bot response after a short delay
                setTimeout(() => {
                    const responses = [
                     "vedi",
                      "orkam vernu",
                      "purr",
                      "pari",
                      "kona venda",
                      "shivram indo"
                    ];
                    const randomReply = responses[Math.floor(Math.random() * responses.length)];
                    addMessage(randomReply, 'bot');
                }, 800);
            }
        }

        // Event listeners for clicking Send or pressing Enter
        sendBtn.addEventListener('click', handleSend);
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSend();
            }
        });