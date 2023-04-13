import nodemailer from 'nodemailer';
import mailConfig from '../../mail.config.json';
import fs from 'fs';

export class MailerError extends Error {
    constructor (message: string) {
        super(message);
        this.name = 'MailerError';
    }
}

interface MailInfos {
    to: string
    subject: string
    text: string
    html: string
}

let transporter: nodemailer.Transporter | undefined;

async function initMailer () {
    const enabled: boolean = mailConfig.enabled;
    if (!enabled) return;

    if (process.env.NODE_ENV === 'production') {
        console.warn('Mailer in production mode. Emails will be sent to real recipients.');
    } else {
        console.info('Mailer in dev mode, emails will be sent to', mailConfig.devMode.overrideTo);
    }

    let privKey: string;
    try {
        privKey = fs.readFileSync(mailConfig.settings.dkim.privKeyPath, 'utf8');
    } catch (err) {
        console.error('Mailer disabled due to error:\n', err);
        return;
    }

    transporter = nodemailer.createTransport({
        service: 'postfix',
        host: mailConfig.settings.host,
        secure: mailConfig.settings.secure,
        port: mailConfig.settings.port,
        tls: { rejectUnauthorized: false, ciphers: 'SSLv3' },
        dkim: {
            domainName: mailConfig.settings.dkim.domainName,
            keySelector: mailConfig.settings.dkim.selector,
            privateKey: privKey
        }
    });

    try {
        await transporter.verify();
        console.log('Mailer ready');
    } catch (err) {
        console.error('Mailer disabled due to error:\n', err);
        transporter = undefined;
    }
}

async function sendMail ({ to, subject, text, html }: MailInfos) {
    if (transporter === undefined) {
        throw new MailerError(`Mailer disabled. Cannot send email '${subject}' to '${to}'.`);
    }

    if (process.env.NODE_ENV !== 'production') {
        console.log('Mailer in dev mode, email sent to ', mailConfig.devMode.overrideTo);
        subject = '[DEV] ' + subject + ' (original recipient: ' + to + ')';
        to = mailConfig.devMode.overrideTo;
    }

    const info = await transporter.sendMail({
        from: mailConfig.settings.email, // sender address
        to, // list of receivers
        subject, // Subject line
        text, // plain text body
        html // html body
    });

    console.log('Message sent:', { to, subject }, { messageId: info.messageId });
}

export { initMailer, sendMail }
