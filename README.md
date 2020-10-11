# Pingolier
Пингует хост и шлет уведомление на email или в телеграмм, если нет хост недоступен

## Start:

Создайте файл .env в корне.

    .env
    EMAIL=емайл с доменом //test@yanex.ru
    PASS=пароль от почты
    HOST=массив объектов ip или адрес без порта и без http://
            [
                {name: 'Ping1', ip: '8.8.8.8'},
                {name: 'Ping2', ip: '8.8.8.8'}
            ]
    TOKEN=token бота @BotFather
    GROUP=id группового чата
    
### npm i
### node app.js
 
