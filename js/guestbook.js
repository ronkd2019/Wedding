/**
 * Guestbook Logic
 * Maintains a list of sticky notes in LocalStorage (for demo)
 * and handles UI rendering + Admin capabilities.
 */

/* --- CONFIGURATION --- */
const firebaseConfig = {
    apiKey: "AIzaSyDfo7j_KFDs1xuMSj6-5HV9ooLjE_Q_Yw8",
    authDomain: "wedding-78309.firebaseapp.com",
    projectId: "wedding-78309",
    storageBucket: "wedding-78309.firebasestorage.app",
    messagingSenderId: "607738380108",
    appId: "1:607738380108:web:51ce3824c5212cbd8f19e9",
    measurementId: "G-LNWPX3FZJ4"
};

/* --- STATE --- */
const AppState = {
    messages: [],
    isAdmin: false,
    db: null
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    AppState.db = firebase.firestore();
    console.log("Firebase initialized");
} catch (e) {
    console.error("Firebase initialization failed:", e);
    console.warn("Using LocalStorage fallback due to error.");
}

// Admin Password (Client-side simple check)
const ADMIN_PASS = "wedding2024";

document.addEventListener('DOMContentLoaded', () => {
    // Check if running in Admin Mode (persisted)
    if (sessionStorage.getItem('guestbook_admin') === 'true') {
        AppState.isAdmin = true;
        document.body.classList.add('admin-mode'); // Shows delete buttons
    }

    // Load Messages
    loadMessages();

    // Event Listeners
    setupModalListeners();
    setupAdminListeners();
});

/* --- STORAGE SERVICE --- */
function loadMessages() {
    if (AppState.db) {
        // Real-time Firestore Listener
        AppState.db.collection("messages").orderBy("date", "desc")
            .onSnapshot((snapshot) => {
                AppState.messages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                renderBoard();
            }, (error) => {
                console.error("Error loading messages:", error);
            });
    } else {
        // Fallback: LocalStorage
        const stored = localStorage.getItem('wedding_guestbook_messages');
        if (stored) {
            AppState.messages = JSON.parse(stored);
        } else {
            AppState.messages = [
                { id: "demo1", name: "Oleksandra & Dmytro", text: "Welcome to our guestbook! Leave us a note! ❤️", color: "pink", date: Date.now() }
            ];
            // Save initial demo message
            localStorage.setItem('wedding_guestbook_messages', JSON.stringify(AppState.messages));
        }
        renderBoard();
    }
}

function saveMessage(msg) {
    if (AppState.db) {
        // Save to Firestore
        AppState.db.collection("messages").add({
            name: msg.name,
            text: msg.text,
            color: msg.color,
            date: msg.date
        }).then(() => {
            console.log("Message saved!");
        }).catch((error) => {
            console.error("Error saving message:", error);
            alert("Could not save message. Check console.");
        });
    } else {
        // Save to LocalStorage
        AppState.messages.push(msg);
        localStorage.setItem('wedding_guestbook_messages', JSON.stringify(AppState.messages));
        renderBoard();
    }
}

function deleteMessage(id) {
    if (!AppState.isAdmin) return;

    // Check if user has opted out of confirmation
    const dontAsk = localStorage.getItem('wedding_guestbook_dont_ask_delete');
    if (dontAsk === 'true') {
        performDelete(id);
        return;
    }

    // Show Confirmation Modal
    const modal = document.getElementById('confirmDeleteModal');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');
    const dontAskCheckbox = document.getElementById('dontAskAgain');

    modal.style.display = 'block';

    // Reset checkbox
    dontAskCheckbox.checked = false;

    // Handle Confirm
    const onConfirm = () => {
        if (dontAskCheckbox.checked) {
            localStorage.setItem('wedding_guestbook_dont_ask_delete', 'true');
        }
        performDelete(id);
        closeModal();
    };

    // Handle Cancel
    const onCancel = () => {
        closeModal();
    };

    // Cleanup and Close Helper
    const closeModal = () => {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);

    // Close ×
    const closeXBtn = document.getElementById('closeConfirmDelete');
    if (closeXBtn) closeXBtn.onclick = closeModal;

    // Close on click outside
    window.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
}

