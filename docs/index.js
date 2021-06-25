const express = require('express');
const { randomBytes } = require('crypto');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

const app = express();
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());

const docs = {};

app.get('/docs/:id', async (req, res) => {
  const docid = req.params.id;
  const uploadPath = __dirname + '\\signings\\' + docid +'.pdf';
  const edimg = __dirname + '\\signings\\eDOCLogo2.png';
  console.log('Loading: '+uploadPath);
  const thepdf = await PDFDocument.load(fs.readFileSync(uploadPath));
  const timesRomanFont = await thepdf.embedFont(StandardFonts.TimesRoman)
  const pagecount = thepdf.getPageCount();
  const page = thepdf.getPage(pagecount-1);
  console.log('Page '+(pagecount-1).toString()+' loaded, width: '+page.getWidth().toString());
  console.log('Loading: '+edimg);
  const emblemImageBytes = fs.readFileSync(edimg);
  const emblemImage = await thepdf.embedPng(emblemImageBytes);
  const pngDims = emblemImage.scale(0.5);
  console.log(pngDims);
  page.drawText('Creating PDFs in JavaScript is awesome!', {
    x: 50,
    y: 450,
    size: 15,
    font: timesRomanFont,
    color: rgb(0, 0.53, 0.71),
  });
  page.drawImage(emblemImage,{
    x: page.getWidth() / 2 - pngDims.width / 2 + 75,
    y: page.getHeight() / 2 - pngDims.height,
    width:pngDims.width,
    height:pngDims.height});
  console.log('Saving pdf');
  fs.writeFileSync(uploadPath, await thepdf.save());
  res.send(docs[req.params.id] || {});
});

app.post('/docs', async (req, res) => {
  const id = randomBytes(4).toString('hex');
  if(!req.files || Object.keys(req.files).length === 0 || !req.files.FILE){
    return res.status(400).send('No files uploaded');
  }
  if(req.files.FILE.mimetype!='application/pdf'){
    return res.status(401).send('Invalid file uploaded');
  }  
  uploadPath = __dirname + '\\signings\\' + id +'.pdf';
  console.log(uploadPath);
  req.files.FILE.mv(uploadPath, function(err) {
    if (err)
      return res.status(500).send(err);
  });
  const { title } = JSON.parse(req.body.JSON);
  docs[id] = { id, title };
  res.status(201).send(docs[id]);
});

app.listen(4000, () => {
  console.log('Listening on 4000')
})