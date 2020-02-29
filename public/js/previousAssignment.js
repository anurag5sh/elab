$("#semester").change(()=>{
    $.get('/assignment/previous/'+$("#semester").val(),function (data,status){
    $("#List").empty();
    $("#col").empty().append(data);
   
   //
   $("#aid").change(()=>{ 
   $("#List").empty().append('<table class="table table-hover" id="list"><thead><tr><th style="width:30px">#</th><th>Question ID</th><th>Name</th><th>Created By</th><th>Difficulty</th><th>View</th><th>View in editor</th></table>');
    $.get('/assignment/previous/list/'+$("#aid").val(),function(data,status){
        questions = $('#list').DataTable( {
                   "data":data,
                   "columns": [
                       { "data": null },
                       { "data": "qid" },
                       { "data": "name" },
                       { "data": "createdByName" },
                       { "data": "difficulty" },
                       { "data": "view" },
                       { "data": "editor" }

                   ],
                   "order": [[ 1, 'asc' ]],
                   "columnDefs": [ {"searchable": false,"orderable": false,"targets": 0},
                                   {"searchable": false,"targets": 3},
                                   {"searchable": false,"targets": 4},
                                   {"searchable": false,"orderable": false,"targets": 5}],
               } );

               questions.on( 'order.dt search.dt', function () {
               questions.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
                   cell.innerHTML = i+1;
               } );
           } ).draw();
    }).fail((err)=>{
        toastr.error(err.responseText);
    });
   });
   //
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

$(document).ready(function() {
$("#view").on('show.bs.modal', function(e){
$("#ques-edit")[0].reset();
$("#samplecase_extra").empty();
$("#testcase_extra").empty();
ecount = ecount2 = 1 ;
editor_edit.setText("");
const qid = e.relatedTarget.dataset.id;
$("#qid").val(qid);
let url = '/assignment/old/'+qid; 
$.get(url,function(data,status){
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

});    


});
});