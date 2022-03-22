# Process-scheduler

A simple module to spawn, kill, retrive \[stdout | stderr\] and control number of maximum running processes, built using EventEmitter.

## Applications

The 'Process-scheduler' module could be used as 

1. backend for an online code compiler
2. process manager for a cloud compute engine
3. scheduler to execute programs with control on maximum running processes

## Usage example

```
const {createScheduler,events}=require('./process_scheduler')

const newScheduler=createScheduler(maxInstance=3,timeout=5000)

let id='process1'

newScheduler.createProcess(id,'ls',['-la'])

newScheduler.on(id,(event,optArg)=>{
  switch(event){
    case events.SPAWN_EVENT:
      console.log(`Process with id: ${id} created`)
      break
    case events.STDOUT_EVENT:
      console.log(`\nStdout:\n-------------\n${optArg}\n\n-------------\n`)
      break
    case events.CLOSE_EVENT:
      console.log(`Process with id: ${id} exited, code ${optArg}`)
      break
  }
})

```
