// Submit Photos JavaScript - File Upload Handling and Validation

const fileInput = document.getElementById('photos');
const fileList = document.getElementById('fileList');
const fileLabel = document.querySelector('.file-upload-label');
const uploadText = document.querySelector('.upload-text');
const form = document.getElementById('photoForm');

let selectedFiles = [];

// Handle file selection
fileInput.addEventListener('change', function (e) {
    handleFiles(this.files);
});

// Drag and drop functionality
fileLabel.addEventListener('dragover', function (e) {
    e.preventDefault();
    this.style.borderColor = 'var(--primary-color)';
    this.style.backgroundColor = 'rgba(139, 115, 85, 0.1)';
});

fileLabel.addEventListener('dragleave', function (e) {
    e.preventDefault();
    this.style.borderColor = '#d0d0d0';
    this.style.backgroundColor = 'var(--bg-color)';
});

fileLabel.addEventListener('drop', function (e) {
    e.preventDefault();
    this.style.borderColor = '#d0d0d0';
    this.style.backgroundColor = 'var(--bg-color)';

    const files = e.dataTransfer.files;
    handleFiles(files);
});

// Handle selected files
function handleFiles(files) {
    const filesArray = Array.from(files);

    // Limit to 10 files
    if (selectedFiles.length + filesArray.length > 10) {
        alert('You can only upload up to 10 photos at a time. Please select fewer files.');
        return;
    }

    // Validate file types (images only)
    const validFiles = filesArray.filter(file => {
        if (!file.type.startsWith('image/')) {
            alert(`"${file.name}" is not an image file and will be skipped.`);
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
    // Validate at least one photo is selected
    if (selectedFiles.length === 0) {
        e.preventDefault();
        alert('Please select at least one photo to upload.');
        return;
    }

    // Update the file input with selected files
    // Create a new DataTransfer to update the file input
    const dataTransfer = new DataTransfer();
    selectedFiles.forEach(file => {
        dataTransfer.items.add(file);
    });
    fileInput.files = dataTransfer.files;

    // Show loading state
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Sending...</span>';

    // Let the form submit normally to FormSubmit
});
