export const environment = {
  production: true,
  // Valores padrão - serão substituídos pelo script replace-env.js durante o build
  // se as variáveis NG_APP_API_URL ou NG_APP_GOOGLE_CLIENT_ID estiverem definidas no Netlify
  apiUrl: 'https://api-fin-control.vercel.app/api/v1',
  googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
};

