import { authApi, auth } from './api.js';

const form = document.getElementById('admin-register-form');

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(form);

  const payload = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  try {
    const profile = await authApi.register(payload);
    if (profile.role !== 'admin') {
      auth.logout();
      throw new Error('Unable to create admin account');
    }
    alert('Account created! Redirecting to dashboard.');
    window.location.href = 'admins.html';
  } catch (error) {
    alert(error.message);
  }
});
