function setDateTime(s,e){
    $('input[name="duration"]').daterangepicker({
        timePicker: true,
        startDate: s,
        endDate: e,
        locale: {
        format: 'YYYY/MM/DD hh:mm A'
        }
    });
}
$('#sem').change(function (){

    $.get("/assignment/edit/"+document.getElementById("sem").value,function(data,status){
        $('#details').empty();
        $('#qlist').empty();
        const sem = '<div class="form-group row"><label class="col-sm-2">Semester &nbsp; : &nbsp;'+data.assignment.sem+'</label><label class="col-sm-2">Set &nbsp; : &nbsp;'+data.assignment.id.substr(9)+'</label></div>';
        const dateTime = '<div class="form-group row"><label class="col-sm-1">Duration</label><div class="col-sm-4"><input type="text" name="duration" class="form-control"></div></div>';
        const batch = '<div class="form-group row"><label class="col-sm-1">Batch</label><div class="col-sm-4"><input readonly type="text" value="'+data.assignment.id.substr(5,4)+'"class="form-control"></div></div>';
        const ready = '<div class="form-group row"><label class="col-sm-1">Status</label>&nbsp;&nbsp;<div class="col-sm-4 "><input type="checkbox" data-toggle="toggle" data-on="Ready" data-off="Not Ready" data-onstyle="success" data-offstyle="danger" data-size="small" data-width="120" name="isReady" id="isReady"></div></div>';
        const del  ='<div class="col-8"><button class="btn btn-danger" type="button" data-toggle="modal" data-target="#deleteAssignment">Delete this Assignment</button></div>';
        const newQ = '<br><div class="form-group row"><div class="col-2"><button class="btn btn-primary" type="button" data-toggle="modal" data-target="#myModal">Add New Question</button></div><div class="col-2"><button class="btn btn-primary" type="button" data-toggle="modal" data-target="#oldQues">Insert Old Question</button></div>'+del+'</div>';
        const submit = '<div class="form-group row"><div class="col-2"><input type="submit" class="btn btn-success" value="Update"></div></div>';
        
        document.getElementById("details").innerHTML = sem + dateTime + batch +ready+submit+newQ;
        setDateTime(data.assignment.duration.starts,data.assignment.duration.ends);
        $("#isReady").bootstrapToggle();
        if(data.assignment.isReady)  $("#isReady").bootstrapToggle('on');
        data.questions.forEach(insert);
        function insert(item,index){
            if(item.assignmentId==data.assignment.id)
            $("#qlist").append('<tr><td>'+item.qid+'</td><td>'+item.name+'</td><td><a class="fas fa-edit" data-toggle="modal" data-target="#edit" data-id="'+item.qid+'" style="color:dimgrey;" href=""></a></td><td><a href="" data-toggle="modal" data-target="#solution" data-id="'+item.qid+'" data-name="'+item.name+'">Add Solution</a></td><td><a class="fas fa-trash" style="color:red;" data-toggle="modal" data-target="#delete" href="" data-id="'+item.qid+'" data-name="'+item.name+'"></a></td></tr>');
            else
            $("#qlist").append('<tr><td>'+item.qid+'(Batch '+item.assignmentId.substr(5,4)+') </td><td>'+item.name+'</td><td><a class="fas fa-eye" data-toggle="modal" data-target="#edit" data-id="'+item.qid+'" style="color:dimgrey;" href=""></a></td><td><a href="" data-toggle="modal" data-target="#solution" data-id="'+item.qid+'" data-name="'+item.name+'">Add Solution</a></td><td><a class="fas fa-trash" style="color:red;" data-toggle="modal" data-target="#delete" href=""  data-id="'+item.qid+'" data-name="'+item.name+'"></a></td></tr>');
        }
        
    });
});

function saveDetails(){
    const aId = $('#sem').val();
    $.ajax({
        type: "POST",
        url: "/admin/assignment/edit",
        data: $("#form_details").serialize()+"&aId="+aId,
        success: function (data,status, jqXHR) {
    
        toastr.success(data);
        },
        error: function (e) {

            toastr.error(e.responseText);

        },
    
    });

    return false;
}

