// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDkVtlOJfh6SXeEzLTIn_hEuWymIYcGKK4",
    authDomain: "dndloottable.firebaseapp.com",
    projectId: "dndloottable",
    storageBucket: "dndloottable.appspot.com",
    messagingSenderId: "526522251773",
    appId: "1:526522251773:web:9ef595ed71afabee46c194"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();