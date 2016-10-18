const firebase = require('firebase');

class Firebase {
  constructor(config) {
    this.app = firebase.initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      databaseURL: config.databaseURL,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
    });

    this.app.auth().signInWithEmailAndPassword(
      config.email,
      config.password
    ).catch((err) => {
      console.log(`FIREBASE ERROR: ${err.message}`);
      process.exit(1);
    });
  }

  /**
   * Get data from database
   * @param string ref
   * @return Promise
   */
  get(ref) {
    return new Promise((resolve) => {
      firebase.database().ref(ref).once('value', (value) => {
        resolve(value.val());
      });
    });
  }

  /**
   * Set data into database
   * @param string ref
   * @param value
   * @return Promise
   */
  set(ref, value) {
    return firebase.database().ref(ref).set(value);
  }

  /**
   * Remove data from database
   * @param string ref
   * @return Promise
   */
  remove(ref) {
    return firebase.database().ref(ref).remove();
  }
}

module.exports = Firebase;
