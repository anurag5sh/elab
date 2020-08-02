const osu = require('node-os-utils')
const cpu = osu.cpu;
const mem = osu.mem;
const drive = osu.drive;

module.exports = function(io){
    //Socket for stats
    io.on('connection', function(socket){

        socket.on('getStats',()=>{
        Promise.all([mem.info(),cpu.usage(),drive.info()]).then((data)=>{socket.emit('stats',data);});
        });
    
    });
}