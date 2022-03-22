const {spawn}=require('child_process')
const EventEmitter=require('events')

const events={
    SPAWN_EVENT:'SPAWN_EVENT',
    ERROR_EVENT:'ERROR_EVENT',
    STDOUT_EVENT:'STDOUT_EVENT',
    STDERR_EVENT:'STDERR_EVENT',
    CLOSE_EVENT:'CLOSE_EVENT',
    TIMEOUT_EVENT:'TIMEOUT_EVENT',
    KILL_EVENT:'KILL_EVENT'
}

const QUEUED='QUEUED'
const RUNNING='RUNNING'

const queue=[]
const running=[]



// ------------ Supporting functions start ------------

function subscribeEvents(scheduler,newProcess,timeout){
    let timeCounter=setTimeout(()=>{
        newProcess.proc.kill('SIGKILL')
        scheduler.emit(newProcess.id,events.TIMEOUT_EVENT)
    },timeout)
    
    newProcess.proc.on('spawn',()=>{scheduler.emit(newProcess.id,events.SPAWN_EVENT)})
    newProcess.proc.on('error',()=>{scheduler.emit(newProcess.id,events.ERROR_EVENT)})
    
    newProcess.proc.on('close',(code,signal)=>{
        clearTimeout(timeCounter)
        scheduler.emit(newProcess.id,events.CLOSE_EVENT,code)
        
        let index=running.indexOf(newProcess)
        running.splice(index,1)
    })

    newProcess.proc.stdout.on('data',(data)=>{scheduler.emit(newProcess.id,events.STDOUT_EVENT,data)})
    newProcess.proc.stderr.on('data',(data)=>{scheduler.emit(newProcess.id,events.STDERR_EVENT,data)})
    scheduler.on(newProcess.id,(event,optArg)=>{
        if(event===events.KILL_EVENT) newProcess.proc.kill('SIGKILL')
    })
}

function updateRunning(scheduler,maxInstance,timeout){
    if(running.length<maxInstance && queue.length>0){
        let newProcess=queue.shift()

        newProcess.status=RUNNING
        
        newProcess.proc=spawn(newProcess.cmd,newProcess.args,{shell:true})
        subscribeEvents(scheduler,newProcess,timeout)
        
        running.push(newProcess)
    }
}

// ------------ Supporting functions end ------------


class ProcessScheduler extends EventEmitter{
    constructor(maxInstance,timeout){
        super()
        this.maxInstance=maxInstance
        this.timeout=timeout
        setInterval(updateRunning,0,this,maxInstance,timeout)
    }
    createProcess(id,cmd,args){
        let newProcess={
            id:id,
            cmd:cmd,
            args:args,
            status:QUEUED,
            proc:undefined
        }
        queue.push(newProcess)
    }
    queueCount(){
        return queue.length
    }
    runningCount(){
        return running.length
    }
    getStatus(){
        return {queue:[...queue],running:[...running]}
    }
    killProcess(id){
        this.emit(id,events.KILL_EVENT)
    }
}

function createScheduler(maxInstance,timeout){
    return new ProcessScheduler(maxInstance,timeout)
}



module.exports.ProcessScheduler=ProcessScheduler
module.exports.createScheduler=createScheduler
module.exports.events=events