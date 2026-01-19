/**
 * Notifikaatio ja äänihälytys -apuvälineet
 * Lähettää selainilmoituksen ja soittaa äänen kun uusia tapahtumia tai tehtäviä luodaan
 */

// Globaali toast-funktio (asetetaan App.jsx:ssä)
let globalToastFn = null;
let audioContext = null;
let audioContextInitialized = false;

export const setGlobalToastFunction = (toastFn) => {
  globalToastFn = toastFn;
};

// Alusta AudioContext käyttäjän ensimmäisestä interaktiosta
const initializeAudioContext = () => {
  if (audioContextInitialized) return;
  
  const handler = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('AudioContext initialized and resumed');
        audioContextInitialized = true;
      }).catch(err => {
        console.error('Failed to initialize AudioContext:', err);
      });
    } else {
      audioContextInitialized = true;
    }
    // Poista listener kun AudioContext on alustettu
    document.removeEventListener('click', handler);
    document.removeEventListener('touchstart', handler);
  };
  
  document.addEventListener('click', handler, { once: true });
  document.addEventListener('touchstart', handler, { once: true });
};

// Hae tai luo AudioContext
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Alusta AudioContext app käynnistyessä
if (typeof window !== 'undefined') {
  initializeAudioContext();
}

// Tarkista selaimen notifikaatio-tuki
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Selaimen notifikaatiot eivät ole tuettuja');
    return false;
  }

  console.log('Notification permission current status:', Notification.permission);

  if (Notification.permission === 'granted') {
    console.log('Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    return permission === 'granted';
  }

  console.log('Notification permission was denied');
  return false;
};

// Soita kellonsoitto-mainen ilmoitusääni
export const playNotificationSound = () => {
  try {
    console.log('Attempting to play notification sound');
    
    // Käytä globaalia AudioContext:ia
    const ctx = getAudioContext();
    
    // Varmista että AudioContext on käynnissä
    if (ctx.state === 'suspended') {
      console.log('AudioContext was suspended, resuming...');
      ctx.resume().then(() => {
        console.log('AudioContext resumed successfully');
        playSoundWithContext(ctx);
      }).catch((err) => {
        console.error('Failed to resume AudioContext:', err);
      });
    } else {
      playSoundWithContext(ctx);
    }
  } catch (error) {
    console.error('Virhe äänen soittamisessa:', error);
  }
};

// Apufunktio äänen soittamiseen
const playSoundWithContext = (audioContext) => {
  try {
    const now = audioContext.currentTime;
    
    // Luo perusoskillaattori
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    // Aseta ominaisuudet kellonsoittomaista ääntä varten
    oscillator.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.value = 4000;

    // Luodaan neljä kellonsoiton kaltaista säveliä
    // Sävel 1 - korkea C
    oscillator.frequency.setValueAtTime(1047, now);
    oscillator.frequency.setValueAtTime(1047, now + 0.15);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    
    // Sävel 2 - matala C
    oscillator.frequency.setValueAtTime(523.25, now + 0.2);
    gain.gain.setValueAtTime(0.5, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 0.35);
    
    // Sävel 3 - korkea E
    oscillator.frequency.setValueAtTime(1318.51, now + 0.4);
    gain.gain.setValueAtTime(0.5, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 0.55);
    
    // Sävel 4 - matala E (loppuaksentti)
    oscillator.frequency.setValueAtTime(659.25, now + 0.6);
    gain.gain.setValueAtTime(0.6, now + 0.6);
    gain.gain.linearRampToValueAtTime(0, now + 0.85);

    oscillator.start(now);
    oscillator.stop(now + 0.85);
    
    console.log('Sound played successfully');
  } catch (error) {
    console.error('Virhe äänen soittamisessa playSoundWithContext:', error);
  }
};

// Pääfunktio ilmoituksille
export const sendNotification = async (title, options = {}) => {
  try {
    console.log('sendNotification called with title:', title, 'options:', options);
    
    // Näytä visuaalinen toast
    if (globalToastFn) {
      console.log('Showing toast notification');
      globalToastFn(options.body || title, 'info', 5000);
    }
    
    // Pyydä lupa ensimmäisen kerran
    const hasPermission = await requestNotificationPermission();
    console.log('Has permission:', hasPermission);

    // Näytä selain-ilmoitus
    if (hasPermission && Notification.permission === 'granted') {
      console.log('Showing browser notification:', title);
      const notification = new Notification(title, {
        icon: '/manifest.json',
        badge: '/robots.txt',
        tag: 'notification-' + Date.now(), // Unique tag estää duplikaatteja
        requireInteraction: false, // Ei vaadi käyttäjän toimintoa, mutta näkyy silti
        vibrate: [200, 100, 200], // Värinä (jos laite tukee)
        ...options
      });
      
      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
      };
      
      console.log('Browser notification shown successfully');
    } else {
      console.log('Cannot show browser notification - permission not granted');
    }

    // Soita ääni joka tapauksessa
    console.log('Playing notification sound');
    playNotificationSound();
    
    // Yritä lähettää push notifikaatio Service Workerin kautta (background-notifikaatiot)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.log('Service Worker ready, sending push notification');
        // Voimme lähettää custom viestin Service Workerille
        if (registration.active) {
          registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: title,
            options: {
              body: options.body || title,
              icon: '/manifest.json',
              badge: '/robots.txt',
              tag: options.tag || 'notification-' + Date.now(),
              vibrate: [200, 100, 200],
              ...options
            }
          });
        }
      }).catch(err => console.error('Service Worker not ready:', err));
    }
  } catch (error) {
    console.error('Virhe ilmoitusta lähettäessä:', error);
    // Yritä ainakin soittaa ääni vaikka ilmoitus epäonnistuisi
    try {
      console.log('Trying to play sound despite notification error');
      playNotificationSound();
    } catch (soundError) {
      console.error('Virhe äänen soittamisessa:', soundError);
    }
  }
};

// Tapahtuman ilmoitus
export const notifyEventCreated = (eventName) => {
  console.log('notifyEventCreated called:', eventName);
  sendNotification('🎯 Uusi tapahtuma', {
    body: `"${eventName}" on luotu`,
    tag: 'event-created',
    silent: false
  });
};

// Tehtävän ilmoitus
export const notifyTaskCreated = (taskTitle) => {
  console.log('notifyTaskCreated called:', taskTitle);
  sendNotification('✓ Uusi tehtävä', {
    body: `"${taskTitle}" on luotu`,
    tag: 'task-created',
    silent: false
  });
};

// Tapahtuman muokkaus ilmoitus
export const notifyEventUpdated = (eventName) => {
  console.log('notifyEventUpdated called:', eventName);
  sendNotification('📝 Tapahtuma päivitetty', {
    body: `"${eventName}" on päivitetty`,
    tag: 'event-updated',
    silent: false
  });
};

// Tehtävän valmistumisen ilmoitus
export const notifyTaskCompleted = (taskTitle) => {
  sendNotification('✅ Tehtävä valmistunut', {
    body: `"${taskTitle}" on merkitty valmiiksi`,
    tag: 'task-completed',
    silent: false
  });
};
