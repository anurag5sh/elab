const request = require("request-promise");
const url = 'http://127.0.0.1:3000/submissions?base64_encoded=true&wait=true';

function encode64(string){ //encoding to base64
    const b = new Buffer.from(string.replace(/\r\n/g, "\n"));
  return b.toString('base64');
}

async function run(data){

    let compiler_opt = null;
    if (data.language == 50){
      compiler_opt = "-lm";
    }

    let options = { method: 'POST',
    url: url,
    body: { "source_code": encode64(data.source), "language_id": data.language ,"stdin":encode64(data.input),
        "expected_output":encode64(data.output), "compiler_options":compiler_opt},

    json: true };

    return request(options);
  
}

module.exports = {run};