# Testimonial Management API

REST API для управления видео-отзывами клиентов. Node.js, Express, MongoDB (Mongoose), JWT.

## Требования

- Node.js 16 или новее
- MongoDB (локально или MongoDB Atlas)

## Установка

```bash
npm install
cp .env.example .env
```

На Windows (cmd) вместо `cp`: `copy .env.example .env`

Откройте `.env` и укажите свои значения.

## Переменные окружения

| Переменная    | Описание                                  | По умолчанию                                  |
| ------------- | ----------------------------------------- | --------------------------------------------- |
| `PORT`        | Порт сервера                              | `3000`                                        |
| `MONGODB_URI` | Строка подключения к MongoDB              | `mongodb://127.0.0.1:27017/testimonial_api`   |
| `JWT_SECRET`  | Секрет для подписи JWT (обязательно)      | нет                                           |
| `JWT_EXPIRY`  | Время жизни токена                        | `7d`                                          |

## Запуск

```bash
npm start
```

Режим разработки с автоперезапуском:

```bash
npm run dev
```

Сервер будет доступен на `http://localhost:3000`.

## Тесты

```bash
npm test
```

## Быстрая проверка

Регистрация:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"password123","businessName":"My Shop"}'
```

Создание отзыва (подставьте токен из ответа):

```bash
curl -X POST http://localhost:3000/api/testimonials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"customerName":"John Doe","rating":5,"text":"Great service"}'
```

Список отзывов:

```bash
curl http://localhost:3000/api/testimonials -H "Authorization: Bearer <TOKEN>"
```
