const router = require("express").Router();
var request = require('request');

router.post("/runcode", async(req,res)=>{
  const { code, language, input } = req.body;

  console.log("req.body: ", req.body);

  try{

    var program = {
      script : code,
      language: language,
      stdin: input,
      language: "python3",
      versionIndex: "0",
      clientId: "4dd577b9ea50d2703ba276eef3b9f917",
      clientSecret:"af37da4b9509e346e1f32c243f3d66aebc53619b506fc1757e4445ba39175a8e"
    };

    request({
      url: 'https://api.jdoodle.com/v1/execute',
      method: "POST",
      json: program
    },
    function (error, response, body) {
        console.log('error:', error);
        console.log('statusCode:', response && response.statusCode);
        console.log('body:', body);
        res.status(200).json({message: "Success from API", data: body});
    })
  }catch(e){return res.status(500).json(e)}
})

module.exports = router;