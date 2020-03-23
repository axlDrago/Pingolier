var ping = require('ping');
var email = require('emailjs');
const dotenv = require('dotenv');
dotenv.config();

function Pingolier(){
    this.options = {
        host: process.env.HOST,
        interval: 300000
    };

    this.serverOptions = {
        user: process.env.EMAIL,
        password: process.env.PASS,
        host: "smtp.yandex.ru",
        ssl: true
    };
};

/**
 * Пингуем
 */
Pingolier.prototype.ping = function (){
    let _this = this;
    ping.sys.probe(this.options.host, function(res){
        if(!res){
            _this.sendEmail();
        } else {
            console.log('хост доступен: ' + Date('now'));
            _this.timeOut();
        }
    });
};

/**
 * Отправляем сообщение
 */
Pingolier.prototype.sendEmail = function () {
    let _this = this;
  
    let server = email.server.connect({
        user: this.serverOptions.user,
        password: this.serverOptions.password,
        host: this.serverOptions.host,
        ssl: this.serverOptions.ssl
    });
  
    server.send({
        text:    "Lavka отвалилась",
        from:    "Lavka-Serv <" + this.serverOptions.user + ">",
        to:      "Me <" + this.serverOptions.user + ">",
        subject: "Lavka отвалилась"
    }, function () {
        _this.timeOut();
    });
  };

/**
 * Ждем
 */
Pingolier.prototype.timeOut = function () {
    setTimeout(() => this.ping(), this.options.interval);
};

let pingolier = new Pingolier();
pingolier.ping();