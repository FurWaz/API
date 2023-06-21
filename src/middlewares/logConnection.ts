import type { UserDevice, IPLocation, Connection } from '@prisma/client';
import type express from 'express';
import fetch from 'node-fetch';
import { prisma } from '../app';
import { ErrLog, Log } from '../tools/log';
import { hashPassword } from '../controllers/auth';

async function getIpObj (ip: string): Promise<IPLocation> {
    return new Promise((resolve, reject) => {
        if (ip.startsWith('::ffff:')) ip = ip.slice(7);
        if (ip === '' || ip.startsWith('127.0') || ip.startsWith('192.168')) {
            reject(new Error('IP is invalid (' + ip + ')'));
            return;
        }

        prisma.iPLocation.findFirst({ where: { ip } }).then(ipLocation => {
            if (ipLocation === null) {
                // if not, get ip infos and create it
                const createNewIp = (infos: any) => {
                    prisma.iPLocation.create({
                        data: {
                            ip,
                            country: infos.country,
                            city: infos.city,
                            zip: infos.zip,
                            latitude: infos.lat,
                            longitude: infos.lon
                        }
                    }).then(ipLocation => {
                        resolve(ipLocation);
                    }).catch(err => {
                        reject(err);
                    });
                };

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _ = fetch(`http://ip-api.com/json/${ip}`).then(async result => result.json().then((json: any) => {
                    if (json.status === 'success') {
                        createNewIp(json);
                    } else {
                        reject(new Error('IP-API status not success : ' + ip));
                    }
                }).catch(() => {
                    reject(new Error('IP-API json parsing error'));
                }));
            } else resolve(ipLocation);
        }).catch(err => {
            reject(err);
        });
    });
};

async function getDeviceObj (hash: string, agent: string, userId: number | null, ipLocation: IPLocation | null): Promise<UserDevice> {
    return new Promise((resolve, reject) => {
        const createNewDevice = async (): Promise<UserDevice> => {
            return new Promise((resolve, reject) => {
                hashPassword(agent + Date.now().toString(), 1).then(hash => {
                    prisma.userDevice.create({
                        data: {
                            hash,
                            user_agent: agent,
                            user_id: userId
                        }
                    }).then(userDevice => {
                        resolve(userDevice);
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                });
            });
        };

        if (hash === undefined) { // device hash may not be sent by the client, in this case we search with user agent + ip
            const condition = userId === null
                ? {
                    user_agent: agent,
                    connections: {
                        some: {
                            ip_loc_id: ipLocation?.id
                        }
                    }
                }
                : {
                    user_agent: agent,
                    OR: {
                        user_id: userId,
                        connections: {
                            some: {
                                ip_loc_id: ipLocation?.id
                            }
                        }
                    }
                };
            prisma.userDevice.findFirst({
                where: condition
            }).then(userDevice => {
                if (userDevice === null) {
                    createNewDevice().then(resolve).catch(reject);
                    return;
                }

                if (userDevice.user_id === null) {
                    prisma.userDevice.update({
                        where: { id: userDevice.id },
                        data: { user_id: userId }
                    }).then(resolve).catch(reject);
                } else resolve(userDevice);
            }).catch(err => {
                reject(err);
            });
            return;
        }

        prisma.userDevice.findFirst({ where: { hash } }).then(userDevice => {
            if (userDevice === null) {
                createNewDevice().then(resolve).catch(reject);
                return;
            }

            if (userDevice.user_id === null && userId !== null) { // user logged in from new device
                prisma.userDevice.update({
                    where: { id: userDevice.id },
                    data: { user_id: userId }
                }).then(resolve).catch(reject);
            } else resolve(userDevice);
        }).catch(err => {
            reject(err);
        });
    });
};

async function getConnection (ipLocation: IPLocation, userDevice: UserDevice): Promise<Connection> {
    return new Promise((resolve, reject) => {
        const createNewConnection = async (): Promise<Connection> => {
            return new Promise((resolve, reject) => {
                prisma.connection.create({
                    data: {
                        ip_loc_id: ipLocation.id,
                        device_id: userDevice.id
                    }
                }).then(resolve).catch(reject);
            });
        };

        prisma.connection.findFirst({
            where: {
                ip_loc_id: ipLocation.id,
                device_id: userDevice.id,
                // requests with less than 1 hours gap are considered as the same connection
                updatedAt: { gt: new Date(Date.now() - 1000 * 60 * 60 * 1) }
            },
            orderBy: { updatedAt: 'desc' }
        }).then(connection => {
            if (connection == null) {
                createNewConnection().then(resolve).catch(reject);
            } else {
                prisma.connection.update({
                    where: { id: connection.id },
                    data: {
                        updatedAt: new Date()
                    }
                }).then(resolve).catch(reject);
            }
        }).catch(err => {
            reject(err);
        });
    });
}

module.exports = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.headers['x-forwarded-for']?.toString() ?? req.ip;
    const agent = req.headers['user-agent'] ?? 'agent';
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const deviceHash = req.headers['device']?.toString() ?? '';
    const userId = res.locals.user?.id ?? null;

    if (ip === undefined) {
        console.error('Error in LogConnection middleware : no IP found');
        new ErrLog(res.locals.lang.error.generic.internalError, Log.CODE.INTERNAL_SERVER_ERROR).sendTo(res);
        return;
    }

    console.log('Loggin new connection... ');

    getIpObj(ip).then(ipLocation => {
        getDeviceObj(deviceHash, agent, userId, ipLocation).then(userDevice => {
            getConnection(ipLocation, userDevice).then(connection => {
                res.locals.connection = connection;
                res.locals.userDevice = userDevice;
                res.locals.ipLocation = ipLocation;
                console.log(' - Connection logged:');
                console.log('   - IP: ' + ipLocation.ip);
                console.log('   - Device: ' + userDevice.hash + ' (' + userDevice.id.toString() + ')');
                console.log('   - Connection: ' + connection.id.toString());
            }).catch((err: Error) => {
                console.error('Cannot create Connection Object: ' + err.message);
            });
        }).catch((err: Error) => {
            console.error('Cannot get UserDevice Object: ' + err.message);
        });
    }).catch((err: Error) => {
        console.error('Cannot get IPLocation Object: ' + err.message);
    });

    next(); // even if we cannot log the connection, continue.
};
