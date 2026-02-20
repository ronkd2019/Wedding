/**
 * Guestbook Logic
 * Maintains sticky notes in Firebase Firestore with fallback to LocalStorage.
 * Includes full keyboard accessibility: focus trapping, Escape to close, auto-focus.
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
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

// Admin Password (Client-side simple check)
const ADMIN_PASS = "wedding2024";

/* ============================================
   ACCESSIBILITY HELPERS
   ============================================ */

/**
 * Trap focus inside a modal while it is open.
 * Returns a cleanup function that removes the listener.
 */
function trapFocus(modal) {
    const focusableSelectors = [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[role="radio"]'
    ].join(', ');

    const focusable = Array.from(modal.querySelectorAll(focusableSelectors));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handleTab(e) {
        if (e.key !== 'Tab') return;
        if (focusable.length === 0) { e.preventDefault(); return; }

        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    modal.addEventListener('keydown', handleTab);

    // Auto-focus the first focusable element (heading or first input)
    const firstInput = modal.querySelector('input, textarea, button.close-modal');
    if (firstInput) firstInput.focus();

    return () => modal.removeEventListener('keydown', handleTab);
}

/**
 * Open a modal: remove hidden, trap focus, add Escape listener.
 * Returns a close function that reverses everything.
 */
function openModal(modal, triggerElement) {
    const previouslyFocused = triggerElement || document.activeElement;

    modal.removeAttribute('hidden');
    modal.style.display = 'block';

    const removeTrap = trapFocus(modal);

    function onEscape(e) {
        if (e.key === 'Escape') closeModal();
    }
    document.addEventListener('keydown', onEscape);

    function onBackdropClick(e) {
        if (e.target === modal) closeModal();
    }
    modal.addEventListener('click', onBackdropClick);

    function closeModal() {
        modal.style.display = 'none';
        modal.setAttribute('hidden', '');
        removeTrap();
        document.removeEventListener('keydown', onEscape);
        modal.removeEventListener('click', onBackdropClick);
        // Return focus to the element that triggered the modal
        if (previouslyFocused && previouslyFocused.focus) {
            previouslyFocused.focus();
        }
    }

    return closeModal;
}

/* ============================================
   INITIALISATION
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('guestbook_admin') === 'true') {
        AppState.isAdmin = true;
        document.body.classList.add('admin-mode');
    }

    loadMessages();
    setupModalListeners();
    setupAdminListeners();
});

/* --- STORAGE SERVICE --- */
function loadMessages() {
    if (AppState.db) {
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
        const stored = localStorage.getItem('wedding_guestbook_messages');
        if (stored) {
            AppState.messages = JSON.parse(stored);
        } else {
            AppState.messages = [
                { id: "demo1", name: "Oleksandra & Dmytro", text: "Welcome to our guestbook! Leave us a note! ❤️", color: "pink", date: Date.now() }
            ];
            localStorage.setItem('wedding_guestbook_messages', JSON.stringify(AppState.messages));
        }
        renderBoard();
    }
}

function saveMessage(msg) {
    if (AppState.db) {
        AppState.db.collection("messages").add({
            name: msg.name,
            text: msg.text,
            color: msg.color,
            date: msg.date
        }).catch((error) => {
            console.error("Error saving message:", error);
        });
    } else {
        AppState.messages.push(msg);
        localStorage.setItem('wedding_guestbook_messages', JSON.stringify(AppState.messages));
        renderBoard();
    }
}

function deleteMessage(id) {
    if (!AppState.isAdmin) return;

    const dontAsk = localStorage.getItem('wedding_guestbook_dont_ask_delete');
    if (dontAsk === 'true') {
        performDelete(id);
        return;
    }

    const modal = document.getElementById('confirmDeleteModal');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');
    const dontAskCheckbox = document.getElementById('dontAskAgain');
    const closeXBtn = document.getElementById('closeConfirmDelete');

    dontAskCheckbox.checked = false;

    const closeModal = openModal(modal, document.activeElement);

    const onConfirm = () => {
        if (dontAskCheckbox.checked) {
            localStorage.setItem('wedding_guestbook_dont_ask_delete', 'true');
        }
        performDelete(id);
        cleanup();
        closeModal();
    };

    const onCancel = () => {
        cleanup();
        closeModal();
    };

    function cleanup() {
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', onCancel);
        if (closeXBtn) closeXBtn.removeEventListener('click', onCancel);
    }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    if (closeXBtn) closeXBtn.addEventListener('click', onCancel);
}

function performDelete(id) {
    if (AppState.db) {
        AppState.db.collection("messages").doc(id).delete()
            .catch((error) => console.error("Error deleting:", error));
    } else {
        AppState.messages = AppState.messages.filter(m => String(m.id) !== String(id));
        localStorage.setItem('wedding_guestbook_messages', JSON.stringify(AppState.messages));
        renderBoard();
    }
}

/* --- UI RENDERING --- */
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    const sorted = [...AppState.messages].sort((a, b) => b.date - a.date);

    sorted.forEach((msg) => {
        const note = document.createElement('div');
        note.className = `sticky-note ${msg.color || 'yellow'}`;

        const rotation = (msg.date % 10 - 5);
        note.style.transform = `rotate(${rotation}deg) translateZ(0)`;

        note.innerHTML = `
            <div class="pin" aria-hidden="true"></div>
            ${AppState.isAdmin ? `<button class="delete-btn" onclick="deleteMessage('${msg.id}')" aria-label="Delete note from ${escapeHtml(msg.name)}">✕</button>` : ''}
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
    const closeBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('noteForm');
    const colorOptions = document.querySelectorAll('.color-option');

    let closeModal = null;

    addBtn.addEventListener('click', () => {
        closeModal = openModal(modal, addBtn);
    });

    closeBtn.addEventListener('click', () => {
        if (closeModal) { closeModal(); closeModal = null; }
        form.reset();
        resetColorPicker();
    });

    // Color Selection (keyboard + mouse)
    let selectedColor = 'yellow';

    function selectColor(opt) {
        colorOptions.forEach(o => {
            o.classList.remove('selected');
            o.setAttribute('aria-checked', 'false');
        });
        opt.classList.add('selected');
        opt.setAttribute('aria-checked', 'true');
        selectedColor = opt.getAttribute('data-color');
    }

    function resetColorPicker() {
        selectedColor = 'yellow';
        colorOptions.forEach((o, i) => {
            const isFirst = i === 0;
            o.classList.toggle('selected', isFirst);
            o.setAttribute('aria-checked', isFirst ? 'true' : 'false');
        });
    }

    colorOptions.forEach(opt => {
        opt.addEventListener('click', () => selectColor(opt));
        // Keyboard: Enter or Space to select a colour swatch
        opt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectColor(opt);
            }
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('guestName').value.trim();
        const text = document.getElementById('guestMessage').value.trim();

        if (name && text) {
            const newMessage = {
                id: Date.now(),
                name,
                text,
                color: selectedColor,
                date: Date.now()
            };

            saveMessage(newMessage);

            if (closeModal) { closeModal(); closeModal = null; }
            form.reset();
            resetColorPicker();
        }
    });
}

function setupAdminListeners() {
    const trigger = document.getElementById('adminTrigger');
    const modal = document.getElementById('adminModal');
    const closeBtn = document.getElementById('closeAdmin');
    const form = document.getElementById('adminForm');

    let closeModal = null;

    trigger.addEventListener('click', () => {
        if (AppState.isAdmin) {
            if (window.confirm("Logout admin?")) {
                AppState.isAdmin = false;
                sessionStorage.removeItem('guestbook_admin');
                document.body.classList.remove('admin-mode');
                renderBoard();
            }
        } else {
            closeModal = openModal(modal, trigger);
        }
    });

    closeBtn.addEventListener('click', () => {
        if (closeModal) { closeModal(); closeModal = null; }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pass = document.getElementById('adminPass').value;

        if (pass === ADMIN_PASS) {
            AppState.isAdmin = true;
            sessionStorage.setItem('guestbook_admin', 'true');
            document.body.classList.add('admin-mode');
            renderBoard();
            if (closeModal) { closeModal(); closeModal = null; }

            const toast = document.createElement('div');
            toast.textContent = '✓ Admin mode activated';
            toast.setAttribute('role', 'status');
            toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--primary-color);color:white;padding:12px 24px;border-radius:50px;font-size:0.95rem;z-index:9999;box-shadow:0 4px 15px rgba(0,0,0,0.2);';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } else {
            const passField = document.getElementById('adminPass');
            passField.style.borderColor = '#e74c3c';
            passField.setAttribute('aria-invalid', 'true');
            passField.focus();
            setTimeout(() => {
                passField.style.borderColor = '';
                passField.removeAttribute('aria-invalid');
            }, 2000);
        }
        form.reset();
    });
}

// Make delete available globally (called from inline onclick in renderBoard)
window.deleteMessage = deleteMessage;
