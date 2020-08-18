const ping = require('ping');
const email = require('emailjs');
const dotenv = require('dotenv');
const http = require('request');
dotenv.config();

function Pingolier(){
    this.options = {
        host: process.env.HOST,
        interval: 300000, //время повторного пинга, мс (5 мин)
        errInterval: 30000 //время повторного пинга при недоступности хоста, мс (30 сек)
    };

    this.serverOptions = {
        user: process.env.EMAIL,
        password: process.env.PASS,
        host: "smtp.yandex.ru",
        ssl: true
    };

    this.err = false;
};

/**
 * Пингуем
 */
Pingolier.prototype.ping = function (){
    const _this = this;
    ping.sys.probe(this.options.host, function(res){
        if(!res){
            _this.sendEmail();
            _this.sendTelegram();
            _this.err = true;
            _this.timeOut();
        } else {
            console.log('хост доступен: ' + Date('now'));
            _this.err = false;
            _this.timeOut();
        }
    });
};

/**
 * Отправляем сообщение
 */
Pingolier.prototype.sendEmail = function () {
    let server = email.server.connect({
        user: this.serverOptions.user,
        password: this.serverOptions.password,
        host: this.serverOptions.host,
        ssl: this.serverOptions.ssl
    });
  
    server.send({
        text:    "Хост недоступен: "  + this.options.host,
        from:    "Pingolier_bot <" + this.serverOptions.user + ">",
        to:      "Me <" + this.serverOptions.user + ">",
        subject: "Хост недоступен: " + this.options.host
    });
};

/**
 * Отправляем сообщение в телеграм
 */
Pingolier.prototype.sendTelegram = function(){
    msg = encodeURI('Хост недоступен: ' + this.options.host);

    http.post(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage?chat_id=${process.env.GROUP}&parse_mode=html&text=${msg}`, 
        function (error, response, body) {  
            console.log('error:', error); 
            console.log('statusCode:', response && response.statusCode); 
            console.log('body:', body); 
  });
};

/**
 * Ждем
 */
Pingolier.prototype.timeOut = function () {
    setTimeout(() => this.ping(), !this.err ? this.options.interval : this.options.errInterval);
};

let pingolier = new Pingolier();
pingolier.ping();