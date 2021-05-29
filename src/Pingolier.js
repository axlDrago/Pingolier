const ping = require('ping');
const email = require('emailjs');
const dotenv = require('dotenv');
const http = require('request');
const fs = require('fs');
dotenv.config();

function Pingolier() {
    this.options = {
        logFile: 'log.txt',
        host: JSON.parse(process.env.HOST),
        interval: 5 * 60 * 1000, //время повторного пинга, мс
        errInterval: 1 * 60 * 1000, //время повторного пинга при недоступности хоста, мс
        pingConfig: {
	      extra: ['-i', '2', '-c', '5']
    	}
    };

    this.mailOptions = {
        user: process.env.EMAIL,
        password: process.env.PASS,
        protocol: process.env.SMTP,
        ssl: true
    };


    this.err = false;
};

/**
 * Инициализация
 */
Pingolier.prototype.init = function () {
    let idx = 0;
    const _this = this;

    async function each() {
        let val = _this.options.host[idx];
        _this.err = await _this.ping(val);

        if (_this.err) {
            _this.sender(val);
            setTimeout(() => _this.checkBadIp(val), _this.options.errInterval);
            return;
        }

        if (!_this.err && _this.options.host.length - 1 === idx) {
            setTimeout(() => _this.init(), _this.options.interval);
            return;
        }

        idx++;
        if (idx < _this.options.host.length) {
            each();
        }
    };

    each();
};

/**
 * Проверяем недоступный IP повторно
 */
Pingolier.prototype.checkBadIp = async function (val) {
    this.err = await this.ping(val);

    if (this.err) {
        setTimeout(() => this.checkBadIp(val), this.options.errInterval);
        return;
    }

    if (!this.err) {
        this.sender(val, false);
        this.init();
        return;
    }
};

/**
 * Логируем
 */
Pingolier.prototype.log = function (val) {
    const errMsg = `******************************** \nERROR! ${Date('now')} \n Хост не доступен: ${val.name} : ${val.ip} \n`;
    fs.appendFileSync(this.options.logFile, errMsg);
}

/**
 * Пингуем
 */
Pingolier.prototype.ping = async function (val) {
    return !(await ping.promise.probe(val.ip, this.options.pingConfig)).alive;
};

/**
 * Отправляем email
 */
Pingolier.prototype.sendEmail = function (host, err) {
  const msg = err ?
    `Хост недоступен: ${host.name} ip: ${host.ip}` :
    `Заработало: ${host.name} ip: ${host.ip}`;

    const server = email.server.connect({
          user: this.mailOptions.user,
          password: this.mailOptions.password,
          host: this.mailOptions.protocol,
          ssl: this.mailOptions.ssl
    });

    server.send({
        text: msg,
        from: "Pingolier_bot <" + this.mailOptions.user + ">",
        to: "Me <" + this.mailOptions.user + ">",
        subject: "Pingolier_bot" 
    });
};

/**
 * Отправляем сообщение в телеграм
 */
Pingolier.prototype.sendTelegram = function (host, err) {
    const msg = err ?
        encodeURI("Хост недоступен: " + host.name + " ip: " + host.ip)
        : encodeURI("ЗАРАБОТАЛО!: " + host.name + " ip: " + host.ip);

    http.post(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage?chat_id=${process.env.GROUP}&parse_mode=html&text=${msg}`);
};

/**
 * Отправляем сообщения
 */
Pingolier.prototype.sender = function(host, err = true) {
  this.sendTelegram(host, err);
  this.sendEmail(host, err);
  if(err) {
    this.log(host)
  }
}

const pingolier = new Pingolier();
pingolier.init();