function aDelete(){
    const aId = $('#sem').val();
    $.get('/admin/assignment/delete/'+aId,function (data,status){
        location.reload();
        toastr.success(data);
    });

    return false;
}


$(document).ready(function() {

var count = 1;
// CREATE A "DIV" ELEMENT AND DESIGN IT USING jQuery ".css()" CLASS.
var container = $(document.createElement('div')).css({
    padding: '5px',margin: '20px'
    
});

$('#btSampleAdd').click(function() {

        count = count +1;

        // ADD TEXTBOX.
        $(container).append('<p id=s_no' + count +'>Sample Testcase ' + (count) + '</p>');
        $(container).append('<textarea id=i_sample' + count + ' name="i_sample1" rows="5" cols="50"  class="input form-control" placeholder="Input" style="margin-bottom:10px;" ></textarea>');
        $(container).append('<textarea id=o_sample' + count + ' name="o_sample1" rows="5" cols="50"  class="input form-control" placeholder="Output" ></textarea>');
        
        // ADD BOTH THE DIV ELEMENTS TO THE "main" CONTAINER.
        $('#samplecase').after(container);
    
});

// REMOVE ONE ELEMENT PER CLICK.
$('#btSampleRemove').click(function() {

    if (count != 1) 
    {
    
    $('#o_sample' + count).remove();  
    $('#i_sample' + count).remove(); 
    $('#s_no' + count).remove();count = count -1;
    
    }

    
        });
    
        
    });

$(document).ready(function() {

    
    var count = 1;
    // CREATE A "DIV" ELEMENT AND DESIGN IT USING jQuery ".css()" CLASS.
    var container = $(document.createElement('div')).css({
        padding: '5px', margin: '20px'
        
    });

    $('#btAdd').click(function() {

            
            count = count +1;

            // ADD TEXTBOX.
            $(container).append('<p id=t_no' + count +'>Testcase ' + (count) + '</p>');
            $(container).append('<textarea id=i_testcase' + count + ' name="i_testcase1" rows="5" cols="50"  class="input form-control" placeholder="Input" style="margin-bottom:10px;"></textarea>');
            $(container).append('<textarea id=o_testcase' + count + ' name="o_testcase1" rows="5" cols="50"  class="input form-control" placeholder="Output" ></textarea>');
            $(container).append('<p id=p_no' + count + '>Points</p>');
            $(container).append('<input id="points'+ count +'" class="form-control" style="width:15%;" name="points" type="text" placeholder="Ex: 10"/>');
            // ADD BOTH THE DIV ELEMENTS TO THE "main" CONTAINER.
            $('#testcase').after(container);
        
    });

    // REMOVE ONE ELEMENT PER CLICK.
    $('#btRemove').click(function() {
        if (count != 1) 
        {
        $('#points' + count).remove(); 
        $('#p_no' + count).remove();
        $('#o_testcase' + count).remove(); 
        $('#i_testcase' + count).remove();
        $('#t_no' + count).remove();count = count -1;
        }
    
    
    });

    
});
/* -----------------------edit------------------------------------- */
var ecount = 1;
    // CREATE A "DIV" ELEMENT AND DESIGN IT USING jQuery ".css()" CLASS.
    const c1 = document.createElement('div');
    c1.id="samplecase_extra"
    var container1 = $(c1).css({
        padding: '5px',margin: '20px'
        
    });
    var ecount2 = 1;
    // CREATE A "DIV" ELEMENT AND DESIGN IT USING jQuery ".css()" CLASS.
    const c2 = document.createElement('div');c2.id="testcase_extra";
    var container2 = $(c2).css({
        padding: '5px', margin: '20px'
        
    });
 
