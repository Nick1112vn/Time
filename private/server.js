const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const cors = require('cors');
const server = http.createServer(app);
const hostKey=11122008;
const originstudents=require("../students.json");
const students=[[],[],[],[],[]]
const stories=require("../stories.json");
const origingroups=[];
let currentTimeout;
let currentTimeout1;
let currentTimeout2;
let groups=[];
let host;
let timeShoot=null;
let answeringPlayers=[];
app.use(cors());
app.use(express.json());
app.post('/ntp-time', (req, res) => {
    res.json({ ntpTime: new Date() });
    
  });
const io = socketIo(server,{
    cors: {
        origin: "*", // Cho phép tất cả các origin
        methods: ["GET", "POST"]
    }
});

const originQuestions = require('./question.json')
questions=originQuestions.map(obj => ({question:obj.question,options:obj.options}))
let players = [];
let rdPlayers=[[],[],[],[],[]];
let currentQuestionIndex = 0;
let answersReceived = 0;
function getRandomIndexes(max, count) {
    const indexes = new Set();
    while (indexes.size < count) {
        const randomIndex = Math.floor(Math.random() * max);
        indexes.add(randomIndex);
    }
    return Array.from(indexes);
}
function getRandomExcept(exclude,max) {
    let num;
    do {
      num = Math.floor(Math.random() * (max+1)); // Số ngẫu nhiên từ 0 đến 5
    } while (exclude.includes(num)); // Lặp lại nếu số nằm trong mảng loại trừ
    return num;
  }
  function sendQuestion1(){
    if (currentQuestionIndex >= questions.length) {io.emit('quizEnd', { message: "Quiz completed!" });return}
            
                // Kết thúc quiz
                
            
    //if(groups.length<2)groups=JSON.parse(JSON.stringify(origingroups));
    answeringPlayers=[]
    clearTimeout(currentTimeout);
    clearTimeout(currentTimeout1);
    let groupBefore;
    for(let i=0;i<2;i+=1){
        if(groups.length==0){groups=JSON.parse(JSON.stringify(origingroups));groups.splice(groups.indexOf(groupBefore),1)}
        const groupIndex=Math.floor(Math.random() * groups.length)
                   const group = groups[groupIndex];
                   groupBefore=groups[groupIndex]
                   //console.log(origingroups)
                   const randomIndex = Math.floor(Math.random() * rdPlayers[group].length);
                   if(rdPlayers[group].length<=0)rdPlayers[group]=JSON.parse(JSON.stringify(students[group]))
                   answeringPlayers.push(players.find(player => player.name === rdPlayers[group][randomIndex]));
                   groups.splice(groupIndex,1)
                   //console.log(students.slice());
                   //console.log(`Question sent to  player ${rdPlayers[group][randomIndex]}  ${randomIndex} ${group}`);
                   rdPlayers[group].splice(randomIndex,1)
        }
                   //answeringPlayer = rdPlayers[group][randomIndex];
                   //console.log(answeringPlayer)
                   io.emit('quizStart', { message: "Quiz started!" });
                   host.emit('questionData', {answeringPlayers:answeringPlayers.map(obj => ({id:obj.id,name:obj.name})),question:originQuestions[currentQuestionIndex]});
                   setTimeout(() => {
                   if(answeringPlayers.length>0)answeringPlayers.forEach(s =>s.emit('question', questions[currentQuestionIndex]));
                }, 6000)
  }
  function sendQuestion(){
    //console.log(origingroups)
        if(origingroups.length>=2)sendQuestion1()
            else currentTimeout2=setTimeout(() => {if(host)sendQuestion()},1000);
    
  }
