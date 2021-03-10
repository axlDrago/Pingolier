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
        protocol: "smtp.yandex.ru",
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
	    _this.sendTelegram(val);
            _this.sendBadLog(val);
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
Pingolier.prototype.sendBadLog = function (val) {
    this.log(val);
    //this.sendTelegram(val);

    setTimeout(() => {
        this.checkBadIp(val);
    }, this.options.errInterval);
};

/**
 * Проверяем недоступный IP повторно
 */
Pingolier.prototype.checkBadIp = async function (val) {
    this.err = await this.ping(val);

    if (this.err) {
        this.sendBadLog(val);
        return;
    }

    if (!this.err) {
        this.sendTelegram(val, false);
        this.init();
        return;
    }
};

/**
 * Логируем
 */
Pingolier.prototype.log = function (val) {
    const errMsg = `******************************** \nERROR! ${Date('now')} \n Хост не доступен: ${val.ip} \n`;
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
Pingolier.prototype.sendEmail = function (host) {
    const server = email.server.connect({
        user: this.mailOptions.user,
        password: this.mailOptions.password,
        host: this.mailOptions.protocol,
        ssl: this.mailOptions.ssl
    });

    server.send({
        text: "Хост недоступен: " + host.name + " ip: " + host.ip,
        from: "Pingolier_bot <" + this.serverOptions.user + ">",
        to: "Me <" + this.serverOptions.user + ">",
        subject: "Хост недоступен: " + host.name
    });
};

/**
 * Отправляем сообщение в телеграм
 */
Pingolier.prototype.sendTelegram = function (host, err = true) {
    const msg = err ?
        encodeURI("Хост недоступен: " + host.name + " ip: " + host.ip)
        : encodeURI("ЗАРАБОТАЛО!: " + host.name + " ip: " + host.ip);

    http.post(`https://api.telegram.org/bot${process.env.TOKEN}/sendMessage?chat_id=${process.env.GROUP}&parse_mode=html&text=${msg}`);
};

const pingolier = new Pingolier();
pingolier.init();