function sampleAdd() {

    ecount = ecount +1;

    // ADD TEXTBOX.
    $(container1).append('<p id=es_no' + ecount +'>Sample Testcase ' + (ecount) + '</p>');
    $(container1).append('<textarea required id=ei_sample' + ecount + ' name="i_sample1" rows="5" cols="50"  class="input form-control" placeholder="Input" style="margin-bottom:10px;" ></textarea>');
    $(container1).append('<textarea required id=eo_sample' + ecount + ' name="o_sample1" rows="5" cols="50"  class="input form-control" placeholder="Output" ></textarea>');
    
    // ADD BOTH THE DIV ELEMENTS TO THE "main" CONTAINER.
    $('#samplecase-e').after(container1);

}
function sampleRemove() {

    if (ecount != 1) 
    {
    
    $('#eo_sample' + ecount).remove();  
    $('#ei_sample' + ecount).remove(); 
    $('#es_no' + ecount).remove();ecount = ecount -1;
    
    }
    }

    function testAdd() {

            
        ecount2 = ecount2 +1;

        // ADD TEXTBOX.
        $(container2).append('<p id=et_no' + ecount2 +'>Testcase ' + (ecount2) + '</p>');
        $(container2).append('<textarea required id=ei_testcase' + ecount2 + ' name="i_testcase1" rows="5" cols="50"  class="input form-control" placeholder="Input" style="margin-bottom:10px;"></textarea>');
        $(container2).append('<textarea required id=eo_testcase' + ecount2 + ' name="o_testcase1" rows="5" cols="50"  class="input form-control" placeholder="Output" ></textarea>');
        $(container2).append('<p required id=ep_no' + ecount2 + '>Points</p>');
        $(container2).append('<input id="epoints'+ ecount2 +'" class="form-control" style="width:15%;" name="points" type="text" placeholder="Ex: 10"/>');
        // ADD BOTH THE DIV ELEMENTS TO THE "main" CONTAINER.
        $('#testcase-e').after(container2);
        
    }
    function testRemove() {
        if (ecount2 != 1) 
        {
        $('#epoints' + ecount2).remove(); 
        $('#ep_no' + ecount2).remove();
        $('#eo_testcase' + ecount2).remove(); 
        $('#ei_testcase' + ecount2).remove();
        $('#et_no' + ecount2).remove();ecount2 = ecount2 -1;
        }
    
    
    }
    
    
$(document).ready(function() {

    $('#btSampleAdd_e').click(sampleAdd);

    // REMOVE ONE ELEMENT PER CLICK.
  
    $('#btSampleRemove_e').click(sampleRemove);

    });
    
   
    $(document).ready(function() {

        $('#btAdd-e').click(testAdd);
    
        // REMOVE ONE ELEMENT PER CLICK.
        
        $('#btRemove-e').click(testRemove);
    
        
    });



/*-------------------------*/

function closeModal() {
    $('#loading').on('shown.bs.modal', function(e) {
        $("#loading").modal("hide");
    });
}

