var express = require('express');
var router = express.Router();
const request = require("request-promise");


function encode64(string){ //encoding to base64
  const b = new Buffer.from(string);
return b.toString('base64');
}

function decode64(string64){//decode to utf8
  const b = new Buffer.from(string64, 'base64')
return b.toString();
}

router.post('/', (req,res)=>{
  console.log(req.body);

  if(req.body.source=='')
    return res.send();
  let options = { method: 'POST',
  url: 'http://127.0.0.1:3000/submissions?base64_encoded=true&wait=true',
  body: { "source_code": encode64(req.body.source), "language_id": req.body.language },
  json: true };

  
  request(options)
    .then((response) => { let output="";
    
      const json_res = JSON.parse(JSON.stringify(response));
      console.log(json_res);
      if(json_res.stdout!=null) output=json_res.stdout;
      else if(json_res.stderr!=null) output=json_res.stderr;
      else if(json_res.compile_output!=null) output=json_res.compile_output;
      res.send(decode64(output));
      
    })
    .catch((err) => {
      res.send(err);
    });
 
  
}); 
 


  module.exports = router;