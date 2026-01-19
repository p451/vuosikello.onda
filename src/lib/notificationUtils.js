/**
 * Notifikaatio ja äänihälytys -apuvälineet
 * Lähettää selainilmoituksen ja soittaa äänen kun uusia tapahtumia tai tehtäviä luodaan
 */

// Tarkista selaimen notifikaatio-tuki
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Selaimen notifikaatiot eivät ole tuettuja');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Soita kellonsoitto-mainen ilmoitusääni
const playNotificationSound = () => {
  try {
    // Käytä Web Audio API -ääntä
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
  } catch (error) {
    console.error('Virhe äänen soittamisessa:', error);
  }
};

// Pääfunktio ilmoituksille
export const sendNotification = async (title, options = {}) => {
  try {
    // Pyydä lupa ensimmäisen kerran
    const hasPermission = await requestNotificationPermission();

    // Näytä ilmoitus
    if (hasPermission && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/manifest.json',
        badge: '/robots.txt',
        tag: 'notification-' + Date.now(), // Unique tag estää duplikaatteja
        requireInteraction: false, // Ei vaadi käyttäjän toimintoa, mutta näkyy silti
        vibrate: [200, 100, 200], // Värinä (jos laite tukee)
        ...options
      });
    }

    // Soita ääni joka tapauksessa
    playNotificationSound();
  } catch (error) {
    console.error('Virhe ilmoitusta lähettäessä:', error);
    // Yritä ainakin soittaa ääni vaikka ilmoitus epäonnistuisi
    try {
      playNotificationSound();
    } catch (soundError) {
      console.error('Virhe äänen soittamisessa:', soundError);
    }
  }
};

// Tapahtuman ilmoitus
export const notifyEventCreated = (eventName) => {
  sendNotification('🎯 Uusi tapahtuma', {
    body: `"${eventName}" on luotu`,
    tag: 'event-created',
    silent: false
  });
};

// Tehtävän ilmoitus
export const notifyTaskCreated = (taskTitle) => {
  sendNotification('✓ Uusi tehtävä', {
    body: `"${taskTitle}" on luotu`,
    tag: 'task-created',
    silent: false
  });
};

// Tapahtuman muokkaus ilmoitus
export const notifyEventUpdated = (eventName) => {
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
