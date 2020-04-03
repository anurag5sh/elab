const {Achievements} = require('../models/achievementJob');
const winston = require('winston');
const {Contest} = require('../models/contest');
const {Student} = require('../models/student');

let timer_list = [];

async function achievementsStartup(){
    await Achievements.find().lean().then((contests)=>{
        contests.forEach((item)=>{
            let obj = {};
            obj.id = item.contest_id;
            obj.timeout = setTimeout(async ()=>{
                try{
                    const contest = await Contest.findOne({id:item.contest_id}).lean().select('leaderboard name id -_id');
                    const leaderboard = contest.leaderboard.slice(0,4);
        
                    leaderboard.forEach(async (item,index)=>{
                        await Student.findOneAndUpdate({usn:item.usn},{$addToSet:{achievements:{position:index+1,id:contest.id}}});
                    });

                    await Achievements.findOneAndDelete({contest_id:item.contest_id});
                }
                catch(ex){
                    winston.error("Achivements Error",ex);
                }

            },item.ends - Date.now());
            timer_list.push(obj);
        });
    });
    
}


async function clearAchievementJob(id){
    const index = timer_list.findIndex(element => {return element.id == id});

    if(index>-1){
        clearTimeout(timer_list[index].timeout);
        await Achievements.findOneAndDelete({contest_id:timer_list[index].id});
        timer_list.splice(index,1);
    }
}

async function addAchievementJob(contest_id,ends){
    let obj = {};
    obj.id = contest_id;
    obj.timeout = setTimeout(async ()=>{
        try{
            const contest = await Contest.findOne({id:contest_id}).lean().select('leaderboard name id -_id');
            const leaderboard = contest.leaderboard.slice(0,4);

            leaderboard.forEach(async (item,index)=>{
                await Student.findOneAndUpdate({usn:item.usn},{$addToSet:{achievements:{position:index+1,id:contest.id}}});
            });

            await Achievements.findOneAndDelete({contest_id:contest_id});
        }
        catch(ex){
            winston.error("Achivements Error",ex);
        }
        

    },ends - Date.now());
    timer_list.push(obj);
    const a = new Achievements();
    a.contest_id = contest_id;
    a.ends = ends;
    await a.save();
}

exports.achievementsStartup = achievementsStartup;
exports.clearAchievementJob = clearAchievementJob;
exports.addAchievementJob = addAchievementJob;
exports.timer_list = timer_list;