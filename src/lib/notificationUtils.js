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

// Soita ilmoitusääni
const playNotificationSound = () => {
  try {
    // Käytä Web Audio API -ääntä
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    // Luo kaksi oskillaattoria miellyttävän äänen luomiseen
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    // Aseta ominaisuudet
    oscillator.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    // Luodaan kaksiosainen melodia
    // Ensimmäinen sävel
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.setValueAtTime(600, now + 0.1);
    
    // Toinen sävel korkeampi
    oscillator.frequency.setValueAtTime(900, now + 0.15);
    oscillator.frequency.setValueAtTime(900, now + 0.3);

    // Gain envelope - lisää ja vähennä volyymiä
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.setValueAtTime(0.4, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.16);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
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
        requireInteraction: false, // Ei vaadi käyttäjän toimintoa
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
    body: `Tapahtuma "${eventName}" on luotu`,
    tag: 'event-created'
  });
};

// Tehtävän ilmoitus
export const notifyTaskCreated = (taskTitle) => {
  sendNotification('✓ Uusi tehtävä', {
    body: `Tehtävä "${taskTitle}" on luotu`,
    tag: 'task-created'
  });
};

// Tapahtuman muokkaus ilmoitus
export const notifyEventUpdated = (eventName) => {
  sendNotification('📝 Tapahtuma päivitetty', {
    body: `Tapahtuma "${eventName}" on päivitetty`,
    tag: 'event-updated'
  });
};

// Tehtävän valmistumisen ilmoitus
export const notifyTaskCompleted = (taskTitle) => {
  sendNotification('✅ Tehtävä valmistunut', {
    body: `Tehtävä "${taskTitle}" on merkitty valmiiksi`,
    tag: 'task-completed'
  });
};
