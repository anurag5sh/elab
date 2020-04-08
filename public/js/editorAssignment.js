
function setup(){const editor = ace.edit("editor");
ace.config.set("basePath", "/src-min-noconflict");
ace.require("ace/ext/language_tools");
editor.getSession().setUseWrapMode(true);
    editor.setOptions({
enableBasicAutocompletion: true,
enableSnippets: true,
enableLiveAutocompletion: true,
showPrintMargin: false,
indentedSoftWrap: false
});

setup.sourceArray=[];
function source(lang){
    
    const pre = $("#lang").data('pre');
    $.post(`/assignment/source/`+qid,{sourceCode:editor.getValue(),lang:pre},function (data,status){
    $("#lang").data('pre', $("#lang").val());
    
    if(!lang) lang='';
    $.get(`/assignment/source/`+qid,{lang:lang},function (data,status){
        if(lang){
        editor.setValue(data[0].sourceCode);
        
        }
        else{$("#sourceBody").empty();sourceArray=data;
        data.forEach((item,index)=>{
        $("#sourceBody").append('<tr><td>'+(index+1)+'</td><td>'+item.language_id.slice(0,-2)+'</td><td>'+item.status+'</td><td>'+item.points+'</td><td><a href="javascript:setup().sourceInsert('+index+')">Select</a></td></tr>');
        });
        }
    }).fail((err)=>{
    toastr.error(err.responseText);
    })
    }).fail((err)=>{
    toastr.error(err.responseText);
    });
}
function sourceInsert(i){
    editor.setValue(sourceArray[i].sourceCode);
    $("#lang").val(sourceArray[i].language_id.toLowerCase()).change();
    $('select').niceSelect('update');
    $("#sourceModal").modal('hide');
}

function setLang(){ let m='';
    const l = $("#lang").val();
    switch (parseInt(l.substr(l.length-2))){
    case 50 : m='c_cpp';break;
    case 51 : m='csharp';break;
    case 54 : m='c_cpp';break;
    default: m=l.slice(0,-2); 
    }
    
    editor.session.setMode("ace/mode/"+m);
    source(l.substr(l.length-2));
}

setInterval(function(){
    
    const pre = $("#lang").data('pre');
    $.post(`/assignment/source/`+qid,{sourceCode:editor.getValue(),lang:pre},function (data,status){
    $("#lang").data('pre', $("#lang").val());});
},60000*5);

function save(){
    const pre = $("#lang").data('pre');
    $.post(`/assignment/source/`+qid,{sourceCode:editor.getValue(),lang:pre},function (data,status){
    $("#lang").data('pre', $("#lang").val());$("#save").prop('disabled',true);$("#save span").text("Saved");
    setTimeout(()=>{$("#save").prop('disabled',false);$("#save span").text("Save");},3000)}
    ).fail((err)=>{toastr.error("Could not save!")});
}

function setTheme(){
    editor.setTheme("ace/theme/"+$("#theme").val());
}
function setFont(){
    editor.setFontSize(parseInt($("#fontsize").val()));
}

function setDefault(){$('#lang').data('pre', $("#lang").val());setLang();setTheme();setFont();setup.hh=true;}
(!setup.hh?setDefault():void(0));

function readText() { window.location.href="#loader";
let l = document.getElementById("lang").value;
l=l.slice(-2);
$(document).ready(function(){
let input = null;
if(document.getElementById("custom_i").checked == true){
    input = document.getElementById("custom_input").value;
}
$("#button").prop('disabled', true).append('<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>');
$.post("/api",
{
source:editor.getValue(),
language: l,
qid: window.location.pathname,
custom: input
},
function(data,status){ 
    if(document.getElementById("custom_i").checked == true){
    $(".custom").remove();  
    $('#opbox').append('<div class="card custom" style="width:650px;;"><label><b>Custom TestCase</b></label><hr style="width:25%;margin-top:0rem;"><label><b>Input</b></label><textarea readonly="readonly" class="bg-col" style="font-family: Source Code Pro, monospace;width:100%;border:none;height:auto;">'+ document.getElementById("custom_input").value+'</textarea ><br><label><b>Output</b></label><textarea readonly="readonly" class="bg-col" style="font-family: Source Code Pro, monospace;width:100%;border:none;height:125px;">'+data[0].output+'</textarea>') 
    document.getElementById("loader").style.display="none";  
    }
    else{
    if(!Array.isArray(data)){
    toastr.warning(data);
    document.getElementById("loader").style.display="none";
    return;
}

for(let i=0;i<data.length;i++)
{
    if(data[i].id==3){
    $('#color'+(i+1)+'').removeClass('red-cross yellow-exclamation');
    $('#color'+(i+1)+'').addClass('green-tick');
    $('#icon'+(i+1)+'').removeClass('fad fa-times fad fa-exclamation-triangle');
    $('#icon'+(i+1)+'').addClass('fad fa-check');
    }
    else if(data[i].id == 4){
    $('#color'+(i+1)+'').removeClass('green-tick yellow-exclamation');
    $('#color'+(i+1)+'').addClass('red-cross');
    $('#icon'+(i+1)+'').removeClass('fad fa-check fad fa-exclamation-triangle');
    $('#icon'+(i+1)+'').addClass('fad fa-times');
    }
    else{
    $('#color'+(i+1)+'').removeClass('green-tick red-cross');
    $('#color'+(i+1)+'').addClass('yellow-exclamation');
    $('#icon'+(i+1)+'').removeClass('fad fa-check fad fa-times');
    $('#icon'+(i+1)+'').addClass('fad fa-exclamation-triangle');
    }
}
for(let i=0;i<$('#card .sa').length;i++){
document.getElementById("message"+(i+1)+"").innerHTML=data[i].description;
document.getElementById("output"+(i+1)+"").value = data[i].output;
$("#input"+(i+1)+"").html(document.getElementById("sam_i"+i+"").innerHTML);
$("#expectedOutput"+(i+1)+"").html(document.getElementById("sam_o"+i+"").innerHTML);
}

document.getElementById("loader").style.display="none";
document.getElementById("out").style.display="block";
window.location.href="#opbox";
    }
//save
    
    const pre = $("#lang").data('pre');
    $.post(`/assignment/source/`+qid,{sourceCode:editor.getValue(),lang:pre},function (data,status){
    $("#lang").data('pre', $("#lang").val());});
    //spinner
    $("#button").prop('disabled', false);
    $("#button").find('span').remove();

}).fail((err)=>{
    toastr.error(err.responseText);
    document.getElementById("loader").style.display="none";
    });

});
}
function submission(){ 
    let l = document.getElementById("lang").value;
    l=l.slice(-2);
    $("#button_submit").prop('disabled', true).append('<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>');
    $(document).ready(function (){
    $.post(window.location.pathname,
    {
    source:editor.getValue(),
    language: l
    },
    function(data,status){
    if(!Array.isArray(data)){
    toastr.warning(data);
    document.getElementById("loader").style.display="none";
    return;
}
    //- $(".points").remove();
    //- $(".green-tick-t").remove();
    //-   $(".red-cross-t").remove();
    $("#TestCases").empty();

    let total =0;

    let table = document.createElement("TABLE");
    table.setAttribute("id", "table");
    table.setAttribute("class","table table-borderless");
    document.getElementById("TestCases").appendChild(table);

    for(let i=0;i<data.length;i++){
        
        let row = document.createElement("TR");
        row.setAttribute("id", "myTr"+(i+1)+"");
        document.getElementById("table").appendChild(row);


        let test_no = document.createElement("TD");
        let t = document.createTextNode("Testcase "+(i+1)+" ");
        test_no.appendChild(t);

        let icon = document.createElement("I");

        if(data[i].id==3){
        test_no.setAttribute("class","green-tick-t tCase");
        icon.setAttribute("class","fad fa-check");
        }
        else if(data[i].id == 4){
        test_no.setAttribute("class","red-cross-t tCase");
        icon.setAttribute("class","fad fa-times ");
        }
        else{
        test_no.setAttribute("class","text-warning tCase");
        icon.setAttribute("class","fad fa-exclamation-triangle");
        }
        test_no.appendChild(icon);

        document.getElementById("myTr"+(i+1)+"").appendChild(test_no);
        let message = document.createElement("TD");
        t = document.createTextNode(data[i].description);
        message.appendChild(t);
        document.getElementById("myTr"+(i+1)+"").appendChild(message);
        
        let points = document.createElement("TD");
        t = document.createTextNode(data[i].points);
        points.appendChild(t);
        document.getElementById("myTr"+(i+1)+"").appendChild(points);

        total+=data[i].points;

    }

    $("#TestCases").append('<p class="points" style="padding:10px;font-weight:bold"> Total Points = '+ total +'</p>');
    
    document.getElementById("loader").style.display="none";
    document.getElementById("out").style.display="block";
        window.location.href="#opbox";
    //spinner
    $("#button_submit").prop('disabled', false);
    $("#button_submit").find('span').remove();
    }).fail((err)=>{
    toastr.error(err.responseText);
    document.getElementById("loader").style.display="none";
    //spinner
    $("#button_submit").prop('disabled', false);
    $("#button_submit").find('span').remove();
    });
    });
    
}
return {run:readText,submit:submission,setLang:setLang,source:source,setTheme:setTheme,setFont:setFont,sourceInsert:sourceInsert,save:save}

}

    $(document).ready(function() {
$('select').niceSelect();
setup();
$("#sourceModal").on('show.bs.modal', function(){
    setup().source();
});
});


