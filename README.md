# Pingolier
Пингует хост и шлет уведомление на email или telegram, если нет хост недоступен

## Start:

Создайте файл .env в корне.

    .env
    EMAIL=емайл с доменом //test@yanex.ru
    PASS=пароль от почты
    SMTP=smtp.server.ru //SMTP сервер
    HOST= [{"name": "Ping1", "ip": "8.8.8.8"},{"name": "Ping2", "ip": "8.8.8.8"}] //массив объектов ip или адрес без порта и без http://
    TOKEN=token бота @BotFather
    GROUP=id группового чата
    
### npm i
### npm start
 
Мониторинг работает в одном потоке, выводит ошибку первого отвалившегося IP, и начинает за ним наблюдать
