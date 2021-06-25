const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const signer = require('./signpdf');
//https://github.com/Hopding/pdf-lib/issues/112#issuecomment-569085380

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());

app.get('/sign/:id', async (req, res) => {
  const docid = req.params.id;
  const uploadPath = 'C:\\Work\\nodeproj\\eSign\\docs\\signings\\' + docid +'.pdf';
  const p12Path = 'C:\\Work\\nodeproj\\eSign\\docs\\signings\\pdf-signer.p12';
  const pdf = new PDFDocument()
  console.log(uploadPath);
  console.log(p12Path);
  const p12Buffer = fs.readFileSync(p12Path);
  const pdfBuffer = fs.readFileSync(uploadPath);
  new signer.SignPdf().sign(pdfBuffer,p12Buffer);
  res.send('done signing');
});

app.listen(4001, () => {
  console.log('Listening on 4001')
})