$(document).ready(function() {
    var count=0,count1=0;
    $('#button').click(function()
    { 
    $(".SUBMIT_BOX").remove();
    count1=0;
    if(count==0){
        count=count+1;
        //$('#opbox').append('<div name="out" id="out" style="width: 650px;height:600px;box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);text-align: left;left: 20px;padding: 10px;margin: 20px;position: relative;"><label><u><b>Input</b></u></label><textarea id="input" readonly="readonly" style="width:100%;border:none;"></textarea><label><u><b>Output</b></u></label><textarea id="output" readonly="readonly" style="width:100%;border:none;"></textarea><label><u><b>Expected Output</b></u></label><textarea id="expectedOutput" readonly="readonly" style="width:100%;border:none;"></textarea></div>');
        $('#opbox').append('<div name="out" id="out" class="container mt-3 OUTPUT" style="background-color:white;width: 650px;height:auto;border-radius:4px;box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);text-align: left;left: 20px;padding: 10px;margin: 20px;position: relative;"><ul class="nav nav-tabs" id="Output"></ul><div class="tab-content" id="tab-content"></div></div>');
        for(var i=1;i<=$('#card .sa').length;i++){
        if(i==1){
        $('#Output').append('<li class="nav-item"><a class="nav-link active" id="color'+i+'" data-toggle="tab" href="#tab'+i+'">Sample '+i+'  <i id="icon'+i+'"></i></a></li>');
        $('#tab-content').append('<div id="tab'+i+'" class="container tab-pane active"><br><label><b>Message</b></label><br><p style="font-family: Source Sans Pro, sans-serif;font-size:18px;" id="message'+i+'"></p><label><b>Input</b></label><div class="bg-col" id="input'+i+'" readonly="readonly" style="white-space:pre-wrap;font-family: Source Code Pro, monospace;width:100%;border:none;height:auto;"></div><label><b>Output</b></label><textarea class="bg-col" id="output'+i+'" readonly="readonly" style="font-family: Source Code Pro, monospace;width:100%;border:none;height:110px;"></textarea><label><b>Expected Output</b></label><div class="bg-col" id="expectedOutput'+i+'" readonly="readonly" style="white-space:pre-wrap;font-family: Source Code Pro, monospace;width:100%;border:none;height:auto;"></div></div>');
        }else{
        $('#Output').append('<li class="nav-item"><a class="nav-link" id="color'+i+'" data-toggle="tab" href="#tab'+i+'">Sample '+i+'  <i id="icon'+i+'"></i></a></li>');                
        $('#tab-content').append('<div id="tab'+i+'" class="container tab-pane fade"><br><label><b>Message</b></label><br><p style="font-family: Source Sans Pro, sans-serif;font-size:18px;" id="message'+i+'"></p><label><b>Input</b></label><div class="bg-col" id="input'+i+'" readonly="readonly" style="white-space:pre-wrap;font-family: Source Code Pro, monospace;width:100%;border:none;height:auto;"></div><label><b>Output</b></label><textarea class="bg-col" id="output'+i+'" readonly="readonly" style="font-family: Source Code Pro, monospace;width:100%;border:none;height:110px;"></textarea><label><b>Expected Output</b></label><div class="bg-col" id="expectedOutput'+i+'" readonly="readonly" style="white-space:pre-wrap;font-family: Source Code Pro, monospace;width:100%;border:none;height:auto;"></div></div>');
        }
        } 

    }
    
    document.getElementById("out").style.display="none";
    document.getElementById("loader").style.display="block";
    
    });
    $('#button_submit').click(function(){
    
    $(".OUTPUT").remove();
    count=0;
    
    if(count1==0){
    $('#opbox').append('<div name="out" id="out" class="container mt-3 SUBMIT_BOX" style="width: 650px;box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);text-align: left;left: 20px;padding: 10px;margin: 20px;position: relative;"><div id="TestCases"></div></div>');
    count1=count1+1;
    
    }
    
    document.getElementById("out").style.display="none";
    document.getElementById("loader").style.display="block";
    //- document.getElementById("loader").style.height="350px";
    });

    $('#custom_i').click(function(){
    if(document.getElementById('custom_i').checked == true){
    document.getElementById('custom_input').style.display = "block";
    }else
    {
        $('.custom').remove();
    document.getElementById('custom_input').style.display = "none";
    }
    });

    $('#custom_input').click(function(){
    if(document.getElementById('custom_i').checked == false)
    $('#custom_i').click();
    })

    });
    $("#solution").on('show.bs.modal',function (e){
    $.get('/assignment/solution/'+qid,function (data,status){
        if(data.sourceCode){
        $("#solutionLang").text("Language : "+ data.language);
        $("#solutionBody").html(he.escape(data.sourceCode));
        }
        else{
        $("#solutionLang").html(data);
        }
    });
    });