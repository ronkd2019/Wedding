// Submit Photos JavaScript - File Upload Handling and Validation

const fileInput = document.getElementById('photos');
const fileList = document.getElementById('fileList');
const fileLabel = document.querySelector('.file-upload-label');
const uploadText = document.querySelector('.upload-text');
const form = document.getElementById('photoForm');

let selectedFiles = [];

// --- Inline error helper (replaces alert()) ---
function showError(message) {
    const errorEl = document.getElementById('formError');
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.add('visible');
    // scrollIntoView with options not supported in Safari < 15.4 — use try/catch
    try {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {
        errorEl.scrollIntoView(false);
    }
    setTimeout(() => errorEl.classList.remove('visible'), 6000);
}

// --- Success state: show overlay if ?sent=true in URL ---
document.addEventListener('DOMContentLoaded', () => {
    if (new URLSearchParams(window.location.search).get('sent') === 'true') {
        const overlay = document.getElementById('successOverlay');
        if (overlay) overlay.style.display = 'flex';
        // Clean the URL without reloading
        history.replaceState(null, '', window.location.pathname);
    }
});

// Handle file selection
fileInput.addEventListener('change', function (e) {
    handleFiles(this.files);
});

// Drag and drop functionality
fileLabel.addEventListener('dragover', function (e) {
    e.preventDefault();
    this.classList.add('drag-over');
});

fileLabel.addEventListener('dragleave', function (e) {
    e.preventDefault();
    this.classList.remove('drag-over');
});

fileLabel.addEventListener('drop', function (e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

// Handle selected files
function handleFiles(files) {
    const filesArray = Array.from(files);

    // Limit to 10 files
    if (selectedFiles.length + filesArray.length > 10) {
        showError('You can only upload up to 10 photos at a time. Please select fewer files.');
        return;
    }

    // Validate file types (images only)
    const validFiles = filesArray.filter(file => {
        if (!file.type.startsWith('image/')) {
            showError(`"${file.name}" is not an image file and will be skipped.`);
            return false;
        }
        return true;
    });

    // Add to selected files
    selectedFiles = selectedFiles.concat(validFiles);

    // Update UI
    updateFileList();
    updateUploadText();
}

// Update file list display
function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.classList.remove('active');
        fileList.innerHTML = '';
        return;
    }

    fileList.classList.add('active');
    fileList.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileSize = formatFileSize(file.size);
        const fileExtension = file.name.split('.').pop().toUpperCase();

        fileItem.innerHTML = `
      <div class="file-info">
        <div class="file-icon">${fileExtension}</div>
        <div class="file-details">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${fileSize}</span>
        </div>
      </div>
      <button type="button" class="remove-file" data-index="${index}" aria-label="Remove file">×</button>
    `;

        fileList.appendChild(fileItem);
    });

    // Add remove file event listeners
    document.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', function () {
            const index = parseInt(this.getAttribute('data-index'));
            removeFile(index);
        });
    });
}

// Remove file from selection
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateUploadText();

    // Reset file input
    fileInput.value = '';
}

// Update upload button text
function updateUploadText() {
    if (selectedFiles.length === 0) {
        uploadText.textContent = 'Click to select photos or drag and drop';
    } else if (selectedFiles.length === 1) {
        uploadText.textContent = '1 photo selected - Add more or submit';
    } else {
        uploadText.textContent = `${selectedFiles.length} photos selected - Add more or submit`;
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Form submission handling
form.addEventListener('submit', function (e) {
    // Validate required name field (novalidate disables browser built-in checking)
    const nameField = document.getElementById('name');
    if (!nameField.value.trim()) {
        e.preventDefault();
        nameField.setAttribute('aria-invalid', 'true');
        nameField.style.borderColor = '#9E4F2E';
        showError('Please enter your name before submitting.');
        nameField.focus();
        nameField.addEventListener('input', function clearErr() {
            nameField.removeAttribute('aria-invalid');
            nameField.style.borderColor = '';
            nameField.removeEventListener('input', clearErr);
        });
        return;
    }

    // Validate at least one photo is selected
    if (selectedFiles.length === 0) {
        e.preventDefault();
        showError('Please select at least one photo to upload.');
        return;
    }

    // Update the file input with selected files
    // new DataTransfer() is not supported in Safari < 14.5 — use try/catch
    try {
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach(file => {
            dataTransfer.items.add(file);
        });
        fileInput.files = dataTransfer.files;
    } catch (e) {
        // Safari fallback: the original file input is used as-is.
        // File removal won't be reflected, but the upload will still work
        // since selectedFiles was already validated above.
        console.warn('DataTransfer not supported. Using native file input.');
    }

    // Set _next URL dynamically so FormSubmit redirects back here with ?sent=true
    let nextInput = form.querySelector('input[name="_next"]');
    if (!nextInput) {
        nextInput = document.createElement('input');
        nextInput.type = 'hidden';
        nextInput.name = '_next';
        form.appendChild(nextInput);
    }
    nextInput.value = window.location.origin + window.location.pathname + '?sent=true';

    // Show loading state
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Sending... 📤</span>';

    // Let the form submit normally to FormSubmit
});