function performDelete(id) {
    if (AppState.db) {
        // Delete from Firestore
        AppState.db.collection("messages").doc(id).delete()
            .then(() => {
                console.log("Message deleted!");
            }).catch((error) => {
                console.error("Error deleting:", error);
            });
    } else {
        // Delete from LocalStorage
        AppState.messages = AppState.messages.filter(m => String(m.id) !== String(id));
        localStorage.setItem('wedding_guestbook_messages', JSON.stringify(AppState.messages));
        renderBoard();
    }
}

/* --- UI RENDERING --- */
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    // Sort by newest first
    const sorted = [...AppState.messages].sort((a, b) => b.date - a.date);

    sorted.forEach((msg) => {
        const note = document.createElement('div');
        note.className = `sticky-note ${msg.color || 'yellow'}`;

        // Random slight rotation using date as seed (stable)
        const rotation = (msg.date % 10 - 5);
        note.style.transform = `rotate(${rotation}deg)`;

        note.innerHTML = `
            <div class="pin"></div>
            ${AppState.isAdmin ? `<button class="delete-btn" onclick="deleteMessage('${msg.id}')">✕</button>` : ''}
            <div class="note-content">${escapeHtml(msg.text)}</div>
            <div class="note-author">- ${escapeHtml(msg.name)}</div>
        `;

        board.appendChild(note);
    });
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* --- INTERACTION --- */
function setupModalListeners() {
    const modal = document.getElementById('noteModal');
    const addBtn = document.getElementById('addNoteBtn');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('noteForm');
    const colorOptions = document.querySelectorAll('.color-option');

    // Open
    addBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // Close
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        form.reset();
    });

    // Color Selection
    let selectedColor = 'yellow';
    colorOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            // Remove active class from all
            colorOptions.forEach(o => o.classList.remove('selected'));
            // Add to clicked
            opt.classList.add('selected');
            selectedColor = opt.getAttribute('data-color');
        });
    });

    // Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('guestName').value;
        const text = document.getElementById('guestMessage').value;

        if (name && text) {
            const newMessage = {
                id: Date.now(), // Simple unique ID
                name: name,
                text: text,
                color: selectedColor,
                date: Date.now()
            };

            saveMessage(newMessage);

            // Close and reset
            modal.style.display = 'none';
            form.reset();
        }
    });

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function setupAdminListeners() {
    const trigger = document.getElementById('adminTrigger');
    const modal = document.getElementById('adminModal');
    const closeBtn = document.getElementById('closeAdmin');
    const form = document.getElementById('adminForm');

    // Secret Trigger (Pi symbol in footer)
    trigger.addEventListener('click', () => {
        if (AppState.isAdmin) {
            // Already logged in, maybe logout?
            if (confirm("Logout admin?")) {
                AppState.isAdmin = false;
                sessionStorage.removeItem('guestbook_admin');
                document.body.classList.remove('admin-mode');
                renderBoard();
            }
        } else {
            modal.style.display = 'block';
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = document.getElementById('adminPass').value;

        if (pass === ADMIN_PASS) {
            AppState.isAdmin = true;
            sessionStorage.setItem('guestbook_admin', 'true');
            document.body.classList.add('admin-mode');
            renderBoard();
            modal.style.display = 'none';
            // Show a small in-page toast instead of alert()
            const toast = document.createElement('div');
            toast.textContent = '✓ Admin mode activated';
            toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--primary-color);color:white;padding:12px 24px;border-radius:50px;font-size:0.95rem;z-index:9999;box-shadow:0 4px 15px rgba(0,0,0,0.2);';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } else {
            const passField = document.getElementById('adminPass');
            passField.style.borderColor = '#e74c3c';
            setTimeout(() => passField.style.borderColor = '', 2000);
        }
        form.reset();
    });

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Make delete available globally
window.deleteMessage = deleteMessage;
