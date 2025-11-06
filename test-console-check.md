# 🔍 Проверка логов подписи транзакций

## Как проверить, работает ли подпись транзакций

### 1. Откройте DevTools (F12) → Console

### 2. Попробуйте создать SOL игру

### 3. Ищите следующие логи с эмодзи:

#### ✅ Успешная подпись:
```
🔐 signTransaction called with Privy
🔐 Using Privy signTransaction API
🔐 Transaction bytes length: [число]
🔐 Privy signTransaction result: { hasSignedTransaction: true }
✅ Returning transaction object: Transaction
🔐 Signed transaction signatures: 1
```

#### ❌ Ошибка подписи:
```
🔐 signTransaction called with Privy
❌ Privy signTransaction error: [ошибка]
Failed to create SOL game: Failed to setup user profile: Signature verification failed
```

## 🧪 Быстрая проверка

Выполните в консоли браузера:

```javascript
// Проверка кошелька
console.log('Кошельки:', window.__PRIVY_WALLETS__ || 'Не найдено')

// Проверка подписи
const checkSigning = () => {
  const logs = []
  const originalConsoleLog = console.log
  console.log = (...args) => {
    const msg = args.join(' ')
    if (msg.includes('🔐') || msg.includes('signTransaction')) {
      logs.push(msg)
    }
    originalConsoleLog.apply(console, args)
  }
  
  // Запустите создание игры здесь
  console.log('Теперь создайте SOL игру и проверьте логи')
  
  setTimeout(() => {
    console.log = originalConsoleLog
    console.log('🔍 Найденные логи подписи:')
    logs.forEach(log => console.log(log))
  }, 10000)
}

checkSigning()
```

## 📋 Чеклист проблем

### ❌ "No Solana wallet available for transaction signing"
- **Причина**: Кошелек не найден
- **Решение**: Проверьте, что вы вошли в систему и есть Solana кошелек

### ❌ "Privy signTransaction error"
- **Причина**: Ошибка при подписи
- **Решение**: Проверьте версию Privy SDK и логи ошибки

### ❌ "Transaction recentBlockhash required"
- **Причина**: Нет recentBlockhash
- **Решение**: Уже исправлено в коде

### ❌ "Signature verification failed"
- **Причина**: Транзакция не подписана или подпись неверна
- **Решение**: Проверьте логи выше для деталей

## 🔧 Дебаг информация

Если видите лог:
```
🔐 Using wallet for signing: {...}
```

Проверьте:
- `address` - есть ли адрес
- `type` - должен быть 'privy'
- `walletClientType` - должен быть 'privy'

Если видите лог:
```
🔐 No signTransaction method available on wallet
Available keys: [...]
```

Это означает, что у кошелька нет метода подписи. Проверьте настройки Privy Dashboard.
