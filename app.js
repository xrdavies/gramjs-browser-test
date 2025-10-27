// Global variables
let client = null;
let isConnected = false;
let isListening = false;
let selectedChatId = null;

// Telegram classes - will be initialized when needed
let TelegramClient, StringSession, NewMessage, Api;

// Wait for library to load with timeout
async function waitForTelegramLibrary(maxWaitMs = 10000) {
    const startTime = Date.now();

    while (typeof telegram === 'undefined') {
        if (Date.now() - startTime > maxWaitMs) {
            throw new Error('Telegram library failed to load after 10 seconds. Check your internet connection or try refreshing the page.');
        }
        // Wait 100ms before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true;
}

// Initialize Telegram classes once the library is loaded
async function initTelegramClasses() {
    // Wait for library to be available
    await waitForTelegramLibrary();

    if (typeof telegram === 'undefined') {
        throw new Error('Telegram library not loaded. Please refresh the page.');
    }

    if (!TelegramClient) {
        console.log('Initializing Telegram classes...');
        console.log('telegram object:', telegram);
        console.log('telegram.TelegramClient:', telegram.TelegramClient);
        console.log('telegram.sessions:', telegram.sessions);

        TelegramClient = telegram.TelegramClient;
        StringSession = telegram.sessions.StringSession;
        NewMessage = telegram.events.NewMessage;
        Api = telegram.Api;

        console.log('✅ Telegram classes initialized:');
        console.log('  - TelegramClient:', typeof TelegramClient);
        console.log('  - StringSession:', typeof StringSession);
        console.log('  - NewMessage:', typeof NewMessage);
        console.log('  - Api:', typeof Api);
    }
}

// Status display helpers
function showStatus(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="status ${type}">${message}</div>`;
}

function clearStatus(elementId) {
    document.getElementById(elementId).innerHTML = '';
}

// Connect to Telegram
async function connect() {
    const apiId = parseInt(document.getElementById('apiId').value);
    const apiHash = document.getElementById('apiHash').value;
    const sessionString = document.getElementById('sessionString').value.trim();

    if (!apiId || !apiHash) {
        showStatus('connectionStatus', '❌ Please enter API ID and API Hash', 'error');
        return;
    }

    if (!sessionString) {
        showStatus('connectionStatus', '❌ Please enter a session string', 'error');
        return;
    }

    try {
        showStatus('connectionStatus', '⏳ Connecting to Telegram...', 'info');
        document.getElementById('connectBtn').disabled = true;

        // Initialize Telegram classes
        initTelegramClasses();

        // Create session from string
        const session = new StringSession(sessionString);

        // Create client
        client = new TelegramClient(session, apiId, apiHash, {
            connectionRetries: 5,
        });

        // Connect
        await client.connect();

        // Verify connection by getting current user
        const me = await client.getMe();

        isConnected = true;
        showStatus('connectionStatus', `✅ Connected as ${me.firstName || 'User'} (@${me.username || 'no username'})`, 'success');

        // Enable other buttons
        document.getElementById('listDialogsBtn').disabled = false;
        document.getElementById('startListeningBtn').disabled = false;
        document.getElementById('sendBtn').disabled = false;

        console.log('Connected user:', me);
    } catch (error) {
        console.error('Connection error:', error);
        showStatus('connectionStatus', `❌ Connection failed: ${error.message}`, 'error');
        document.getElementById('connectBtn').disabled = false;
    }
}

// List dialogs (groups/channels)
async function listDialogs() {
    if (!isConnected || !client) {
        showStatus('dialogsStatus', '❌ Please connect first', 'error');
        return;
    }

    try {
        showStatus('dialogsStatus', '⏳ Fetching dialogs...', 'info');
        document.getElementById('listDialogsBtn').disabled = true;

        const dialogs = await client.getDialogs({ limit: 100 });

        const dialogsList = document.getElementById('dialogsList');
        dialogsList.innerHTML = '';

        if (dialogs.length === 0) {
            dialogsList.innerHTML = '<div class="loading">No dialogs found</div>';
            showStatus('dialogsStatus', '⚠️ No dialogs found', 'info');
        } else {
            let channelCount = 0;
            let groupCount = 0;

            dialogs.forEach(dialog => {
                const entity = dialog.entity;
                const isChannel = entity.broadcast;
                const isGroup = entity.megagroup || (entity.className === 'Chat');

                if (isChannel) channelCount++;
                if (isGroup) groupCount++;

                const item = document.createElement('div');
                item.className = 'dialog-item';
                item.onclick = () => selectChat(dialog);

                let badge = '';
                if (isChannel) badge = '<span class="badge channel">Channel</span>';
                else if (isGroup) badge = '<span class="badge group">Group</span>';

                item.innerHTML = `
                    <div class="dialog-title">${entity.title || entity.firstName || 'Unknown'}${badge}</div>
                    <div class="dialog-info">
                        ID: ${entity.id} |
                        ${entity.username ? '@' + entity.username : 'No username'} |
                        ${entity.participantsCount || 0} members
                    </div>
                `;

                dialogsList.appendChild(item);
            });

            showStatus('dialogsStatus', `✅ Found ${dialogs.length} dialogs (${channelCount} channels, ${groupCount} groups)`, 'success');
        }

        document.getElementById('listDialogsBtn').disabled = false;
    } catch (error) {
        console.error('Error fetching dialogs:', error);
        showStatus('dialogsStatus', `❌ Failed to fetch dialogs: ${error.message}`, 'error');
        document.getElementById('listDialogsBtn').disabled = false;
    }
}

// Select a chat for messaging
function selectChat(dialog) {
    selectedChatId = dialog.entity.id;
    document.getElementById('targetChat').value = dialog.entity.username || dialog.entity.id;
    showStatus('sendStatus', `✅ Selected: ${dialog.entity.title || dialog.entity.firstName}`, 'success');
}

// Start listening for new messages
async function startListening() {
    if (!isConnected || !client) {
        showStatus('messagesStatus', '❌ Please connect first', 'error');
        return;
    }

    if (isListening) {
        showStatus('messagesStatus', '⚠️ Already listening', 'info');
        return;
    }

    try {
        isListening = true;
        document.getElementById('startListeningBtn').disabled = true;
        document.getElementById('stopListeningBtn').disabled = false;

        showStatus('messagesStatus', '👂 Listening for new messages...', 'info');

        // Add event handler for new messages
        client.addEventHandler(handleNewMessage, new NewMessage({}));

        console.log('Started listening for messages');
    } catch (error) {
        console.error('Error starting listener:', error);
        showStatus('messagesStatus', `❌ Failed to start listening: ${error.message}`, 'error');
        isListening = false;
        document.getElementById('startListeningBtn').disabled = false;
        document.getElementById('stopListeningBtn').disabled = true;
    }
}

// Stop listening for messages
function stopListening() {
    if (!isListening) {
        return;
    }

    isListening = false;
    document.getElementById('startListeningBtn').disabled = false;
    document.getElementById('stopListeningBtn').disabled = true;

    showStatus('messagesStatus', '⏸️ Stopped listening', 'info');
    console.log('Stopped listening for messages');
}

// Handle new message event
async function handleNewMessage(event) {
    const message = event.message;

    console.log('New message:', message);

    const messagesList = document.getElementById('messagesList');

    // Create message item
    const item = document.createElement('div');
    item.className = 'message-item';

    const sender = await message.getSender();
    const senderName = sender ? (sender.firstName || sender.title || 'Unknown') : 'Unknown';
    const chat = await message.getChat();
    const chatName = chat ? (chat.title || chat.firstName || 'Unknown') : 'Unknown';

    const date = new Date(message.date * 1000).toLocaleString();

    item.innerHTML = `
        <div class="message-sender">${senderName} in ${chatName}</div>
        <div class="message-text">${message.text || '(no text)'}</div>
        <div class="message-date">${date}</div>
    `;

    // Add to top of list
    messagesList.insertBefore(item, messagesList.firstChild);

    // Update status
    showStatus('messagesStatus', `👂 Listening... (received ${messagesList.children.length} messages)`, 'success');
}

// Send message
async function sendMessage() {
    if (!isConnected || !client) {
        showStatus('sendStatus', '❌ Please connect first', 'error');
        return;
    }

    const targetChat = document.getElementById('targetChat').value.trim();
    const messageText = document.getElementById('messageText').value.trim();

    if (!targetChat) {
        showStatus('sendStatus', '❌ Please enter a target chat', 'error');
        return;
    }

    if (!messageText) {
        showStatus('sendStatus', '❌ Please enter a message', 'error');
        return;
    }

    try {
        showStatus('sendStatus', '⏳ Sending message...', 'info');
        document.getElementById('sendBtn').disabled = true;

        // Send message
        await client.sendMessage(targetChat, { message: messageText });

        showStatus('sendStatus', `✅ Message sent successfully to ${targetChat}`, 'success');
        document.getElementById('messageText').value = '';

        console.log('Message sent:', messageText, 'to', targetChat);

        document.getElementById('sendBtn').disabled = false;
    } catch (error) {
        console.error('Error sending message:', error);
        showStatus('sendStatus', `❌ Failed to send message: ${error.message}`, 'error');
        document.getElementById('sendBtn').disabled = false;
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', async () => {
    if (client) {
        await client.disconnect();
    }
});

// Wait for page to fully load before initializing
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🔷 GramJS Test Client - Page loaded');

    // Show loading status while waiting for library
    const statusEl = document.getElementById('connectionStatus');
    if (statusEl) {
        statusEl.innerHTML = '<div class="status info">⏳ Loading Telegram library...</div>';
    }

    // Wait for library with timeout
    try {
        await waitForTelegramLibrary();
        await initTelegramClasses();
        console.log('✅ Telegram classes initialized successfully');
        console.log('Ready to connect!');

        if (statusEl) {
            statusEl.innerHTML = '<div class="status success">✅ Ready! Enter your session string and click Connect.</div>';
        }
    } catch (error) {
        console.error('❌ Failed to initialize:', error.message);
        if (statusEl) {
            statusEl.innerHTML = `<div class="status error">❌ ${error.message}</div>`;
        }
    }
});
