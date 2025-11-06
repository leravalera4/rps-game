# ✅ Исправлена ошибка

## Проблема:
```
Error: `defaultChain` must be included in `supportedChains`
```

## Решение:
Добавлен `supportedChains: ['solana']` в конфигурацию Privy Provider.

## Теперь настроено:
- ✅ `supportedChains: ['solana']` - поддерживается только Solana
- ✅ `defaultChain: 'solana'` - Solana по умолчанию
- ✅ `solana: { chain: 'devnet' }` - используем Solana Devnet

## Что это значит:
- При регистрации пользователя будет автоматически создаваться **только Solana кошелек**
- Никаких Ethereum кошельков
- Все кошельки будут на Solana Devnet

## Перезагрузите страницу и проверьте:
1. Откройте консоль браузера
2. Войдите в систему
3. Должно быть: `✅ Solana wallets found: 1`
4. Адрес должен быть **не** 0x... (это Solana адрес)
