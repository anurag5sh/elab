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

  $("#ques").validate({
    ignore: ".ignore .ql-container *",
    invalidHandler: function(e,validator){
        if(validator.errorList.length){
            element = validator.errorList[0].element;
            $('.nav a[href="#' + $(element).closest(".tab-pane").attr('id') + '"]').tab('show');
            setTimeout(()=>{
                $(element).focus();
            },400)
        }
        
    },
    submitHandler:submitFormAdd
    });

    $('.ques').click(function(evt) {
        evt.preventDefault();
        
        $("#ques").submit();
    
    });


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
          alert("Problem Statement cannot be empty");
          return false;
      }

      document.getElementById('es').value=encodeURIComponent(JSON.stringify(editor.getContents()));
      $.ajax({
            type: "POST",
            url: "/contest/add/"+curl,
            data: $("#ques").serialize(),
            success: function (data) {
 
              toastr.success(data);
              setTimeout(()=>{
                location.reload();
              },1000)
              
 
            },
            error: function (e) {
 
               toastr.error(e.responseText);
 
            }
        });
      return false;
  }
  
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
$(document).ready(function() {
    $("#edit").on('show.bs.modal', function(e){
    $("#ques-edit")[0].reset();
    $("#samplecase_extra").empty();
    $("#testcase_extra").empty();
    ecount = ecount2 = 1 ;
    editor_edit.setText("");
    const qid = e.relatedTarget.dataset.id;
    $("#qid").val(qid);

    $.get("/contest/edit/"+curl+"/"+qid,function(data,status){
        
        $("#name-e").val(data.name);
        editor_edit.setContents(JSON.parse(data.statement));
        $("#constraints-e").val(data.constraints);
        $("#i_format-e").val(data.input_format);
        $("#o_format-e").val(data.output_format);
        $("#description-e").val(data.description);
        $("#ei_sample1").val(data.sample_cases[0].input);
        $("#eo_sample1").val(data.sample_cases[0].output);
        $("#explanation_edit").val(data.explanation);
        $("#ei_testcase1").val(data.test_cases[0].input);
        $("#eo_testcase1").val(data.test_cases[0].output);
        $("#epoints1").val(data.test_cases[0].points);
        $("#difficult-e").val(data.difficulty);
        $('#difficult-e').niceSelect('update');
        if (data.active) $("#qActive-e").bootstrapToggle("on");
        else $("#qActive-e").bootstrapToggle("off");
        if (data.autoJudge) {
            $("#Auto-e").prop("checked", true);
            $("#totalPoints-e").find("input").prop('required',false);
            $("#totalPoints-e").hide();
        } else {
            $("#Manual-e").prop("checked", true);
            $("#totalPoints-e").find("input").prop('required',true);
            $("#totalPoints-e").show();
        }
        $("#totalPointsValue").val(data.totalPoints);

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
        options = data.languages;

    });    


    });

    $("#deleteQuestion").on('show.bs.modal', function(e){
        $("#dbodyQ").empty();
        $("#dbodyQ").append("<p>"+e.relatedTarget.dataset.name+"</p><p style='display:none;' id='del_qid'>"+e.relatedTarget.dataset.id+"</p>");

    });

    $("#solution").on('show.bs.modal', function(e){
        $("#formSolution")[0].reset();
        $("#qidForSolution").text(e.relatedTarget.dataset.id);
        $.get('/contest/solution/'+curl+"/"+e.relatedTarget.dataset.id,function(data,status){
            if(data != ''){
                $("#languageCode").val(data.language);
                $('#languageCode').niceSelect('update');
                $('#solutionCode').val(data.sourceCode);
            }
        }).fail((err)=>{
            toastr.error(err.responseText);
        })
    });

    $("#myModal").on('show.bs.modal', function(e){
        options=['50','54','51','71','62','63'];
    });

    //hiding the sample and testcases
    $("#ques").find('input[type=radio][name=judging]').on('change',function(){
        switch($(this).val()) {
            case 'true' :
                $("#totalPoints").hide();
                $("#totalPoints").find("input").prop('required',false);
                $("#samplecase").find("textarea").prop('required',true);
                $("#testcase").find("textarea,input").prop('required',true);
                break;
            case 'false' :
                $("#totalPoints").show();
                $("#totalPoints").find("input").prop('required',true);
                $("#samplecase").find("textarea").prop('required',false);
                $("#testcase").find("textarea,input").prop('required',false);
                break;
        }      
    });

    $("#ques-edit").find('input[type=radio][name=judging]').on('change',function(){
        switch($(this).val()) {
            case 'true' :
                $("#totalPoints-e").hide();
                $("#totalPoints-e").find("input").prop('required',false);
                $("#samplecase-e").find("textarea").prop('required',true);
                $("#testcase-e").find("textarea,input").prop('required',true);
                break;
            case 'false' :
                $("#totalPoints-e").show();
                $("#totalPoints-e").find("input").prop('required',true);
                $("#samplecase-e").find("textarea").prop('required',false);
                $("#testcase-e").find("textarea,input").prop('required',false);
                break;
        }      
    });


$("#ques-edit").validate({
    ignore: ".ignore .ql-container *",
    invalidHandler: function(e,validator){
        if(validator.errorList.length){
            element = validator.errorList[0].element;
            $('.nav a[href="#' + $(element).closest(".tab-pane").attr('id') + '"]').tab('show');
            setTimeout(()=>{
                $(element).focus();
            },400)
        }
        
    },
    submitHandler:editForm
    });

$('.ques-edit').click(function(evt) {
    evt.preventDefault();
    
    $("#ques-edit").submit();

});

$("#myModal").on('show.bs.modal',()=>{
    if($("#Auto").is(":checked"))
    $("#totalPoints").hide();
});
    
});
function editForm(){
    if(!$("#lang1e,#lang2e,#lang3e,#lang4e,#lang5e,#lang6e").is(':checked')){
        alert("Select atleast one language");
        return false;
    }
    const qid = document.getElementById('qid').value;
$("#es_edit").val(encodeURIComponent(JSON.stringify(editor_edit.getContents())));
$.ajax({
    type: "POST",
    url: "/contest/edit/"+curl+"/"+qid,
    data: $("#ques-edit").serialize(),
    success: function (data,status, jqXHR) {
    $("#edit").modal('hide');
    toastr.success(data);
    editor.setText("");
    window.location.reload();
    },
    error: function (e) {
        toastr.error(e.responseText);

    }

});

return false;
}
function deleteQ(){
$("#delete").modal('hide');
const qid = $("#del_qid").html();
$.get('/contest/delete/'+curl+'/'+qid,function(data,status){
    toastr.success(data);
    $("#del_qid").empty();
    window.location.reload();
}).fail((err)=>{
    toastr.error(err.responseText);
})

}

function solution(){
    if($("#languageCode").val == null){
        alert("Choose a language");
        return false;
    }
    $.post('/contest/solution/'+curl+"/"+$("#qidForSolution").text(),$("#formSolution").serialize(),function(data,status){
        toastr.success(data);
    }).fail((err)=>{
        toastr.error(err.responseText);
    });

    return false;
}