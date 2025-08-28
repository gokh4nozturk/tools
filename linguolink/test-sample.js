// Test file for LinguoLink extension
// Bu dosya LinguoLink extension'ını test etmek için

const greetings = {
    english: "Hello World",
    turkish: "Merhaba Dünya", 
    spanish: "Hola Mundo",
    french: "Bonjour le Monde",
    german: "Hallo Welt"
};

/**
 * Kullanıcıya hoş geldin mesajı gösterir
 * @param {string} name - Kullanıcının adı
 */
function showWelcomeMessage(name) {
    console.log("Welcome to our application, " + name);
    // Uygulamamıza hoş geldiniz mesajı
    return `¡Bienvenido ${name}!`; // Spanish welcome
}

// TODO: Add more language support
// YAPILACAKLAR: Daha fazla dil desteği ekle

const errorMessages = [
    "An error occurred", // Bir hata oluştu
    "Invalid input provided", // Geçersiz giriş sağlandı
    "Connection timeout", // Bağlantı zaman aşımı
    "Permission denied" // İzin reddedildi
];

/* 
Multi-line comment in Turkish:
Bu fonksiyon kullanıcı verilerini doğrular
ve geçerli değilse hata mesajı döndürür
*/
function validateUserData(userData) {
    if (!userData) {
        throw new Error("User data is required"); // Kullanıcı verisi gerekli
    }
    return true;
}
