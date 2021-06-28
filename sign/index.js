const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
//https://github.com/Hopding/pdf-lib/issues/112#issuecomment-569085380
const signer = require('node-signpdf');
const {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFHexString,
  PDFString,
} = require('pdf-lib');

const PDFArrayCustom = require('./PDFArrayCustom');

const SIGNATURE_LENGTH = 3322;


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());

app.get('/sign/:id', async (req, res) => {
  const docid = req.params.id;
  const uploadPath = 'C:\\Work\\nodeproj\\eSign\\docs\\signings\\' + docid +'.pdf';
  const p12Path = 'C:\\Work\\nodeproj\\eSign\\docs\\signings\\cer.p12';
  console.log(uploadPath);
  console.log(p12Path);
  const p12Buffer = fs.readFileSync(p12Path);
  const pdfBuffer = fs.readFileSync(uploadPath);
  
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  const ByteRange = PDFArrayCustom.withContext(pdfDoc.context);
  ByteRange.push(PDFNumber.of(0));
  ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER));
  ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER));
  ByteRange.push(PDFName.of(signer.DEFAULT_BYTE_RANGE_PLACEHOLDER));

  const signatureDict = pdfDoc.context.obj({
    Type: 'Sig',
    Filter: 'Adobe.PPKLite',
    SubFilter: 'adbe.pkcs7.detached',
    ByteRange,
    Contents: PDFHexString.of('A'.repeat(SIGNATURE_LENGTH)),
    Reason: PDFString.of('We need your signature for reasons...'),
    M: PDFString.fromDate(new Date()),
  });
  const signatureDictRef = pdfDoc.context.register(signatureDict);

  const widgetDict = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Widget',
    FT: 'Sig',
    Rect: [0, 0, 0, 0],
    V: signatureDictRef,
    T: PDFString.of('Signature1'),
    F: 4,
    P: pages[0].ref,
  });
  const widgetDictRef = pdfDoc.context.register(widgetDict);

  // Add our signature widget to the first page
  pages[0].node.set(PDFName.of('Annots'), pdfDoc.context.obj([widgetDictRef]));

  // Create an AcroForm object containing our signature widget
  pdfDoc.catalog.set(
    PDFName.of('AcroForm'),
    pdfDoc.context.obj({
      SigFlags: 3,
      Fields: [widgetDictRef],
    }),
  );

  const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
  const modifiedPdfBuffer = Buffer.from(modifiedPdfBytes);

  const signObj = new signer.SignPdf();
  const signedPdfBuffer = signObj.sign(modifiedPdfBuffer, p12Buffer, {
    passphrase: '2020',
  });

  // Write the signed file
  fs.writeFileSync('./signed.pdf', signedPdfBuffer);

  res.send('done signing');
});

app.listen(4001, () => {
  console.log('Listening on 4001')
})