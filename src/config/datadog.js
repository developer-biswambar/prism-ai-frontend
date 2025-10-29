import { datadogRum } from '@datadog/browser-rum';

/**
 * Initialize Datadog Real User Monitoring (RUM)
 * This should be called as early as possible in the application lifecycle
 */
export const initializeDatadog = () => {
  // Check if required environment variables are present
  const applicationId = import.meta.env.VITE_DATADOG_APPLICATION_ID;
  const clientToken = import.meta.env.VITE_DATADOG_CLIENT_TOKEN;
  const site = import.meta.env.VITE_DATADOG_SITE || 'datadoghq.com';
  const service = import.meta.env.VITE_DATADOG_SERVICE || 'prism-ai-frontend';
  const env = import.meta.env.VITE_DATADOG_ENV || import.meta.env.MODE || 'development';

  // Skip initialization if credentials are not configured
  if (!applicationId || !clientToken) {
    console.warn('Datadog RUM: Missing application ID or client token. Skipping initialization.');
    return;
  }

  datadogRum.init({
    applicationId,
    clientToken,
    site,
    service,
    env,
    // Specify the version of your application
    // version: '1.0.0',

    // Session sampling configuration
    sessionSampleRate: 100, // Percentage of sessions to track (100 = all sessions)
    sessionReplaySampleRate: 20, // Percentage of tracked sessions to record (20 = 20% of sessions)

    // Tracking features
    trackUserInteractions: true, // Track clicks, inputs, etc.
    trackResources: true, // Track XHR/Fetch requests, CSS, JS, images, etc.
    trackLongTasks: true, // Track tasks that block the main thread for > 50ms

    // Privacy and security
    defaultPrivacyLevel: 'mask-user-input', // Mask sensitive data by default

    // Performance tracking
    enableExperimentalFeatures: ['clickmap'],

    // Before send hook - useful for filtering or modifying data
    beforeSend: (event) => {
      // You can filter events, add custom attributes, or modify data here
      // Return false to prevent the event from being sent
      return true;
    },
  });

  // Start session replay recording
  datadogRum.startSessionReplayRecording();

  console.log(`Datadog RUM initialized for ${service} in ${env} environment`);
};

/**
 * Add custom user information to Datadog RUM
 * Call this after user authentication
 */
export const setDatadogUser = (user) => {
  if (!user) return;

  datadogRum.setUser({
    id: user.id,
    name: user.name,
    email: user.email,
    // Add any other relevant user properties
  });
};

/**
 * Add custom global context to all RUM events
 */
export const addDatadogContext = (key, value) => {
  datadogRum.addRumGlobalContext(key, value);
};

/**
 * Track custom actions/events
 */
export const trackAction = (name, context = {}) => {
  datadogRum.addAction(name, context);
};

/**
 * Track errors manually
 */
export const trackError = (error, context = {}) => {
  datadogRum.addError(error, context);
};