function submitFormAdd(){ 
    if(!$("#lang1,#lang2,#lang3,#lang4,#lang5,#lang6").is(':checked')){
        alert("Select atleast one language");
        return false;
    }
    
    function isQuillEmpty(quill) {
    if ((quill.getContents()['ops'] || []).length !== 1) { return false }
    return quill.getText().trim().length === 0
    }

    if(isQuillEmpty(editor)){
        toastr.warning("Problem Statement cannot be empty");
        return false;
    }
   
    const aId = document.getElementById('sem').value;
    
    document.getElementById('es').value=encodeURIComponent(JSON.stringify(editor.getContents()));
    $.ajax({
            type: "POST",
            url: "/assignment/add",
            data: $("#ques").serialize()+"&aId="+aId,
            success: function (data,status, jqXHR) {
            $('#myModal').modal('hide');
            $("#loading").modal('show');
            
            $("#sem").val(aId).change();
            closeModal();
            toastr.success("Question added successfully!");
            $("#ques")[0].reset();
            editor.setText("");
            },
            error: function (e) {
                toastr.error(e.responseText);

            },
        
        });
        
        return false;
    
    }

    $(document).ready(function() {
        $("#edit").on('show.bs.modal', function(e){
        $("#ques-edit")[0].reset();
        $("#samplecase_extra").empty();
        $("#testcase_extra").empty();
        ecount = ecount2 = 1 ;
        editor_edit.setText("");
        const aId = document.getElementById('sem').value;
        const qid = e.relatedTarget.dataset.id;
        $("#qid").val(qid);
        let url = "/assignment/edit/"+aId+"/"+qid;
        if(e.relatedTarget.dataset.old){ url = '/assignment/old/'+qid; $("#editSubmit").hide(); }
        else $("#editSubmit").show();
        $.get(url,function(data,status){
            if(data.assignmentId!=aId){
                $("#edit_info").html("Cannot edit an old question");
            }
            else $("#edit_info").html("");
            $("#name-e").val(data.name);
            editor_edit.setContents(JSON.parse(data.statement));
            $("#constraints-e").val(data.constraints);
            $("#i_format-e").val(data.input_format);
            $("#o_format-e").val(data.output_format);
            $("#ei_sample1").val(data.sample_cases[0].input);
            $("#eo_sample1").val(data.sample_cases[0].output);
            $("#explanation_edit").val(data.explanation);
            $("#ei_testcase1").val(data.test_cases[0].input);
            $("#eo_testcase1").val(data.test_cases[0].output);
            $("#epoints1").val(data.test_cases[0].points);
            $("#edifficulty").val(data.difficulty);
            $("#edifficulty").niceSelect('update');
            $("#edescription").val(data.description);

            for(let i=1;i<data.sample_cases.length;i++){
                sampleAdd();
                $("#ei_sample"+(i+1)).val(data.sample_cases[i].input);
                $("#eo_sample"+(i+1)).val(data.sample_cases[i].output);
            }

            for(let i=1;i<data.test_cases.length;i++){
                testAdd();
                $("#ei_testcase"+(i+1)).val(data.test_cases[i].input);
                $("#eo_testcase"+(i+1)).val(data.test_cases[i].output);
                $("#epoints"+(i+1)).val(data.test_cases[i].points);
            }
            $.each(data.languages, function(i, val){

                $("input[value='" + val + "']").prop('checked', true);
             
             });
             options=data.languages;

        });    


        });

        $("#delete").on('show.bs.modal', function(e){
            $("#dbody").empty();
            $("#dbody").append("<p>"+e.relatedTarget.dataset.name+"</p><p style='display:none;' id='del_qid'>"+e.relatedTarget.dataset.id+"</p>");

        });

        $("#myModal").on('show.bs.modal', function(e){
            options=['50','54','51','71','62','63'];
        });

        
    });
function editForm(){
    if(!$("#lang1e,#lang2e,#lang3e,#lang4e,#lang5e,#lang6e").is(':checked')){
        alert("Select atleast one language");
        return false;
    }
    
    const qid = document.getElementById('qid').value;
    const aId = document.getElementById('sem').value;
    $("#es_edit").val(encodeURIComponent(JSON.stringify(editor_edit.getContents())));
    $.ajax({
        type: "POST",
        url: "/assignment/edit/"+aId+"/"+qid,
        data: $("#ques-edit").serialize()+"&aId="+aId,
        success: function (data,status, jqXHR) {
        $("#edit").modal('hide');
        $("#loading").modal('show');
        closeModal();
        toastr.success(data);
        editor.setText("");
        },
        error: function (e) {
            toastr.error(e.responseText);

        }
    
    });

    return false;
}
function deleteQ(){
    $("#delete").modal('hide');
    $("#loader").modal('show');
    const qid = $("#del_qid").html();
    const aId = $("#sem").val();
    $.get('/assignment/delete/'+aId+'/'+qid,function(data,status){
        toastr.success(data);
        closeModal();
        $("#sem").val(aId).change();
        $("#del_qid").empty();
    });

}


