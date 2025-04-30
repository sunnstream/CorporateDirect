document.addEventListener('DOMContentLoaded', () => {

    const form                = document.getElementById('wf-form-invoice-payment');
    const entityNameInput     = document.getElementById('entity-name');
    const emailInput          = document.getElementById('email-address-invoice');
    const invoiceInput        = document.getElementById('invoice-number');
    const radioButtons        = document.querySelectorAll('input[name="minutes-checklist"]');
    const fileInput           = document.getElementById('meeting-minutes-file-upload-2');
    const fileUploadWrapper   = document.querySelector('.file-upload_wrapper');
  
    /*  File-upload–specific error banner */
    const fileErrorWrap = document.getElementById('file-upload-error');
    const fileErrorTxt  = document.getElementById('file-upload-error-text');
  
    /*  Global, Webflow-native error wrapper (.form-error_wrapper)  */
    const globalErrorWrap = document.querySelector('.form-error_wrapper');
    const globalErrorTxt  = globalErrorWrap?.querySelector('.text-size-small.error');
  
    hideGlobalError();
    hideFileError();
  
    function showGlobalError(msg) {
      if (!globalErrorWrap || !globalErrorTxt) return;
      globalErrorTxt.textContent = msg;
      globalErrorWrap.style.display = 'block';
    }
    function hideGlobalError() {
      if (globalErrorWrap) globalErrorWrap.style.display = 'none';
    }
  
    function showFileError(msg) {
      if (!fileErrorWrap || !fileErrorTxt) return;
      fileErrorTxt.textContent = msg;
      fileErrorWrap.classList.remove('w-hidden');
      fileErrorWrap.style.display = 'block';
    }
    function hideFileError() {
      if (fileErrorWrap) {
        fileErrorWrap.classList.add('w-hidden');
        fileErrorWrap.style.display = 'none';
        if (fileErrorTxt) fileErrorTxt.textContent = '';
      }
    }

    function toggleFileUpload() {
      hideFileError();
      const needsFile = [...radioButtons].some((rb) => rb.checked && rb.value === 'yes');
      
      if (needsFile) {
        fileUploadWrapper?.classList.remove('w-hidden');
        fileUploadWrapper?.style.display = 'block';
        fileInput.required = true;
      } else {
        fileUploadWrapper?.classList.add('w-hidden');
        fileUploadWrapper?.style.display = 'none';
        fileInput.required = false;
        fileInput.value = '';          // clear stray file
      }
    }
    
    radioButtons.forEach((rb) => rb.addEventListener('change', toggleFileUpload));
    toggleFileUpload();              
  
    document
      .querySelectorAll('[data-char-limit]')
      .forEach((el) => {
        const limit = +el.getAttribute('data-char-limit');
        el.addEventListener('input', () => {
          if (el.value.length > limit) el.value = el.value.slice(0, limit);
        });
      });
  
    fileInput.addEventListener('change', () => {
      hideFileError();
      if (!fileInput.files?.length) return;
  
      const file       = fileInput.files[0];
      const maxSize    = 10 * 1024 * 1024;
      const extensions = ['.zip', '.pdf'];
      const validExt   = extensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  
      if (file.size > maxSize) {
        showFileError('Upload failed. Max size for files is 10 MB.');
        fileInput.value = '';
      } else if (!validExt) {
        showFileError('Upload failed. File must be .zip or .pdf.');
        fileInput.value = '';
      }
    });
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideGlobalError();
      hideFileError();
  
      if (!entityNameInput || !emailInput || !invoiceInput) {
        showGlobalError('A required field is missing on this page.');
        return;
      }
  
      const email = emailInput.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showGlobalError('Please enter a valid email address.');
        emailInput.focus();
        return;
      }
  
      const invoiceNum = invoiceInput.value.trim();
      if (!/^\d{6,8}$/.test(invoiceNum)) {
        showGlobalError('Invoice # must be numeric and 6–8 digits.');
        invoiceInput.focus();
        return;
      }
  
      const rbValue = [...radioButtons].find((rb) => rb.checked)?.value;
      if (!rbValue) {
        showGlobalError('Please indicate whether you have a completed minutes checklist.');
        return;
      }
  
      if (rbValue === 'yes') {
        if (!fileInput.files?.length) {
          showFileError('If checklist is marked "Yes", you must upload your file(s) before proceeding.');
          return;
        }
      }
  
      const formData = new FormData(form);
      try {
        await fetch(form.action, { method: 'POST', body: formData, mode: 'no-cors' });
        console.log('Form data sent to Webflow.');
      } catch (err) {
        console.error('Webflow submission error:', err);
        showGlobalError('Unable to submit the form. Please try again.');
        return;
      }
  
      const pdc = new URL('https://app.pdcflow.com/8175/renewals');
      pdc.searchParams.append('transactionForm', 'CARD');
      pdc.searchParams.append('accountNumber', invoiceNum);
      pdc.searchParams.append('memo', entityNameInput.value.trim());
  
      setTimeout(() => window.open(pdc.toString(), '_blank'), 500);
  
    });
  });
  