// Kết nối client
io.on('connection', (socket) => {
    //console.log(`Player connected: ${socket.id}`);
    players.push(socket);
    io.emit('playerCount',players.filter(item => item.name != null).length)
    // Gửi câu hỏi hiện tại cho người chơi mới
    socket.on('shoot', (sentTime) => {
        const now = new Date()
        if (!answeringPlayers.includes(socket)||!socket.answered) return;
        if(timeShoot==null){host.emit('shoot',{state:'lose',answer:false}); return;}
        if(timeShoot!=null&&now>timeShoot)host.emit('shoot',{state:'winner',answer:socket.answer}) 
        else host.emit('shoot',{state:'lose',answer:socket.answer})
        if(socket.answer!=true)return;
        //console.log(timeShoot)
        if(timeShoot!=null){
            

    
        clearTimeout(currentTimeout);
socket.shootTime=now

       

const arr=answeringPlayers;
const sortedArr = arr.sort((a, b) => b.shootTime - a.shootTime);

// Lấy đối tượng có giá trị cao nhất
const highestValueObject = sortedArr[0];
if (now<timeShoot)host.emit('miss',{name:socket.name,answer:socket.answer})
else host.emit('winner',{name:socket.name,answer:socket.answer})
answeringPlayers.forEach(s =>s.shootTime=null)
answeringPlayers.forEach(s =>s.emit('reset', ''));
players.forEach(p => p.answered = false);
timeShoot=null;
setTimeout(() => {
sendQuestion();
},20000)

        
    }  
    })
    socket.on('name', (name) => {
        if(!originstudents.flat().includes(name)||socket.name||students.flat().includes(name))return
            socket.name=name;
            const i=originstudents.findIndex(innerArray => innerArray.includes(name))
            students[i].push(name)
            rdPlayers[i].push(name)
            if(!origingroups.includes(i))origingroups.push(i)
                if(!groups.includes(i))groups.push(i)
            const arr=getRandomIndexes(stories.length, 5);
            socket.stories=arr;
            socket.emit('stories',arr)
            io.emit('playerCount',players.filter(item => item.name != null).length)
    });
    socket.on('selectStory', (i) => {
        if(!socket.stories||!socket.stories.includes(i)||socket.selectedStory)return;
socket.selectedStory=stories[i];
    });
    socket.on('start_quiz', (key,questionI) => {
        console.log(origingroups)
        if(hostKey!=key||origingroups.length<2)return;
        clearTimeout(currentTimeout);
        clearTimeout(currentTimeout1);
        host = socket;
        timeShoot=null;
        players=players.filter(player => player !== socket);
        console.log(`Host assigned: ${host}`);
         
        socket.emit('host_assigned', `You are the host. Your code is: ${socket.id}`);
        players.forEach(p => p.answered = false);
            currentQuestionIndex = questionI;
 answersReceived = 0;
 answeringPlayers=[];
 rdPlayers=JSON.parse(JSON.stringify(students));
 groups=JSON.parse(JSON.stringify(origingroups));
        sendQuestion();
    });
    // Lắng nghe khi người chơi gửi câu trả lời
    socket.on('submitAnswer', (data) => {
        
        
            //console.log(socket.answered)
        // Đánh dấu người chơi đã trả lời
        
        if (!answeringPlayers.includes(socket)||socket.answered) return;
        socket.answer=data.answer==originQuestions[currentQuestionIndex].answer
            //console.log("1");
            answersReceived+=1;
            
socket.answered=true;
        // Khi tất cả người chơi đã trả lời
        
            
            
                if(answersReceived<answeringPlayers.length)return
                currentQuestionIndex++;
                answersReceived = 0;
                
                
                // Reset trạng thái cho câu hỏi mới
                host.emit('battle','')
                currentTimeout1=setTimeout(() => {
                    
                    const randomSeconds = Math.floor(Math.random() * (12 - 6 + 1)) + 6;
                    timeShoot=new Date()
// Add the random seconds to the current time
timeShoot.setSeconds(timeShoot.getSeconds() + randomSeconds);
                    host.emit('shootTime',randomSeconds)
                    currentTimeout=setTimeout(() => {host.emit('winner',"no one because of the timeout!")
                        answeringPlayers.forEach(s =>s.shootTime=null)
                        players.forEach(p => p.answered = false);
                        timeShoot=null;
                        setTimeout(() => {sendQuestion();},20000)}, 20000);
                },10000)
                // Gửi câu hỏi mới cho tất cả người chơi
                
            
            
        
    });

    // Khi người chơi ngắt kết nối
    socket.on('disconnect', () => {
        if(socket==host) host=null;
        //console.log(`Player disconnected: ${socket.id}`);
        players = players.filter(p => p.id !== socket.id);
        io.emit('playerCount',players.filter(item => item.name != null).length)
        if(!socket.name)return;
        
        const index=students.findIndex(innerArray => innerArray.includes(socket.name))
        students[index].splice(students[index].indexOf(socket.name),1)
        rdPlayers[index].splice(students[index].indexOf(socket.name),1)
       
        if(students[index].length<=0)origingroups.splice(origingroups.indexOf(index),1);
        if (answeringPlayers.includes(socket)&&!socket.answered){answeringPlayers.forEach(s =>s.shootTime=null)
            answeringPlayers.splice(answeringPlayers.indexOf(socket),1)
            players.forEach(p => p.answered = false);
            timeShoot=null;
            answersReceived = 0;
            sendQuestion();
        }
        //console.log(students,index,origingroups)
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