function display(page){
    if(!page) page=1;
    $("#pagination").empty();
    $("#oldQlist").empty();
    $.ajax({
        type: "POST",
        url: "/assignment/edit/old?page="+page,
        data: {sem:$("#oldSelect").val()},
        success: function (data,status, jqXHR) {
        
            data.questions.forEach((item,index)=>{
                    $("#oldQlist").append('<tr><td><input '+(listArray.includes(item.assignmentId+'#'+item.qid)?'checked':'')+' type="checkbox" id="aq" name="list" value="'+item.assignmentId+'#'+item.qid +'"></td><td>'+item.assignmentId.substr(5,4)+'</td><td>'+item.qid+'</td><td>'+item.name+'</td><td><a class="fas fa-eye"  style="color:dimgrey;" data-toggle="modal" data-target="#edit" data-id="'+item.qid+'" data-old="true" href=""></a></td></tr>');
            });
            
            let pagi = '<nav aria-label="..."><ul class="pagination pagination-sm justify-content-center"><li class="page-item '+(page==1?'disabled':'') +'"><a class="page-link" href="javascript:display('+(page-1)+')" '+(page==1?'aria-disabled="true"':'')+'>Previous</a></li>';
            for(let i=1;i<=Math.ceil(data.total/10);i++){
               pagi+='<li class="page-item '+(page==i?'active':'') +'"><a class="page-link " href="javascript:display('+i+')">'+i+" "+(page==i?'<span class="sr-only">(current)</span>':'')+'</a></li>';
            }
            pagi+='<li class="page-item '+(page==Math.ceil(data.total/10)?'disabled':'') +'"><a class="page-link" href="javascript:display('+(page+1)+')" '+(page==data.total?'aria-disabled="true"':'')+'>Next</a></li></ul></nav>';
            $("#pagination").append(pagi);
            
            list();
        },
        error: function (e) {
            toastr.error(e.responseText);

        }
    
    });
}

$('#oldSelect').change(function (){
    $("#oldQlist").empty();
    $("#pagination").empty();

    display(1);
    
});

function oldQuesInsert(){
    const aId = $("#sem").val();
    $.ajax({
        type: "POST",
        url: "/assignment/edit/oldAdd",
        data:{list:listArray,cur_aId:$("#sem").val()},
        success: function (data,status, jqXHR) {
            $("#oldQues").modal('hide');
            $("#sem").val(aId).change();
            toastr.success(data);  
            $("#oldQlist").empty();
            $("#pagination").empty();
            $('#oldSelect').prop('selectedIndex',0);
            listArray=[];        
            
        },
        error: function (e) {
            toastr.error(e.responseText);

        }
    
    });

}

//searching
$(function() {
    $("#oldSearch").on("keyup", function() {
      
      const val = $.trim(this.value);
      if (val) {$("#oldQlist").empty();
        $.get('/assignment/old/search/'+$("#oldSelect").val()+'/'+val,function(data,status){
            if(Array.isArray(data)){
                $.each(data, function(_,obj) {
                    $("#oldQlist").append('<tr><td><input '+(listArray.includes(obj.assignmentId+'#'+obj.qid)?'checked':'')+' type="checkbox" id="aq" name="list" value="'+obj.assignmentId+'#'+obj.qid +'"></td><td>'+obj.assignmentId.substr(5,4)+'</td><td>'+obj.qid+'</td><td>'+obj.name+'</td><td><a class="fas fa-eye"  style="color:dimgrey;" data-toggle="modal" data-target="#edit" data-id="'+obj.qid+'" data-old="true" href=""></a></td></tr>');
                   });
                   list();
            }
            else
            {
                toastr.error(data);
            }
            
        });
        
      }
      else{
        $("#oldQlist").empty();
      }
      
    });
  });

  //selected questions
  let listArray=[];
function list(){
$('input[name="list"]').click(function(){
    if($(this).prop("checked") == true){
        listArray.push($(this).val());
        
    }
    else if($(this).prop("checked") == false){
        listArray.splice(listArray.indexOf($(this).val()),1);
    }
});
}

$(document).ready(function(){
    $("#solution").on('show.bs.modal', function(e){
        $("#formSolution")[0].reset();
        $("#qidForSolution").text(e.relatedTarget.dataset.id);
        $.get('/assignment/solution/'+e.relatedTarget.dataset.id,function(data,status){
            if(data != ''){
                $("#languageCode").val(data.language);
                $('#languageCode').niceSelect('update');
                $('#solutionCode').val(data.sourceCode);
                //document.getElementById("solutionCode").dispatchEvent(new Event("input"));
            }
        }).done(auto_grow).fail((err)=>{
            toastr.error(err.responseText);
        });
});
});

function solution(){
    $.post('/assignment/solution/'+$("#qidForSolution").text(),$("#formSolution").serialize(),function(data,status){
        toastr.success(data);
    }).fail((err)=>{
        toastr.error(err.responseText);
    });

    return false;
}

