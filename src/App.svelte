<script>
  import { onMount } from 'svelte';
  import { auth } from './lib/firebase.js';
  import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
  import Dashboard from './components/Dashboard.svelte';
  import { currentUser, loadingAuth } from './lib/stores/auth';

  let mobileNumber = '';
  let otp = '';
  let otpSent = false;
  let loading = false;
  let statusMsg = '';

  onMount(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        { size: 'invisible', callback: () => {} }
      );
    }
  });

  async function handleSendOtp() {
    statusMsg = '';
    if (!/^\d{10}$/.test(mobileNumber)) {
      alert('कृपया 10 अंकों का वैध मोबाइल नम्बर डालें।');
      return;
    }
    loading = true;
    const phoneNumber = `+91${mobileNumber}`;
    const appVerifier = window.recaptchaVerifier;

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;
      otpSent = true;
      statusMsg = 'OTP भेज दिया गया है।';
    } catch (error) {
      console.error('Error sending OTP:', error);
      statusMsg = error?.message || 'OTP भेजने में दिक्कत आई।';
      try {
        const widgetId = await appVerifier.render();
        window.recaptchaVerifier.reset(widgetId);
      } catch {}
    } finally {
      loading = false;
    }
  }

  async function handleVerifyOtp() {
    statusMsg = '';
    if (!/^\d{6}$/.test(otp)) {
      alert('कृपया 6 अंकों का OTP डालें।');
      return;
    }
    loading = true;
    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      statusMsg = `लॉगिन सफल! UID: ${user.uid}`;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      statusMsg = error?.message || 'OTP सही नहीं है या समय समाप्त हो गया।';
    } finally {
      loading = false;
    }
  }

  function resetFlow() {
    otpSent = false;
    otp = '';
    statusMsg = '';
  }
</script>

{#if $loadingAuth}
  <div class="p-6">Loading...</div>
{:else if $currentUser}
  <Dashboard/>
{:else}
  <main class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">
        Photographer Login
      </h2>

      {#if !otpSent}
        <div class="mb-6">
          <label for="mobile" class="block text-gray-700 text-sm font-bold mb-2">
            Mobile Number
          </label>
          <input
            id="mobile"
            type="tel"
            placeholder="Enter your 10-digit mobile number"
            class="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={mobileNumber}
            maxlength="10"
          />
        </div>

        <button
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 disabled:opacity-60"
          on:click={handleSendOtp}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      {:else}
        <div class="mb-6">
          <label for="otp" class="block text-gray-700 text-sm font-bold mb-2">
            Enter OTP
          </label>
          <input
            id="otp"
            type="tel"
            placeholder="6-digit OTP"
            class="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            bind:value={otp}
            maxlength="6"
          />
        </div>

        <div class="flex gap-2">
          <button
            class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 disabled:opacity-60"
            on:click={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded transition-colors duration-200"
            on:click={resetFlow}
            type="button"
          >
            Back
          </button>
        </div>
      {/if}

      {#if statusMsg}
        <p class="mt-4 text-sm text-gray-700">{statusMsg}</p>
      {/if}
    </div>
  </main>
{/if}
