document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');
    const loadingState = document.getElementById('loading-state');
    const dropzoneInner = document.querySelector('.dropzone-inner');
    const loadingFilename = document.getElementById('loading-filename');
    
    const resultSection = document.getElementById('result-section');
    const resultFilename = document.getElementById('result-filename');
    const statSize = document.getElementById('stat-size');
    const statWords = document.getElementById('stat-words');
    const statDuration = document.getElementById('stat-duration');
    
    const previewContainer = document.getElementById('preview-container');
    const rawContainer = document.getElementById('raw-container');
    const rawText = document.getElementById('raw-text');
    
    const btnViewPreview = document.getElementById('btn-view-preview');
    const btnViewRaw = document.getElementById('btn-view-raw');
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');
    const btnNew = document.getElementById('btn-new');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    let currentMarkdown = '';
    let currentOriginalName = '';

    // ================= Drag & Drop Events =================
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // ================= Upload & Convert Handler =================
    async function handleFileUpload(file) {
        if (!file) return;

        // UI State: Loading
        dropzoneInner.classList.add('hidden');
        loadingState.classList.remove('hidden');
        loadingFilename.textContent = `Mengonversi ${file.name}...`;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Terjadi kesalahan pada server.' }));
                throw new Error(errorData.detail || 'Gagal mengonversi file.');
            }

            const data = await response.json();
            displayResult(data);
        } catch (error) {
            showToast(`⚠️ Error: ${error.message}`, 5000);
            resetUploadState();
        }
    }

    function displayResult(data) {
        currentMarkdown = data.markdown;
        currentOriginalName = data.filename;

        // Populate Metadata
        resultFilename.textContent = data.filename;
        statSize.textContent = data.filesize_formatted;
        statWords.textContent = `${data.word_count.toLocaleString()} kata`;
        statDuration.textContent = `${data.duration_ms} ms`;

        // Render Markdown
        if (window.marked && window.DOMPurify) {
            const parsedHtml = marked.parse(currentMarkdown);
            previewContainer.innerHTML = DOMPurify.sanitize(parsedHtml);
        } else {
            previewContainer.textContent = currentMarkdown;
        }

        // Set Raw Text
        rawText.value = currentMarkdown;

        // Switch to Preview View by default
        switchView('preview');

        // Show result card
        uploadSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        // Reset upload form
        resetUploadState();
    }

    function resetUploadState() {
        dropzoneInner.classList.remove('hidden');
        loadingState.classList.add('hidden');
        fileInput.value = '';
    }

    // ================= View Switching =================
    function switchView(view) {
        if (view === 'preview') {
            btnViewPreview.classList.add('active');
            btnViewRaw.classList.remove('active');
            previewContainer.classList.remove('hidden');
            rawContainer.classList.add('hidden');
        } else {
            btnViewRaw.classList.add('active');
            btnViewPreview.classList.remove('active');
            rawContainer.classList.remove('hidden');
            previewContainer.classList.add('hidden');
        }
    }

    btnViewPreview.addEventListener('click', () => switchView('preview'));
    btnViewRaw.addEventListener('click', () => switchView('raw'));

    // ================= Copy Action =================
    btnCopy.addEventListener('click', async () => {
        if (!currentMarkdown) return;
        try {
            await navigator.clipboard.writeText(currentMarkdown);
            showToast('📋 Markdown berhasil disalin ke clipboard!');
        } catch (err) {
            // Fallback
            rawText.select();
            document.execCommand('copy');
            showToast('📋 Markdown berhasil disalin!');
        }
    });

    // ================= Download Action =================
    btnDownload.addEventListener('click', () => {
        if (!currentMarkdown) return;
        
        // Base filename without original extension + .md
        const baseName = currentOriginalName.replace(/\.[^/.]+$/, "");
        const downloadName = `${baseName || 'document'}.md`;

        const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`💾 Berhasil mengunduh ${downloadName}`);
    });

    // ================= Convert Another File =================
    btnNew.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        resetUploadState();
    });

    // ================= Toast Notification =================
    let toastTimeout = null;
    function showToast(message, duration = 3200) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, duration);
    }
});
