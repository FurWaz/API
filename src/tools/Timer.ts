import Queue from "bee-queue";
import Config from "./Config.ts";

export interface TaskActioner {
    type: string;
    action: (task: Task) => void;
}

export class Task {
    public type: string;
    public time: string;
    public data: string;

    constructor(type: string, time: string|Date, data: string|object) {
        this.type = type.toString();
        this.time = typeof(time) === 'object' ? time.toISOString() : time.toString();
        this.data = typeof(data) === 'object' ? JSON.stringify(data) : data.toString();
    }
}

const redisUrl = Config.redis.url;
const queueOptions = {
    removeOnSuccess: true,
    redis: {
        host: redisUrl.split('://')[1].split(':')[0],
        port: redisUrl.split('://')[1].split(':')[1],
        password: '',
    },
}


export class Timer {
    public static queues: Queue[] = [];
    
    public static registerAction(action: TaskActioner) {
        if (!Config.redis.enabled) {
            console.error('[registerAction for ' + action.type + '] Redis isn\'t enabled on this server, please enable it to use the Timer and Delayed Tasks.');
            return;
        }

        const queue = new Queue(action.type, queueOptions);
        this.queues.push(queue);
        // @ts-expect-error : Bee-queue typings are wrong
        queue.process((job, done) => {
            const now = new Date();
            const taskDate = new Date(job.data.time);
            const delayMS = taskDate.getTime() - now.getTime();
            setTimeout(() => {
                try {
                    action.action(job.data);
                } catch (err) {
                    console.error('Error while executing task (type = '+job.data.type+')\n', err);
                }
                done();
            }, delayMS);
        });
    }

    public static addTask(task: Task) {
        const queue = this.queues.find(q => q.name === task.type);
        if (queue === undefined) {
            throw new Error('No queue found for type ' + task.type);
        }
        queue.createJob(task).save();
    }
}
